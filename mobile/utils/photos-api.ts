import * as FileSystem from 'expo-file-system';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
}

export async function getPresignedUrl(
  projectId: string,
  logId: string,
  filename: string,
  contentType: string,
): Promise<PresignedUrlResponse> {
  const response = await fetch(`${API_URL}/photos/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId, log_id: logId, filename, content_type: contentType }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(body || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<PresignedUrlResponse>;
}

export async function uploadImageToS3(
  uploadUrl: string,
  imageUri: string,
  contentType: string,
): Promise<void> {
  const result = await FileSystem.uploadAsync(uploadUrl, imageUri, {
    httpMethod: 'PUT',
    headers: { 'Content-Type': contentType },
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Upload failed with status ${result.status}`);
  }
}
