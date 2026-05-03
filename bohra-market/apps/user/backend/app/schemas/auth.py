from pydantic import BaseModel, EmailStr, field_validator
import re


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str
    city: str
    latitude: float | None = None
    longitude: float | None = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("phone")
    @classmethod
    def phone_format(cls, v: str) -> str:
        cleaned = re.sub(r"\D", "", v)
        if len(cleaned) < 10:
            raise ValueError("Invalid phone number")
        return cleaned


class VendorRegisterRequest(RegisterRequest):
    business_name: str
    business_type: str  # e.g. "Food", "Clothing", "Crafts", "Services"
    whatsapp: str
    business_description: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    city: str | None = None
    latitude: float | None = None
    longitude: float | None = None
