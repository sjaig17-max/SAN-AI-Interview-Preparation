from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.schemas.dashboard import DashboardStatsResponse, LeaderboardEntry
from backend.app.api.deps import get_current_user
from backend.app.models.models import (
    User, Resume, ResumeAnalysis, ActivityLog, Leaderboard, Achievement, Notification
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Assembles overall statistics, recent activity, skill breakdown charts, and gamification leaderboard.
    """
    # 1. Fetch Resume Scores
    latest_resume = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).first()
    ats_score = 0
    resume_score = 0
    if latest_resume and latest_resume.analysis:
        ats_score = latest_resume.analysis.ats_score
        resume_score = latest_resume.analysis.resume_score

    # 2. Activity logs
    recent_logs = db.query(ActivityLog).filter(ActivityLog.user_id == current_user.id).order_by(ActivityLog.created_at.desc()).limit(5).all()

    # 3. Achievements
    earned_achievements = db.query(Achievement).filter(Achievement.user_id == current_user.id).order_by(Achievement.unlocked_at.desc()).limit(3).all()

    # 4. Notifications
    unread_notifications = db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read == False).count()

    # 5. Leaderboard (Top 5 scores)
    top_entries = db.query(Leaderboard).order_by(Leaderboard.total_score.desc()).limit(5).all()
    leaderboard = []
    for entry in top_entries:
        user_name = entry.user.full_name if entry.user else "Anonymous User"
        leaderboard.append(LeaderboardEntry(user_name=user_name, total_score=entry.total_score))

    # Mock dynamic goals and strengths for detailed display
    todays_goal = "Complete your Technical Interview mock questions for python."
    recommended_learning = [
        "Mastering FastAPI lifespan and dependencies",
        "Understanding CSS grid systems and tailwind variables",
        "Building multi-threaded workers with Celery & Redis"
    ]
    skill_progress = {
        "Python": 80,
        "FastAPI": 75,
        "SQL/Postgres": 65,
        "React/TS": 50
    }

    return DashboardStatsResponse(
        resume_score=resume_score,
        ats_score=ats_score,
        learning_streak=5, # Static streak count
        interview_readiness=int((ats_score + resume_score) / 2) if ats_score else 45,
        overall_progress=60,
        todays_goal=todays_goal,
        recommended_learning=recommended_learning,
        skill_progress=skill_progress,
        recent_activities=recent_logs,
        achievements=earned_achievements,
        leaderboard=leaderboard,
        unread_notifications_count=unread_notifications
    )
