import json
import logging
from typing import Any, Dict, Optional, Type
from pydantic import BaseModel
from openai import OpenAI
from backend.app.core.config import settings

logger = logging.getLogger("san_ai_llm_client")


class LLMClient:
    """
    Client wrapper for interactives sessions with OpenAI-compatible LLMs.
    Includes fallbacks for local/offline testing without active api keys.
    """

    def __init__(self):
        # Use OpenRouter settings if provided
        self.api_key = settings.OPENROUTER_API_KEY if settings.OPENROUTER_API_KEY != "mock-or-local-llm-key" else settings.OPENAI_API_KEY
        self.api_base = "https://openrouter.ai/api/v1" if settings.OPENROUTER_API_KEY != "mock-or-local-llm-key" else settings.OPENAI_API_BASE
        
        # Check if we should use mock fallback mode
        self.use_mock = (
            not self.api_key 
            or self.api_key == "mock-or-local-llm-key" 
            or "mock" in self.api_key.lower()
        )
        
        if not self.use_mock:
            try:
                self.client = OpenAI(api_key=self.api_key, base_url=self.api_base)
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}. Falling back to Mock mode.")
                self.use_mock = True
        else:
            logger.info("Initializing in LLM mock fallback mode.")

    def generate_json(
        self, 
        system_prompt: str, 
        user_prompt: str, 
        fallback_data: Dict[str, Any], 
        model: str = "google/gemini-2.5-flash"
    ) -> Dict[str, Any]:
        """
        Sends request to LLM and returns parsed JSON. Falls back to fallback_data on error or mock mode.
        """
        if self.use_mock:
            logger.debug("Mock mode active: returning static mock evaluation data.")
            return fallback_data

        try:
            # Note: response_format is supported on some OpenRouter models, keeping it conditional
            extra_body = {}
            if "gemini" not in model.lower():
                extra_body["response_format"] = {"type": "json_object"}

            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                **extra_body
            )
            content = response.choices[0].message.content
            
            # Clean up markdown code blocks if present
            cleaned_content = content.strip()
            if cleaned_content.startswith("```"):
                lines = cleaned_content.split("\n")
                if lines[0].startswith("```json"):
                    cleaned_content = "\n".join(lines[1:-1])
                elif lines[0].startswith("```"):
                    cleaned_content = "\n".join(lines[1:-1])
                    
            return json.loads(cleaned_content)
        except Exception as e:
            logger.error(f"LLM API call failed: {e}. Falling back to default data structure.")
            return fallback_data


# Global LLM instance
llm_client = LLMClient()
