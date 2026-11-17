from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    role: Optional[str] = "passenger"
    operator_id: Optional[str] = None

    @field_validator("email")
    @classmethod
    def _norm(cls, v: str) -> str:
        return v.strip().lower()


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

    @field_validator("email")
    @classmethod
    def _norm(cls, v: str) -> str:
        return v.strip().lower()


class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    message: str
    user: UserOut
