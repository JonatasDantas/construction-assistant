import json
import os

import boto3
import pytest
from moto import mock_aws

from reports.handler import handler

TABLE_NAME = "test-table"
BUCKET_NAME = "test-bucket"


@pytest.fixture(autouse=True)
def set_env(monkeypatch):
    monkeypatch.setenv("TABLE_NAME", TABLE_NAME)
    monkeypatch.setenv("BUCKET_NAME", BUCKET_NAME)


@pytest.fixture()
def aws_resources():
    with mock_aws():
        ddb = boto3.resource("dynamodb", region_name="us-east-1")
        table = ddb.create_table(
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
        s3 = boto3.client("s3", region_name="us-east-1")
        s3.create_bucket(Bucket=BUCKET_NAME)
        yield table, s3


def _event(project_id=None):
    qs = {"project_id": project_id} if project_id is not None else None
    return {
        "httpMethod": "POST",
        "queryStringParameters": qs,
    }


def _seed_entry(table, project_id, service_type="Estrutura", team_size=3, description="desc"):
    import uuid
    from datetime import datetime, timezone

    ts = datetime.now(timezone.utc).isoformat()
    table.put_item(Item={
        "PK": f"PROJECT#{project_id}",
        "SK": ts,
        "id": str(uuid.uuid4()),
        "projectId": project_id,
        "serviceType": service_type,
        "teamSize": team_size,
        "description": description,
        "formalDescription": f"Formal: {description}",
        "photoKey": "",
        "createdAt": ts,
    })


# --- Validation ---

def test_missing_query_params_returns_400(aws_resources):
    table, s3 = aws_resources
    response = handler({"httpMethod": "POST", "queryStringParameters": None}, None, table=table, s3_client=s3)
    assert response["statusCode"] == 400
    assert "project_id" in json.loads(response["body"])["error"]


def test_empty_project_id_returns_400(aws_resources):
    table, s3 = aws_resources
    response = handler(_event(""), None, table=table, s3_client=s3)
    assert response["statusCode"] == 400


def test_missing_project_id_key_returns_400(aws_resources):
    table, s3 = aws_resources
    response = handler({"httpMethod": "POST", "queryStringParameters": {}}, None, table=table, s3_client=s3)
    assert response["statusCode"] == 400


# --- Happy path: empty project ---

def test_empty_project_returns_200(aws_resources):
    table, s3 = aws_resources
    response = handler(_event("proj-empty"), None, table=table, s3_client=s3)
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert "pdfUrl" in body


# --- Happy path: project with entries ---

def test_returns_presigned_url_for_project_with_entries(aws_resources):
    table, s3 = aws_resources
    _seed_entry(table, "proj1", service_type="Alvenaria", team_size=4, description="Levantamento de paredes")
    _seed_entry(table, "proj1", service_type="Estrutura", team_size=6, description="Concretagem")

    response = handler(_event("proj1"), None, table=table, s3_client=s3)
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert "pdfUrl" in body
    assert isinstance(body["pdfUrl"], str)
    assert len(body["pdfUrl"]) > 0


def test_pdf_uploaded_to_correct_s3_path(aws_resources):
    table, s3 = aws_resources
    _seed_entry(table, "proj2")

    handler(_event("proj2"), None, table=table, s3_client=s3)

    objects = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix="reports/proj2/")
    assert objects["KeyCount"] == 1
    key = objects["Contents"][0]["Key"]
    assert key.startswith("reports/proj2/")
    assert key.endswith(".pdf")


def test_pdf_is_valid_pdf_bytes(aws_resources):
    table, s3 = aws_resources
    _seed_entry(table, "proj3")

    handler(_event("proj3"), None, table=table, s3_client=s3)

    objects = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix="reports/proj3/")
    key = objects["Contents"][0]["Key"]
    obj = s3.get_object(Bucket=BUCKET_NAME, Key=key)
    pdf_bytes = obj["Body"].read()
    assert pdf_bytes[:4] == b"%PDF"


def test_entries_from_other_projects_not_included(aws_resources):
    table, s3 = aws_resources
    _seed_entry(table, "projA")
    _seed_entry(table, "projB")

    response = handler(_event("projA"), None, table=table, s3_client=s3)
    assert response["statusCode"] == 200

    objects = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix="reports/projA/")
    assert objects["KeyCount"] == 1
