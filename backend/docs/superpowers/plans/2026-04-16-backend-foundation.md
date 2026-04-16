# Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the `backend/` folder from a bare CDK init into a development-ready project with proper structure, stub Lambda handlers, and all AWS resources defined in the CDK stack.

**Architecture:** Single `ConstructionAssistantStack` (CDK Python) defining Cognito, DynamoDB, S3, SQS, API Gateway, and Lambda functions. Lambda handlers are stubs — they return `200 not implemented` — wired up so the infrastructure deploys and routes exist. Business logic is left for later feature work.

**Tech Stack:** Python 3.11, AWS CDK v2 (Python), API Gateway REST, Cognito User Pools, DynamoDB (single table), S3, SQS, pytest + moto for unit tests.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `backend/construction_assistant_stack.py` | Create | Rename from `backend_stack.py`; all AWS resources defined here |
| `backend/backend_stack.py` | Delete | Replaced by above |
| `app.py` | Modify | Import new stack class |
| `lambdas/shared/__init__.py` | Create | Package marker |
| `lambdas/shared/response.py` | Create | HTTP response builder helpers (`ok`, `error`) |
| `lambdas/shared/db.py` | Create | DynamoDB resource factory |
| `lambdas/projects/__init__.py` | Create | Package marker |
| `lambdas/projects/handler.py` | Create | Stub for all `/projects` routes |
| `lambdas/entries/__init__.py` | Create | Package marker |
| `lambdas/entries/handler.py` | Create | Stub for `/projects/{id}/entries` routes |
| `lambdas/photos/__init__.py` | Create | Package marker |
| `lambdas/photos/handler.py` | Create | Stub for `POST /photos/upload-url` |
| `lambdas/voice/__init__.py` | Create | Package marker |
| `lambdas/voice/submit_handler.py` | Create | Stub for `POST /voice/submit` |
| `lambdas/voice/process_handler.py` | Create | Stub SQS consumer |
| `tests/conftest.py` | Create | Add `lambdas/` to `sys.path` for imports |
| `tests/unit/test_construction_assistant_stack.py` | Modify | CDK assertions for all resources |
| `tests/unit/test_shared_response.py` | Create | Unit tests for response helpers |
| `.env.example` | Create | Documents required environment variables |
| `requirements-dev.txt` | Modify | Add pytest, pytest-mock, moto |

---

## Task 1: Rename CDK stack class and update entrypoint

**Files:**
- Create: `backend/construction_assistant_stack.py`
- Delete: `backend/backend_stack.py`
- Modify: `app.py`

- [ ] **Step 1: Create the new stack file**

`backend/construction_assistant_stack.py`:
```python
from aws_cdk import Stack
from constructs import Construct


class ConstructionAssistantStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
```

- [ ] **Step 2: Update `app.py`**

```python
#!/usr/bin/env python3
import aws_cdk as cdk

from backend.construction_assistant_stack import ConstructionAssistantStack


app = cdk.App()
ConstructionAssistantStack(app, "ConstructionAssistantStack")
app.synth()
```

- [ ] **Step 3: Delete the old stack file**

```bash
rm backend/backend_stack.py
```

- [ ] **Step 4: Verify synth**

```bash
cd backend && source .venv/bin/activate && cdk synth
```

Expected: CloudFormation template printed with no errors, empty resources section.

- [ ] **Step 5: Commit**

```bash
git add backend/construction_assistant_stack.py backend/backend_stack.py app.py
git commit -m "refactor: rename stack to ConstructionAssistantStack"
```

---

## Task 2: Update dev dependencies and create `.env.example`

**Files:**
- Modify: `requirements-dev.txt`
- Create: `.env.example`

- [ ] **Step 1: Update `requirements-dev.txt`**

```
pytest
pytest-mock
moto[dynamodb,s3,sqs,cognitoidentityprovider]
boto3
```

- [ ] **Step 2: Install updated deps**

```bash
cd backend && source .venv/bin/activate && pip install -r requirements-dev.txt
```

Expected: packages install without errors.

- [ ] **Step 3: Create `.env.example`**

```
TABLE_NAME=
BUCKET_NAME=
QUEUE_URL=
USER_POOL_ID=
USER_POOL_CLIENT_ID=
```

- [ ] **Step 4: Commit**

