"""Small shared helpers: JSON extraction and Gemini calling."""

import json
import re
import time

from . import config

GEMINI_RATE_LIMIT_MAX_RETRIES = 4
GEMINI_RATE_LIMIT_BASE_DELAY_SECONDS = 5


def extract_json(text: str) -> dict | list | None:
    """Best-effort extraction of a JSON object/array from LLM output text.

    Handles ```json ... ``` fences and stray prose around the JSON payload.
    """
    if not text:
        return None

    fence_match = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    candidates = [fence_match.group(1)] if fence_match else []
    candidates.append(text)

    for candidate in candidates:
        candidate = candidate.strip()
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

        start_obj, start_arr = candidate.find("{"), candidate.find("[")
        starts = [s for s in (start_obj, start_arr) if s != -1]
        if not starts:
            continue
        start = min(starts)
        opener = candidate[start]
        closer = "}" if opener == "{" else "]"
        end = candidate.rfind(closer)
        if end == -1 or end <= start:
            continue
        try:
            return json.loads(candidate[start : end + 1])
        except json.JSONDecodeError:
            continue

    return None


def resolve_path(data, path: str):
    """Resolve a simple dot/bracket path like 'choices[0].message.content'
    against a parsed JSON value. Raises KeyError/IndexError/TypeError on
    a bad path — callers should wrap and report those clearly."""
    current = data
    for token in re.findall(r"[^.\[\]]+|\[\d+\]", path):
        if token.startswith("["):
            current = current[int(token[1:-1])]
        else:
            current = current[token]
    return current


_gemini_model = None


def get_gemini_model():
    """Lazily initialize and cache the Vertex AI Gemini model client."""
    global _gemini_model
    if _gemini_model is not None:
        return _gemini_model

    import vertexai
    from vertexai.generative_models import GenerativeModel

    if not config.GCP_PROJECT_ID:
        raise RuntimeError(
            "GCP_PROJECT_ID is not set. Set it in your .env or environment."
        )

    vertexai.init(project=config.GCP_PROJECT_ID, location=config.GCP_REGION)
    _gemini_model = GenerativeModel(config.GEMINI_MODEL)
    return _gemini_model


def call_gemini(system_prompt: str, user_prompt: str) -> str:
    """Send a single-turn request to Gemini and return the raw text response.

    Retries with exponential backoff on HTTP 429 (RESOURCE_EXHAUSTED) — a
    transient quota limit, not a real failure — up to
    GEMINI_RATE_LIMIT_MAX_RETRIES times before giving up and re-raising.
    """
    from google.api_core.exceptions import ResourceExhausted

    model = get_gemini_model()
    full_prompt = f"{system_prompt}\n\n{user_prompt}"

    for attempt in range(GEMINI_RATE_LIMIT_MAX_RETRIES + 1):
        try:
            response = model.generate_content(full_prompt)
            return response.text
        except ResourceExhausted:
            if attempt == GEMINI_RATE_LIMIT_MAX_RETRIES:
                raise
            delay = GEMINI_RATE_LIMIT_BASE_DELAY_SECONDS * (2**attempt)
            print(
                f"[biasprobe] Gemini rate-limited (429), retrying in {delay}s "
                f"(attempt {attempt + 1}/{GEMINI_RATE_LIMIT_MAX_RETRIES})...",
                flush=True,
            )
            time.sleep(delay)


def call_gemini_json(
    system_prompt: str, user_prompt: str, retry_note: str = ""
) -> tuple[dict | list | None, bool]:
    """Call Gemini and parse JSON from its response.

    Retries once with a stricter reformat instruction on parse failure.
    Returns (parsed, parse_failed).
    """
    raw = call_gemini(system_prompt, user_prompt)
    parsed = extract_json(raw)
    if parsed is not None:
        return parsed, False

    strict_note = retry_note or (
        "Your previous response could not be parsed as JSON. "
        "Respond again with ONLY valid JSON, no markdown fences, no prose."
    )
    raw_retry = call_gemini(system_prompt, f"{user_prompt}\n\n{strict_note}")
    parsed = extract_json(raw_retry)
    return parsed, parsed is None
