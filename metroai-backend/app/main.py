import os
import logging
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.services.station_service import seed_stations_if_empty
from app.ml.ml_service import ml_service
from app.routers import auth, passenger, admin

# Setup centralized logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("metroai.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown orchestration.
    1. Creates database schema tables.
    2. Seeds station master data if empty.
    3. Seeds a default DMRC operations administrator if not present.
    4. Loads pre-trained XGBoost residual models into memory.
    """
    logger.info("Starting MetroAI Backend Engine...")

    # 1. Initialize Tables
    Base.metadata.create_all(bind=engine)

    # 2. Seed Data
    db = SessionLocal()
    try:
        seed_stations_if_empty(db)

        # Seed default admin only if explicitly configured in environment
        admin_email = settings.ADMIN_EMAIL.strip().lower() if settings.ADMIN_EMAIL else None
        admin_password = settings.ADMIN_PASSWORD
        if admin_email and admin_password:
            existing_admin = db.query(User).filter(User.email == admin_email).first()
            if not existing_admin:
                default_admin = User(
                    email=admin_email,
                    password_hash=hash_password(admin_password),
                    role="admin"
                )
                db.add(default_admin)
                db.commit()
                logger.info(f"Initialized administrator account: {admin_email}")
            else:
                existing_admin.password_hash = hash_password(admin_password)
                existing_admin.role = "admin"
                db.commit()
                logger.info(f"Synchronized administrator credentials for: {admin_email}")
        else:
            logger.info("Skipping admin auto-seeding (ADMIN_EMAIL or ADMIN_PASSWORD not set in environment).")
    except Exception as e:
        logger.error(f"Startup seeding error: {e}")
        db.rollback()
    finally:
        db.close()

    # 3. Load ML Models
    ml_service.load_models()

    yield

    logger.info("MetroAI Backend shut down cleanly.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Delhi Metro Passenger Crowd Prediction API — Production Backend with XGBoost Residual Inference & PostgreSQL",
    version="2.0.0",
    lifespan=lifespan
)

# -------------------------------------------------------------
# CORS Middleware: Strictly Configured for Exact Whitelisted Origins
# Notice: allow_credentials=True is required for HTTP-Only cookies!
# Wildcard regex removed to prevent untrusted cross-origin access.
# -------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------------------
# Global Exception Handler (CRITICAL RULE #3)
# Catch all unexpected 500 errors.
# Logs real traceback to server console, sends generic safe message to client.
# -------------------------------------------------------------
@app.exception_handler(Exception)
def global_exception_handler(request: Request, exc: Exception):
    # Log full traceback on server side
    tb = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    logger.error(f"Unhandled Exception on {request.method} {request.url.path}:\n{tb}")

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error. Please contact support."}
    )


# Mount Feature Routers
app.include_router(auth.router)
app.include_router(passenger.router)
app.include_router(admin.router)


@app.get("/health", tags=["Health"])
def health_check():
    """Health probe for deployment orchestration (Render, Railway, Fly.io, AWS)."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "ml_models_loaded": ml_service.is_loaded
    }


# -------------------------------------------------------------
# Static SPA Frontend Mounting (Supports single-command execution)
# -------------------------------------------------------------
DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "metroai-frontend", "dist"))
ASSETS_DIR = os.path.join(DIST_DIR, "assets")

if os.path.isdir(DIST_DIR):
    if os.path.isdir(ASSETS_DIR):
        app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend_spa(full_path: str):
        target = os.path.join(DIST_DIR, full_path)
        if full_path and os.path.isfile(target):
            return FileResponse(target)
        return FileResponse(os.path.join(DIST_DIR, "index.html"))
else:
    @app.get("/", tags=["Health"])
    def root():
        """Root health check if frontend dist is not built."""
        return {
            "status": "online",
            "service": settings.PROJECT_NAME,
            "docs": "/docs"
        }
