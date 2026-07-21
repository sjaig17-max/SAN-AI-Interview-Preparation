from fastapi import APIRouter, Depends, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.schemas.resume import ResumeAnalysisResponse, ResumeOptimizeRequest
from backend.app.api.deps import get_current_user
from backend.app.models.models import User
from backend.app.services.resume_service import ResumeService

router = APIRouter(prefix="/resume", tags=["Resume Optimization"])


@router.post("/upload", response_model=ResumeAnalysisResponse, status_code=status.HTTP_201_CREATED)
def upload_resume(
    file: UploadFile = File(...),
    target_role: str = Form("Software Engineer"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ingests resume binary (PDF/DOCX), processes structure parser, and saves ATS alignment reports.
    """
    return ResumeService.process_and_analyze_resume(db, current_user.id, file, target_role)


@router.get("/analysis/latest", response_model=ResumeAnalysisResponse)
def get_latest_resume_analysis(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Retrieves the most recent resume analysis report for the logged-in candidate.
    """
    analysis = ResumeService.get_latest_analysis(db, current_user.id)
    if not analysis:
        # Generate default response if none uploaded
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404, 
            detail="No resume analysis report exists. Please upload your resume first."
        )
    return analysis
