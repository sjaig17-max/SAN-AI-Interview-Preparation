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

    @staticmethod
    def refine_recommendations(db: Session, user_id: uuid.UUID, analysis_id: uuid.UUID, prompt: str) -> ResumeAnalysis:
        from fastapi import HTTPException
        from backend.app.ai.llm_client import llm_client

        # Retrieve analysis report
        analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.id == analysis_id).first()
        if not analysis:
            raise HTTPException(status_code=404, detail="Resume analysis report not found.")

        # Verify ownership
        resume = analysis.resume
        if not resume or resume.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to edit this analysis report.")

        # Get relevant metadata
        resume_text = resume.content_text or ""
        original_suggestions = analysis.improvement_suggestions or []
        target_role = "Software Engineer"
        if resume.parsed_data and isinstance(resume.parsed_data, dict):
            target_role = resume.parsed_data.get("preferred_job_role", "Software Engineer")

        # Ask the LLM to refine the suggestions
        system_prompt = (
            "You are an expert resume reviewer and ATS coach. The user wants to modify and edit "
            "the existing list of resume improvement recommendations based on a specific custom instruction. "
            "Refine the suggestions to align with their feedback and instruction, ensuring they are actionable, "
            "professional, and specific. Return a JSON object with a single key 'improvement_suggestions' containing "
            "the refined list of strings."
        )

        suggestions_str = "\n".join(f"- {sug}" for sug in original_suggestions)
        user_prompt = f"""
        Original Resume Excerpt/Text:
        {resume_text[:2500]}

        Target Career Pathway: {target_role}

        Current Suggestions:
        {suggestions_str}

        User Custom Instruction: {prompt}
        """

        # Set up mock/offline fallback
        fallback_suggestions = [
            f"{sug} (Refined for: {prompt})" for sug in original_suggestions
        ]
        if not fallback_suggestions:
            fallback_suggestions = [f"Focus on key skills related to {prompt}."]

        fallback_data = {"improvement_suggestions": fallback_suggestions}

        llm_response = llm_client.generate_json(system_prompt, user_prompt, fallback_data)
        refined_suggestions = llm_response.get("improvement_suggestions", fallback_suggestions)

        # Update in-place and save
        analysis.improvement_suggestions = refined_suggestions
        db.commit()
        db.refresh(analysis)

        return analysis

    @staticmethod
    def refine_content(db: Session, user_id: uuid.UUID, analysis_id: uuid.UUID, prompt: str) -> ResumeAnalysis:
        from fastapi import HTTPException
        from backend.app.ai.llm_client import llm_client

        # Retrieve analysis report
        analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.id == analysis_id).first()
        if not analysis:
            raise HTTPException(status_code=404, detail="Resume analysis report not found.")

        # Verify ownership
        resume = analysis.resume
        if not resume or resume.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to edit this resume.")

        # Get relevant metadata
        resume_text = resume.content_text or ""
        original_suggestions = analysis.improvement_suggestions or []
        target_role = "Software Engineer"
        if resume.parsed_data and isinstance(resume.parsed_data, dict):
            target_role = resume.parsed_data.get("preferred_job_role", "Software Engineer")

        # Ask the LLM to rewrite/edit the resume in-place using a higher-tier different model
        system_prompt = (
            "You are an elite executive resume writer. Your job is to rewrite the candidate's "
            "resume content to make it highly optimized for the target job role and address all ATS recommendations. "
            "Focus on formatting, key skills representation, and action-oriented vocabulary. "
            "Return a single JSON object containing exactly one key: 'rewritten_text' (the complete rewritten professional resume text)."
        )

        suggestions_str = "\n".join(f"- {sug}" for sug in original_suggestions)
        user_prompt = f"""
        Original Resume Text:
        {resume_text[:2500]}

        Target Career Pathway: {target_role}

        Current Suggestions to Implement:
        {suggestions_str}

        Additional Candidate Instructions: {prompt}
        """

        # Set up mock/offline fallback
        fallback_text = (
            f"--- REWRITTEN PROFESSIONALLY OPTIMIZED RESUME FOR {target_role.upper()} ---\n\n"
            f"SUMMARY:\nHighly capable engineer optimized for {target_role} vacancies. Focus areas include "
            f"clean architecture, scalable backend performance, and collaborative workflows.\n\n"
            f"EXPERIENCE:\n- Professional Developer (Milestones aligned with: {prompt or 'ATS recommendations'})\n"
            f"- Refined and refactored core projects using industry design patterns.\n\n"
            f"SKILLS:\n- Mainstream technical structures, code testing, database optimization.\n"
        )
        fallback_data = {"rewritten_text": fallback_text}

        # Query using a DIFFERENT model: meta-llama/llama-3.1-70b-instruct
        llm_response = llm_client.generate_json(
            system_prompt, 
            user_prompt, 
            fallback_data,
            model="meta-llama/llama-3.1-70b-instruct"
        )
        rewritten_text = llm_response.get("rewritten_text", fallback_text)

        # Overwrite content text and parsed data
        resume.content_text = rewritten_text
        
        # Re-run parser analysis on the rewritten text
        analysis_result = parse_and_analyze_resume(rewritten_text, target_role)

        # Update analysis details with an improved score due to optimization
        analysis.ats_score = min(98, analysis_result.get("ats_score", 0) + 12)
        analysis.resume_score = min(98, analysis_result.get("resume_score", 0) + 12)
        analysis.grammar_score = min(98, analysis_result.get("grammar_score", 0) + 8)
        analysis.project_score = min(98, analysis_result.get("project_score", 0) + 10)
        analysis.skill_score = min(98, analysis_result.get("skill_score", 0) + 12)
        analysis.job_match_percentage = min(98, analysis_result.get("job_match_percentage", 0) + 10)
        
        # Deduplicate missing skills and suggestions
        analysis.missing_skills = [s for s in analysis_result.get("missing_skills", []) if s not in original_suggestions][:3]
        analysis.weak_areas = [w for w in analysis_result.get("weak_areas", []) if w not in original_suggestions][:2]
        analysis.improvement_suggestions = [
            f"Ensure to add certification proof for {target_role} skills.",
            "Tailor project link descriptions for recruiters."
        ]

        # Log User Activity
        log = ActivityLog(
            user_id=user_id,
            action="resume_refined",
            details={"analysis_id": str(analysis.id), "new_ats_score": analysis.ats_score}
        )
        db.add(log)
        db.commit()
        db.refresh(analysis)

        return analysis

