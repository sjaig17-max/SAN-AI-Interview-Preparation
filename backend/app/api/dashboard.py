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

    # 3. Auto-award Achievements and Calculate XP
    base_xp = 100
    
    # Milestone 1: Uploaded resume
    if latest_resume:
        existing_first_step = db.query(Achievement).filter(
            Achievement.user_id == current_user.id,
            Achievement.title == "First Steps"
        ).first()
        if not existing_first_step:
            ach = Achievement(
                user_id=current_user.id,
                title="First Steps",
                description="Uploaded your first resume for ATS check.",
                badge_icon="file-text"
            )
            db.add(ach)
            db.commit()
        base_xp += 150

    # Milestone 2: High ATS score
    if ats_score >= 80:
        existing_ats = db.query(Achievement).filter(
            Achievement.user_id == current_user.id,
            Achievement.title == "ATS Conqueror"
        ).first()
        if not existing_ats:
            ach = Achievement(
                user_id=current_user.id,
                title="ATS Conqueror",
                description="Scored 80% or higher on ATS alignment.",
                badge_icon="shield-check"
            )
            db.add(ach)
            db.commit()
        base_xp += 250

    # Milestone 3: Finished at least 1 mock interview
    from backend.app.models.models import InterviewSession
    completed_interviews = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id,
        InterviewSession.status == "completed"
    ).count()
    if completed_interviews > 0:
        existing_mock = db.query(Achievement).filter(
            Achievement.user_id == current_user.id,
            Achievement.title == "Mock Marathoner"
        ).first()
        if not existing_mock:
            ach = Achievement(
                user_id=current_user.id,
                title="Mock Marathoner",
                description="Completed a full interactive AI Mock Interview round.",
                badge_icon="trophy"
            )
            db.add(ach)
            db.commit()
        base_xp += 300 + (completed_interviews * 100)

    # Sync XP with Leaderboard table
    leaderboard_entry = db.query(Leaderboard).filter(Leaderboard.user_id == current_user.id).first()
    if not leaderboard_entry:
        leaderboard_entry = Leaderboard(user_id=current_user.id, total_score=float(base_xp))
        db.add(leaderboard_entry)
    else:
        leaderboard_entry.total_score = max(leaderboard_entry.total_score, float(base_xp))
    db.commit()

    user_xp = int(leaderboard_entry.total_score)
    user_level = (user_xp // 200) + 1

    # Fetch Earned Achievements
    earned_achievements = db.query(Achievement).filter(Achievement.user_id == current_user.id).order_by(Achievement.unlocked_at.desc()).all()

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
        unread_notifications_count=unread_notifications,
        user_xp=user_xp,
        user_level=user_level
    )
