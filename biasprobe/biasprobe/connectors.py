"""Pluggable connectors so BiasProbe can target any LLM endpoint.

Every connector exposes one method — generate(prompt) -> str — so the rest
of the pipeline (target_runner.py) never needs to know which API shape it's
talking to.
"""

import json
from abc import ABC, abstractmethod

import requests

from .schemas import TargetEndpointConfig
from .utils import resolve_path


class TargetConnector(ABC):
    @abstractmethod
    def generate(self, prompt: str) -> str:
        """Send prompt to the target model and return its raw text response."""


class OllamaConnector(TargetConnector):
    def __init__(self, base_url: str, model: str, timeout: int = 120):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout

    def generate(self, prompt: str) -> str:
        resp = requests.post(
            f"{self.base_url}/api/generate",
            json={"model": self.model, "prompt": prompt, "stream": False},
            timeout=self.timeout,
        )
        if not resp.ok:
            detail = resp.json().get("error", resp.text) if resp.content else resp.reason
            raise RuntimeError(
                f"Ollama returned {resp.status_code} for model '{self.model}': {detail}"
            )
        return resp.json().get("response", "")


class OpenAICompatibleConnector(TargetConnector):
    """Covers OpenAI, Groq, Together, vLLM, LM Studio, and anything else
    that speaks the /v1/chat/completions shape."""

    def __init__(self, base_url: str, model: str, api_key: str | None, timeout: int = 120):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.api_key = api_key
        self.timeout = timeout

    def generate(self, prompt: str) -> str:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        resp = requests.post(
            f"{self.base_url}/chat/completions",
            headers=headers,
            json={"model": self.model, "messages": [{"role": "user", "content": prompt}]},
            timeout=self.timeout,
        )
        if not resp.ok:
            raise RuntimeError(f"Target endpoint returned {resp.status_code}: {resp.text[:500]}")
        data = resp.json()
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as e:
            raise RuntimeError(
                f"Unexpected response shape from OpenAI-compatible endpoint: {e}"
            ) from e


class AnthropicConnector(TargetConnector):
    def __init__(self, base_url: str, model: str, api_key: str, timeout: int = 120):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.api_key = api_key
        self.timeout = timeout

    def generate(self, prompt: str) -> str:
        headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
        }
        resp = requests.post(
            f"{self.base_url}/messages",
            headers=headers,
            json={
                "model": self.model,
                "max_tokens": 1024,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=self.timeout,
        )
        if not resp.ok:
            raise RuntimeError(f"Target endpoint returned {resp.status_code}: {resp.text[:500]}")
        data = resp.json()
        try:
            return data["content"][0]["text"]
        except (KeyError, IndexError, TypeError) as e:
            raise RuntimeError(f"Unexpected response shape from Anthropic endpoint: {e}") from e


class CustomHTTPConnector(TargetConnector):
    """Generic connector for arbitrary REST endpoints.

    `request_template` is a JSON string containing a literal "{{prompt}}"
    placeholder; `response_path` is a dot/bracket path into the response
    JSON, e.g. "choices[0].message.content" or "output.text".
    """

    def __init__(
        self,
        base_url: str,
        method: str,
        headers: dict[str, str],
        request_template: str,
        response_path: str,
        timeout: int = 120,
    ):
        if "{{prompt}}" not in request_template:
            raise ValueError("request_template must contain a literal '{{prompt}}' placeholder")
        self.base_url = base_url
        self.method = method.upper()
        self.headers = headers
        self.request_template = request_template
        self.response_path = response_path
        self.timeout = timeout

    def _build_body(self, prompt: str) -> dict:
        # json.dumps(prompt) gives a quoted, escaped JSON string literal;
        # strip the surrounding quotes so it drops cleanly into the template.
        escaped = json.dumps(prompt)[1:-1]
        filled = self.request_template.replace("{{prompt}}", escaped)
        try:
            return json.loads(filled)
        except json.JSONDecodeError as e:
            raise ValueError(f"request_template is not valid JSON after substitution: {e}") from e

    def generate(self, prompt: str) -> str:
        body = self._build_body(prompt)
        resp = requests.request(
            self.method,
            self.base_url,
            headers={"Content-Type": "application/json", **self.headers},
            json=body,
            timeout=self.timeout,
        )
        if not resp.ok:
            raise RuntimeError(f"Target endpoint returned {resp.status_code}: {resp.text[:500]}")
        data = resp.json()
        try:
            value = resolve_path(data, self.response_path)
        except (KeyError, IndexError, TypeError) as e:
            raise RuntimeError(
                f"response_path '{self.response_path}' did not resolve against the "
                f"response JSON: {e}"
            ) from e
        if not isinstance(value, str):
            raise RuntimeError(
                f"response_path '{self.response_path}' resolved to a non-string "
                f"value: {value!r}"
            )
        return value


def build_connector(cfg: TargetEndpointConfig) -> TargetConnector:
    if cfg.preset == "ollama":
        return OllamaConnector(cfg.base_url, cfg.model_id, cfg.timeout)
    if cfg.preset == "openai":
        return OpenAICompatibleConnector(cfg.base_url, cfg.model_id, cfg.api_key, cfg.timeout)
    if cfg.preset == "anthropic":
        if not cfg.api_key:
            raise ValueError("Anthropic preset requires an api_key")
        return AnthropicConnector(cfg.base_url, cfg.model_id, cfg.api_key, cfg.timeout)
    if cfg.preset == "custom":
        if not cfg.request_template or not cfg.response_path:
            raise ValueError("Custom preset requires request_template and response_path")
        headers = dict(cfg.headers)
        if cfg.api_key and "Authorization" not in headers:
            headers["Authorization"] = f"Bearer {cfg.api_key}"
        return CustomHTTPConnector(
            cfg.base_url, cfg.method, headers, cfg.request_template, cfg.response_path, cfg.timeout
        )
    raise ValueError(f"Unknown preset: {cfg.preset}")
