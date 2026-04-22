import json
import os
import time

import boto3
import pytest
from moto import mock_aws

from projects.handler import handler

TABLE_NAME = "test-table"


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


def _event(method, user_id="user-1", project_id=None, body=None):
    return {
        "httpMethod": method,
        "pathParameters": {"id": project_id} if project_id else None,
        "body": json.dumps(body) if body is not None else None,
        "requestContext": {"authorizer": {"claims": {"sub": user_id}}},
    }


def _no_auth_event(method, project_id=None):
    return {
        "httpMethod": method,
        "pathParameters": {"id": project_id} if project_id else None,
        "body": None,
        "requestContext": {},
    }


# --- Auth ---


def test_missing_auth_returns_401(table):
    response = handler(_no_auth_event("GET"), None, table=table)
    assert response["statusCode"] == 401


def test_malformed_claims_returns_401(table):
    event = _no_auth_event("GET")
    event["requestContext"] = {"authorizer": {"claims": None}}
    response = handler(event, None, table=table)
    assert response["statusCode"] == 401


# --- POST /projects ---


def test_create_project_returns_201(table):
    response = handler(_event("POST", body={"name": "Obra Central"}), None, table=table)
    assert response["statusCode"] == 201
    item = json.loads(response["body"])
    assert item["name"] == "Obra Central"
    assert item["description"] == ""
    assert item["status"] == "active"
    assert "id" in item
    assert "createdAt" in item
    assert "updatedAt" in item


def test_create_project_with_all_fields(table):
    body = {"name": "Residencial", "description": "Projeto residencial", "status": "planning"}
    response = handler(_event("POST", body=body), None, table=table)
    assert response["statusCode"] == 201
    item = json.loads(response["body"])
    assert item["name"] == "Residencial"
    assert item["description"] == "Projeto residencial"
    assert item["status"] == "planning"


def test_create_project_missing_name_returns_400(table):
    response = handler(_event("POST", body={"description": "No name"}), None, table=table)
    assert response["statusCode"] == 400


def test_create_project_empty_name_returns_400(table):
    response = handler(_event("POST", body={"name": ""}), None, table=table)
    assert response["statusCode"] == 400


def test_create_project_whitespace_name_returns_400(table):
    response = handler(_event("POST", body={"name": "   "}), None, table=table)
    assert response["statusCode"] == 400


def test_create_project_invalid_json_returns_400(table):
    event = _event("POST")
    event["body"] = "{bad json"
    response = handler(event, None, table=table)
    assert response["statusCode"] == 400


def test_create_project_does_not_expose_pk_or_sk(table):
    response = handler(_event("POST", body={"name": "Obra"}), None, table=table)
    item = json.loads(response["body"])
    assert "PK" not in item
    assert "SK" not in item


# --- GET /projects ---


def test_list_projects_empty_returns_empty_array(table):
    response = handler(_event("GET"), None, table=table)
    assert response["statusCode"] == 200
    assert json.loads(response["body"]) == []


def test_list_projects_returns_all_for_user(table):
    for name in ["Alpha", "Beta", "Gamma"]:
        handler(_event("POST", body={"name": name}), None, table=table)

    response = handler(_event("GET"), None, table=table)
    assert response["statusCode"] == 200
    items = json.loads(response["body"])
    assert len(items) == 3


def test_list_projects_sorted_newest_first(table):
    for name in ["First", "Second", "Third"]:
        handler(_event("POST", body={"name": name}), None, table=table)
        time.sleep(0.01)

    response = handler(_event("GET"), None, table=table)
    items = json.loads(response["body"])
    timestamps = [i["createdAt"] for i in items]
    assert timestamps == sorted(timestamps, reverse=True)


def test_list_projects_user_isolation(table):
    handler(_event("POST", user_id="user-A", body={"name": "User A Project"}), None, table=table)
    handler(_event("POST", user_id="user-B", body={"name": "User B Project"}), None, table=table)

    response = handler(_event("GET", user_id="user-A"), None, table=table)
    items = json.loads(response["body"])
    assert len(items) == 1
    assert items[0]["name"] == "User A Project"


# --- GET /projects/{id} ---


def test_get_project_returns_200(table):
    create_resp = handler(_event("POST", body={"name": "My Project"}), None, table=table)
    project_id = json.loads(create_resp["body"])["id"]

    response = handler(_event("GET", project_id=project_id), None, table=table)
    assert response["statusCode"] == 200
    item = json.loads(response["body"])
    assert item["id"] == project_id
    assert item["name"] == "My Project"
    assert "PK" not in item
    assert "SK" not in item


