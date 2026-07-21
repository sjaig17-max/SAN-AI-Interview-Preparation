import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.api.auth import router as auth_router
from backend.app.api.dashboard import router as dashboard_router
from backend.app.api.resume import router as resume_router
from backend.app.api.interview import router as interview_router
from backend.app.websocket.interview_ws import router as ws_router
from backend.app.models.models import Role, User, UserProfile
from backend.app.core.security import get_password_hash

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("san_ai_backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan events for FastAPI.
    Performs startup database table check/creation and seeds default user credentials.
    """
    logger.info("Starting up SAN AI Interview Preparation application...")
    try:
        logger.info("Verifying database tables exist...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified successfully.")
        
        # Seed default roles and user credentials
        db = SessionLocal()
        try:
            # 1. Seed Roles
            user_role = db.query(Role).filter(Role.name == "USER").first()
            if not user_role:
                user_role = Role(name="USER", description="Standard student/professional user role")
                db.add(user_role)
            admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
            if not admin_role:
                admin_role = Role(name="ADMIN", description="Administrator role")
                db.add(admin_role)
            db.commit()
            db.refresh(user_role)

            # 2. Seed default user account if not exists
            default_email = "sjaig17@gmail.com"
            existing = db.query(User).filter(User.email == default_email).first()
            if not existing:
                default_user = User(
                    email=default_email,
                    password_hash=get_password_hash("password123"),
                    full_name="Jane Doe",
                    is_active=True,
                    is_admin=True,
                    role_id=user_role.id
                )
                db.add(default_user)
                db.commit()
                db.refresh(default_user)
                
                profile = UserProfile(
                    user_id=default_user.id,
                    college="Harvard University",
                    degree="Computer Science",
                    department="Engineering",
                    current_year=4,
                    experience_level="Entry",
                    preferred_job_role="Software Engineer"
                )
                db.add(profile)
                db.commit()
                logger.info(f"Successfully seeded default user: {default_email} with password 'password123'")
        except Exception as e:
            logger.error(f"Failed to seed default databases: {e}")
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Error initializing database tables on startup: {e}")
        logger.warning("Ensure PostgreSQL is running and DATABASE_URL is correct.")
    yield
    logger.info("Shutting down SAN AI Interview Preparation application...")


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Enterprise SaaS platform for AI-powered Interview Preparation.",
    lifespan=lifespan
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://san-ai-interview-preparation-fronte.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include core routers
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(resume_router)
app.include_router(interview_router)
app.include_router(ws_router)


@app.get("/health", tags=["System"])
def health_check():
    """
    Health check endpoint for status validation.
    """
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": settings.ENVIRONMENT
    }


@app.websocket("/ws/test")
async def websocket_test_endpoint(websocket: WebSocket):
    """
    Test WebSocket endpoint to verify real-time connectivity.
    """
    await websocket.accept()
    logger.info("Test WebSocket connection accepted.")
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Echo response: {data}")
    except WebSocketDisconnect:
        logger.info("Test WebSocket connection closed.")
