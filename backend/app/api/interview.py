import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.schemas.interview import (
    InterviewSessionCreate, InterviewSessionResponse, 
    AptitudeQuestionResponse, AptitudeAnswerSubmission, AptitudeResultResponse,
    GDTopicResponse, GDSubmission, GDResultResponse,
    TechnicalQuestionResponse, TechnicalSubmission, TechnicalResultResponse,
    HRQuestionResponse, HRSubmission, HRResultResponse,
    FinalReportResponse
)
from backend.app.services.interview_service import InterviewService
from backend.app.api.deps import get_current_user
from backend.app.models.models import User, Report, InterviewSession

router = APIRouter(prefix="/interview", tags=["AI Interview Process"])


@router.post("/session", response_model=InterviewSessionResponse, status_code=status.HTTP_201_CREATED)
def create_interview_session(
    data: InterviewSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new multi-stage interview session targeting a specific role and starts at Round 1.
    """
    return InterviewService.create_session(db, current_user.id, data)


@router.get("/session/active", response_model=Optional[InterviewSessionResponse])
def get_active_session(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Retrieves any active ongoing interview session for the current candidate.
    """
    session = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id, 
        InterviewSession.status == "started"
    ).first()
    return session


@router.get("/session/{id}", response_model=InterviewSessionResponse)
def get_session_details(id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Retrieves the basic status details of the interview session.
    """
    session = db.query(InterviewSession).filter(
        InterviewSession.id == id, 
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")
    return session


@router.get("/session/{id}/aptitude", response_model=List[AptitudeQuestionResponse])
def get_aptitude_questions(id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Retrieves the 5 multiple-choice questions for Round 1.
    """
    return InterviewService.get_aptitude_questions(db, id)


@router.post("/submit/aptitude", response_model=AptitudeResultResponse)
def submit_aptitude_answers(
    data: AptitudeAnswerSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Grades user response choice answers for Aptitude quiz incorporating negative marking.
    """
    return InterviewService.submit_aptitude_round(db, current_user.id, data)


@router.get("/session/{id}/gd", response_model=List[GDTopicResponse])
def get_gd_topics(id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Retrieves selection of topics for the Group Discussion round.
    """
    return InterviewService.get_gd_topics(db)


@router.post("/submit/gd", response_model=GDResultResponse)
def submit_gd_answer(
    data: GDSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Accepts transcription argument response for the Group Discussion and rates participation.
    """
    return InterviewService.submit_gd_round(db, current_user.id, data)


@router.get("/session/{id}/technical", response_model=List[TechnicalQuestionResponse])
def get_technical_questions(id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Retrieves the role-specific coding or architecture questions.
    """
    return InterviewService.get_technical_questions(db, id)


@router.post("/submit/technical", response_model=TechnicalResultResponse)
def submit_technical_answer(
    data: TechnicalSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submits user answer for a specific technical question for compiler/keyphrase checks.
    """
    return InterviewService.submit_technical_answer(db, current_user.id, data)


@router.get("/session/{id}/hr", response_model=List[HRQuestionResponse])
def get_hr_questions(id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Retrieves behavioral soft skills questions for the HR round.
    """
    return InterviewService.get_hr_questions(db, id)


@router.post("/submit/hr", response_model=HRResultResponse)
def submit_hr_answer(
    data: HRSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Grading HR answers using structural compliance checklists.
    """
    return InterviewService.submit_hr_answer(db, current_user.id, data)


@router.get("/session/{id}/report", response_model=FinalReportResponse)
def get_interview_report(id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Fetches completed interview report containing averages, radar charts, and custom roadmaps.
    """
    report = db.query(Report).filter(Report.session_id == id, Report.user_id == current_user.id).first()
    if not report:
        raise HTTPException(
            status_code=404, 
            detail="Final report is not ready. Complete all rounds to compile evaluation stats."
        )
    return report
