import json
from unittest.mock import MagicMock, patch

import pytest

from voice.process_handler import handler, _process_record

_STRUCTURED_RESPONSE = {
    "serviceType": "Alvenaria",
    "teamSize": 6,
    "description": "Assentamento de blocos no segundo pavimento",
    "formalDescription": "Execução do assentamento de blocos cerâmicos no segundo pavimento.",
}

_VALID_AUDIO_BYTES = b"fake-audio-bytes"


@pytest.fixture(autouse=True)
def set_env(monkeypatch):
    monkeypatch.setenv("TABLE_NAME", "test-table")
    monkeypatch.setenv("BUCKET_NAME", "test-bucket")
    monkeypatch.setenv("SSM_PARAMETER_NAME", "/construction-assistant/openai-api-key")


def _make_openai_client(transcript: str = "Assentamento de blocos", structured: dict = None):
    if structured is None:
        structured = _STRUCTURED_RESPONSE

    client = MagicMock()

    transcription_result = MagicMock()
    transcription_result.text = transcript
    client.audio.transcriptions.create.return_value = transcription_result

    message = MagicMock()
    message.content = json.dumps(structured)
    choice = MagicMock()
    choice.message = message
    completion = MagicMock()
    completion.choices = [choice]
    client.chat.completions.create.return_value = completion

    return client


def _make_s3_client(audio_bytes: bytes = _VALID_AUDIO_BYTES):
    s3 = MagicMock()
    body_mock = MagicMock()
    body_mock.read.return_value = audio_bytes
    s3.get_object.return_value = {"Body": body_mock}
    return s3


def _make_table():
    table = MagicMock()
    return table


def _sqs_event(messages: list) -> dict:
    return {
        "Records": [
            {"body": json.dumps(msg)} for msg in messages
        ]
    }


# --- Happy path ---

def test_happy_path_creates_dynamodb_entry():
    table = _make_table()
    event = _sqs_event([{
        "audioKey": "voice/proj-1/2026-01-01.m4a",
        "projectId": "proj-1",
        "contentType": "audio/m4a",
    }])

    handler(event, None,
            s3_client=_make_s3_client(),
            openai_client=_make_openai_client(),
            table=table)

    table.put_item.assert_called_once()
    item = table.put_item.call_args.kwargs["Item"]
    assert item["projectId"] == "proj-1"


def test_entry_has_correct_pk_sk_format():
    table = _make_table()
    event = _sqs_event([{
        "audioKey": "voice/proj-abc/ts.m4a",
        "projectId": "proj-abc",
        "contentType": "audio/m4a",
    }])

    handler(event, None,
            s3_client=_make_s3_client(),
            openai_client=_make_openai_client(),
            table=table)

    item = table.put_item.call_args.kwargs["Item"]
    assert item["PK"] == "PROJECT#proj-abc"
    assert "SK" in item
    assert "T" in item["SK"]  # ISO 8601 timestamp contains "T"


def test_entry_includes_all_structured_fields():
    table = _make_table()
    event = _sqs_event([{
        "audioKey": "voice/proj-1/ts.m4a",
        "projectId": "proj-1",
        "contentType": "audio/m4a",
    }])

    handler(event, None,
            s3_client=_make_s3_client(),
            openai_client=_make_openai_client(),
            table=table)

    item = table.put_item.call_args.kwargs["Item"]
    assert item["serviceType"] == "Alvenaria"
    assert item["teamSize"] == 6
    assert item["description"] == "Assentamento de blocos no segundo pavimento"
    assert item["formalDescription"] == "Execução do assentamento de blocos cerâmicos no segundo pavimento."
    assert "id" in item
    assert "createdAt" in item
    assert item["photoKey"] == ""


def test_whisper_called_with_portuguese_language():
    openai_client = _make_openai_client()
    event = _sqs_event([{
        "audioKey": "voice/proj-1/ts.m4a",
        "projectId": "proj-1",
        "contentType": "audio/m4a",
    }])

    handler(event, None,
            s3_client=_make_s3_client(),
            openai_client=openai_client,
            table=_make_table())

    call_kwargs = openai_client.audio.transcriptions.create.call_args.kwargs
    assert call_kwargs["model"] == "whisper-1"
    assert call_kwargs["language"] == "pt"


def test_gpt_called_with_json_mode_and_correct_model():
    openai_client = _make_openai_client()
    event = _sqs_event([{
        "audioKey": "voice/proj-1/ts.m4a",
        "projectId": "proj-1",
        "contentType": "audio/m4a",
    }])

    handler(event, None,
            s3_client=_make_s3_client(),
            openai_client=openai_client,
            table=_make_table())

    call_kwargs = openai_client.chat.completions.create.call_args.kwargs
    assert call_kwargs["model"] == "gpt-4o-mini"
    assert call_kwargs["response_format"] == {"type": "json_object"}


# --- Invalid / malformed messages — should be skipped without crashing ---

def test_invalid_json_body_is_skipped():
    table = _make_table()
    records = [{"body": "{bad json}"}]
    event = {"Records": records}

    handler(event, None,
            s3_client=_make_s3_client(),
            openai_client=_make_openai_client(),
            table=table)

    table.put_item.assert_not_called()


def test_missing_audio_key_is_skipped():
    table = _make_table()
    event = _sqs_event([{"projectId": "proj-1", "contentType": "audio/m4a"}])

    handler(event, None,
            s3_client=_make_s3_client(),
            openai_client=_make_openai_client(),
            table=table)

    table.put_item.assert_not_called()


def test_missing_project_id_is_skipped():
    table = _make_table()
    event = _sqs_event([{"audioKey": "voice/proj-1/ts.m4a", "contentType": "audio/m4a"}])

    handler(event, None,
            s3_client=_make_s3_client(),
            openai_client=_make_openai_client(),
            table=table)

    table.put_item.assert_not_called()


# --- Retriable errors — should raise so SQS can retry ---

def test_s3_download_failure_raises():
    s3 = MagicMock()
    s3.get_object.side_effect = Exception("S3 unavailable")
    event = _sqs_event([{
        "audioKey": "voice/proj-1/ts.m4a",
        "projectId": "proj-1",
        "contentType": "audio/m4a",
    }])

    with pytest.raises(Exception, match="S3 unavailable"):
        handler(event, None,
                s3_client=s3,
                openai_client=_make_openai_client(),
                table=_make_table())


def test_transcription_failure_raises():
    openai_client = MagicMock()
    openai_client.audio.transcriptions.create.side_effect = Exception("Whisper unavailable")
    event = _sqs_event([{
        "audioKey": "voice/proj-1/ts.m4a",
        "projectId": "proj-1",
        "contentType": "audio/m4a",
    }])

    with pytest.raises(Exception, match="Whisper unavailable"):
        handler(event, None,
                s3_client=_make_s3_client(),
                openai_client=openai_client,
                table=_make_table())


# --- Multiple records ---

def test_multiple_records_processed_independently():
    table = _make_table()
    event = _sqs_event([
        {"audioKey": "voice/proj-1/ts1.m4a", "projectId": "proj-1", "contentType": "audio/m4a"},
        {"audioKey": "voice/proj-2/ts2.m4a", "projectId": "proj-2", "contentType": "audio/m4a"},
    ])

    handler(event, None,
            s3_client=_make_s3_client(),
            openai_client=_make_openai_client(),
            table=table)

    assert table.put_item.call_count == 2
    project_ids = {call.kwargs["Item"]["projectId"] for call in table.put_item.call_args_list}
    assert project_ids == {"proj-1", "proj-2"}
