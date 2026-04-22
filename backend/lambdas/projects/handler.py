import json
import uuid
from datetime import datetime, timezone

from boto3.dynamodb.conditions import Key

from shared.db import get_table
from shared.response import error, ok

_USER_PREFIX = "USER#"
_PROJECT_PREFIX = "PROJECT#"


def _pk(user_id: str) -> str:
    return f"{_USER_PREFIX}{user_id}"


def _sk(project_id: str) -> str:
    return f"{_PROJECT_PREFIX}{project_id}"


def _get_user_id(event: dict):
    try:
        return event["requestContext"]["authorizer"]["claims"]["sub"]
    except (KeyError, TypeError):
        return None


def _strip_keys(item: dict) -> dict:
    return {k: v for k, v in item.items() if k not in ("PK", "SK")}


def _list_projects(user_id: str, table) -> dict:
    response = table.query(
        KeyConditionExpression=Key("PK").eq(_pk(user_id)) & Key("SK").begins_with(_PROJECT_PREFIX),
    )
    items = sorted(
        [_strip_keys(i) for i in response.get("Items", [])],
        key=lambda x: x["createdAt"],
        reverse=True,
    )
    return ok(items)


def _create_project(event: dict, user_id: str, table) -> dict:
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return error("invalid JSON body", 400)

    name = (body.get("name") or "").strip()
    if not name:
        return error("name is required", 400)

    project_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    item = {
        "PK": _pk(user_id),
        "SK": _sk(project_id),
        "id": project_id,
        "name": name,
        "description": body.get("description", ""),
        "status": body.get("status", "active"),
        "createdAt": now,
        "updatedAt": now,
    }

    table.put_item(Item=item)
    return ok(_strip_keys(item), status_code=201)


def _get_project(project_id: str, user_id: str, table) -> dict:
    response = table.get_item(Key={"PK": _pk(user_id), "SK": _sk(project_id)})
    item = response.get("Item")
    if not item:
        return error("project not found", 404)
    return ok(_strip_keys(item))


def _update_project(event: dict, project_id: str, user_id: str, table) -> dict:
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return error("invalid JSON body", 400)

    existing = table.get_item(Key={"PK": _pk(user_id), "SK": _sk(project_id)})
    if not existing.get("Item"):
        return error("project not found", 404)

    updatable = {}
    if "name" in body:
        name = (body["name"] or "").strip()
        if not name:
            return error("name cannot be empty", 400)
        updatable["name"] = name
    if "description" in body:
        updatable["description"] = body["description"]
    if "status" in body:
        updatable["status"] = body["status"]

    if not updatable:
        return error("no updatable fields provided", 400)

    updatable["updatedAt"] = datetime.now(timezone.utc).isoformat()

    set_parts = []
    expr_names = {}
    expr_values = {}
    for idx, (k, v) in enumerate(updatable.items()):
        name_key = f"#f{idx}"
        val_key = f":v{idx}"
        set_parts.append(f"{name_key} = {val_key}")
        expr_names[name_key] = k
        expr_values[val_key] = v

    response = table.update_item(
        Key={"PK": _pk(user_id), "SK": _sk(project_id)},
        UpdateExpression="SET " + ", ".join(set_parts),
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
        ReturnValues="ALL_NEW",
    )
    return ok(_strip_keys(response["Attributes"]))


def _delete_project(project_id: str, user_id: str, table) -> dict:
    existing = table.get_item(Key={"PK": _pk(user_id), "SK": _sk(project_id)})
    if not existing.get("Item"):
        return error("project not found", 404)

    table.delete_item(Key={"PK": _pk(user_id), "SK": _sk(project_id)})
    return {"statusCode": 204, "headers": {"Content-Type": "application/json"}, "body": ""}


def handler(event, context, table=None):
    if table is None:
        table = get_table()

    user_id = _get_user_id(event)
    if not user_id:
        return error("unauthorized", 401)

    http_method = event.get("httpMethod", "")
    path_params = event.get("pathParameters") or {}
    project_id = path_params.get("id")

    if project_id:
        if http_method == "GET":
            return _get_project(project_id, user_id, table)
        if http_method == "PUT":
            return _update_project(event, project_id, user_id, table)
        if http_method == "DELETE":
            return _delete_project(project_id, user_id, table)
    else:
        if http_method == "GET":
            return _list_projects(user_id, table)
        if http_method == "POST":
            return _create_project(event, user_id, table)

    return error("method not allowed", 405)