```bash
git add requirements-dev.txt .env.example
git commit -m "chore: add dev dependencies and env example"
```

---

## Task 3: Create shared Lambda utilities with tests

**Files:**
- Create: `lambdas/shared/__init__.py`
- Create: `lambdas/shared/response.py`
- Create: `lambdas/shared/db.py`
- Create: `tests/conftest.py`
- Create: `tests/unit/test_shared_response.py`

- [ ] **Step 1: Add `lambdas/` to test path via conftest**

`tests/conftest.py`:
```python
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "lambdas"))
```

- [ ] **Step 2: Write failing tests for response helpers**

`tests/unit/test_shared_response.py`:
```python
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
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
cd backend && source .venv/bin/activate && pytest tests/unit/test_shared_response.py -v
```

Expected: `ModuleNotFoundError: No module named 'shared'`

- [ ] **Step 4: Create `lambdas/shared/__init__.py`**

```python
```
(empty file)

- [ ] **Step 5: Create `lambdas/shared/response.py`**

```python
import json


def ok(body, status_code=200):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }


def error(message, status_code=400):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"error": message}),
    }
```

- [ ] **Step 6: Create `lambdas/shared/db.py`**

```python
import boto3
import os


def get_table(resource=None):
    dynamodb = resource or boto3.resource("dynamodb")
    return dynamodb.Table(os.environ["TABLE_NAME"])
```

- [ ] **Step 7: Run tests to confirm they pass**

```bash
cd backend && source .venv/bin/activate && pytest tests/unit/test_shared_response.py -v
```

Expected:
```
PASSED tests/unit/test_shared_response.py::test_ok_default_status
PASSED tests/unit/test_shared_response.py::test_ok_custom_status
PASSED tests/unit/test_shared_response.py::test_error_default_status
PASSED tests/unit/test_shared_response.py::test_error_custom_status
```

- [ ] **Step 8: Commit**

```bash
git add lambdas/ tests/conftest.py tests/unit/test_shared_response.py
git commit -m "feat: add shared Lambda utilities with tests"
```

---

## Task 4: Create stub Lambda handlers

**Files:**
- Create: `lambdas/projects/__init__.py`, `lambdas/projects/handler.py`
- Create: `lambdas/entries/__init__.py`, `lambdas/entries/handler.py`
- Create: `lambdas/photos/__init__.py`, `lambdas/photos/handler.py`
- Create: `lambdas/voice/__init__.py`, `lambdas/voice/submit_handler.py`, `lambdas/voice/process_handler.py`

- [ ] **Step 1: Create projects stub**

`lambdas/projects/__init__.py`: (empty)

`lambdas/projects/handler.py`:
```python
from shared.response import ok


def handler(event, context):
    return ok({"message": "not implemented"}, status_code=501)
```

- [ ] **Step 2: Create entries stub**

`lambdas/entries/__init__.py`: (empty)

`lambdas/entries/handler.py`:
```python
from shared.response import ok


def handler(event, context):
    return ok({"message": "not implemented"}, status_code=501)
```

- [ ] **Step 3: Create photos stub**

`lambdas/photos/__init__.py`: (empty)

`lambdas/photos/handler.py`:
```python
from shared.response import ok


def handler(event, context):
    return ok({"message": "not implemented"}, status_code=501)
```

- [ ] **Step 4: Create voice stubs**

`lambdas/voice/__init__.py`: (empty)

`lambdas/voice/submit_handler.py`:
```python
from shared.response import ok


def handler(event, context):
    return ok({"message": "not implemented"}, status_code=501)
```

`lambdas/voice/process_handler.py`:
```python
def handler(event, context):
    # SQS consumer — no HTTP response needed
    for record in event.get("Records", []):
        print(f"Received SQS message: {record['body']}")
```

- [ ] **Step 5: Commit**

```bash
git add lambdas/
git commit -m "feat: add stub Lambda handlers for all routes"
```

---

## Task 5: Wire CDK stack with all AWS resources

**Files:**
- Modify: `backend/construction_assistant_stack.py`

- [ ] **Step 1: Write failing CDK assertion test**

