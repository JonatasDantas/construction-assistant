import { API_BASE_URL, ENDPOINTS } from '@/constants/api';

export interface VoiceProcessResult {
  serviceType: string;
  teamSize: number;
  description: string;
  formalDescription: string;
}

async function readAsBase64(uri: string): Promise<{ base64: string; contentType: string }> {
  const response = await fetch(uri);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const separatorIndex = dataUrl.indexOf(',');
      const header = dataUrl.slice(0, separatorIndex);
      const base64 = dataUrl.slice(separatorIndex + 1);
      const match = header.match(/data:([^;]+)/);
      const contentType = match ? match[1] : 'audio/m4a';
      resolve({ base64, contentType });
    };
    reader.onerror = () => reject(new Error('Failed to read audio file'));
    reader.readAsDataURL(blob);
  });
}

export async function processVoice(uri: string): Promise<VoiceProcessResult> {
  const { base64, contentType } = await readAsBase64(uri);

  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.voiceSubmit}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio_base64: base64, content_type: contentType }),
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body.error) message = body.error;
    } catch {
      // ignore parse errors — use the default message
    }
    throw new Error(message);
  }

  return response.json() as Promise<VoiceProcessResult>;
}
