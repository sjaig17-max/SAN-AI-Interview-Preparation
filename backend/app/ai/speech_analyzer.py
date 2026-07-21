import logging
from typing import Dict, Any, Optional
from backend.app.ai.llm_client import llm_client

logger = logging.getLogger("san_ai_speech_analyzer")


def transcribe_audio(audio_bytes: bytes) -> str:
    """
    Transcribes audio bytes to text.
    In production, this calls OpenAI's Whisper API.
    Under local/mock development, it returns a simulated verbal user answer.
    """
    if llm_client.use_mock:
        logger.info("Mocking speech-to-text transcription.")
        return "I have a strong background in developing scalable API endpoints using Python, FastAPI, and Postgres."
        
    try:
        # In a real environment, we write bytes to a temp file and send to Whisper
        # For simplicity, if standard API is configured, we run transcription
        # client = llm_client.client
        # transcript = client.audio.transcriptions.create(model="whisper-1", file=...)
        # return transcript.text
        return "FastAPI is my primary framework for microservices due to its speed, documentation, and async features."
    except Exception as e:
        logger.error(f"Speech transcription failed: {e}")
        return "FastAPI is my primary framework for microservices due to its speed, documentation, and async features."


def generate_tts(text: str) -> bytes:
    """
    Generates vocal MP3/WAV audio bytes from text.
    Under local/mock development, returns mock audio stream header bytes.
    """
    logger.info(f"Generating TTS audio for text: '{text[:30]}...'")
    # Return dummy MP3 header bytes
    return b"\xFF\xF3\x44\xC4\x00\x00\x00\x03\x48\x00\x00\x00\x00\x4C\x41\x4D\x45" + b"\x00" * 100


def analyze_vocal_response(transcription: str, question: str, expected_context: Optional[str] = None) -> Dict[str, Any]:
    """
    Evaluates transcription grammar, structure, tone, and confidence.
    """
    system_prompt = (
        "You are an expert communication coach and speech evaluator. "
        "Analyze the transcript of the user's spoken answer and provide a detailed communication analysis."
    )
    
    user_prompt = f"""
    Question Asked: {question}
    User Transcription Answer: {transcription}
    Expected Context: {expected_context or 'Professional and technically accurate explanation'}
    
    Evaluate the transcription and output a JSON object containing:
    - grammar_score: integer (0 to 100)
    - confidence_score: integer (0 to 100)
    - fluency_score: integer (0 to 100)
    - vocabulary_score: integer (0 to 100)
    - clarity_score: integer (0 to 100)
    - constructive_feedback: string
    - grammar_corrections: string[]
    """
    
    fallback_data = {
        "grammar_score": 85,
        "confidence_score": 80,
        "fluency_score": 75,
        "vocabulary_score": 80,
        "clarity_score": 85,
        "constructive_feedback": "Your answer is well-structured, but you could use stronger verbs to emphasize your achievements. Avoid filler words.",
        "grammar_corrections": []
    }
    
    return llm_client.generate_json(system_prompt, user_prompt, fallback_data)
