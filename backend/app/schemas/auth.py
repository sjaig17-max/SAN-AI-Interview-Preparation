import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, HttpUrl, Field


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"


class TokenPayload(BaseModel):
    sub: str  # User ID
    email: str
    type: str  # 'access' or 'refresh'
    exp: datetime


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    full_name: str = Field(min_length=2, max_length=100)
    phone_number: Optional[str] = None
    
    # Profile details captured on registration
    college: Optional[str] = None
    degree: Optional[str] = None
    department: Optional[str] = None
    current_year: Optional[int] = None
    city: Optional[str] = None
    target_company: Optional[str] = None
    preferred_job_role: Optional[str] = None
    experience_level: Optional[str] = "Entry"  # Student, Entry, Mid, Senior
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    profile_photo_url: Optional[str] = None


class UserProfileUpdate(BaseModel):
    college: Optional[str] = None
    degree: Optional[str] = None
    department: Optional[str] = None
    current_year: Optional[int] = None
    city: Optional[str] = None
    target_company: Optional[str] = None
    preferred_job_role: Optional[str] = None
    experience_level: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    profile_photo_url: Optional[str] = None


class UserProfileResponse(BaseModel):
    college: Optional[str] = None
    degree: Optional[str] = None
    department: Optional[str] = None
    current_year: Optional[int] = None
    city: Optional[str] = None
    target_company: Optional[str] = None
    preferred_job_role: Optional[str] = None
    experience_level: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    profile_photo_url: Optional[str] = None

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None
    is_active: bool
    is_admin: bool
    created_at: datetime
    profile: Optional[UserProfileResponse] = None

    class Config:
        from_attributes = True
        
        
class RefreshTokenRequest(BaseModel):
    refresh_token: str
