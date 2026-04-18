import io
import os
from datetime import datetime, timezone

import boto3
from boto3.dynamodb.conditions import Key

from shared.db import get_table
from shared.response import error, ok

PRESIGNED_URL_EXPIRY = 3600  # 1 hour


def handler(event, context, table=None, s3_client=None):
    if table is None:
        table = get_table()
    if s3_client is None:
        s3_client = boto3.client("s3")

    query_params = event.get("queryStringParameters") or {}
    project_id = query_params.get("project_id", "").strip()
    if not project_id:
        return error("project_id is required", 400)

    bucket_name = os.environ["BUCKET_NAME"]

    response = table.query(
        KeyConditionExpression=Key("PK").eq(f"PROJECT#{project_id}"),
        ScanIndexForward=True,
    )
    entries = response.get("Items", [])

    pdf_bytes = _generate_pdf(project_id, entries)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    s3_key = f"reports/{project_id}/{timestamp}.pdf"

    s3_client.put_object(
        Bucket=bucket_name,
        Key=s3_key,
        Body=pdf_bytes,
        ContentType="application/pdf",
    )

    presigned_url = s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket_name, "Key": s3_key},
        ExpiresIn=PRESIGNED_URL_EXPIRY,
    )

    return ok({"pdfUrl": presigned_url})


def _generate_pdf(project_id, entries):
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReportTitle", parent=styles["Heading1"], fontSize=18, spaceAfter=6,
    )
    meta_style = ParagraphStyle(
        "ReportMeta", parent=styles["Normal"], fontSize=10, textColor=colors.grey, spaceAfter=4,
    )
    section_style = ParagraphStyle(
        "EntrySection", parent=styles["Heading3"], fontSize=11, spaceBefore=10, spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "EntryBody", parent=styles["Normal"], fontSize=9, leading=14,
    )
    note_style = ParagraphStyle(
        "EntryNote", parent=styles["Normal"], fontSize=9, textColor=colors.grey,
    )

    story = []

    story.append(Paragraph("Construction Log Report", title_style))
    story.append(Paragraph(f"Project: {project_id}", meta_style))

    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    if entries:
        sorted_by_date = sorted(entries, key=lambda e: e.get("createdAt", ""))
        date_from = (sorted_by_date[0].get("createdAt", "") or "")[:10] or "N/A"
        date_to = (sorted_by_date[-1].get("createdAt", "") or "")[:10] or "N/A"
        story.append(Paragraph(f"Period: {date_from} to {date_to}", meta_style))

    story.append(Paragraph(f"Generated: {generated_at}", meta_style))
    story.append(Spacer(1, 0.5 * cm))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.grey))
    story.append(Spacer(1, 0.5 * cm))

    if not entries:
        story.append(Paragraph("No log entries found for this project.", body_style))
    else:
        sorted_entries = sorted(entries, key=lambda e: e.get("createdAt", ""))
        story.append(Paragraph(f"Total Entries: {len(sorted_entries)}", meta_style))
        story.append(Spacer(1, 0.3 * cm))

        for i, entry in enumerate(sorted_entries, 1):
            created_raw = entry.get("createdAt", "")
            date_str = created_raw[:10] if created_raw else "N/A"
            service_type = entry.get("serviceType", "N/A")
            team_size = entry.get("teamSize", "N/A")
            formal_desc = entry.get("formalDescription") or entry.get("description") or "N/A"
            photo_key = entry.get("photoKey", "")

            story.append(Paragraph(f"Entry {i} - {date_str}", section_style))
            story.append(Paragraph(f"<b>Service Type:</b> {service_type}", body_style))
            story.append(Paragraph(f"<b>Team Size:</b> {team_size}", body_style))
            story.append(Paragraph(f"<b>Description:</b> {formal_desc}", body_style))
            if photo_key:
                story.append(Paragraph(f"<b>Photo:</b> {photo_key}", note_style))
            story.append(Spacer(1, 0.2 * cm))
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey))

    doc.build(story)
    return buffer.getvalue()
