import pytest
import uuid
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import Base, engine

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    """
    Set up and teardown test database tables.
    """
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_complete_interview_lifecycle():
    # 1. Register User
    email = "candidate_interview@test.com"
    password = "password123"
    reg_payload = {
        "email": email,
        "password": password,
        "full_name": "Test Candidate Two",
        "phone_number": "+1 555-9876",
        "college": "Stanford",
        "degree": "M.S.",
        "department": "CS",
        "current_year": 2,
        "city": "Palo Alto",
        "target_company": "Netflix",
        "preferred_job_role": "Backend Developer",
        "experience_level": "Mid"
    }
    reg_response = client.post("/auth/register", json=reg_payload)
    assert reg_response.status_code == 201

    # 2. Login to get token
    login_response = client.post("/auth/login", json={"email": email, "password": password})
    assert login_response.status_code == 200
    token_data = login_response.json()
    access_token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # 3. Create Interview Session
    session_payload = {
        "job_role": "Backend Developer",
        "experience_level": "Mid",
        "difficulty": "Medium",
        "language": "English"
    }
    session_response = client.post("/interview/session", json=session_payload, headers=headers)
    assert session_response.status_code == 201
    session_data = session_response.json()
    session_id = session_data["id"]
    assert session_data["current_round"] == 1
    assert session_data["status"] == "started"

    # Get active session and assert matches
    active_resp = client.get("/interview/session/active", headers=headers)
    assert active_resp.status_code == 200
    assert active_resp.json()["id"] == session_id

    # 4. Round 1: Cognitive Aptitude
    apt_questions_resp = client.get(f"/interview/session/{session_id}/aptitude", headers=headers)
    assert apt_questions_resp.status_code == 200
    apt_questions = apt_questions_resp.json()
    assert len(apt_questions) == 5

    # Construct correct answers mapping
    # Correct choices are: B, A, C, C, B
    answers_map = {}
    correct_options = ["B", "A", "C", "C", "B"]
    for i, q in enumerate(apt_questions):
        answers_map[q["id"]] = correct_options[i % len(correct_options)]

    apt_submission = {
        "session_id": session_id,
        "answers": answers_map,
        "duration_seconds": 90
    }
    apt_submit_resp = client.post("/interview/submit/aptitude", json=apt_submission, headers=headers)
    assert apt_submit_resp.status_code == 200
    apt_result = apt_submit_resp.json()
    assert apt_result["score"] == 100.0  # All correct answers should score 100%
    assert apt_result["correct_answers"] == 5

    # Verify session advanced to round 2 (GD)
    sess_details = client.get(f"/interview/session/{session_id}", headers=headers)
    assert sess_details.json()["current_round"] == 2

    # 5. Round 2: Simulated Group Discussion
    gd_topics_resp = client.get(f"/interview/session/{session_id}/gd", headers=headers)
    assert gd_topics_resp.status_code == 200
    gd_topics = gd_topics_resp.json()
    assert len(gd_topics) > 0
    selected_topic_id = gd_topics[0]["id"]

    gd_submission = {
        "session_id": session_id,
        "topic_id": selected_topic_id,
        "answer_text": "I believe that remote work enhances productivity as it eliminates long commutes."
    }
    gd_submit_resp = client.post("/interview/submit/gd", json=gd_submission, headers=headers)
    assert gd_submit_resp.status_code == 200
    gd_result = gd_submit_resp.json()
    assert "evaluation" in gd_result
    assert gd_result["evaluation"]["score"] > 0

    # Verify session advanced to round 3 (Technical)
    sess_details = client.get(f"/interview/session/{session_id}", headers=headers)
    assert sess_details.json()["current_round"] == 3

    # 6. Round 3: Core Technical Mock
    tech_questions_resp = client.get(f"/interview/session/{session_id}/technical", headers=headers)
    assert tech_questions_resp.status_code == 200
    tech_questions = tech_questions_resp.json()
    assert len(tech_questions) == 3

    # Submit answer to each technical question
    for q in tech_questions:
        tech_submission = {
            "session_id": session_id,
            "question_id": q["id"],
            "user_answer": "In python, lists are mutable and tuples are immutable, saving memory."
        }
        tech_submit_resp = client.post("/interview/submit/technical", json=tech_submission, headers=headers)
        assert tech_submit_resp.status_code == 200
        tech_result = tech_submit_resp.json()
        assert "evaluation" in tech_result

    # Verify session advanced to round 4 (HR)
    sess_details = client.get(f"/interview/session/{session_id}", headers=headers)
    assert sess_details.json()["current_round"] == 4

    # 7. Round 4: HR & Behavioral Assessment
    hr_questions_resp = client.get(f"/interview/session/{session_id}/hr", headers=headers)
    assert hr_questions_resp.status_code == 200
    hr_questions = hr_questions_resp.json()
    assert len(hr_questions) == 2

    # Submit answer to each HR question
    for q in hr_questions:
        hr_submission = {
            "session_id": session_id,
            "question_id": q["id"],
            "user_answer": "I resolved a major dispute by listening to all sides and choosing a data-driven path."
        }
        hr_submit_resp = client.post("/interview/submit/hr", json=hr_submission, headers=headers)
        assert hr_submit_resp.status_code == 200
        hr_result = hr_submit_resp.json()
        assert "evaluation" in hr_result

    # Verify session advanced to round 5 (Completed) and status is completed
    sess_details = client.get(f"/interview/session/{session_id}", headers=headers)
    assert sess_details.json()["current_round"] == 5
    assert sess_details.json()["status"] == "completed"

    # 8. Round 5: Final Report Retrieval
    report_resp = client.get(f"/interview/session/{session_id}/report", headers=headers)
    assert report_resp.status_code == 200
    report_data = report_resp.json()
    assert report_data["session_id"] == session_id
    assert report_data["overall_score"] > 0
    assert "detailed_evaluation" in report_data
    assert "roadmap" in report_data["detailed_evaluation"]
