import { createLogEntry, CreateLogPayload } from '@/utils/logs-api';

const BASE_URL = 'https://api.example.com';

const PAYLOAD: CreateLogPayload = {
  serviceType: 'Concretagem',
  teamSize: '8 pessoas',
  description: 'Transcricao original',
  formalDescription: 'Descricao formal gerada pela IA',
  projectId: 'proj-123',
  timestamp: '2026-04-22T00:00:00.000Z',
};

beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = BASE_URL;
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

test('POSTs to the correct endpoint', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

  await createLogEntry(PAYLOAD);

  expect(global.fetch).toHaveBeenCalledWith(
    `${BASE_URL}/logs`,
    expect.objectContaining({ method: 'POST' }),
  );
});

test('sends Content-Type: application/json header', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

  await createLogEntry(PAYLOAD);

  const [, init] = (global.fetch as jest.Mock).mock.calls[0];
  expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
});

test('sends all payload fields in the request body', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

  await createLogEntry(PAYLOAD);

  const [, init] = (global.fetch as jest.Mock).mock.calls[0];
  const body = JSON.parse(init.body);
  expect(body.serviceType).toBe(PAYLOAD.serviceType);
  expect(body.teamSize).toBe(PAYLOAD.teamSize);
  expect(body.description).toBe(PAYLOAD.description);
  expect(body.formalDescription).toBe(PAYLOAD.formalDescription);
});

test('includes projectId and timestamp in the request body', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

  await createLogEntry(PAYLOAD);

  const [, init] = (global.fetch as jest.Mock).mock.calls[0];
  const body = JSON.parse(init.body);
  expect(body.projectId).toBe(PAYLOAD.projectId);
  expect(body.timestamp).toBe(PAYLOAD.timestamp);
});

test('resolves without error on 2xx response', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

  await expect(createLogEntry(PAYLOAD)).resolves.toBeUndefined();
});

test('throws on non-OK HTTP response', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status: 500,
    text: jest.fn().mockResolvedValueOnce(''),
  });

  await expect(createLogEntry(PAYLOAD)).rejects.toThrow('HTTP 500');
});

test('throws with server error message when response body is non-empty', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status: 400,
    text: jest.fn().mockResolvedValueOnce('Project not found'),
  });

  await expect(createLogEntry(PAYLOAD)).rejects.toThrow('Project not found');
});
