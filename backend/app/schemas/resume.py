import uuid
from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel


class ResumeUploadResponse(BaseModel):
    id: uuid.UUID
    file_name: str
    file_size: int
    created_at: datetime

    class Config:
        from_attributes = True


class ResumeAnalysisResponse(BaseModel):
    id: uuid.UUID
    resume_id: uuid.UUID
    ats_score: int
    resume_score: int
    grammar_score: int
    project_score: int
    skill_score: int
    experience_score: int
    communication_score: int
    missing_skills: List[str]
    weak_areas: List[str]
    strong_areas: List[str]
    job_match_percentage: int
    improvement_suggestions: List[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ResumeOptimizeRequest(BaseModel):
    target_role: str
    target_description: Optional[str] = None


class ResumeRefineRequest(BaseModel):
    analysis_id: uuid.UUID
    prompt: str

