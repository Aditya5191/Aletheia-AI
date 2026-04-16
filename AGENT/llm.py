import os
from dotenv import load_dotenv
from crewai import LLM

load_dotenv()

# Custom LM Studio endpoint via Dev Tunnels
# LM Studio uses the OpenAI-compatible format at /v1
CUSTOM_LLM_URL = "https://7x73n9pq-1234.inc1.devtunnels.ms/v1"
# We use 'custom_openai/' to prevent LiteLLM from stripping the 'openai/' part of the model name
CUSTOM_MODEL = "custom_openai/openai/gpt-oss-20b"

# Configure environment variables for LiteLLM (used by CrewAI)
os.environ["OPENAI_API_BASE"] = CUSTOM_LLM_URL
os.environ["OPENAI_API_KEY"] = "lm-studio" 

def get_llm(temperature=0.1) -> LLM:
    """
    LLM for Data Profiler and Bias Analyst.
    Configured for LM Studio via OpenAI-compatible endpoint.
    """
    return LLM(
        model=CUSTOM_MODEL,
        base_url=CUSTOM_LLM_URL,
        temperature=temperature,
        api_key="lm-studio"
    )

def get_fallback_llm() -> LLM:
    """Fallback to the same custom model for consistency."""
    return get_llm(temperature=0.1)

def get_creative_llm() -> LLM:
    """LLM for Report Writer with slightly higher temperature."""
    return get_llm(temperature=0.3)
