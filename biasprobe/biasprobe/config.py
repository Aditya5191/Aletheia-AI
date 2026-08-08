"""Environment configuration and defaults for BiasProbe."""

import os

from dotenv import load_dotenv

load_dotenv(override=False)

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_TARGET_MODEL_DEFAULT = os.getenv("OLLAMA_TARGET_MODEL", "llama3.1")

GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID")
GCP_REGION = os.getenv("GCP_REGION", "us-central1")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-pro")

# GOOGLE_APPLICATION_CREDENTIALS, if set, is picked up automatically by the
# google-cloud-aiplatform SDK via Application Default Credentials.

DEFAULT_NUM_SCENARIOS = 5
DEFAULT_VARIANTS_PER_DIMENSION = 3

DISCLAIMER = (
    "This report reflects model-level behavior on synthetic scenarios only, "
    "not the behavior of any specific production prompt/agent built on this model."
)

JUDGE_LIMITATION_NOTE = (
    "The judge model (Gemini) has its own biases and should be treated as a "
    "strong heuristic, not ground truth."
)
