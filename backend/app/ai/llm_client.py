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
        self.api_key = settings.OPENAI_API_KEY
        self.api_base = settings.OPENAI_API_BASE
        
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

    def generate_json(self, system_prompt: str, user_prompt: str, fallback_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sends request to LLM and returns parsed JSON. Falls back to fallback_data on error or mock mode.
        """
        if self.use_mock:
            logger.debug("Mock mode active: returning static mock evaluation data.")
            return fallback_data

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # Highly cost-efficient standard model
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            logger.error(f"LLM API call failed: {e}. Falling back to default data structure.")
            return fallback_data


# Global LLM instance
llm_client = LLMClient()
