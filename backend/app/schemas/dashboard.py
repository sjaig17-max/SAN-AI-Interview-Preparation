from typing import List, Dict, Optional, Any
from pydantic import BaseModel
from datetime import datetime


class ActivityLogResponse(BaseModel):
    action: str
    created_at: datetime
    details: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class AchievementResponse(BaseModel):
    title: str
    description: str
    badge_icon: str
    unlocked_at: datetime

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    user_name: str
    total_score: float
    rank: Optional[int] = None


class DashboardStatsResponse(BaseModel):
    resume_score: int
    ats_score: int
    learning_streak: int
    interview_readiness: int
    overall_progress: int
    todays_goal: str
    recommended_learning: List[str]
    skill_progress: Dict[str, int]
    recent_activities: List[ActivityLogResponse]
    achievements: List[AchievementResponse]
    leaderboard: List[LeaderboardEntry]
    unread_notifications_count: int
    user_xp: int = 0
    user_level: int = 1
