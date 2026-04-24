import { API_BASE_URL } from './api-config';

export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
}

export async function requestPresignedUrl(
  projectId: string,
  logId: string,
  filename: string,
  contentType: string,
): Promise<PresignedUrlResponse> {
  const response = await fetch(`${API_BASE_URL}/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId, log_id: logId, filename, content_type: contentType }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to get presigned URL: ${response.status} ${text}`);
  }

  return response.json() as Promise<PresignedUrlResponse>;
}

export async function uploadToS3(
  uploadUrl: string,
  fileUri: string,
  contentType: string,
): Promise<void> {
  const response = await fetch(fileUri);
  const blob = await response.blob();

  const upload = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });

  if (!upload.ok) {
    throw new Error(`S3 upload failed: ${upload.status}`);
  }
}
