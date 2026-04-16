from shared.response import ok


def handler(event, context):
    return ok({"message": "not implemented"}, status_code=501)
