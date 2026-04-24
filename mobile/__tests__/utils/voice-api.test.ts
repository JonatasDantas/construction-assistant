import { submitVoiceRecording, VoiceSubmitResponse } from '@/utils/voice-api';

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  EncodingType: { Base64: 'base64' },
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
}));

import * as FileSystem from 'expo-file-system';

const mockGetInfoAsync = FileSystem.getInfoAsync as jest.Mock;
const mockReadAsStringAsync = FileSystem.readAsStringAsync as jest.Mock;

const AUDIO_URI = 'file:///tmp/recording.m4a';
const BASE64_AUDIO = 'SGVsbG8gV29ybGQ=';
const API_URL = 'https://api.example.com';

const MOCK_RESPONSE: VoiceSubmitResponse = {
  serviceType: 'Concretagem',
  teamSize: 8,
  description: 'Concretagem da laje hoje com 8 pessoas.',
  formalDescription: 'Concretagem da laje do 3º pavimento concluída conforme cronograma.',
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_API_URL = API_URL;

  mockGetInfoAsync.mockResolvedValue({ exists: true, size: 1024 });
  mockReadAsStringAsync.mockResolvedValue(BASE64_AUDIO);

  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(MOCK_RESPONSE),
    text: () => Promise.resolve(JSON.stringify(MOCK_RESPONSE)),
  }) as jest.Mock;
});

describe('submitVoiceRecording', () => {
  it('returns correct VoiceSubmitResponse on successful API call', async () => {
    const result = await submitVoiceRecording(AUDIO_URI);
    expect(result).toEqual(MOCK_RESPONSE);
  });

  it('reads audio file with Base64 encoding', async () => {
    await submitVoiceRecording(AUDIO_URI);
    expect(mockReadAsStringAsync).toHaveBeenCalledWith(AUDIO_URI, {
      encoding: 'base64',
    });
  });

  it('sends audio_base64 and content_type in POST body', async () => {
    await submitVoiceRecording(AUDIO_URI, 'audio/wav');
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.audio_base64).toBe(BASE64_AUDIO);
    expect(body.content_type).toBe('audio/wav');
  });

  it('defaults content_type to audio/m4a when not provided', async () => {
    await submitVoiceRecording(AUDIO_URI);
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.content_type).toBe('audio/m4a');
  });

  it('throws descriptive error when audio exceeds 25 MB', async () => {
    const oversizeBytes = 26 * 1024 * 1024;
    mockGetInfoAsync.mockResolvedValue({ exists: true, size: oversizeBytes });
    await expect(submitVoiceRecording(AUDIO_URI)).rejects.toThrow('25 MB');
  });

  it('throws on non-OK HTTP response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    });
    await expect(submitVoiceRecording(AUDIO_URI)).rejects.toThrow('Internal Server Error');
  });

  it('throws on network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network request failed'));
    await expect(submitVoiceRecording(AUDIO_URI)).rejects.toThrow('Network request failed');
  });

  it('includes Content-Type: application/json header', async () => {
    await submitVoiceRecording(AUDIO_URI);
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers['Content-Type']).toBe('application/json');
  });
});
