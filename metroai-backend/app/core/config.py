import os
from typing import List, Union, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings

# Absolute path to backend directory (metroai-backend)
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_DB_PATH = os.path.join(BACKEND_DIR, "metroai.db").replace("\\", "/")


class Settings(BaseSettings):
    PROJECT_NAME: str = "MetroAI Backend"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"

    # Database: Read strictly from environment / .env without hardcoded fallback string
    DATABASE_URL: Optional[str] = Field(
        default=None,
        description="Database connection URL read from environment"
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def resolve_sqlite_path(cls, v):
        if isinstance(v, str) and v.startswith("sqlite:///."):
            rel = v.replace("sqlite:///", "")
            return f"sqlite:///{os.path.abspath(os.path.join(BACKEND_DIR, rel)).replace('\\', '/')}"
        return v

    # JWT Security: Required environment variable with minimum 32 characters (FAIL CLOSED: crashes on startup if missing)
    SECRET_KEY: str = Field(..., min_length=32, description="Required JWT signing secret key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    COOKIE_NAME: str = "access_token"

    # Admin Provisioning Credentials (Read strictly from environment; no hardcoded fallback)
    ADMIN_EMAIL: Optional[str] = Field(default=None, description="Initial admin email for provisioning")
    ADMIN_PASSWORD: Optional[str] = Field(default=None, description="Initial admin password for provisioning")

    # CORS Allowed Origins (Read strictly from environment if set, parsed from comma-separated string)
    CORS_ORIGINS: Union[List[str], str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "https://metroai.vercel.app",
        ]
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    # Models Directory (Absolute path)
    MODELS_DIR: str = os.getenv(
        "MODELS_DIR",
        os.path.join(BACKEND_DIR, "models_weights").replace("\\", "/")
    )

    class Config:
        case_sensitive = True
        env_file = os.path.join(BACKEND_DIR, ".env")


settings = Settings()
