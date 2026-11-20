import os
# Prevent Windows Defender / Application Control from blocking Cython DLLs
os.environ.setdefault("DISABLE_SQLALCHEMY_CEXT", "1")

import logging
import traceback
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
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
                logger.info(f"Initialized administrator account from environment: {admin_email}")
            else:
                existing_admin.password_hash = hash_password(admin_password)
                existing_admin.role = "admin"
                db.commit()
                logger.info(f"Synchronized administrator credentials for: {admin_email}")
        else:
            logger.warning("ADMIN_EMAIL or ADMIN_PASSWORD not configured in environment. Skipping administrator auto-seeding.")

        # Seed default operator account only if explicitly configured in environment
        operator_email = settings.OPERATOR_EMAIL.strip().lower() if settings.OPERATOR_EMAIL else None
        operator_password = settings.OPERATOR_PASSWORD
        if operator_email and operator_password:
            existing_operator = db.query(User).filter(User.email == operator_email).first()
            if not existing_operator:
                default_operator = User(
                    email=operator_email,
                    password_hash=hash_password(operator_password),
                    role="operator"
                )
                db.add(default_operator)
                db.commit()
                logger.info(f"Initialized DMRC operator account from environment: {operator_email}")
            else:
                existing_operator.password_hash = hash_password(operator_password)
                existing_operator.role = "operator"
                db.commit()
                logger.info(f"Synchronized DMRC operator credentials for: {operator_email}")
        else:
            logger.info("OPERATOR_EMAIL or OPERATOR_PASSWORD not configured in environment. Skipping operator auto-seeding.")
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
# -------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------------------
# Global Exception Handler
# -------------------------------------------------------------
@app.exception_handler(Exception)
def global_exception_handler(request: Request, exc: Exception):
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
    """Health probe for deployment orchestration."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "ml_models_loaded": ml_service.is_loaded
    }


# -------------------------------------------------------------
# Static SPA Frontend Mounting with Strict Path Traversal Defense (Fix C1)
# -------------------------------------------------------------
DIST_DIR = Path(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "metroai-frontend", "dist"))).resolve()
ASSETS_DIR = DIST_DIR / "assets"
INDEX_FILE = DIST_DIR / "index.html"

if DIST_DIR.is_dir():
    if ASSETS_DIR.is_dir():
        app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend_spa(full_path: str):
        # 1. Do not shadow backend API routes, auth endpoints, or health probe
        clean_path = full_path.strip("/")
        if clean_path.startswith(("api", "auth", "health", "docs", "openapi.json", "redoc")):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Resource '{full_path}' not found."
            )

        # 2. Strict Path Traversal Defense: Ensure resolved target is strictly contained within DIST_DIR
        try:
            target = (DIST_DIR / clean_path).resolve()
        except Exception:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid resource path.")

        # Verify target is strictly within DIST_DIR
        try:
            if not target.is_relative_to(DIST_DIR):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Access denied."
                )
        except AttributeError:
            # Fallback for Python versions before 3.9
            try:
                target.relative_to(DIST_DIR)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Access denied."
                )

        # If a specific static file was requested and exists
        if clean_path and target.is_file():
            return FileResponse(str(target))

        # 3. SPA Fallback: Return index.html for all client-side routed URLs
        if INDEX_FILE.is_file():
            return FileResponse(str(INDEX_FILE))

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Frontend build artifacts not found."
        )
else:
    @app.get("/", tags=["Health"])
    def root():
        return {
            "status": "online",
            "service": settings.PROJECT_NAME,
            "docs": "/docs"
        }
