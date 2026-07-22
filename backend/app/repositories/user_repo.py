import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from backend.app.models.models import User, UserProfile, RefreshToken, Role
from backend.app.schemas.auth import UserRegister, UserProfileUpdate
from backend.app.core.security import get_password_hash


class UserRepository:
    """
    Handles database operations for User, UserProfile, and RefreshToken models.
    """

    @staticmethod
    def get_by_id(db: Session, user_id: uuid.UUID | str) -> Optional[User]:
        if isinstance(user_id, str):
            try:
                user_id = uuid.UUID(user_id)
            except ValueError:
                return None
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email.lower().strip()).first()

    @staticmethod
    def create(db: Session, data: UserRegister) -> User:
        # Check if default USER role exists, create if not
        user_role = db.query(Role).filter(Role.name == "USER").first()
        if not user_role:
            user_role = Role(name="USER", description="Standard student/professional user role")
            db.add(user_role)
            db.commit()
            db.refresh(user_role)

        # Create user
        db_user = User(
            email=data.email.lower().strip(),
            password_hash=get_password_hash(data.password),
            full_name=data.full_name,
            phone_number=data.phone_number,
            role_id=user_role.id
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        # Create user profile
        db_profile = UserProfile(
            user_id=db_user.id,
            college=data.college,
            degree=data.degree,
            department=data.department,
            current_year=data.current_year,
            city=data.city,
            target_company=data.target_company,
            preferred_job_role=data.preferred_job_role,
            experience_level=data.experience_level,
            github_url=data.github_url,
            linkedin_url=data.linkedin_url,
            portfolio_url=data.portfolio_url,
            profile_photo_url=data.profile_photo_url
        )
        db.add(db_profile)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def update_profile(db: Session, user_id: uuid.UUID, data: UserProfileUpdate) -> Optional[UserProfile]:
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        if not profile:
            profile = UserProfile(user_id=user_id)
            db.add(profile)
            db.commit()
            db.refresh(profile)
        
        # Update defined fields dynamically
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(profile, key, value)
            
        db.commit()
        db.refresh(profile)
        return profile

    @staticmethod
    def add_refresh_token(db: Session, user_id: uuid.UUID, token: str, expires_at: datetime) -> RefreshToken:
        db_token = RefreshToken(
            user_id=user_id,
            token=token,
            expires_at=expires_at
        )
        db.add(db_token)
        db.commit()
        db.refresh(db_token)
        return db_token

    @staticmethod
    def get_refresh_token(db: Session, token: str) -> Optional[RefreshToken]:
        return db.query(RefreshToken).filter(RefreshToken.token == token, RefreshToken.is_revoked == False).first()

    @staticmethod
    def revoke_refresh_token(db: Session, token: str) -> bool:
        db_token = db.query(RefreshToken).filter(RefreshToken.token == token).first()
        if db_token:
            db_token.is_revoked = True
            db.commit()
            return True
        return False

    @staticmethod
    def revoke_all_user_tokens(db: Session, user_id: uuid.UUID) -> None:
        db.query(RefreshToken).filter(RefreshToken.user_id == user_id).update({RefreshToken.is_revoked: True})
        db.commit()
