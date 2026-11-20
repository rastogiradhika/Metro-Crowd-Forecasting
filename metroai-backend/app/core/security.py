from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Request, HTTPException, status, Depends
from jose import jwt, JWTError
import bcrypt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db


def hash_password(password: str) -> str:
    """Hashes a plaintext password using native bcrypt (truncated to 72 bytes standard)."""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against a bcrypt hash."""
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generates a signed JWT with expiration timestamp."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def get_token_from_cookie_or_header(request: Request) -> Optional[str]:
    """
    Extracts the JWT access token from the HTTP-Only cookie first,
    falling back to the Authorization header if provided.
    """
    # 1. Check HTTP-Only Cookie
    cookie_token = request.cookies.get(settings.COOKIE_NAME)
    if cookie_token:
        if cookie_token.startswith("Bearer "):
            return cookie_token[7:]
        return cookie_token

    # 2. Check Authorization Header (Bearer ...)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:]

    return None


def get_current_user(request: Request, db: Session = Depends(get_db)):
    """
    Dependency that authenticates the user using the JWT from the HTTP-Only cookie.
    Raises 401 Unauthorized if invalid or expired.
    """
    from app.models.user import User

    token = get_token_from_cookie_or_header(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials token."
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please re-authenticate."
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found."
        )

    return user


def get_current_admin(current_user = Depends(get_current_user)):
    """
    Dependency that ensures the current user has the 'admin' or 'operator' role.
    Raises 403 Forbidden if not authorized.
    """
    if current_user.role not in ["admin", "operator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required for operations center."
        )
    return current_user


def require_role(required_role: str):
    """
    FastAPI dependency factory that enforces a strict user role.
    Raises 403 Forbidden if the authenticated user's role does not match.
    """
    def role_checker(current_user = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: '{required_role}' privileges required."
            )
        return current_user
    return role_checker


# Strict dependency: ONLY an admin can perform admin-only provisioning (Fix C3)
require_superadmin = require_role("admin")
