import os
from dotenv import load_dotenv
from crewai import LLM

load_dotenv()

# Gemini Configuration
GEMINI_MODEL = "gemini/gemini-1.5-pro"
PROFILER_MODEL = "gemini/gemini-1.5-flash"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure environment variables for LiteLLM (used by CrewAI)
os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY

def get_llm(temperature=0.1) -> LLM:
    """
    LLM for Bias Analyst.
    Configured for Gemini Pro.
    """
    return LLM(
        model=GEMINI_MODEL,
        temperature=temperature,
        api_key=GEMINI_API_KEY
    )

def get_profiler_llm(temperature=0.1) -> LLM:
    """
    LLM for Data Profiler.
    Configured for Gemini Flash.
    """
    return LLM(
        model=PROFILER_MODEL,
        temperature=temperature,
        api_key=GEMINI_API_KEY
    )

def get_fallback_llm() -> LLM:
    """Fallback to the same Gemini model for consistency."""
    return get_llm(temperature=0.1)

def get_creative_llm() -> LLM:
    """LLM for Report Writer with slightly higher temperature."""
    return get_llm(temperature=0.3)
