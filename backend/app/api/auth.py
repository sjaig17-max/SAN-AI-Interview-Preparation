from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.schemas.auth import (
    UserRegister, UserLogin, Token, UserResponse, 
    RefreshTokenRequest, UserProfileUpdate, UserProfileResponse
)
from backend.app.services.auth_service import AuthService
from backend.app.repositories.user_repo import UserRepository
from backend.app.api.deps import get_current_user
from backend.app.models.models import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)):
    """
    Registers a new student or professional user and provisions a profile template.
    """
    return AuthService.register_user(db, data)


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """
    Logs in an active user and generates JWT access and refresh tokens.
    """
    return AuthService.authenticate_user(db, data)


@router.post("/refresh", response_model=Token)
def refresh_token(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Refreshes an expired JWT access token using a valid, unrevoked refresh token.
    """
    return AuthService.refresh_access_token(db, data.refresh_token)


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(data: RefreshTokenRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Revokes the provided refresh token to terminate the session.
    """
    AuthService.logout(db, data.refresh_token)
    return {"message": "Successfully logged out."}


@router.post("/logout-everywhere", status_code=status.HTTP_200_OK)
def logout_everywhere(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Revokes all active refresh tokens for the current user to terminate all sessions.
    """
    AuthService.logout_everywhere(db, str(current_user.id))
    return {"message": "Successfully logged out of all devices."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Retrieves information and profile details for the currently logged-in user.
    """
    return current_user


@router.put("/profile", response_model=UserProfileResponse)
def update_profile(data: UserProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Updates the current user's college, career objectives, target companies, and social links.
    """
    profile = UserRepository.update_profile(db, current_user.id, data)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found."
        )
    return profile
