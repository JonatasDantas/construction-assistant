import json
from shared.response import ok, error


def test_ok_default_status():
    result = ok({"key": "value"})
    assert result["statusCode"] == 200
    assert json.loads(result["body"]) == {"key": "value"}
    assert result["headers"]["Content-Type"] == "application/json"


def test_ok_custom_status():
    result = ok({"id": "1"}, status_code=201)
    assert result["statusCode"] == 201


def test_error_default_status():
    result = error("not found")
    assert result["statusCode"] == 400
    assert json.loads(result["body"]) == {"error": "not found"}


def test_error_custom_status():
    result = error("server error", status_code=500)
    assert result["statusCode"] == 500
