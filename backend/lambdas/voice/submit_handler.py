import base64
import io
import json
import os

import boto3
from openai import OpenAI

from shared.response import error, ok

_MAX_AUDIO_BYTES = 25 * 1024 * 1024  # 25 MB — Whisper hard limit
_SSM_PARAM_ENV = "SSM_PARAMETER_NAME"

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


def handler(event, context, ssm_client=None, openai_client=None):
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return error("invalid JSON body", 400)

    audio_b64 = body.get("audio_base64")
    content_type = body.get("content_type")

    if not audio_b64:
        return error("audio_base64 is required", 400)
    if not content_type:
        return error("content_type is required", 400)

    try:
        audio_bytes = base64.b64decode(audio_b64)
    except Exception:
        return error("audio_base64 is not valid base64", 400)

    if len(audio_bytes) > _MAX_AUDIO_BYTES:
        return error("audio file exceeds 25 MB limit", 400)

    try:
        client = openai_client or _get_openai_client(ssm_client)
        transcript = _transcribe(audio_bytes, content_type, client)
        structured = _structure(transcript, client)
    except Exception as exc:
        return error(f"AI processing failed: {exc}", 500)

    return ok({
        "serviceType": structured.get("serviceType", ""),
        "teamSize": int(structured.get("teamSize", 0)),
        "description": structured.get("description", ""),
        "formalDescription": structured.get("formalDescription", ""),
    })