def test_get_project_not_found_returns_404(table):
    response = handler(_event("GET", project_id="nonexistent"), None, table=table)
    assert response["statusCode"] == 404


def test_get_project_other_user_returns_404(table):
    create_resp = handler(_event("POST", user_id="user-1", body={"name": "Private"}), None, table=table)
    project_id = json.loads(create_resp["body"])["id"]

    response = handler(_event("GET", user_id="user-2", project_id=project_id), None, table=table)
    assert response["statusCode"] == 404


# --- PUT /projects/{id} ---


def test_update_project_all_fields(table):
    create_resp = handler(_event("POST", body={"name": "Old Name"}), None, table=table)
    project_id = json.loads(create_resp["body"])["id"]

    body = {"name": "New Name", "description": "New desc", "status": "completed"}
    response = handler(_event("PUT", project_id=project_id, body=body), None, table=table)
    assert response["statusCode"] == 200
    item = json.loads(response["body"])
    assert item["name"] == "New Name"
    assert item["description"] == "New desc"
    assert item["status"] == "completed"


def test_update_project_partial_fields(table):
    create_resp = handler(
        _event("POST", body={"name": "Original", "status": "active"}), None, table=table
    )
    project_id = json.loads(create_resp["body"])["id"]

    response = handler(_event("PUT", project_id=project_id, body={"name": "Updated"}), None, table=table)
    assert response["statusCode"] == 200
    item = json.loads(response["body"])
    assert item["name"] == "Updated"
    assert item["status"] == "active"


def test_update_project_refreshes_updated_at(table):
    create_resp = handler(_event("POST", body={"name": "Proj"}), None, table=table)
    original = json.loads(create_resp["body"])
    project_id = original["id"]

    time.sleep(0.01)
    response = handler(_event("PUT", project_id=project_id, body={"name": "Updated"}), None, table=table)
    updated = json.loads(response["body"])
    assert updated["updatedAt"] > original["updatedAt"]


def test_update_project_no_valid_fields_returns_400(table):
    create_resp = handler(_event("POST", body={"name": "Proj"}), None, table=table)
    project_id = json.loads(create_resp["body"])["id"]

    response = handler(_event("PUT", project_id=project_id, body={"unknown": "field"}), None, table=table)
    assert response["statusCode"] == 400


def test_update_project_not_found_returns_404(table):
    response = handler(_event("PUT", project_id="ghost", body={"name": "X"}), None, table=table)
    assert response["statusCode"] == 404


def test_update_project_invalid_json_returns_400(table):
    create_resp = handler(_event("POST", body={"name": "Proj"}), None, table=table)
    project_id = json.loads(create_resp["body"])["id"]

    event = _event("PUT", project_id=project_id)
    event["body"] = "{bad"
    response = handler(event, None, table=table)
    assert response["statusCode"] == 400


# --- DELETE /projects/{id} ---


def test_delete_project_returns_204(table):
    create_resp = handler(_event("POST", body={"name": "To Delete"}), None, table=table)
    project_id = json.loads(create_resp["body"])["id"]

    response = handler(_event("DELETE", project_id=project_id), None, table=table)
    assert response["statusCode"] == 204


def test_delete_project_removes_item(table):
    create_resp = handler(_event("POST", body={"name": "Gone"}), None, table=table)
    project_id = json.loads(create_resp["body"])["id"]

    handler(_event("DELETE", project_id=project_id), None, table=table)

    get_resp = handler(_event("GET", project_id=project_id), None, table=table)
    assert get_resp["statusCode"] == 404


def test_delete_project_not_found_returns_404(table):
    response = handler(_event("DELETE", project_id="no-such-id"), None, table=table)
    assert response["statusCode"] == 404


def test_delete_project_other_user_returns_404(table):
    create_resp = handler(_event("POST", user_id="user-1", body={"name": "Protected"}), None, table=table)
    project_id = json.loads(create_resp["body"])["id"]

    response = handler(_event("DELETE", user_id="user-2", project_id=project_id), None, table=table)
    assert response["statusCode"] == 404


# --- Routing ---


def test_unknown_method_on_collection_returns_405(table):
    response = handler(_event("PATCH"), None, table=table)
    assert response["statusCode"] == 405


def test_unknown_method_on_resource_returns_405(table):
    response = handler(_event("PATCH", project_id="some-id"), None, table=table)
    assert response["statusCode"] == 405
