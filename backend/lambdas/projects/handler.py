import json
import uuid
from datetime import datetime, timezone

from boto3.dynamodb.conditions import Key

from shared.db import get_table
from shared.response import error, ok

_USER_PREFIX = "USER#"
_PROJECT_PREFIX = "PROJECT#"


def _get_user_id(event: dict):
    try:
        return event["requestContext"]["authorizer"]["claims"]["sub"]
    except (KeyError, TypeError):
        return None


def _pk(user_id: str) -> str:
    return f"{_USER_PREFIX}{user_id}"


def _sk(project_id: str) -> str:
    return f"{_PROJECT_PREFIX}{project_id}"


def _strip_keys(item: dict) -> dict:
    return {k: v for k, v in item.items() if k not in ("PK", "SK")}


def _list_projects(user_id: str, table):
    response = table.query(
        KeyConditionExpression=Key("PK").eq(_pk(user_id)) & Key("SK").begins_with(_PROJECT_PREFIX),
        ScanIndexForward=False,
    )
    items = [_strip_keys(item) for item in response.get("Items", [])]
    items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return ok(items)


def _create_project(event, user_id: str, table):
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return error("invalid JSON body", 400)

    name = body.get("name", "")
    if not isinstance(name, str) or not name.strip():
        return error("name is required", 400)

    project_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    item = {
        "PK": _pk(user_id),
        "SK": _sk(project_id),
        "id": project_id,
        "name": name.strip(),
        "description": body.get("description", ""),
        "status": body.get("status", "active"),
        "createdAt": now,
        "updatedAt": now,
    }

    table.put_item(Item=item)
    return ok(_strip_keys(item), status_code=201)


def _get_project(project_id: str, user_id: str, table):
    response = table.get_item(Key={"PK": _pk(user_id), "SK": _sk(project_id)})
    item = response.get("Item")
    if not item:
        return error("project not found", 404)
    return ok(_strip_keys(item))


def _update_project(event, project_id: str, user_id: str, table):
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return error("invalid JSON body", 400)

    existing = table.get_item(Key={"PK": _pk(user_id), "SK": _sk(project_id)}).get("Item")
    if not existing:
        return error("project not found", 404)

    updatable = {k: body[k] for k in ("name", "description", "status") if k in body}
    if not updatable:
        return error("no valid fields to update", 400)

    now = datetime.now(timezone.utc).isoformat()
    set_expr = ", ".join(f"#{k} = :{k}" for k in updatable) + ", updatedAt = :updatedAt"
    expr_names = {f"#{k}": k for k in updatable}
    expr_values = {f":{k}": v for k, v in updatable.items()}
    expr_values[":updatedAt"] = now

    response = table.update_item(
        Key={"PK": _pk(user_id), "SK": _sk(project_id)},
        UpdateExpression=f"SET {set_expr}",
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
        ReturnValues="ALL_NEW",
    )
    return ok(_strip_keys(response["Attributes"]))


def _delete_project(project_id: str, user_id: str, table):
    existing = table.get_item(Key={"PK": _pk(user_id), "SK": _sk(project_id)}).get("Item")
    if not existing:
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
    project_id = (event.get("pathParameters") or {}).get("id")

    if not project_id:
        if http_method == "GET":
            return _list_projects(user_id, table)
        if http_method == "POST":
            return _create_project(event, user_id, table)
        return error("method not allowed", 405)

    if http_method == "GET":
        return _get_project(project_id, user_id, table)
    if http_method == "PUT":
        return _update_project(event, project_id, user_id, table)
    if http_method == "DELETE":
        return _delete_project(project_id, user_id, table)
    return error("method not allowed", 405)
