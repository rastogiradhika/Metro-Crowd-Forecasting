from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_admin,
)
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserOut, TokenOut

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Public commuter registration.
    Strictly enforces role="passenger" in the database model to prevent privilege escalation.
    """
    existing_user = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Strictly force role="passenger" regardless of client payload
    new_user = User(
        email=user_in.email.lower().strip(),
        password_hash=hash_password(user_in.password),
        role="passenger",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/operators", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_operator(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    """
    PROTECTED ENDPOINT (Admin Only):
    Provisions a verified DMRC operations staff account (role: operator or admin).
    """
    existing_user = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    assigned_role = user_in.role if user_in.role in ["operator", "admin"] else "operator"
    new_operator = User(
        email=user_in.email.lower().strip(),
        password_hash=hash_password(user_in.password),
        role=assigned_role,
    )
    db.add(new_operator)
    db.commit()
    db.refresh(new_operator)
    return new_operator


@router.post("/login", response_model=TokenOut)
def login(user_in: UserLogin, response: Response, db: Session = Depends(get_db)):
    """
    Authenticates user and returns an HTTP-Only secure cookie containing the JWT.
    Protects against XSS token theft (frontend never stores tokens in localStorage).
    """
    # Normalize email to lowercase and strip whitespace to prevent case-sensitive login failures
    email_clean = user_in.email.lower().strip() if user_in.email else ""
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials."
        )

    # Create JWT Access Token
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role}
    )

    # Set Secure HTTP-Only Cookie
    is_production = settings.ENVIRONMENT == "production"
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=is_production,       # True in production (HTTPS required)
        samesite="lax",
        path="/",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return {
        "message": "Authentication successful. Operations session initialized.",
        "user": user
    }


@router.post("/logout")
def logout(response: Response):
    """Clears the HTTP-Only cookie, logging the user out."""
    is_production = settings.ENVIRONMENT == "production"
    response.delete_cookie(
        key=settings.COOKIE_NAME,
        path="/",
        httponly=True,
        secure=is_production,
        samesite="lax",
    )
    return {"message": "Logged out successfully."}


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Validates the active session and returns current user details."""
    return current_user
