import json
import os

import boto3

from shared.response import error, ok

_PRESIGNED_URL_EXPIRY = 300  # 5 minutes


def handler(event, context, s3_client=None):
    s3 = s3_client or boto3.client("s3")
    bucket_name = os.environ["BUCKET_NAME"]

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return error("invalid JSON body", 400)

    project_id = body.get("project_id")
    log_id = body.get("log_id")
    filename = body.get("filename")
    content_type = body.get("content_type", "application/octet-stream")

    if not project_id or not log_id or not filename:
        return error("project_id, log_id, and filename are required", 400)

    key = f"photos/{project_id}/{log_id}/{filename}"

    upload_url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": bucket_name, "Key": key, "ContentType": content_type},
        ExpiresIn=_PRESIGNED_URL_EXPIRY,
    )

    return ok({"uploadUrl": upload_url, "key": key})
