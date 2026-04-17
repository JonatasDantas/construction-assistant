import json
import os

import boto3
import pytest
from moto import mock_aws

from entries.handler import handler

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


def _event(method, project_id, entry_id=None, body=None):
    path_params = {"id": project_id}
    if entry_id:
        path_params["entry_id"] = entry_id
    return {
        "httpMethod": method,
        "pathParameters": path_params,
        "body": json.dumps(body) if body else None,
    }


# --- POST /projects/{id}/entries ---


def test_create_entry_returns_201(table):
    body = {
        "serviceType": "Estrutura",
        "teamSize": 4,
        "description": "Concretagem da laje do 3o andar",
        "formalDescription": "Execução da concretagem da laje do terceiro pavimento.",
        "photoKey": "photos/proj1/entry1/photo.jpg",
    }
    event = _event("POST", "proj1", body=body)
    response = handler(event, None, table=table)

    assert response["statusCode"] == 201
    item = json.loads(response["body"])
    assert item["serviceType"] == "Estrutura"
    assert item["teamSize"] == 4
    assert item["description"] == "Concretagem da laje do 3o andar"
    assert item["formalDescription"] == "Execução da concretagem da laje do terceiro pavimento."
    assert item["photoKey"] == "photos/proj1/entry1/photo.jpg"
    assert "id" in item
    assert "createdAt" in item
    assert "PK" not in item
    assert "SK" not in item


def test_create_entry_optional_fields_default(table):
    body = {
        "serviceType": "Alvenaria",
        "teamSize": 2,
        "description": "Levantamento de paredes",
    }
    event = _event("POST", "proj1", body=body)
    response = handler(event, None, table=table)

    assert response["statusCode"] == 201
    item = json.loads(response["body"])
    assert item["formalDescription"] == ""
    assert item["photoKey"] == ""


def test_create_entry_missing_required_fields_returns_400(table):
    body = {"serviceType": "Estrutura"}
    event = _event("POST", "proj1", body=body)
    response = handler(event, None, table=table)

    assert response["statusCode"] == 400


def test_create_entry_invalid_json_returns_400(table):
    event = _event("POST", "proj1")
    event["body"] = "{bad json"
    response = handler(event, None, table=table)

    assert response["statusCode"] == 400


# --- GET /projects/{id}/entries ---


def test_list_entries_empty_returns_empty_array(table):
    event = _event("GET", "proj-empty")
    response = handler(event, None, table=table)

    assert response["statusCode"] == 200
    assert json.loads(response["body"]) == []


def test_list_entries_returns_all_for_project(table):
    for service in ["Alvenaria", "Estrutura", "Elétrica"]:
        handler(
            _event("POST", "proj2", body={"serviceType": service, "teamSize": 1, "description": "desc"}),
            None,
            table=table,
        )

    response = handler(_event("GET", "proj2"), None, table=table)
    assert response["statusCode"] == 200
    items = json.loads(response["body"])
    assert len(items) == 3


def test_list_entries_sorted_descending(table):
    """Items should come back newest-first (ScanIndexForward=False)."""
    import time

    for i in range(3):
        handler(
            _event("POST", "proj3", body={"serviceType": f"S{i}", "teamSize": 1, "description": "d"}),
            None,
            table=table,
        )
        time.sleep(0.01)  # ensure distinct timestamps

    response = handler(_event("GET", "proj3"), None, table=table)
    items = json.loads(response["body"])
    assert len(items) == 3
    timestamps = [item["createdAt"] for item in items]
    assert timestamps == sorted(timestamps, reverse=True)


def test_list_entries_does_not_return_other_projects(table):
    handler(
        _event("POST", "projA", body={"serviceType": "S", "teamSize": 1, "description": "d"}),
        None,
        table=table,
    )
    handler(
        _event("POST", "projB", body={"serviceType": "S", "teamSize": 1, "description": "d"}),
        None,
        table=table,
    )

    response = handler(_event("GET", "projA"), None, table=table)
    items = json.loads(response["body"])
    assert len(items) == 1
    assert items[0]["projectId"] == "projA"


# --- GET /projects/{id}/entries/{entry_id} ---


def test_get_entry_by_id_returns_200(table):
    create_resp = handler(
        _event("POST", "proj4", body={"serviceType": "Estrutura", "teamSize": 3, "description": "d"}),
        None,
        table=table,
    )
    entry_id = json.loads(create_resp["body"])["id"]

    response = handler(_event("GET", "proj4", entry_id=entry_id), None, table=table)
    assert response["statusCode"] == 200
    item = json.loads(response["body"])
    assert item["id"] == entry_id
    assert "PK" not in item
    assert "SK" not in item


def test_get_entry_not_found_returns_404(table):
    response = handler(_event("GET", "proj5", entry_id="nonexistent-id"), None, table=table)
    assert response["statusCode"] == 404


# --- Method routing ---


def test_unknown_method_returns_405(table):
    event = _event("DELETE", "proj6")
    response = handler(event, None, table=table)
    assert response["statusCode"] == 405
