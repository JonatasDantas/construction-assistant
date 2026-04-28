import base64
import json
import os
from unittest.mock import MagicMock, patch

import pytest

from voice.submit_handler import handler

VALID_AUDIO_B64 = base64.b64encode(b"fake-audio-bytes").decode()
VALID_CONTENT_TYPE = "audio/m4a"

_STRUCTURED_RESPONSE = {
    "serviceType": "Estrutura",
    "teamSize": 4,
    "description": "Concretagem da laje do terceiro andar",
    "formalDescription": "Execução da concretagem da laje do terceiro pavimento.",
}


@pytest.fixture(autouse=True)
def set_env(monkeypatch):
    monkeypatch.setenv("SSM_PARAMETER_NAME", "/construction-assistant/openai-api-key")


def _make_openai_client(transcript: str = "Concretagem da laje", structured: dict = None):
    if structured is None:
        structured = _STRUCTURED_RESPONSE

    client = MagicMock()

    # Whisper transcription
    transcription_result = MagicMock()
    transcription_result.text = transcript
    client.audio.transcriptions.create.return_value = transcription_result

    # GPT chat completion
    message = MagicMock()
    message.content = json.dumps(structured)
    choice = MagicMock()
    choice.message = message
    completion = MagicMock()
    completion.choices = [choice]
    client.chat.completions.create.return_value = completion

    return client


def _event(body=None, raw_body=None):
    return {"body": raw_body if raw_body is not None else (json.dumps(body) if body else None)}


# --- Happy path ---

def test_happy_path_returns_structured_json():
    client = _make_openai_client()
    body = {"audio_base64": VALID_AUDIO_B64, "content_type": VALID_CONTENT_TYPE}
    response = handler(_event(body), None, openai_client=client)

    assert response["statusCode"] == 200
    data = json.loads(response["body"])
    assert data["serviceType"] == "Estrutura"
    assert data["teamSize"] == 4
    assert data["description"] == "Concretagem da laje do terceiro andar"
    assert data["formalDescription"] == "Execução da concretagem da laje do terceiro pavimento."


def test_whisper_called_with_correct_language():
    client = _make_openai_client()
    body = {"audio_base64": VALID_AUDIO_B64, "content_type": VALID_CONTENT_TYPE}
    handler(_event(body), None, openai_client=client)

    call_kwargs = client.audio.transcriptions.create.call_args.kwargs
    assert call_kwargs["model"] == "whisper-1"
    assert call_kwargs["language"] == "pt"


def test_gpt_called_with_json_mode():
    client = _make_openai_client()
    body = {"audio_base64": VALID_AUDIO_B64, "content_type": VALID_CONTENT_TYPE}
    handler(_event(body), None, openai_client=client)

    call_kwargs = client.chat.completions.create.call_args.kwargs
    assert call_kwargs["model"] == "gpt-4o-mini"
    assert call_kwargs["response_format"] == {"type": "json_object"}


# --- SSM ---

def test_ssm_key_read_with_correct_param_name(monkeypatch):
    monkeypatch.setenv("SSM_PARAMETER_NAME", "/construction-assistant/openai-api-key")
    ssm_mock = MagicMock()
    ssm_mock.get_parameter.return_value = {"Parameter": {"Value": "sk-test"}}

    openai_client = _make_openai_client()

    with patch("voice.submit_handler.OpenAI", return_value=openai_client):
        body = {"audio_base64": VALID_AUDIO_B64, "content_type": VALID_CONTENT_TYPE}
        handler(_event(body), None, ssm_client=ssm_mock)

    ssm_mock.get_parameter.assert_called_once_with(
        Name="/construction-assistant/openai-api-key",
        WithDecryption=True,
    )


# --- Validation errors ---

def test_missing_audio_base64_returns_400():
    body = {"content_type": VALID_CONTENT_TYPE}
    response = handler(_event(body), None)

    assert response["statusCode"] == 400
    assert "audio_base64" in json.loads(response["body"])["error"]


def test_missing_content_type_returns_400():
    body = {"audio_base64": VALID_AUDIO_B64}
    response = handler(_event(body), None)

    assert response["statusCode"] == 400
    assert "content_type" in json.loads(response["body"])["error"]


def test_invalid_json_body_returns_400():
    response = handler(_event(raw_body="{bad json"), None)

    assert response["statusCode"] == 400
    assert "invalid JSON" in json.loads(response["body"])["error"]


def test_empty_body_returns_400():
    response = handler(_event(), None)

    assert response["statusCode"] == 400


def test_audio_exceeds_25mb_returns_400():
    large_audio = b"x" * (25 * 1024 * 1024 + 1)
    large_b64 = base64.b64encode(large_audio).decode()
    body = {"audio_base64": large_b64, "content_type": VALID_CONTENT_TYPE}
    response = handler(_event(body), None)

    assert response["statusCode"] == 400
    assert "25 MB" in json.loads(response["body"])["error"]


# --- API error handling ---

def test_whisper_api_error_returns_500():
    client = MagicMock()
    client.audio.transcriptions.create.side_effect = Exception("Whisper unavailable")
    body = {"audio_base64": VALID_AUDIO_B64, "content_type": VALID_CONTENT_TYPE}
    response = handler(_event(body), None, openai_client=client)

    assert response["statusCode"] == 500
    assert "AI processing failed" in json.loads(response["body"])["error"]


def test_gpt_api_error_returns_500():
    client = MagicMock()
    transcription_result = MagicMock()
    transcription_result.text = "some transcript"
    client.audio.transcriptions.create.return_value = transcription_result
    client.chat.completions.create.side_effect = Exception("GPT unavailable")

    body = {"audio_base64": VALID_AUDIO_B64, "content_type": VALID_CONTENT_TYPE}
    response = handler(_event(body), None, openai_client=client)

    assert response["statusCode"] == 500
    assert "AI processing failed" in json.loads(response["body"])["error"]
