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
        user_pool_client = cognito.UserPoolClient(
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
            "USER_POOL_CLIENT_ID": user_pool_client.user_pool_client_id,
        }

        def make_lambda(id: str, handler_path: str, timeout: Duration = Duration.seconds(30)) -> lambda_.Function:
            return lambda_.Function(
                self, id,
                runtime=lambda_.Runtime.PYTHON_3_11,
                code=lambda_.Code.from_asset("lambdas"),
                handler=handler_path,
                environment=common_env,
                timeout=timeout,
            )

        projects_fn = make_lambda("ProjectsFn", "projects.handler.handler")
        entries_fn = make_lambda("EntriesFn", "entries.handler.handler")
        photos_fn = make_lambda("PhotosFn", "photos.handler.handler")
        voice_submit_fn = make_lambda("VoiceSubmitFn", "voice.submit_handler.handler")
        # Timeout must match queue visibility_timeout to prevent re-delivery during processing
        voice_process_fn = make_lambda("VoiceProcessFn", "voice.process_handler.handler", timeout=Duration.seconds(300))

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

        entry_r = entries_r.add_resource("{entry_id}")
        entry_r.add_method("GET", entries_int,
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
