from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.repositories.user_repo import UserRepository
from backend.app.schemas.auth import UserRegister, UserLogin, Token
from backend.app.core import security
from backend.app.core.config import settings


class AuthService:
    """
    Business logic layer for managing authentication flows.
    """

    @staticmethod
    def register_user(db: Session, data: UserRegister):
        # Validate that the user doesn't already exist
        existing_user = UserRepository.get_by_email(db, data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists."
            )
        
        # Save user to DB
        return UserRepository.create(db, data)

    @staticmethod
    def authenticate_user(db: Session, data: UserLogin) -> Token:
        user = UserRepository.get_by_email(db, data.email)
        if not user or not security.verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is deactivated."
            )

        # Generate tokens
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(
            data={"sub": str(user.id), "email": user.email},
            expires_delta=access_token_expires
        )
        
        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = security.create_refresh_token(
            data={"sub": str(user.id), "email": user.email},
            expires_delta=refresh_token_expires
        )

        # Store refresh token in database
        expires_at = datetime.utcnow() + refresh_token_expires
        UserRepository.add_refresh_token(db, user.id, refresh_token, expires_at)

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="Bearer"
        )

    @staticmethod
    def refresh_access_token(db: Session, refresh_token: str) -> Token:
        # Decode and validate refresh token
        payload = security.decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token."
            )
        
        # Check database record
        db_token = UserRepository.get_refresh_token(db, refresh_token)
        if not db_token or db_token.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token is expired or revoked."
            )
        
        user = UserRepository.get_by_id(db, db_token.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found."
            )

        # Generate a new access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        new_access_token = security.create_access_token(
            data={"sub": str(user.id), "email": user.email},
            expires_delta=access_token_expires
        )

        # Generate new refresh token to implement sliding sessions
        new_refresh_token = security.create_refresh_token(
            data={"sub": str(user.id), "email": user.email}
        )
        # Revoke the old token and save the new one
        UserRepository.revoke_refresh_token(db, refresh_token)
        UserRepository.add_refresh_token(
            db, 
            user.id, 
            new_refresh_token, 
            datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )

        return Token(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="Bearer"
        )

    @staticmethod
    def logout(db: Session, token: str) -> None:
        UserRepository.revoke_refresh_token(db, token)

    @staticmethod
    def logout_everywhere(db: Session, user_id: str) -> None:
        UserRepository.revoke_all_user_tokens(db, uuid.UUID(user_id))
