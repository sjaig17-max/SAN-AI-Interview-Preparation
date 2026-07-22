import logging
from typing import List, Dict, Any, Optional
from backend.app.ai.llm_client import llm_client

logger = logging.getLogger("san_ai_interview_evaluator")


def generate_aptitude_questions(subject: str, difficulty: str = "Medium", count: int = 5) -> List[Dict[str, Any]]:
    """
    Generates dynamic aptitude multiple-choice questions.
    """
    system_prompt = "You are a professional test creator specializing in corporate aptitude examinations."
    user_prompt = f"""
    Subject: {subject}
    Difficulty: {difficulty}
    Generate {count} unique multiple-choice questions.
    
    Respond in JSON format only with a root key "questions". Each question should contain:
    - question: string
    - options: object with keys "A", "B", "C", "D"
    - correct_option: string ("A", "B", "C", or "D")
    - topic: string (e.g. "Time & Work", "Logical Puzzle")
    - difficulty: string
    """
    
    fallback_data = {
        "questions": [
            {
                "question": "A can complete a work in 10 days, and B can complete the same work in 15 days. How many days will they take if they work together?",
                "options": {"A": "5 days", "B": "6 days", "C": "8 days", "D": "9 days"},
                "correct_option": "B",
                "topic": "Time & Work",
                "difficulty": difficulty
            },
            {
                "question": "Pointing to a man, a woman said, 'His mother is the only daughter of my mother.' How is the woman related to the man?",
                "options": {"A": "Mother", "B": "Daughter", "C": "Sister", "D": "Grandmother"},
                "correct_option": "A",
                "topic": "Blood Relations",
                "difficulty": difficulty
            }
        ]
    }
    
    result = llm_client.generate_json(system_prompt, user_prompt, fallback_data)
    return result.get("questions", fallback_data["questions"])


def generate_technical_questions(role: str, difficulty: str = "Medium", count: int = 5) -> List[Dict[str, Any]]:
    """
    Generates dynamic role-specific technical questions.
    """
    system_prompt = "You are an elite software architect and engineering hiring manager."
    user_prompt = f"""
    Target Role: {role}
    Difficulty: {difficulty}
    Generate {count} unique technical questions.
    
    Respond in JSON format only with a root key "questions". Each question should contain:
    - question: string
    - expected_answer: string (detailed answer key)
    - topic: string (e.g., "OOP", "FastAPI", "Joins")
    - difficulty: string
    """
    
    fallback_data = {
        "questions": [
            {
                "question": "Explain the difference between a list and a tuple in Python, and describe when to use which.",
                "expected_answer": "Lists are mutable, meaning their elements can be modified. Tuples are immutable. Lists use more memory. Use tuples for fixed collections of constants to optimize lookup speed and guarantee read-only data integrity.",
                "topic": "Python Core",
                "difficulty": difficulty
            },
            {
                "question": "What is the purpose of database indexes and how do they speed up select queries? What is the trade-off?",
                "expected_answer": "Indexes create lookup trees (B-Trees) to avoid sequential full-table scans. The trade-off is increased write latency (INSERT/UPDATE operations take longer as they must update the index) and additional storage overhead.",
                "topic": "SQL Database",
                "difficulty": difficulty
            }
        ]
    }
    
    result = llm_client.generate_json(system_prompt, user_prompt, fallback_data)
    return result.get("questions", fallback_data["questions"])


