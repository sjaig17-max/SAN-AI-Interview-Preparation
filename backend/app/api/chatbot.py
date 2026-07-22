from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from backend.app.ai.llm_client import llm_client
from backend.app.models.models import User
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/chatbot", tags=["AI Career Chatbot"])


class ChatMessage(BaseModel):
    role: str # user or assistant
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
def chat_with_coach(request: ChatRequest, current_user: User = Depends(get_current_user)):
    """
    Simulates or calls an interactive OpenRouter LLM session with the SAN AI Career Coach.
    """
    system_prompt = (
        f"You are the SAN AI Interview Coach, an elite career mentor helping '{current_user.full_name}' prepare for "
        f"interviews targeting the role of '{current_user.profile.preferred_job_role if current_user.profile else 'Software Engineer'}'. "
        f"Answer coding, system design, quantitative aptitude, and resume structure questions accurately, concisely, and supportively."
    )
    
    # Format dialogue history
    messages_payload = []
    for msg in request.history[-5:]: # Keep last 5 exchanges
        messages_payload.append(f"{msg.role.upper()}: {msg.content}")
        
    history_str = "\n".join(messages_payload)
    user_prompt = f"""
    Chat History:
    {history_str}
    
    Candidate Message: {request.message}
    
    Respond directly with the coach's message. Do not prefix with 'ASSISTANT:' or 'COACH:'.
    """
    
    fallback_data = {
        "reply": f"Hi {current_user.full_name}! Let's focus on mastering key skills. How can I help you optimize your target preparation today?"
    }
    
    try:
        # Standard completions query OpenRouter Gemini-2.5-flash
        response = llm_client.client.chat.completions.create(
            model="google/gemini-2.5-flash",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7
        )
        reply = response.choices[0].message.content.strip()
    except Exception as e:
        # Fallback to general raw text parser if client or API key is mock
        reply = fallback_data["reply"]
        
    return ChatResponse(reply=reply)
