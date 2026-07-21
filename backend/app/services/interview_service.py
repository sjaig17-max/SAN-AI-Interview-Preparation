import uuid
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.models.models import (
    InterviewSession, AptitudeQuestion, TechnicalQuestion, 
    HRQuestion, AptitudeResult, GDResult, TechnicalResult, 
    HRResult, Report, ActivityLog, Leaderboard, Achievement
)
from backend.app.schemas.interview import (
    InterviewSessionCreate, AptitudeAnswerSubmission, 
    GDSubmission, TechnicalSubmission, HRSubmission
)
from backend.app.ai import interview_evaluator


class InterviewService:
    """
    Core state machine orchestrating interview session rounds, grading mechanics,
    negative marking, and final scoring compilation.
    """

    @staticmethod
    def create_session(db: Session, user_id: uuid.UUID, data: InterviewSessionCreate) -> InterviewSession:
        # Create session
        session = InterviewSession(
            user_id=user_id,
            job_role=data.job_role,
            experience_level=data.experience_level,
            current_round=1,  # Start on Round 1: Aptitude
            status="started"
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        # Seed initial question banks if empty, to ensure out-of-the-box reliability
        InterviewService._seed_question_banks_if_needed(db, data.job_role)

        # Log activity
        log = ActivityLog(
            user_id=user_id,
            action="interview_started",
            details={"session_id": str(session.id), "role": data.job_role}
        )
        db.add(log)
        db.commit()
        
        return session

    @staticmethod
    def get_aptitude_questions(db: Session, session_id: uuid.UUID) -> List[AptitudeQuestion]:
        # Return 5 random aptitude questions
        # In production, filter by session characteristics
        return db.query(AptitudeQuestion).limit(5).all()

    @staticmethod
    def submit_aptitude_round(db: Session, user_id: uuid.UUID, data: AptitudeAnswerSubmission) -> AptitudeResult:
        session = db.query(InterviewSession).filter(InterviewSession.id == data.session_id, InterviewSession.user_id == user_id).first()
        if not session or session.current_round != 1:
            raise HTTPException(status_code=400, detail="Invalid session or incorrect interview round.")

        correct_count = 0
        total_questions = len(data.answers)
        score = 0.0
        details = {}

        for q_id, user_opt in data.answers.items():
            q = db.query(AptitudeQuestion).filter(AptitudeQuestion.id == uuid.UUID(q_id)).first()
            if q:
                is_correct = q.correct_option.strip().upper() == user_opt.strip().upper()
                if is_correct:
                    correct_count += 1
                    score += 1.0  # +1 point
                else:
                    score -= 0.25  # -0.25 negative marking
                
                details[q_id] = {
                    "question": q.question,
                    "selected": user_opt,
                    "correct": q.correct_option,
                    "is_correct": is_correct
                }

        # Prevent negative absolute scores
        score = max(0.0, score)
        final_percentage = (score / max(1, total_questions)) * 100

        result = AptitudeResult(
            session_id=data.session_id,
            user_id=user_id,
            score=final_percentage,
            total_questions=total_questions,
            correct_answers=correct_count,
            duration_seconds=data.duration_seconds,
            details=details
        )
        db.add(result)

        # Update session round state
        session.current_round = 2  # Advance to Group Discussion
        
        # Log user activity
        log = ActivityLog(
            user_id=user_id,
            action="round_aptitude_completed",
            details={"session_id": str(session.id), "score": final_percentage}
        )
        db.add(log)
        db.commit()
        db.refresh(result)
        return result

    @staticmethod
    def get_gd_topics(db: Session) -> List[Any]:
        # Return standard seed topics
        from backend.app.models.models import GDTopic
        return db.query(GDTopic).all()

    @staticmethod
    def submit_gd_round(db: Session, user_id: uuid.UUID, data: GDSubmission) -> GDResult:
        session = db.query(InterviewSession).filter(InterviewSession.id == data.session_id).first()
        if not session or session.current_round != 2:
            raise HTTPException(status_code=400, detail="Invalid session or incorrect interview round.")

        from backend.app.models.models import GDTopic
        topic = db.query(GDTopic).filter(GDTopic.id == data.topic_id).first()
        topic_title = topic.title if topic else "General Technology Discussion"

        # AI evaluation of user participation response
        eval_report = interview_evaluator.evaluate_gd_participation(topic_title, data.answer_text)

        result = GDResult(
            session_id=data.session_id,
            user_id=user_id,
            topic=topic_title,
            transcription=data.answer_text,
            evaluation=eval_report
        )
        db.add(result)

        session.current_round = 3  # Advance to Technical Interview
        db.commit()
        db.refresh(result)
        return result

    @staticmethod
    def get_technical_questions(db: Session, session_id: uuid.UUID) -> List[TechnicalQuestion]:
        session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
        role = session.job_role if session else "Software Engineer"
        # Return 3 questions mapped to job role/subject
        questions = db.query(TechnicalQuestion).filter(TechnicalQuestion.subject.ilike(f"%{role}%")).limit(3).all()
        if len(questions) < 3:
            matched_ids = {q.id for q in questions}
            additional_needed = 3 - len(questions)
            # Fetch other questions that aren't already included
            extra_questions = db.query(TechnicalQuestion).filter(
                ~TechnicalQuestion.id.in_(matched_ids) if matched_ids else True
            ).limit(additional_needed).all()
            questions.extend(extra_questions)
        return questions[:3]

    @staticmethod
    def submit_technical_answer(db: Session, user_id: uuid.UUID, data: TechnicalSubmission) -> TechnicalResult:
        session = db.query(InterviewSession).filter(InterviewSession.id == data.session_id).first()
        if not session or session.current_round != 3:
            raise HTTPException(status_code=400, detail="Invalid session or incorrect round.")

        q = db.query(TechnicalQuestion).filter(TechnicalQuestion.id == data.question_id).first()
        if not q:
            raise HTTPException(status_code=404, detail="Question not found.")

        # AI grading
        eval_report = interview_evaluator.evaluate_technical_answer(q.question, q.expected_answer, data.user_answer)

        result = TechnicalResult(
            session_id=data.session_id,
            user_id=user_id,
            transcription=data.user_answer,
            evaluation={
                "question": q.question,
                "score": eval_report.get("score", 0),
                "correct": eval_report.get("correct", False),
                "keyword_match_percentage": eval_report.get("keyword_match_percentage", 0),
                "missing_points": eval_report.get("missing_points", []),
                "suggestion": eval_report.get("suggestion", "")
            }
        )
        db.add(result)
        db.commit()
        db.refresh(result)
        
        # In this workflow, check if user has submitted answers for all 3 technical questions
        total_submitted = db.query(TechnicalResult).filter(TechnicalResult.session_id == data.session_id).count()
        if total_submitted >= 3:
            session.current_round = 4  # Advance to HR Interview
            db.commit()
            
        return result

    @staticmethod
    def get_hr_questions(db: Session) -> List[HRQuestion]:
        # Return 2 behavioral questions
        return db.query(HRQuestion).limit(2).all()

    @staticmethod
    def submit_hr_answer(db: Session, user_id: uuid.UUID, data: HRSubmission) -> HRResult:
        session = db.query(InterviewSession).filter(InterviewSession.id == data.session_id).first()
        if not session or session.current_round != 4:
            raise HTTPException(status_code=400, detail="Invalid session or incorrect round.")

        q = db.query(HRQuestion).filter(HRQuestion.id == data.question_id).first()
        if not q:
            raise HTTPException(status_code=404, detail="Question not found.")

        # AI HR evaluation
        eval_report = interview_evaluator.evaluate_hr_answer(q.question, data.user_answer)

        result = HRResult(
            session_id=data.session_id,
            user_id=user_id,
            transcription=data.user_answer,
            evaluation={
                "question": q.question,
                "score": eval_report.get("score", 0),
                "professionalism_score": eval_report.get("professionalism_score", 0),
                "star_compliance_score": eval_report.get("star_compliance_score", 0),
                "emotional_intelligence": eval_report.get("emotional_intelligence", 0),
                "feedback": eval_report.get("feedback", ""),
                "improvement_tips": eval_report.get("improvement_tips", [])
            }
        )
        db.add(result)
        db.commit()
        db.refresh(result)

        # Check if HR round is finished (user answered at least 2 HR questions)
        total_submitted = db.query(HRResult).filter(HRResult.session_id == data.session_id).count()
        if total_submitted >= 2:
            # Complete the interview session and build the final report
            InterviewService._compile_final_report(db, session)

        return result

    @staticmethod
    def _compile_final_report(db: Session, session: InterviewSession) -> Report:
        # Calculate individual averages
        apt_res = db.query(AptitudeResult).filter(AptitudeResult.session_id == session.id).first()
        apt_score = apt_res.score if apt_res else 0.0

        gd_res = db.query(GDResult).filter(GDResult.session_id == session.id).first()
        gd_score = gd_res.evaluation.get("score", 0.0) if gd_res else 0.0

        tech_results = db.query(TechnicalResult).filter(TechnicalResult.session_id == session.id).all()
        tech_score = sum(r.evaluation.get("score", 0) for r in tech_results) / len(tech_results) if tech_results else 0.0

        hr_results = db.query(HRResult).filter(HRResult.session_id == session.id).all()
        hr_score = sum(r.evaluation.get("score", 0) for r in hr_results) / len(hr_results) if hr_results else 0.0

        overall = (apt_score + gd_score + tech_score + hr_score) / 4.0

        # Retrieve user skills
        from backend.app.models.models import Skill
        user_skills = db.query(Skill).filter(Skill.user_id == session.user_id).all()
        skill_names = [s.name for s in user_skills] or ["Python", "SQL"]

        # Call AI roadmap generator
        career_roadmap = interview_evaluator.generate_career_roadmap(skill_names, session.job_role)

        report = Report(
            session_id=session.id,
            user_id=session.user_id,
            overall_score=overall,
            aptitude_score=apt_score,
            gd_score=gd_score,
            technical_score=tech_score,
            hr_score=hr_score,
            detailed_evaluation={
                "strengths": ["Clear communication under pressure", "Good understanding of software architecture patterns"],
                "weaknesses": ["Requires familiarity with distributed queue services", "Verbal vocabulary could be enhanced"],
                "roadmap": career_roadmap.get("roadmap", []),
                "resources": career_roadmap.get("resources", [])
            }
        )
        db.add(report)

        # Update session
        session.current_round = 5  # Completed
        session.overall_score = overall
        session.status = "completed"

        # Update Leaderboard score
        leaderboard_entry = db.query(Leaderboard).filter(Leaderboard.user_id == session.user_id).first()
        if not leaderboard_entry:
            leaderboard_entry = Leaderboard(user_id=session.user_id, total_score=overall)
            db.add(leaderboard_entry)
        else:
            # Accumulate scores
            leaderboard_entry.total_score = max(leaderboard_entry.total_score, overall)
        
        # Provision achievement
        achievement = Achievement(
            user_id=session.user_id,
            title="Interview Pioneer",
            description=f"Successfully completed the full multi-round AI Interview for {session.job_role}.",
            badge_icon="trophy"
        )
        db.add(achievement)

        # Log Activity
        log = ActivityLog(
            user_id=session.user_id,
            action="interview_completed",
            details={"session_id": str(session.id), "overall_score": overall}
        )
        db.add(log)
        db.commit()
        db.refresh(report)
        return report

    @staticmethod
    def _seed_question_banks_if_needed(db: Session, job_role: str) -> None:
        """
        Seeds baseline questions into database tables on session creation if empty.
        Ensures client tests run correctly out-of-the-box.
        """
        # Aptitude
        if db.query(AptitudeQuestion).count() == 0:
            questions = [
                AptitudeQuestion(
                    question="A car travels at 60 km/hr for 2 hours and 80 km/hr for another 3 hours. What is the average speed of the car?",
                    options={"A": "70 km/hr", "B": "72 km/hr", "C": "75 km/hr", "D": "76 km/hr"},
                    correct_option="B",
                    subject="Quantitative Aptitude",
                    topic="Speed Time Distance",
                    difficulty="Medium"
                ),
                AptitudeQuestion(
                    question="If 'COACH' is written as 'DPBDI' in a code language, how will 'PLAYER' be written?",
                    options={"A": "QMBZFS", "B": "QKBZFS", "C": "QMBYFS", "D": "QMBSFS"},
                    correct_option="A",
                    subject="Logical Reasoning",
                    topic="Coding-Decoding",
                    difficulty="Easy"
                ),
                AptitudeQuestion(
                    question="Select the synonym of 'IMPETUOUS'.",
                    options={"A": "Cautious", "B": "Impatient", "C": "Rash", "D": "Quiet"},
                    correct_option="C",
                    subject="Verbal Ability",
                    topic="Vocabulary",
                    difficulty="Hard"
                ),
                AptitudeQuestion(
                    question="A and B can complete a task in 8 days. If A alone takes 12 days, how long does B take?",
                    options={"A": "16 days", "B": "20 days", "C": "24 days", "D": "28 days"},
                    correct_option="C",
                    subject="Quantitative Aptitude",
                    topic="Time & Work",
                    difficulty="Medium"
                ),
                AptitudeQuestion(
                    question="Which number replaces the question mark: 2, 6, 12, 20, 30, ?",
                    options={"A": "40", "B": "42", "C": "44", "D": "46"},
                    correct_option="B",
                    subject="Logical Reasoning",
                    topic="Number System",
                    difficulty="Easy"
                )
            ]
            db.bulk_save_objects(questions)
            db.commit()

        # GD Topics
        from backend.app.models.models import GDTopic
        if db.query(GDTopic).count() == 0:
            topics = [
                GDTopic(
                    title="The Role of Social Media in Modern Corporate Recruitment",
                    description="Analyze whether GitHub, LinkedIn, and portfolios provide a better view of candidate credentials than standard resumes.",
                    category="Technology & Career",
                    difficulty="Medium"
                ),
                GDTopic(
                    title="Cryptocurrency: Decentralized Future or Financial Bubble?",
                    description="Discuss blockchain adoption, regulatory implications, and safety risks associated with digital currencies.",
                    category="Economy",
                    difficulty="Hard"
                )
            ]
            db.bulk_save_objects(topics)
            db.commit()

        # Technical Questions
        if db.query(TechnicalQuestion).count() == 0:
            tech_questions = [
                TechnicalQuestion(
                    question="Describe Python decorator mechanics and how to construct a decorator that caches function execution results.",
                    expected_answer="A decorator wraps a function to modify its behavior. Result caching can be achieved by checking a key/value cache dictionary inside the inner wrapper function before calling the original target function.",
                    subject="Python Developer",
                    topic="Decorators",
                    difficulty="Medium"
                ),
                TechnicalQuestion(
                    question="What is JWT and how are claims encoded? How do you prevent token tampering?",
                    expected_answer="JSON Web Tokens consist of Header, Payload, and Signature. Claims are Base64Url encoded. Tampering is prevented by verifying the signature using a secure secret key on the server.",
                    subject="Backend Developer",
                    topic="Authentication",
                    difficulty="Medium"
                ),
                TechnicalQuestion(
                    question="Explain the virtual DOM algorithm in React and how key attributes optimize list renders.",
                    expected_answer="React creates a memory copy of the actual DOM, reconciles changes via diff algorithms, and batched patches the physical DOM. Keys identify elements uniquely to prevent full child re-mounts.",
                    subject="Frontend Developer",
                    topic="React Core",
                    difficulty="Medium"
                )
            ]
            db.bulk_save_objects(tech_questions)
            db.commit()

        # HR Questions
        if db.query(HRQuestion).count() == 0:
            hr_questions = [
                HRQuestion(
                    question="Tell me about a time you faced a serious technical conflict in a engineering project. How did you resolve it?",
                    category="Conflict Resolution",
                    expected_points=["Describe Situation", "Explain Task", "Outline Actions", "Share Result"]
                ),
                HRQuestion(
                    question="Why do you want to work at your target company and what makes you the best fit for this role?",
                    category="Career Goals",
                    expected_points=["Company Values Alignment", "Skill Match", "Long-term Goals"]
                )
            ]
            db.bulk_save_objects(hr_questions)
            db.commit()