def generate_gd_topics(category: str = "Technology", count: int = 3) -> List[Dict[str, Any]]:
    """
    Generates engaging Group Discussion topics.
    """
    system_prompt = "You are a moderator for professional group discussion panels."
    user_prompt = f"""
    Category: {category}
    Generate {count} thought-provoking Group Discussion (GD) topics.
    
    Respond in JSON format only with a root key "topics". Each topic should contain:
    - title: string
    - description: string (giving background context and core argument)
    - category: string
    """
    
    fallback_data = {
        "topics": [
            {
                "title": "Will Artificial Intelligence Replace Humans or Enhance Productivity?",
                "description": "Discuss the ethical, economic, and practical implications of generative AI replacing white-collar jobs versus automating mundane tasks to enable higher human creativity.",
                "category": category
            },
            {
                "title": "Remote Work vs. Office Core: The Hybrid Evolution",
                "description": "Analyze company culture, productivity statistics, and work-life balance arguments on why global companies are moving away from full remote back to hybrid structures.",
                "category": category
            }
        ]
    }
    
    result = llm_client.generate_json(system_prompt, user_prompt, fallback_data)
    return result.get("topics", fallback_data["topics"])


def evaluate_technical_answer(question: str, expected_answer: str, user_answer: str) -> Dict[str, Any]:
    """
    Grades user technical answers based on correctness, clarity, and keyword coverage.
    """
    system_prompt = "You are an AI technical interviewer. Grade the user's technical answer."
    user_prompt = f"""
    Technical Question: {question}
    Expected Reference Answer: {expected_answer}
    User Submitted Answer: {user_answer}
    
    Generate grading score and feedback.
    Respond in JSON format only containing:
    - score: integer (0 to 100)
    - correct: boolean
    - keyword_match_percentage: integer (0 to 100)
    - missing_points: string[]
    - suggestion: string
    """
    
    fallback_data = {
        "score": 80,
        "correct": True,
        "keyword_match_percentage": 75,
        "missing_points": ["Did not mention immutability impact on memory safety"],
        "suggestion": "Good answer. Try to mention how immutability affects thread safety in multi-threaded contexts."
    }
    
    return llm_client.generate_json(system_prompt, user_prompt, fallback_data)


def evaluate_gd_participation(topic: str, user_contribution: str) -> Dict[str, Any]:
    """
    Grades user performance in a simulated group discussion.
    """
    system_prompt = "You are an AI moderator evaluating GD communication performance."
    user_prompt = f"""
    GD Topic: {topic}
    User Contribution: {user_contribution}
    
    Evaluate user's vocabulary, leadership quality, critical thinking, creativity, and communication fluency.
    Respond in JSON format only containing:
    - score: integer (0 to 100)
    - grammar_score: integer (0 to 100)
    - fluency_score: integer (0 to 100)
    - leadership_rating: integer (1 to 10)
    - critical_thinking_rating: integer (1 to 10)
    - key_strengths: string[]
    - weak_points: string[]
    """
    
    fallback_data = {
        "score": 82,
        "grammar_score": 85,
        "fluency_score": 80,
        "leadership_rating": 8,
        "critical_thinking_rating": 9,
        "key_strengths": ["Structured arguments", "Clear tone", "Strong logical correlation"],
        "weak_points": ["Could expand on global economic effects", "Limited vocabulary variety"]
    }
    
    return llm_client.generate_json(system_prompt, user_prompt, fallback_data)


def evaluate_hr_answer(question: str, user_answer: str) -> Dict[str, Any]:
    """
    Grades HR behavioral question responses based on professionalism, confidence, and STAR method alignment.
    """
    system_prompt = "You are an expert HR director grading candidates on behavioral responses."
    user_prompt = f"""
    HR Behavioral Question: {question}
    User Answer: {user_answer}
    
    Evaluate the response using the STAR Method (Situation, Task, Action, Result) and overall professionalism.
    Respond in JSON format only containing:
    - score: integer (0 to 100)
    - professionalism_score: integer (0 to 100)
    - star_compliance_score: integer (0 to 100)
    - emotional_intelligence: integer (0 to 100)
    - feedback: string
    - improvement_tips: string[]
    """
    
    fallback_data = {
        "score": 85,
        "professionalism_score": 90,
        "star_compliance_score": 80,
        "emotional_intelligence": 85,
        "feedback": "Excellent response that highlights structured leadership and team conflict resolution techniques.",
        "improvement_tips": [
            "Quantify the positive outcome of your action (e.g., 'saved 5 hours of manual work weekly').",
            "Be more explicit about the initial constraint/situation."
        ]
    }
    
    return llm_client.generate_json(system_prompt, user_prompt, fallback_data)


