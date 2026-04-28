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


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _list_projects(user_id: str, table):
    response = table.query(
        KeyConditionExpression=Key("PK").eq(_pk(user_id)) & Key("SK").begins_with(_PROJECT_PREFIX),
        ScanIndexForward=False,
    )
    items = [_strip_keys(item) for item in response.get("Items", [])]
    return ok(items)


def _create_project(event: dict, user_id: str, table):
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return error("invalid JSON body", 400)

    name = body.get("name", "").strip()
    if not name:
        return error("name is required", 400)

    project_id = str(uuid.uuid4())
    now = _now()

    item = {
        "PK": _pk(user_id),
        "SK": _sk(project_id),
        "id": project_id,
        "userId": user_id,
        "name": name,
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


def _update_project(event: dict, project_id: str, user_id: str, table):
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return error("invalid JSON body", 400)

    updatable = {k: body[k] for k in ("name", "description", "status") if k in body}
    if not updatable:
        return error("at least one of name, description, or status must be provided", 400)

    existing = table.get_item(Key={"PK": _pk(user_id), "SK": _sk(project_id)}).get("Item")
    if not existing:
        return error("project not found", 404)

    updatable["updatedAt"] = _now()

    set_exprs = [f"#{k} = :{k}" for k in updatable]
    expression = "SET " + ", ".join(set_exprs)
    names = {f"#{k}": k for k in updatable}
    values = {f":{k}": v for k, v in updatable.items()}

    response = table.update_item(
        Key={"PK": _pk(user_id), "SK": _sk(project_id)},
        UpdateExpression=expression,
        ExpressionAttributeNames=names,
        ExpressionAttributeValues=values,
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
    user_id = _get_user_id(event)
    if not user_id:
        return error("unauthorized", 401)

    if table is None:
        table = get_table()

    http_method = event.get("httpMethod", "")
    path_params = event.get("pathParameters") or {}
    project_id = path_params.get("id")

    if not project_id:
        if http_method == "GET":
            return _list_projects(user_id, table)
        if http_method == "POST":
            return _create_project(event, user_id, table)
    else:
        if http_method == "GET":
            return _get_project(project_id, user_id, table)
        if http_method == "PUT":
            return _update_project(event, project_id, user_id, table)
        if http_method == "DELETE":
            return _delete_project(project_id, user_id, table)

    return error("method not allowed", 405)