`tests/unit/test_construction_assistant_stack.py`:
```python
import aws_cdk as cdk
from aws_cdk import assertions
from backend.construction_assistant_stack import ConstructionAssistantStack


def make_template():
    app = cdk.App()
    stack = ConstructionAssistantStack(app, "TestStack")
    return assertions.Template.from_stack(stack)


def test_cognito_user_pool():
    make_template().resource_count_is("AWS::Cognito::UserPool", 1)


def test_dynamodb_table():
    make_template().resource_count_is("AWS::DynamoDB::Table", 1)


def test_s3_bucket():
    make_template().resource_count_is("AWS::S3::Bucket", 1)


def test_sqs_queue():
    # 1 voice queue + 1 dead-letter is acceptable; assert at least 1
    template = make_template()
    queues = template.find_resources("AWS::SQS::Queue")
    assert len(queues) >= 1


def test_api_gateway():
    make_template().resource_count_is("AWS::ApiGateway::RestApi", 1)


def test_lambda_functions():
    template = make_template()
    fns = template.find_resources("AWS::Lambda::Function")
    # projects, entries, photos, voice-submit, voice-process (+ CDK custom resource Lambdas)
    assert len(fns) >= 5
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd backend && source .venv/bin/activate && pytest tests/unit/test_construction_assistant_stack.py -v
```

Expected: all 6 tests FAIL (empty stack has no resources).

- [ ] **Step 3: Implement the stack**

`backend/construction_assistant_stack.py`:
```python
from aws_cdk import (
    Duration,
    RemovalPolicy,
    Stack,
    aws_apigateway as apigw,
    aws_cognito as cognito,
    aws_dynamodb as dynamodb,
    aws_lambda as lambda_,
    aws_lambda_event_sources as event_sources,
    aws_s3 as s3,
    aws_sqs as sqs,
)
from constructs import Construct


class ConstructionAssistantStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # --- Auth ---
        user_pool = cognito.UserPool(
            self, "UserPool",
            user_pool_name="construction-assistant-users",
            self_sign_up_enabled=True,
            sign_in_aliases=cognito.SignInAliases(email=True),
            auto_verify=cognito.AutoVerifiedAttrs(email=True),
            removal_policy=RemovalPolicy.DESTROY,
        )
        cognito.UserPoolClient(
            self, "UserPoolClient",
            user_pool=user_pool,
            auth_flows=cognito.AuthFlow(user_password=True, user_srp=True),
        )

        # --- Storage ---
        table = dynamodb.Table(
            self, "Table",
            partition_key=dynamodb.Attribute(name="PK", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="SK", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
        )

        bucket = s3.Bucket(
            self, "MediaBucket",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            cors=[s3.CorsRule(
                allowed_methods=[s3.HttpMethods.PUT, s3.HttpMethods.GET],
                allowed_origins=["*"],
                allowed_headers=["*"],
            )],
        )

        # --- Queue ---
        voice_queue = sqs.Queue(
            self, "VoiceQueue",
            visibility_timeout=Duration.seconds(300),
        )

        # --- Lambda helpers ---
        common_env = {
            "TABLE_NAME": table.table_name,
            "BUCKET_NAME": bucket.bucket_name,
            "QUEUE_URL": voice_queue.queue_url,
            "USER_POOL_ID": user_pool.user_pool_id,
        }

        def make_lambda(id: str, handler_path: str) -> lambda_.Function:
            return lambda_.Function(
                self, id,
                runtime=lambda_.Runtime.PYTHON_3_11,
                code=lambda_.Code.from_asset("lambdas"),
                handler=handler_path,
                environment=common_env,
            )

        projects_fn = make_lambda("ProjectsFn", "projects.handler.handler")
        entries_fn = make_lambda("EntriesFn", "entries.handler.handler")
        photos_fn = make_lambda("PhotosFn", "photos.handler.handler")
        voice_submit_fn = make_lambda("VoiceSubmitFn", "voice.submit_handler.handler")
        voice_process_fn = make_lambda("VoiceProcessFn", "voice.process_handler.handler")

        # --- Permissions ---
        for fn in [projects_fn, entries_fn, photos_fn, voice_submit_fn, voice_process_fn]:
            table.grant_read_write_data(fn)

        bucket.grant_put(photos_fn)
        bucket.grant_put(voice_submit_fn)
        voice_queue.grant_send_messages(voice_submit_fn)
        voice_process_fn.add_event_source(
            event_sources.SqsEventSource(voice_queue, batch_size=1)
        )

        # --- API Gateway ---
        api = apigw.RestApi(
            self, "Api",
            rest_api_name="construction-assistant-api",
            default_cors_preflight_options=apigw.CorsOptions(
                allow_origins=apigw.Cors.ALL_ORIGINS,
                allow_methods=apigw.Cors.ALL_METHODS,
            ),
        )

        authorizer = apigw.CognitoUserPoolsAuthorizer(
            self, "Authorizer",
            cognito_user_pools=[user_pool],
        )

        projects_int = apigw.LambdaIntegration(projects_fn)
        entries_int = apigw.LambdaIntegration(entries_fn)
        photos_int = apigw.LambdaIntegration(photos_fn)
        voice_submit_int = apigw.LambdaIntegration(voice_submit_fn)

        # /projects
        projects_r = api.root.add_resource("projects")
        projects_r.add_method("GET", projects_int,
            authorizer=authorizer,
            authorization_type=apigw.AuthorizationType.COGNITO,
        )
        projects_r.add_method("POST", projects_int,
            authorizer=authorizer,
            authorization_type=apigw.AuthorizationType.COGNITO,
        )

        project_r = projects_r.add_resource("{id}")
        project_r.add_method("GET", projects_int,
            authorizer=authorizer,
            authorization_type=apigw.AuthorizationType.COGNITO,
        )
        project_r.add_method("PUT", projects_int,
            authorizer=authorizer,
            authorization_type=apigw.AuthorizationType.COGNITO,
        )
        project_r.add_method("DELETE", projects_int,
            authorizer=authorizer,
            authorization_type=apigw.AuthorizationType.COGNITO,
        )

        # /projects/{id}/entries
        entries_r = project_r.add_resource("entries")
        entries_r.add_method("GET", entries_int,
            authorizer=authorizer,
            authorization_type=apigw.AuthorizationType.COGNITO,
        )
        entries_r.add_method("POST", entries_int,
            authorizer=authorizer,
            authorization_type=apigw.AuthorizationType.COGNITO,
        )

        # /photos/upload-url
        photos_r = api.root.add_resource("photos")
        upload_url_r = photos_r.add_resource("upload-url")
        upload_url_r.add_method("POST", photos_int,
            authorizer=authorizer,
            authorization_type=apigw.AuthorizationType.COGNITO,
        )

        # /voice/submit
        voice_r = api.root.add_resource("voice")
        submit_r = voice_r.add_resource("submit")
        submit_r.add_method("POST", voice_submit_int,
            authorizer=authorizer,
            authorization_type=apigw.AuthorizationType.COGNITO,
        )
```

