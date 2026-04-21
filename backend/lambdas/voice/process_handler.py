import io
import json
import logging
import os
import uuid
from datetime import datetime, timezone

import boto3
from openai import OpenAI

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_SSM_PARAM_ENV = "SSM_PARAMETER_NAME"
_TABLE_PREFIX = "PROJECT#"

_GPT_SYSTEM_PROMPT = (
    "You are an assistant for Brazilian construction site foremen. "
    "Given a transcription of a spoken site report, extract structured data and "
    "produce a formal written description in Portuguese. "
    "Return ONLY a JSON object with these keys: "
    "serviceType (string — type of construction service, e.g. Estrutura, Alvenaria, Elétrica), "
    "teamSize (integer — number of workers mentioned), "
    "description (string — concise summary in the foreman's own words), "
    "formalDescription (string — formal, professional Portuguese description suitable for a client report)."
)


def _get_openai_client(ssm_client=None):
    param_name = os.environ.get(_SSM_PARAM_ENV, "/construction-assistant/openai-api-key")
    ssm = ssm_client or boto3.client("ssm")
    response = ssm.get_parameter(Name=param_name, WithDecryption=True)
    api_key = response["Parameter"]["Value"]
    return OpenAI(api_key=api_key)


def _download_audio(audio_key: str, s3_client=None) -> bytes:
    s3 = s3_client or boto3.client("s3")
    bucket_name = os.environ["BUCKET_NAME"]
    response = s3.get_object(Bucket=bucket_name, Key=audio_key)
    return response["Body"].read()


def _transcribe(audio_bytes: bytes, content_type: str, openai_client: OpenAI) -> str:
    ext = content_type.split("/")[-1].split(";")[0].strip() or "m4a"
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = f"audio.{ext}"
    transcript = openai_client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        language="pt",
    )
    return transcript.text


def _structure(transcript: str, openai_client: OpenAI) -> dict:
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": _GPT_SYSTEM_PROMPT},
            {"role": "user", "content": transcript},
        ],
    )
    return json.loads(response.choices[0].message.content)


def _save_entry(project_id: str, structured: dict, table=None) -> None:
    if table is None:
        dynamodb = boto3.resource("dynamodb")
        table = dynamodb.Table(os.environ["TABLE_NAME"])

    created_at = datetime.now(timezone.utc).isoformat()
    item = {
        "PK": f"{_TABLE_PREFIX}{project_id}",
        "SK": created_at,
        "id": str(uuid.uuid4()),
        "projectId": project_id,
        "serviceType": structured.get("serviceType", ""),
        "teamSize": int(structured.get("teamSize", 0)),
        "description": structured.get("description", ""),
        "formalDescription": structured.get("formalDescription", ""),
        "photoKey": "",
        "createdAt": created_at,
    }
    table.put_item(Item=item)
    logger.info("Entry created for project %s", project_id)


def _process_record(record: dict, s3_client=None, ssm_client=None, openai_client=None, table=None) -> None:
    try:
        body = json.loads(record["body"])
    except (json.JSONDecodeError, KeyError) as exc:
        logger.error("Invalid SQS message body — skipping: %s", exc)
        return

    audio_key = body.get("audioKey")
    project_id = body.get("projectId")
    content_type = body.get("contentType", "audio/m4a")

    if not audio_key:
        logger.error("Missing audioKey in SQS message — skipping: %s", body)
        return
    if not project_id:
        logger.error("Missing projectId in SQS message — skipping: %s", body)
        return

    logger.info("Processing audio %s for project %s", audio_key, project_id)

    audio_bytes = _download_audio(audio_key, s3_client)
    client = openai_client or _get_openai_client(ssm_client)
    transcript = _transcribe(audio_bytes, content_type, client)
    structured = _structure(transcript, client)
    _save_entry(project_id, structured, table)


def handler(event, context, s3_client=None, ssm_client=None, openai_client=None, table=None):
    records = event.get("Records", [])
    logger.info("Processing %d SQS record(s)", len(records))

    for record in records:
        _process_record(
            record,
            s3_client=s3_client,
            ssm_client=ssm_client,
            openai_client=openai_client,
            table=table,
        )
