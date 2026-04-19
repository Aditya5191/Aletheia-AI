import os
from crewai import LLM
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_llm():
    """
    Returns the configured CrewAI LLM instance using the custom LM Studio endpoint.
    """
    return LLM(
        model="openai/google/gemma-4-e2b",
        base_url="https://7x73n9pq-1234.inc1.devtunnels.ms/v1",
        api_key="sk-placeholder", # Required but not used by your server
        temperature=0.2,
    )
