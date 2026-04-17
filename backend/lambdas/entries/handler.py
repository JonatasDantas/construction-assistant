import json
import os
import uuid
from datetime import datetime, timezone

from boto3.dynamodb.conditions import Attr, Key

from shared.db import get_table
from shared.response import error, ok

_TABLE_PREFIX = "PROJECT#"


def _pk(project_id: str) -> str:
    return f"{_TABLE_PREFIX}{project_id}"


def _strip_keys(item: dict) -> dict:
    return {k: v for k, v in item.items() if k not in ("PK", "SK")}


def _create_entry(event, table):
    project_id = event["pathParameters"]["id"]
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return error("invalid JSON body", 400)

    service_type = body.get("serviceType")
    team_size = body.get("teamSize")
    description = body.get("description")

    if not service_type or team_size is None or not description:
        return error("serviceType, teamSize, and description are required", 400)

    entry_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    item = {
        "PK": _pk(project_id),
        "SK": created_at,
        "id": entry_id,
        "projectId": project_id,
        "serviceType": service_type,
        "teamSize": int(team_size),
        "description": description,
        "formalDescription": body.get("formalDescription", ""),
        "photoKey": body.get("photoKey", ""),
        "createdAt": created_at,
    }

    table.put_item(Item=item)
    return ok(_strip_keys(item), status_code=201)


def _list_entries(event, table):
    project_id = event["pathParameters"]["id"]

    response = table.query(
        KeyConditionExpression=Key("PK").eq(_pk(project_id)),
        ScanIndexForward=False,
    )

    items = [_strip_keys(item) for item in response.get("Items", [])]
    return ok(items)


def _get_entry(event, table):
    project_id = event["pathParameters"]["id"]
    entry_id = event["pathParameters"]["entry_id"]

    response = table.query(
        KeyConditionExpression=Key("PK").eq(_pk(project_id)),
        FilterExpression=Attr("id").eq(entry_id),
    )

    items = response.get("Items", [])
    if not items:
        return error("entry not found", 404)

    return ok(_strip_keys(items[0]))


def handler(event, context, table=None):
    if table is None:
        table = get_table()

    http_method = event.get("httpMethod", "")
    path_params = event.get("pathParameters") or {}
    has_entry_id = "entry_id" in path_params

    if http_method == "POST" and not has_entry_id:
        return _create_entry(event, table)
    if http_method == "GET" and not has_entry_id:
        return _list_entries(event, table)
    if http_method == "GET" and has_entry_id:
        return _get_entry(event, table)

    return error("method not allowed", 405)
