import { submitVoiceRecording } from '../../utils/voice-api';

jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));

import * as FileSystem from 'expo-file-system';

const mockGetInfoAsync = FileSystem.getInfoAsync as jest.Mock;
const mockReadAsStringAsync = FileSystem.readAsStringAsync as jest.Mock;

const MOCK_URI = 'file:///tmp/recording.m4a';
const MOCK_BASE64 = 'SGVsbG8gV29ybGQ=';
const MOCK_RESPONSE = {
  serviceType: 'Concretagem',
  teamSize: 8,
  description: 'Audio description',
  formalDescription: 'Formal description of the work performed.',
};

beforeEach(() => {
  jest.clearAllMocks();

  mockGetInfoAsync.mockResolvedValue({ exists: true, size: 1024 });
  mockReadAsStringAsync.mockResolvedValue(MOCK_BASE64);

  (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => MOCK_RESPONSE,
    text: async () => JSON.stringify(MOCK_RESPONSE),
  });

  process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';
});

describe('submitVoiceRecording', () => {
  it('returns correct VoiceSubmitResponse on successful API call', async () => {
    const result = await submitVoiceRecording(MOCK_URI);
    expect(result).toEqual(MOCK_RESPONSE);
  });

  it('reads audio file with Base64 encoding', async () => {
    await submitVoiceRecording(MOCK_URI);
    expect(mockReadAsStringAsync).toHaveBeenCalledWith(MOCK_URI, {
      encoding: 'base64',
    });
  });

  it('sends audio_base64 and content_type in POST body', async () => {
    await submitVoiceRecording(MOCK_URI, 'audio/wav');
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body).toEqual({ audio_base64: MOCK_BASE64, content_type: 'audio/wav' });
  });

  it('defaults content_type to audio/m4a when not provided', async () => {
    await submitVoiceRecording(MOCK_URI);
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.content_type).toBe('audio/m4a');
  });

  it('throws descriptive error when audio exceeds 25 MB', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true, size: 26 * 1024 * 1024 });
    await expect(submitVoiceRecording(MOCK_URI)).rejects.toThrow('25 MB');
  });

  it('throws on non-OK HTTP response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal server error',
    });
    await expect(submitVoiceRecording(MOCK_URI)).rejects.toThrow('Internal server error');
  });

  it('throws on network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network request failed'));
    await expect(submitVoiceRecording(MOCK_URI)).rejects.toThrow('Network request failed');
  });

  it('includes Content-Type: application/json header', async () => {
    await submitVoiceRecording(MOCK_URI);
    const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
    expect(headers['Content-Type']).toBe('application/json');
  });
});
