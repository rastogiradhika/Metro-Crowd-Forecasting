import time
from collections import defaultdict, deque
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_superadmin,
)
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserOut, TokenOut

router = APIRouter(prefix="/auth", tags=["Authentication"])

# -------------------------------------------------------------
# Rate Limiting Configuration (Fix C6)
# Max 5 failed attempts per email per 15 minutes window using collections.deque
# -------------------------------------------------------------
RATE_LIMIT_WINDOW_SECONDS = 15 * 60  # 15 minutes window (900 seconds)
MAX_FAILED_ATTEMPTS = 5
LOGIN_FAILURES: dict[str, deque] = defaultdict(deque)

# Pre-computed dummy bcrypt hash to neutralize timing discrepancies when user does not exist
# Prevents account enumeration via response latency timing attacks
_DUMMY_HASH = hash_password("dummy-security-constant-timing-hash")


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Public commuter registration.
    Strictly forces role="passenger" in the database model to prevent privilege escalation.
    """
    existing_user = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

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
    admin_user: User = Depends(require_superadmin)  # Fix C3: Strictly require superadmin role
):
    """
    PROTECTED ENDPOINT (Admin Only):
    Provisions a verified DMRC operations staff account (role: operator or admin).
    Only users with role='admin' can execute this endpoint.
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
def login(user_in: UserLogin, request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Authenticates user and returns an HTTP-Only secure cookie containing the JWT.
    Protects against XSS token theft (frontend never stores tokens in localStorage).
    Applies strict in-memory rate limiting against brute-force credential stuffing (collections.deque).
    Neutralizes email enumeration via equalized bcrypt timing with _DUMMY_HASH.
    """
    email_clean = user_in.email.lower().strip() if user_in.email else ""
    now = time.time()

    # 1. Rate Limiting Check (Fix C6): Max 5 failed attempts per email per 15 minutes
    failure_history = LOGIN_FAILURES[email_clean]
    # Prune attempts outside the sliding 15-minute window
    while failure_history and failure_history[0] <= now - RATE_LIMIT_WINDOW_SECONDS:
        failure_history.popleft()

    if len(failure_history) >= MAX_FAILED_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts for this account. Please wait 15 minutes before trying again."
        )

    # 2. Timing-Safe User Authentication (Fix C6)
    user = db.query(User).filter(User.email == email_clean).first()
    if user:
        is_password_valid = verify_password(user_in.password, user.password_hash)
    else:
        # Compute dummy bcrypt hash verification to equalize server response time and prevent email enumeration
        verify_password(user_in.password, _DUMMY_HASH)
        is_password_valid = False

    if not is_password_valid:
        failure_history.append(now)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials."
        )

    # 3. DMRC Staff Access Authorization Check
    if user.role not in ["admin", "operator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Only authorized DMRC operations staff accounts can log in."
        )

    # 4. Successful Login: Clear failure history
    LOGIN_FAILURES.pop(email_clean, None)

    # 5. Create Signed JWT Access Token
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role}
    )

    # 6. Set Secure HTTP-Only Cookie
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
