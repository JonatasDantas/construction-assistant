import json
import os

import boto3
import pytest
from moto import mock_aws

from projects.handler import handler

TABLE_NAME = "test-table"
USER_ID = "user-123"
OTHER_USER_ID = "user-999"


@pytest.fixture(autouse=True)
def set_env(monkeypatch):
    monkeypatch.setenv("TABLE_NAME", TABLE_NAME)


@pytest.fixture()
def table():
    with mock_aws():
        ddb = boto3.resource("dynamodb", region_name="us-east-1")
        t = ddb.create_table(
            TableName=TABLE_NAME,
            KeySchema=[
                {"AttributeName": "PK", "KeyType": "HASH"},
                {"AttributeName": "SK", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "PK", "AttributeType": "S"},
                {"AttributeName": "SK", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        yield t


def _auth_event(method, project_id=None, body=None, user_id=USER_ID):
    event = {
        "httpMethod": method,
        "pathParameters": {"id": project_id} if project_id else None,
        "body": json.dumps(body) if body else None,
        "requestContext": {
            "authorizer": {
                "claims": {"sub": user_id}
            }
        },
    }
    return event


def _no_auth_event(method, project_id=None, body=None):
    return {
        "httpMethod": method,
        "pathParameters": {"id": project_id} if project_id else None,
        "body": json.dumps(body) if body else None,
    }


# --- Auth ---


def test_missing_auth_returns_401(table):
    response = handler(_no_auth_event("GET"), None, table=table)
    assert response["statusCode"] == 401


def test_missing_claims_returns_401(table):
    event = {"httpMethod": "GET", "requestContext": {}, "pathParameters": None, "body": None}
    response = handler(event, None, table=table)
    assert response["statusCode"] == 401


# --- POST /projects ---


def test_create_project_returns_201(table):
    event = _auth_event("POST", body={"name": "Obra Centro"})
    response = handler(event, None, table=table)

    assert response["statusCode"] == 201
    item = json.loads(response["body"])
    assert item["name"] == "Obra Centro"
    assert item["status"] == "active"
    assert item["description"] == ""
    assert "id" in item
    assert "createdAt" in item
    assert "updatedAt" in item
    assert "PK" not in item
    assert "SK" not in item


def test_create_project_with_all_fields(table):
    body = {"name": "Reforma Sul", "description": "Renovação completa", "status": "paused"}
    event = _auth_event("POST", body=body)
    response = handler(event, None, table=table)

    assert response["statusCode"] == 201
    item = json.loads(response["body"])
    assert item["description"] == "Renovação completa"
    assert item["status"] == "paused"


def test_create_project_missing_name_returns_400(table):
    event = _auth_event("POST", body={"description": "No name"})
    response = handler(event, None, table=table)
    assert response["statusCode"] == 400


def test_create_project_empty_name_returns_400(table):
    event = _auth_event("POST", body={"name": "   "})
    response = handler(event, None, table=table)
    assert response["statusCode"] == 400


def test_create_project_invalid_json_returns_400(table):
    event = _auth_event("POST")
    event["body"] = "{bad json"
    response = handler(event, None, table=table)
    assert response["statusCode"] == 400


def test_create_project_stores_user_id(table):
    event = _auth_event("POST", body={"name": "Proj X"})
    response = handler(event, None, table=table)
    item = json.loads(response["body"])
    assert item["userId"] == USER_ID


# --- GET /projects ---


def test_list_projects_empty_returns_empty_array(table):
    event = _auth_event("GET")
    response = handler(event, None, table=table)

    assert response["statusCode"] == 200
    assert json.loads(response["body"]) == []


def test_list_projects_returns_all_for_user(table):
    for name in ["Proj A", "Proj B", "Proj C"]:
        handler(_auth_event("POST", body={"name": name}), None, table=table)

    response = handler(_auth_event("GET"), None, table=table)
    assert response["statusCode"] == 200
    items = json.loads(response["body"])
    assert len(items) == 3


def test_list_projects_does_not_return_other_users_projects(table):
    handler(_auth_event("POST", body={"name": "My Proj"}, user_id=USER_ID), None, table=table)
    handler(_auth_event("POST", body={"name": "Other Proj"}, user_id=OTHER_USER_ID), None, table=table)

    response = handler(_auth_event("GET", user_id=USER_ID), None, table=table)
    items = json.loads(response["body"])
    assert len(items) == 1
    assert items[0]["name"] == "My Proj"


def test_list_projects_excludes_pk_sk(table):
    handler(_auth_event("POST", body={"name": "Proj"}), None, table=table)
    response = handler(_auth_event("GET"), None, table=table)
    items = json.loads(response["body"])
    assert "PK" not in items[0]
    assert "SK" not in items[0]


# --- GET /projects/{id} ---


def test_get_project_returns_200(table):
    create_resp = handler(_auth_event("POST", body={"name": "Find Me"}), None, table=table)
    project_id = json.loads(create_resp["body"])["id"]

    response = handler(_auth_event("GET", project_id=project_id), None, table=table)
    assert response["statusCode"] == 200
    item = json.loads(response["body"])
    assert item["id"] == project_id
    assert item["name"] == "Find Me"
    assert "PK" not in item
    assert "SK" not in item


def test_get_project_not_found_returns_404(table):
    response = handler(_auth_event("GET", project_id="nonexistent"), None, table=table)
    assert response["statusCode"] == 404


def test_get_project_other_user_returns_404(table):
    create_resp = handler(_auth_event("POST", body={"name": "Secret"}, user_id=OTHER_USER_ID), None, table=table)
    project_id = json.loads(create_resp["body"])["id"]

    response = handler(_auth_event("GET", project_id=project_id, user_id=USER_ID), None, table=table)
    assert response["statusCode"] == 404


# --- PUT /projects/{id} ---


def test_update_project_name_returns_200(table):
    create_resp = handler(_auth_event("POST", body={"name": "Old Name"}), None, table=table)
    project_id = json.loads(create_resp["body"])["id"]

    response = handler(_auth_event("PUT", project_id=project_id, body={"name": "New Name"}), None, table=table)
    assert response["statusCode"] == 200
    item = json.loads(response["body"])
    assert item["name"] == "New Name"


def test_update_project_partial_fields(table):
    create_resp = handler(_auth_event("POST", body={"name": "Proj"}), None, table=table)
    project_id = json.loads(create_resp["body"])["id"]

    response = handler(
        _auth_event("PUT", project_id=project_id, body={"status": "completed", "description": "Done"}),
        None,
        table=table,
    )
    assert response["statusCode"] == 200
    item = json.loads(response["body"])
    assert item["status"] == "completed"
    assert item["description"] == "Done"
    assert item["name"] == "Proj"


def test_update_project_no_valid_fields_returns_400(table):
    create_resp = handler(_auth_event("POST", body={"name": "Proj"}), None, table=table)
    project_id = json.loads(create_resp["body"])["id"]

    response = handler(_auth_event("PUT", project_id=project_id, body={"unknown": "field"}), None, table=table)
    assert response["statusCode"] == 400


def test_update_project_not_found_returns_404(table):
    response = handler(_auth_event("PUT", project_id="ghost", body={"name": "X"}), None, table=table)
    assert response["statusCode"] == 404


def test_update_project_invalid_json_returns_400(table):
    create_resp = handler(_auth_event("POST", body={"name": "Proj"}), None, table=table)
    project_id = json.loads(create_resp["body"])["id"]

    event = _auth_event("PUT", project_id=project_id)
    event["body"] = "{bad"
    response = handler(event, None, table=table)
    assert response["statusCode"] == 400


def test_update_project_updates_updated_at(table):
    create_resp = handler(_auth_event("POST", body={"name": "Proj"}), None, table=table)
    original = json.loads(create_resp["body"])
    project_id = original["id"]

    import time
    time.sleep(0.01)

    response = handler(_auth_event("PUT", project_id=project_id, body={"name": "Updated"}), None, table=table)
    updated = json.loads(response["body"])
    assert updated["updatedAt"] >= original["updatedAt"]


# --- DELETE /projects/{id} ---


def test_delete_project_returns_204(table):
    create_resp = handler(_auth_event("POST", body={"name": "To Delete"}), None, table=table)
    project_id = json.loads(create_resp["body"])["id"]

    response = handler(_auth_event("DELETE", project_id=project_id), None, table=table)
    assert response["statusCode"] == 204


def test_delete_project_actually_removes_it(table):
    create_resp = handler(_auth_event("POST", body={"name": "Gone"}), None, table=table)
    project_id = json.loads(create_resp["body"])["id"]

    handler(_auth_event("DELETE", project_id=project_id), None, table=table)

    get_resp = handler(_auth_event("GET", project_id=project_id), None, table=table)
    assert get_resp["statusCode"] == 404


def test_delete_project_not_found_returns_404(table):
    response = handler(_auth_event("DELETE", project_id="no-such-project"), None, table=table)
    assert response["statusCode"] == 404


def test_delete_project_other_user_returns_404(table):
    create_resp = handler(_auth_event("POST", body={"name": "Owned"}, user_id=OTHER_USER_ID), None, table=table)
    project_id = json.loads(create_resp["body"])["id"]

    response = handler(_auth_event("DELETE", project_id=project_id, user_id=USER_ID), None, table=table)
    assert response["statusCode"] == 404


# --- Routing ---


def test_unknown_method_on_collection_returns_405(table):
    response = handler(_auth_event("PATCH"), None, table=table)
    assert response["statusCode"] == 405


def test_unknown_method_on_resource_returns_405(table):
    response = handler(_auth_event("PATCH", project_id="some-id"), None, table=table)
    assert response["statusCode"] == 405
