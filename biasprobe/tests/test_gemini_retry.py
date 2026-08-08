from unittest.mock import MagicMock, patch

import pytest
from google.api_core.exceptions import ResourceExhausted

from biasprobe import utils


def _mock_response(text):
    resp = MagicMock()
    resp.text = text
    return resp


@patch("time.sleep", return_value=None)
@patch.object(utils, "get_gemini_model")
def test_call_gemini_retries_then_succeeds(mock_get_model, mock_sleep):
    model = MagicMock()
    model.generate_content.side_effect = [
        ResourceExhausted("quota"),
        ResourceExhausted("quota"),
        _mock_response("ok"),
    ]
    mock_get_model.return_value = model

    result = utils.call_gemini("sys", "user")

    assert result == "ok"
    assert model.generate_content.call_count == 3
    assert mock_sleep.call_count == 2


@patch("time.sleep", return_value=None)
@patch.object(utils, "get_gemini_model")
def test_call_gemini_gives_up_after_max_retries(mock_get_model, mock_sleep):
    model = MagicMock()
    model.generate_content.side_effect = ResourceExhausted("quota")
    mock_get_model.return_value = model

    with pytest.raises(ResourceExhausted):
        utils.call_gemini("sys", "user")

    assert model.generate_content.call_count == utils.GEMINI_RATE_LIMIT_MAX_RETRIES + 1


@patch.object(utils, "get_gemini_model")
def test_call_gemini_no_retry_on_success(mock_get_model):
    model = MagicMock()
    model.generate_content.return_value = _mock_response("hello")
    mock_get_model.return_value = model

    result = utils.call_gemini("sys", "user")

    assert result == "hello"
    assert model.generate_content.call_count == 1