- [ ] **Step 4: Run CDK assertion tests**

```bash
cd backend && source .venv/bin/activate && pytest tests/unit/test_construction_assistant_stack.py -v
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Run full synth to verify CloudFormation output**

```bash
cd backend && source .venv/bin/activate && cdk synth
```

Expected: CloudFormation template printed with Cognito, DynamoDB, S3, SQS, Lambda, API Gateway resources. No errors.

- [ ] **Step 6: Commit**

```bash
git add backend/construction_assistant_stack.py tests/unit/test_construction_assistant_stack.py
git commit -m "feat: wire CDK stack with all AWS resources"
```

---

## Task 6: Final check — run all tests

- [ ] **Step 1: Run the full test suite**

```bash
cd backend && source .venv/bin/activate && pytest tests/ -v
```

Expected: all tests PASS, no errors.

- [ ] **Step 2: Confirm folder structure matches spec**

```bash
find lambdas tests backend -type f | sort
```

Expected output includes:
```
backend/__init__.py
backend/construction_assistant_stack.py
lambdas/entries/__init__.py
lambdas/entries/handler.py
lambdas/photos/__init__.py
lambdas/photos/handler.py
lambdas/projects/__init__.py
lambdas/projects/handler.py
lambdas/shared/__init__.py
lambdas/shared/db.py
lambdas/shared/response.py
lambdas/voice/__init__.py
lambdas/voice/process_handler.py
lambdas/voice/submit_handler.py
tests/conftest.py
tests/unit/test_construction_assistant_stack.py
tests/unit/test_shared_response.py
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "chore: verify backend scaffold complete"
```
