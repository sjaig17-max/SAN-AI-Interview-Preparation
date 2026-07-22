import uuid
from datetime import datetime
from typing import List, Dict, Optional, Any
from pydantic import BaseModel


class InterviewSessionCreate(BaseModel):
    job_role: str
    experience_level: str  # Student, Entry, Mid, Senior
    difficulty: str = "Medium"
    language: str = "English"
    resume_id: Optional[uuid.UUID] = None
    persona: str = "Neutral"


class InterviewSessionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    job_role: str
    experience_level: str
    difficulty: str
    language: str
    resume_id: Optional[uuid.UUID]
    current_round: int
    overall_score: float
    status: str
    persona: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AptitudeAnswerSubmission(BaseModel):
    session_id: uuid.UUID
    answers: Dict[str, str]  # Map of Question UUID string to selected option (e.g. "A", "B")
    duration_seconds: int


class AptitudeQuestionResponse(BaseModel):
    id: uuid.UUID
    question: str
    options: Dict[str, str]
    subject: str
    topic: str
    difficulty: str

    class Config:
        from_attributes = True


class AptitudeResultResponse(BaseModel):
    id: uuid.UUID
    score: float
    total_questions: int
    correct_answers: int
    duration_seconds: int
    created_at: datetime

    class Config:
        from_attributes = True


class GDTopicResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    category: str

    class Config:
        from_attributes = True


class GDSubmission(BaseModel):
    session_id: uuid.UUID
    topic_id: uuid.UUID
    answer_text: str


class GDResultResponse(BaseModel):
    id: uuid.UUID
    topic: str
    transcription: Optional[str]
    evaluation: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class TechnicalQuestionResponse(BaseModel):
    id: uuid.UUID
    question: str
    subject: str
    topic: str
    difficulty: str

    class Config:
        from_attributes = True


class TechnicalSubmission(BaseModel):
    session_id: uuid.UUID
    question_id: uuid.UUID
    user_answer: str


class TechnicalResultResponse(BaseModel):
    id: uuid.UUID
    transcription: Optional[str]
    evaluation: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class HRQuestionResponse(BaseModel):
    id: uuid.UUID
    question: str
    category: str

    class Config:
        from_attributes = True


class HRSubmission(BaseModel):
    session_id: uuid.UUID
    question_id: uuid.UUID
    user_answer: str


class HRResultResponse(BaseModel):
    id: uuid.UUID
    transcription: Optional[str]
    evaluation: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class FinalReportResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    overall_score: float
    aptitude_score: float
    gd_score: float
    technical_score: float
    hr_score: float
    detailed_evaluation: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
