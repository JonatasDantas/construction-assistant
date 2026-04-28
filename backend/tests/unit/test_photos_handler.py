import json
import os

import boto3
import pytest
from moto import mock_aws

from photos.handler import handler

BUCKET_NAME = "test-bucket"


@pytest.fixture(autouse=True)
def set_env(monkeypatch):
    monkeypatch.setenv("BUCKET_NAME", BUCKET_NAME)


@pytest.fixture()
def s3_client():
    with mock_aws():
        client = boto3.client("s3", region_name="us-east-1")
        client.create_bucket(Bucket=BUCKET_NAME)
        yield client


def _event(body=None):
    return {
        "httpMethod": "POST",
        "pathParameters": None,
        "body": json.dumps(body) if body else None,
    }


def test_returns_upload_url_and_key(s3_client):
    body = {"project_id": "proj1", "log_id": "log1", "filename": "photo.jpg", "content_type": "image/jpeg"}
    response = handler(_event(body), None, s3_client=s3_client)

    assert response["statusCode"] == 200
    result = json.loads(response["body"])
    assert "uploadUrl" in result
    assert result["key"] == "photos/proj1/log1/photo.jpg"
    assert "proj1" in result["uploadUrl"]
    assert "log1" in result["uploadUrl"]


def test_s3_key_follows_path_format(s3_client):
    body = {"project_id": "proj-abc", "log_id": "log-xyz", "filename": "site.png", "content_type": "image/png"}
    response = handler(_event(body), None, s3_client=s3_client)

    assert response["statusCode"] == 200
    result = json.loads(response["body"])
    assert result["key"] == "photos/proj-abc/log-xyz/site.png"


def test_content_type_defaults_when_not_provided(s3_client):
    body = {"project_id": "proj1", "log_id": "log1", "filename": "photo.jpg"}
    response = handler(_event(body), None, s3_client=s3_client)

    assert response["statusCode"] == 200
    result = json.loads(response["body"])
    assert "uploadUrl" in result
    assert result["key"] == "photos/proj1/log1/photo.jpg"


def test_missing_project_id_returns_400(s3_client):
    body = {"log_id": "log1", "filename": "photo.jpg"}
    response = handler(_event(body), None, s3_client=s3_client)

    assert response["statusCode"] == 400
    assert "project_id" in json.loads(response["body"])["error"]


def test_missing_log_id_returns_400(s3_client):
    body = {"project_id": "proj1", "filename": "photo.jpg"}
    response = handler(_event(body), None, s3_client=s3_client)

    assert response["statusCode"] == 400


def test_missing_filename_returns_400(s3_client):
    body = {"project_id": "proj1", "log_id": "log1"}
    response = handler(_event(body), None, s3_client=s3_client)

    assert response["statusCode"] == 400


def test_invalid_json_returns_400(s3_client):
    event = _event()
    event["body"] = "{bad json"
    response = handler(event, None, s3_client=s3_client)

    assert response["statusCode"] == 400
    assert "invalid JSON" in json.loads(response["body"])["error"]


def test_empty_body_returns_400(s3_client):
    response = handler(_event(), None, s3_client=s3_client)

    assert response["statusCode"] == 400
