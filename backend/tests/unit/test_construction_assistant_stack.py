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
