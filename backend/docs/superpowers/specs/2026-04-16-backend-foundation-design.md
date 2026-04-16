# Backend Foundation Design

**Date:** 2026-04-16
**Project:** Construction Assistant

## Overview

Wire the `backend/` folder from bare CDK scaffold into a development-ready AWS CDK Python project. The backend serves the Construction Assistant mobile app (Expo/React Native) with REST APIs, async voice processing, photo storage, and user auth.

## Architecture

Single `BackendStack` (CDK Python) containing all resources. No multi-stack split at this stage.

**Core services:**
- **Amazon Cognito** — user pool for auth, issues JWTs consumed by API Gateway
- **API Gateway REST API** — Cognito JWT authorizer on all protected routes
- **AWS Lambda** — handlers grouped by domain, Python 3.11
- **DynamoDB** — single table design
- **S3** — photo storage, accessed via presigned PUT URLs
- **SQS + Lambda** — async voice AI processing pipeline

## Folder Structure

```
backend/
├── app.py                                         # CDK entrypoint
├── backend/
│   ├── __init__.py
│   └── construction_assistant_stack.py            # single BackendStack
├── lambdas/
│   ├── shared/
│   │   ├── db.py                                  # DynamoDB client helper
│   │   └── response.py                            # standard HTTP response builder
│   ├── projects/
│   │   └── handler.py                             # GET/POST /projects, GET/PUT/DELETE /projects/{id}
│   ├── entries/
│   │   └── handler.py                             # GET/POST /projects/{id}/entries
│   ├── photos/
│   │   └── handler.py                             # POST /photos/upload-url → presigned S3 URL
│   └── voice/
│       ├── submit_handler.py                      # POST /voice/submit → enqueue to SQS
│       └── process_handler.py                     # SQS consumer → AI pipeline, updates entry
├── tests/
│   └── unit/
│       └── test_construction_assistant_stack.py
├── .env.example
├── requirements.txt
└── requirements-dev.txt
```

## API Routes

All routes use Cognito JWT authorizer unless noted.

```
POST   /auth/signup              # Cognito native — no Lambda, no authorizer
POST   /auth/login               # Cognito native — no Lambda, no authorizer

GET    /projects                 # list user's projects
POST   /projects                 # create project
GET    /projects/{id}            # get project
PUT    /projects/{id}            # update project
DELETE /projects/{id}            # delete project

GET    /projects/{id}/entries    # list entries for a project
POST   /projects/{id}/entries    # create entry

POST   /photos/upload-url        # return presigned S3 PUT URL for direct upload
POST   /voice/submit             # accept voice note metadata → enqueue to SQS
```

Auth flows (signup/login) are handled natively by Cognito — API Gateway proxies directly, no Lambda needed.

## Data Model (DynamoDB Single Table)

```
PK                  SK                   Attributes
─────────────────────────────────────────────────────────────────────────────
USER#<userId>       PROJECT#<projectId>  name, status, createdAt
USER#<userId>       ENTRY#<entryId>      projectId, type, content, photoUrls,
                                         audioUrl, transcript, aiSummary,
                                         processingStatus, createdAt
```

**Entry `type`:** `text | photo | voice`

Voice entries carry `audioUrl`, `transcript`, `aiSummary`, and `processingStatus` (`pending | done | failed`) directly on the entry record. The SQS processor updates the entry in-place when AI processing completes. No separate voice entity.

## Voice Processing Flow

1. Mobile uploads audio file directly to S3 (via presigned URL from `/photos/upload-url`)
2. Mobile calls `POST /voice/submit` with `{ entryId, audioUrl }`
3. `submit_handler` creates the entry in DynamoDB with `processingStatus: pending` and enqueues a message to SQS
4. `process_handler` consumes from SQS, runs AI pipeline (transcription + summary), updates entry with `transcript`, `aiSummary`, `processingStatus: done`
5. Mobile polls or checks entry status on next load

## Local Development

- **Deploy to AWS sandbox account:** `cdk deploy --profile dev`
- **No local Lambda emulation** — iterate against a real dev account
- **Unit tests:** `pytest` with `moto` for mocking AWS calls; Lambda handlers accept boto3 clients as parameters (defaulting to real clients in production) for easy test injection
- **Environment vars:** injected by CDK at deploy time; `.env.example` documents all required vars

## Dependencies

**`requirements.txt`**
```
aws-cdk-lib>=2.241.0,<3.0.0
constructs>=10.5.0,<11.0.0
```

**`requirements-dev.txt`**
```
pytest
pytest-mock
moto[dynamodb,s3,sqs]
```

## Environment Variables (`.env.example`)

```
TABLE_NAME=
BUCKET_NAME=
QUEUE_URL=
USER_POOL_ID=
USER_POOL_CLIENT_ID=
```