def generate_career_roadmap(skills: List[str], target_role: str) -> Dict[str, Any]:
    """
    Builds a customized learning roadmap and skill gap analyzer for the user.
    """
    system_prompt = "You are an expert career coach and corporate learning path creator."
    user_prompt = f"""
    Current Skills: {skills}
    Target Role: {target_role}
    
    Generate a 4-phase structured learning roadmap to bridge gaps and make the candidate ready.
    Respond in JSON format only containing:
    - target_role: string
    - skill_gaps: string[]
    - roadmap: list of objects containing:
      - phase: string (e.g., "Phase 1: Foundations")
      - duration: string (e.g., "2 Weeks")
      - topics_to_learn: string[]
      - recommended_projects: string[]
    - resources: string[]
    """
    
    fallback_data = {
        "target_role": target_role,
        "skill_gaps": ["Docker", "Redis", "Next.js 15", "Kubernetes"],
        "roadmap": [
            {
                "phase": "Phase 1: Advanced Frontend & Next.js Framework",
                "duration": "2 Weeks",
                "topics_to_learn": ["App Router", "Server Components", "State management with Zustand"],
                "recommended_projects": ["Develop an interactive dashboard UI using dynamic routing"]
            },
            {
                "phase": "Phase 2: Cache & Event Systems",
                "duration": "2 Weeks",
                "topics_to_learn": ["Redis key caching patterns", "Celery async job queuing", "WebSockets connection pools"],
                "recommended_projects": ["Build a real-time messaging pipeline integrating Celery queues"]
            }
        ],
        "resources": [
            "Official Next.js documentation (nextjs.org/docs)",
            "FastAPI production tutorials (fastapi.tiangolo.com)",
            "Redis University Developer course"
        ]
    }
    
    return llm_client.generate_json(system_prompt, user_prompt, fallback_data)


def generate_adaptive_followup(
    question: str, 
    user_answer: str, 
    score: int, 
    persona: str = "Neutral", 
    target_role: str = "Software Engineer",
    is_hr: bool = False
) -> Dict[str, Any]:
    """
    Generates a dynamic follow-up question based on the user's previous response,
    conforming to the selected interviewer persona and adaptive difficulty.
    """
    system_prompt = (
        f"You are an expert {'HR director' if is_hr else 'technical architect'} conducting a mock interview for the role of '{target_role}'. "
        f"Your interview style and persona is: '{persona}'.\n"
        f"- Friendly: supportive, encourages candidate, asks constructive/accessible follow-ups.\n"
        f"- Tough: strict, directly challenges logic, points out technical weaknesses, asks demanding questions.\n"
        f"- Neutral: professional, standard corporate interviewer, objective.\n\n"
        f"Generate a single follow-up question to probe the candidate's previous response. If their score was high (>= 75), "
        f"ask a more difficult, advanced question. If their score was lower (< 75), ask a clarifying question or guide "
        f"them to explain standard concepts. Return a JSON object with keys 'question' and 'expected_answer'."
    )
    
    user_prompt = f"""
    Previous Question: {question}
    Candidate's Answer: {user_answer}
    Evaluation Score: {score}/100
    
    Respond in JSON format only with:
    - question: string (the follow-up question)
    - expected_answer: string (the detailed criteria/answer key)
    """
    
    fallback_data = {
        "question": f"Probing deeper into your previous response about '{question[:50]}...', could you explain what trade-offs or alternative options you considered?",
        "expected_answer": "Candidate should discuss time/space complexity, modularity, reliability, or alignment with team objectives."
    }
    
    return llm_client.generate_json(system_prompt, user_prompt, fallback_data)

