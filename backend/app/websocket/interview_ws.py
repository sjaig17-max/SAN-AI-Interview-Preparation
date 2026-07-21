import json
import logging
import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from backend.app.core.database import SessionLocal
from backend.app.models.models import InterviewSession, TechnicalQuestion, HRQuestion
from backend.app.ai.speech_analyzer import transcribe_audio, analyze_vocal_response
from backend.app.services.interview_service import InterviewService

logger = logging.getLogger("san_ai_ws_interview")
router = APIRouter(prefix="/ws", tags=["WebSockets Real-time Interview"])


class ConnectionManager:
    """
    Manages active WebSocket connections.
    """
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, key: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[key] = websocket
        logger.info(f"WebSocket client connected: {key}")

    def disconnect(self, key: str):
        if key in self.active_connections:
            del self.active_connections[key]
            logger.info(f"WebSocket client disconnected: {key}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)


manager = ConnectionManager()


@router.websocket("/interview/{session_id}")
async def interview_websocket_endpoint(websocket: WebSocket, session_id: uuid.UUID):
    """
    Websocket endpoint for real-time interview interactions.
    Handles user speech bytes or text answers and streams instant communication evaluations.
    """
    connection_key = str(session_id)
    await manager.connect(connection_key, websocket)
    
    db: Session = SessionLocal()
    
    try:
        # Load interview state
        session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
        if not session:
            await websocket.send_json({"event": "error", "message": "Interview session not found."})
            await websocket.close()
            return

        # Send initial confirmation
        await websocket.send_json({
            "event": "connected",
            "session_id": str(session_id),
            "job_role": session.job_role,
            "current_round": session.current_round
        })

        while True:
            # Receive frame from user (can be JSON event or binary audio stream)
            message = await websocket.receive()
            
            if "text" in message:
                data = json.loads(message["text"])
                event_type = data.get("event")
                
                if event_type == "start_speech":
                    await websocket.send_json({"event": "recording_started"})
                    
                elif event_type == "submit_answer_text":
                    # User typed out text answer
                    question_id = uuid.UUID(data.get("question_id"))
                    answer_text = data.get("answer_text")
                    round_num = session.current_round
                    
                    # Simulated voice/text metrics
                    evaluation = analyze_vocal_response(answer_text, "Technical/HR Question")
                    
                    await websocket.send_json({
                        "event": "evaluation_result",
                        "transcription": answer_text,
                        "evaluation": evaluation
                    })

            elif "bytes" in message:
                # User sent direct voice audio binary chunk
                audio_data = message["bytes"]
                
                # 1. Transcribe voice bytes to text
                transcription = transcribe_audio(audio_data)
                
                # 2. Analyze response quality
                evaluation = analyze_vocal_response(transcription, "Real-time speech input")
                
                # Stream the real-time audio evaluation back to the frontend
                await websocket.send_json({
                    "event": "speech_analyzed",
                    "transcription": transcription,
                    "evaluation": {
                        "grammar_score": evaluation.get("grammar_score", 85),
                        "confidence_score": evaluation.get("confidence_score", 80),
                        "fluency_score": evaluation.get("fluency_score", 75),
                        "constructive_feedback": evaluation.get("constructive_feedback", ""),
                        "vocal_pitch": "Consistent",
                        "vocal_speed": "130 words per minute"
                    }
                })

    except WebSocketDisconnect:
        manager.disconnect(connection_key)
    except Exception as e:
        logger.error(f"WebSocket execution error: {e}")
        await websocket.send_json({"event": "error", "message": str(e)})
    finally:
        db.close()
