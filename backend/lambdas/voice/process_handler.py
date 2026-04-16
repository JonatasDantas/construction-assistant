def handler(event, context):
    # SQS consumer — no HTTP response needed
    for record in event.get("Records", []):
        print(f"Received SQS message: {record['body']}")
