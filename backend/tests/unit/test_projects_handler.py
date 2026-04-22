import json
import os
import time

import boto3
import pytest
from moto import mock_aws

from projects.handler import handler

TABLE_NAME = "test-table"
USER_ID = "user-abc-123"
OTHER_USER_ID = "user-xyz-999"


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


def _event(method, project_id=None, body=None, user_id=USER_ID):
    return {
        "httpMethod": method,
        "pathParameters": {"id": project_id} if project_id else None,
        "body": json.dumps(body) if body is not None else None,
        "requestContext": {
            "authorizer": {
                "claims": {"sub": user_id}
            }
        },
    }


def _create(table, name="Edifício Central", user_id=USER_ID, **extra):
    body = {"name": name, **extra}
    resp = handler(_event("POST", body=body, user_id=user_id), None, table=table)
    assert resp["statusCode"] == 201
    return json.loads(resp["body"])


# --- Auth ---


def test_missing_auth_returns_401(table):
    event = {"httpMethod": "GET", "pathParameters": None, "body": None, "requestContext": {}}
    resp = handler(event, None, table=table)
    assert resp["statusCode"] == 401


def test_malformed_claims_returns_401(table):
    event = {
        "httpMethod": "GET",
        "pathParameters": None,
        "body": None,
        "requestContext": {"authorizer": {"claims": {}}},
    }
    resp = handler(event, None, table=table)
    assert resp["statusCode"] == 401


# --- POST /projects ---


def test_create_project_returns_201(table):
    resp = handler(_event("POST", body={"name": "Residencial Norte"}), None, table=table)
    assert resp["statusCode"] == 201
    item = json.loads(resp["body"])
    assert item["name"] == "Residencial Norte"
    assert item["status"] == "active"
    assert item["description"] == ""
    assert "id" in item
    assert "createdAt" in item
    assert "updatedAt" in item


def test_create_project_with_all_fields(table):
    body = {"name": "Obra Comercial", "description": "Loja no centro", "status": "paused"}
    resp = handler(_event("POST", body=body), None, table=table)
    assert resp["statusCode"] == 201
    item = json.loads(resp["body"])
    assert item["name"] == "Obra Comercial"
    assert item["description"] == "Loja no centro"
    assert item["status"] == "paused"


def test_create_project_strips_whitespace_from_name(table):
    resp = handler(_event("POST", body={"name": "  Casa Verde  "}), None, table=table)
    assert resp["statusCode"] == 201
    assert json.loads(resp["body"])["name"] == "Casa Verde"


def test_create_project_missing_name_returns_400(table):
    resp = handler(_event("POST", body={"description": "sem nome"}), None, table=table)
    assert resp["statusCode"] == 400


def test_create_project_empty_name_returns_400(table):
    resp = handler(_event("POST", body={"name": ""}), None, table=table)
    assert resp["statusCode"] == 400


def test_create_project_whitespace_name_returns_400(table):
    resp = handler(_event("POST", body={"name": "   "}), None, table=table)
    assert resp["statusCode"] == 400


def test_create_project_invalid_json_returns_400(table):
    event = _event("POST")
    event["body"] = "{bad json"
    resp = handler(event, None, table=table)
    assert resp["statusCode"] == 400


def test_create_project_pk_sk_not_in_response(table):
    resp = handler(_event("POST", body={"name": "Teste"}), None, table=table)
    item = json.loads(resp["body"])
    assert "PK" not in item
    assert "SK" not in item


# --- GET /projects ---


def test_list_projects_empty_returns_empty_array(table):
    resp = handler(_event("GET"), None, table=table)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"]) == []


def test_list_projects_returns_all_for_user(table):
    for name in ["Obra A", "Obra B", "Obra C"]:
        _create(table, name=name)

    resp = handler(_event("GET"), None, table=table)
    assert resp["statusCode"] == 200
    items = json.loads(resp["body"])
    assert len(items) == 3


def test_list_projects_sorted_newest_first(table):
    for name in ["Primeiro", "Segundo", "Terceiro"]:
        _create(table, name=name)
        time.sleep(0.01)

    resp = handler(_event("GET"), None, table=table)
    items = json.loads(resp["body"])
    timestamps = [item["createdAt"] for item in items]
    assert timestamps == sorted(timestamps, reverse=True)


