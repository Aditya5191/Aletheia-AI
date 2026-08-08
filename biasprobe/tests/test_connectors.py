import pytest

from biasprobe.connectors import CustomHTTPConnector, build_connector
from biasprobe.schemas import TargetEndpointConfig
from biasprobe.utils import resolve_path


def test_resolve_path_openai_shape():
    data = {"choices": [{"message": {"content": "hello"}}]}
    assert resolve_path(data, "choices[0].message.content") == "hello"


def test_resolve_path_nested_no_index():
    data = {"output": {"text": "hi"}}
    assert resolve_path(data, "output.text") == "hi"


def test_custom_connector_requires_prompt_placeholder():
    with pytest.raises(ValueError):
        CustomHTTPConnector(
            base_url="http://x",
            method="POST",
            headers={},
            request_template='{"no_placeholder": true}',
            response_path="text",
        )


def test_custom_connector_builds_body_with_escaped_prompt():
    connector = CustomHTTPConnector(
        base_url="http://x",
        method="POST",
        headers={},
        request_template='{"input": "{{prompt}}"}',
        response_path="text",
    )
    body = connector._build_body('He said "hi"\nline2')
    assert body == {"input": 'He said "hi"\nline2'}


def test_build_connector_ollama():
    from biasprobe.connectors import OllamaConnector

    cfg = TargetEndpointConfig(preset="ollama", base_url="http://localhost:11434", model_id="llama3.1:8b")
    connector = build_connector(cfg)
    assert isinstance(connector, OllamaConnector)


def test_build_connector_custom_requires_template_and_path():
    cfg = TargetEndpointConfig(preset="custom", base_url="http://x", model_id="m")
    with pytest.raises(ValueError):
        build_connector(cfg)


def test_build_connector_anthropic_requires_api_key():
    cfg = TargetEndpointConfig(preset="anthropic", base_url="http://x", model_id="m")
    with pytest.raises(ValueError):
        build_connector(cfg)
