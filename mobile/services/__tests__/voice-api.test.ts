import { processVoice } from '../voice-api';

const MOCK_RESULT = {
  serviceType: 'Estrutura',
  teamSize: 4,
  description: 'Concretagem da laje do terceiro andar',
  formalDescription: 'Execução da concretagem da laje do terceiro pavimento.',
};

// Helpers to set up fetch + FileReader mocks for each test

function mockFileReader(base64 = 'dGVzdA==', contentType = 'audio/m4a') {
  const dataUrl = `data:${contentType};base64,${base64}`;
  const readerInstance = {
    readAsDataURL: jest.fn(function (this: typeof readerInstance) {
      // Simulate async onload
      Promise.resolve().then(() => this.onload?.());
    }),
    onload: null as (() => void) | null,
    onerror: null as (() => void) | null,
    result: dataUrl,
  };
  global.FileReader = jest.fn(() => readerInstance) as unknown as typeof FileReader;
  return readerInstance;
}

function mockFetchFile(blob = new Blob(['fake-audio'])) {
  return jest
    .spyOn(global, 'fetch')
    .mockResolvedValueOnce({ blob: () => Promise.resolve(blob) } as Response);
}

function mockApiSuccess(result = MOCK_RESULT) {
  return jest
    .spyOn(global, 'fetch')
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(result),
    } as Response);
}

function mockApiError(status: number, body: object) {
  return jest
    .spyOn(global, 'fetch')
    .mockResolvedValueOnce({
      ok: false,
      status,
      json: () => Promise.resolve(body),
    } as Response);
}

beforeEach(() => {
  jest.restoreAllMocks();
});

// --- Happy path ---

test('returns parsed VoiceProcessResult on success', async () => {
  mockFileReader();
  jest
    .spyOn(global, 'fetch')
    .mockResolvedValueOnce({ blob: () => Promise.resolve(new Blob(['audio'])) } as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(MOCK_RESULT),
    } as Response);

  const result = await processVoice('file:///audio.m4a');

  expect(result).toEqual(MOCK_RESULT);
});

test('sends audio_base64 and content_type in POST body', async () => {
  mockFileReader('dGVzdA==', 'audio/x-m4a');
  const fetchSpy = jest
    .spyOn(global, 'fetch')
    .mockResolvedValueOnce({ blob: () => Promise.resolve(new Blob(['audio'])) } as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(MOCK_RESULT),
    } as Response);

  await processVoice('file:///audio.m4a');

  const [, apiCallInit] = fetchSpy.mock.calls[1];
  const body = JSON.parse((apiCallInit as RequestInit).body as string);
  expect(body.audio_base64).toBe('dGVzdA==');
  expect(body.content_type).toBe('audio/x-m4a');
});

// --- content_type fallback ---

test('defaults content_type to audio/m4a when DataURL has no MIME header', async () => {
  // Simulate a FileReader that produces a DataURL without a recognizable MIME type
  const readerInstance = {
    readAsDataURL: jest.fn(function (this: typeof readerInstance) {
      Promise.resolve().then(() => this.onload?.());
    }),
    onload: null as (() => void) | null,
    onerror: null as (() => void) | null,
    result: 'data:;base64,dGVzdA==',
  };
  global.FileReader = jest.fn(() => readerInstance) as unknown as typeof FileReader;

  const fetchSpy = jest
    .spyOn(global, 'fetch')
    .mockResolvedValueOnce({ blob: () => Promise.resolve(new Blob(['audio'])) } as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(MOCK_RESULT),
    } as Response);

  await processVoice('file:///audio.m4a');

  const [, apiCallInit] = fetchSpy.mock.calls[1];
  const body = JSON.parse((apiCallInit as RequestInit).body as string);
  expect(body.content_type).toBe('audio/m4a');
});

// --- Error handling ---

test('throws with server error message on non-2xx response', async () => {
  mockFileReader();
  jest
    .spyOn(global, 'fetch')
    .mockResolvedValueOnce({ blob: () => Promise.resolve(new Blob(['audio'])) } as Response)
    .mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'audio_base64 is required' }),
    } as Response);

  await expect(processVoice('file:///audio.m4a')).rejects.toThrow('audio_base64 is required');
});

test('throws with status message when server returns non-JSON error body', async () => {
  mockFileReader();
  jest
    .spyOn(global, 'fetch')
    .mockResolvedValueOnce({ blob: () => Promise.resolve(new Blob(['audio'])) } as Response)
    .mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    } as Response);

  await expect(processVoice('file:///audio.m4a')).rejects.toThrow('Request failed with status 500');
});

test('propagates network error when file fetch fails', async () => {
  jest
    .spyOn(global, 'fetch')
    .mockRejectedValueOnce(new Error('Network request failed'));

  await expect(processVoice('file:///audio.m4a')).rejects.toThrow('Network request failed');
});

test('propagates error when FileReader fails', async () => {
  const readerInstance = {
    readAsDataURL: jest.fn(function (this: typeof readerInstance) {
      Promise.resolve().then(() => this.onerror?.());
    }),
    onload: null as (() => void) | null,
    onerror: null as (() => void) | null,
    result: '',
  };
  global.FileReader = jest.fn(() => readerInstance) as unknown as typeof FileReader;

  jest
    .spyOn(global, 'fetch')
    .mockResolvedValueOnce({ blob: () => Promise.resolve(new Blob(['audio'])) } as Response);

  await expect(processVoice('file:///audio.m4a')).rejects.toThrow('Failed to read audio file');
});
