import * as FileSystem from 'expo-file-system';

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB — Whisper limit

export interface VoiceSubmitResponse {
  serviceType: string;
  teamSize: number;
  description: string;
  formalDescription: string;
}

export async function submitVoiceRecording(
  audioUri: string,
  contentType: string = 'audio/m4a',
): Promise<VoiceSubmitResponse> {
  const info = await FileSystem.getInfoAsync(audioUri);
  if (info.exists && 'size' in info && info.size > MAX_AUDIO_BYTES) {
    throw new Error('Audio file exceeds the 25 MB limit required by the transcription service.');
  }

  const audio_base64 = await FileSystem.readAsStringAsync(audioUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const response = await fetch(`${apiUrl}/voice/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio_base64, content_type: contentType }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<VoiceSubmitResponse>;
}
