import uuid
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import UploadFile
from backend.app.models.models import Resume, ResumeAnalysis, ActivityLog
from backend.app.ai.resume_parser import extract_text_from_bytes, parse_and_analyze_resume


class ResumeService:
    """
    Service layer coordinating resume uploads, text extraction, and ATS optimizations.
    """

    @staticmethod
    def process_and_analyze_resume(db: Session, user_id: uuid.UUID, file: UploadFile, target_role: str = "Software Engineer") -> ResumeAnalysis:
        # Read file contents
        file_bytes = file.file.read()
        file_name = file.filename or "resume.pdf"
        file_size = len(file_bytes)

        # In production, file would be uploaded to Cloudinary/S3.
        # We simulate a cloud upload and keep local tracking references.
        simulated_cloud_url = f"/uploads/resumes/{uuid.uuid4()}_{file_name}"

        # Extract text content from resume bytes
        resume_text = extract_text_from_bytes(file_bytes, file_name)

        # Run AI ATS analysis
        analysis_result = parse_and_analyze_resume(resume_text, target_role)

        # Save Resume record
        db_resume = Resume(
            user_id=user_id,
            file_path=simulated_cloud_url,
            file_name=file_name,
            file_size=file_size,
            content_text=resume_text,
            parsed_data=analysis_result.get("parsed_data", {})
        )
        db.add(db_resume)
        db.commit()
        db.refresh(db_resume)

        # Save ResumeAnalysis record
        db_analysis = ResumeAnalysis(
            resume_id=db_resume.id,
            ats_score=analysis_result.get("ats_score", 0),
            resume_score=analysis_result.get("resume_score", 0),
            grammar_score=analysis_result.get("grammar_score", 0),
            project_score=analysis_result.get("project_score", 0),
            skill_score=analysis_result.get("skill_score", 0),
            experience_score=analysis_result.get("experience_score", 0),
            communication_score=analysis_result.get("communication_score", 0),
            missing_skills=analysis_result.get("missing_skills", []),
            weak_areas=analysis_result.get("weak_areas", []),
            strong_areas=analysis_result.get("strong_areas", []),
            job_match_percentage=analysis_result.get("job_match_percentage", 0),
            improvement_suggestions=analysis_result.get("improvement_suggestions", [])
        )
        db.add(db_analysis)

        # Log User Activity
        log = ActivityLog(
            user_id=user_id,
            action="resume_uploaded",
            details={"file_name": file_name, "ats_score": db_analysis.ats_score, "target_role": target_role}
        )
        db.add(log)
        db.commit()
        db.refresh(db_analysis)

        return db_analysis

    @staticmethod
    def get_latest_analysis(db: Session, user_id: uuid.UUID) -> Optional[ResumeAnalysis]:
        latest_resume = db.query(Resume).filter(Resume.user_id == user_id).order_by(Resume.created_at.desc()).first()
        if not latest_resume:
            return None
        return latest_resume.analysis