def test_list_projects_user_isolation(table):
    _create(table, name="Meu Projeto", user_id=USER_ID)
    _create(table, name="Projeto Alheio", user_id=OTHER_USER_ID)

    resp = handler(_event("GET", user_id=USER_ID), None, table=table)
    items = json.loads(resp["body"])
    assert len(items) == 1
    assert items[0]["name"] == "Meu Projeto"


def test_list_projects_pk_sk_not_in_response(table):
    _create(table)
    resp = handler(_event("GET"), None, table=table)
    item = json.loads(resp["body"])[0]
    assert "PK" not in item
    assert "SK" not in item


# --- GET /projects/{id} ---


def test_get_project_returns_200(table):
    created = _create(table, name="Residencial Sul")
    resp = handler(_event("GET", project_id=created["id"]), None, table=table)
    assert resp["statusCode"] == 200
    item = json.loads(resp["body"])
    assert item["id"] == created["id"]
    assert item["name"] == "Residencial Sul"
    assert "PK" not in item
    assert "SK" not in item


def test_get_project_not_found_returns_404(table):
    resp = handler(_event("GET", project_id="nonexistent-id"), None, table=table)
    assert resp["statusCode"] == 404


def test_get_project_other_user_returns_404(table):
    created = _create(table, name="Projeto Privado", user_id=OTHER_USER_ID)
    resp = handler(_event("GET", project_id=created["id"], user_id=USER_ID), None, table=table)
    assert resp["statusCode"] == 404


# --- PUT /projects/{id} ---


def test_update_project_name_only(table):
    created = _create(table, name="Nome Antigo")
    resp = handler(
        _event("PUT", project_id=created["id"], body={"name": "Nome Novo"}),
        None, table=table,
    )
    assert resp["statusCode"] == 200
    item = json.loads(resp["body"])
    assert item["name"] == "Nome Novo"


def test_update_project_partial_fields(table):
    created = _create(table, name="Obra X", description="desc original")
    resp = handler(
        _event("PUT", project_id=created["id"], body={"description": "desc atualizada", "status": "paused"}),
        None, table=table,
    )
    assert resp["statusCode"] == 200
    item = json.loads(resp["body"])
    assert item["description"] == "desc atualizada"
    assert item["status"] == "paused"
    assert item["name"] == "Obra X"


def test_update_project_refreshes_updated_at(table):
    created = _create(table)
    time.sleep(0.01)
    resp = handler(
        _event("PUT", project_id=created["id"], body={"status": "completed"}),
        None, table=table,
    )
    item = json.loads(resp["body"])
    assert item["updatedAt"] > created["updatedAt"]


def test_update_project_no_valid_fields_returns_400(table):
    created = _create(table)
    resp = handler(
        _event("PUT", project_id=created["id"], body={"unknownField": "value"}),
        None, table=table,
    )
    assert resp["statusCode"] == 400


def test_update_project_not_found_returns_404(table):
    resp = handler(
        _event("PUT", project_id="nonexistent-id", body={"name": "Novo"}),
        None, table=table,
    )
    assert resp["statusCode"] == 404


def test_update_project_invalid_json_returns_400(table):
    created = _create(table)
    event = _event("PUT", project_id=created["id"])
    event["body"] = "{bad json"
    resp = handler(event, None, table=table)
    assert resp["statusCode"] == 400


# --- DELETE /projects/{id} ---


def test_delete_project_returns_204(table):
    created = _create(table)
    resp = handler(_event("DELETE", project_id=created["id"]), None, table=table)
    assert resp["statusCode"] == 204


def test_delete_project_actually_removes_item(table):
    created = _create(table)
    handler(_event("DELETE", project_id=created["id"]), None, table=table)
    resp = handler(_event("GET", project_id=created["id"]), None, table=table)
    assert resp["statusCode"] == 404


def test_delete_project_not_found_returns_404(table):
    resp = handler(_event("DELETE", project_id="nonexistent-id"), None, table=table)
    assert resp["statusCode"] == 404


def test_delete_project_other_user_returns_404(table):
    created = _create(table, user_id=OTHER_USER_ID)
    resp = handler(_event("DELETE", project_id=created["id"], user_id=USER_ID), None, table=table)
    assert resp["statusCode"] == 404


# --- Method routing ---


def test_unknown_method_on_collection_returns_405(table):
    resp = handler(_event("PATCH"), None, table=table)
    assert resp["statusCode"] == 405


def test_unknown_method_on_resource_returns_405(table):
    created = _create(table)
    resp = handler(_event("PATCH", project_id=created["id"]), None, table=table)
    assert resp["statusCode"] == 405
