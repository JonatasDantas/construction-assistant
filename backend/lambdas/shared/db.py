import os

import boto3


def get_table(resource=None):
    dynamodb = resource or boto3.resource("dynamodb")
    return dynamodb.Table(os.environ["TABLE_NAME"])
