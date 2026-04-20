import { submitVoiceRecording } from '../../utils/voice-api';

const mockGetInfoAsync = jest.fn();
const mockReadAsStringAsync = jest.fn();

jest.mock('expo-file-system', () => ({
  getInfoAsync: (...args: unknown[]) => mockGetInfoAsync(...args),
  readAsStringAsync: (...args: unknown[]) => mockReadAsStringAsync(...args),
  EncodingType: { Base64: 'base64' },
}));

const MOCK_URI = 'file:///tmp/recording.m4a';
const MOCK_BASE64 = 'SGVsbG8gV29ybGQ=';
const MOCK_RESPONSE = {
  serviceType: 'Concretagem',
  teamSize: 8,
  description: 'Concretagem da laje do terceiro andar.',
  formalDescription: 'Execução de concretagem da laje do terceiro pavimento conforme cronograma.',
};

function makeFileSizeMock(size: number) {
  return { exists: true, uri: MOCK_URI, size, isDirectory: false, modificationTime: 0 };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetInfoAsync.mockResolvedValue(makeFileSizeMock(1024));
  mockReadAsStringAsync.mockResolvedValue(MOCK_BASE64);
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => MOCK_RESPONSE,
    text: async () => '',
  }) as jest.Mock;
  process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';
});

describe('submitVoiceRecording', () => {
  it('returns correct VoiceSubmitResponse on success', async () => {
    const result = await submitVoiceRecording(MOCK_URI);
    expect(result).toEqual(MOCK_RESPONSE);
  });

  it('reads audio file with Base64 encoding', async () => {
    await submitVoiceRecording(MOCK_URI);
    expect(mockReadAsStringAsync).toHaveBeenCalledWith(MOCK_URI, { encoding: 'base64' });
  });

  it('sends audio_base64 and content_type in POST body', async () => {
    await submitVoiceRecording(MOCK_URI, 'audio/aac');
    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.audio_base64).toBe(MOCK_BASE64);
    expect(body.content_type).toBe('audio/aac');
  });

  it('defaults content_type to audio/m4a', async () => {
    await submitVoiceRecording(MOCK_URI);
    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.content_type).toBe('audio/m4a');
  });

  it('includes Content-Type: application/json header', async () => {
    await submitVoiceRecording(MOCK_URI);
    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  it('posts to the correct endpoint', async () => {
    await submitVoiceRecording(MOCK_URI);
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://api.example.com/voice/submit');
  });

  it('throws when audio exceeds 25 MB', async () => {
    mockGetInfoAsync.mockResolvedValue(makeFileSizeMock(26 * 1024 * 1024));
    await expect(submitVoiceRecording(MOCK_URI)).rejects.toThrow('25 MB');
  });

  it('throws on non-OK HTTP response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    }) as jest.Mock;
    await expect(submitVoiceRecording(MOCK_URI)).rejects.toThrow('Internal Server Error');
  });
});
