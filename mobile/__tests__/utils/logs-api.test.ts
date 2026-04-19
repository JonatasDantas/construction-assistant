import { createLogEntry, CreateLogPayload } from '../../utils/logs-api';

const basePayload: CreateLogPayload = {
  serviceType: 'Concretagem',
  teamSize: '8 pessoas',
  description: 'Concretagem da laje do 3º pavimento.',
  formalDescription: 'Concretagem da laje do 3º pavimento finalizada conforme cronograma.',
  projectId: 'project-1',
  timestamp: '2026-04-19T10:00:00.000Z',
};

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';
});

test('POSTs to the correct endpoint', async () => {
  mockFetch.mockResolvedValueOnce({ ok: true });

  await createLogEntry(basePayload);

  expect(mockFetch).toHaveBeenCalledWith(
    'https://api.example.com/logs',
    expect.objectContaining({ method: 'POST' }),
  );
});

test('sends Content-Type: application/json header', async () => {
  mockFetch.mockResolvedValueOnce({ ok: true });

  await createLogEntry(basePayload);

  expect(mockFetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
  );
});

test('sends all payload fields in the request body', async () => {
  mockFetch.mockResolvedValueOnce({ ok: true });

  await createLogEntry(basePayload);

  const { body } = mockFetch.mock.calls[0][1] as RequestInit;
  const parsed = JSON.parse(body as string);
  expect(parsed).toMatchObject({
    serviceType: 'Concretagem',
    teamSize: '8 pessoas',
    description: 'Concretagem da laje do 3º pavimento.',
    formalDescription: 'Concretagem da laje do 3º pavimento finalizada conforme cronograma.',
  });
});

test('includes projectId and timestamp in the request body', async () => {
  mockFetch.mockResolvedValueOnce({ ok: true });

  await createLogEntry(basePayload);

  const { body } = mockFetch.mock.calls[0][1] as RequestInit;
  const parsed = JSON.parse(body as string);
  expect(parsed.projectId).toBe('project-1');
  expect(parsed.timestamp).toBe('2026-04-19T10:00:00.000Z');
});

test('resolves without error on 2xx response', async () => {
  mockFetch.mockResolvedValueOnce({ ok: true });

  await expect(createLogEntry(basePayload)).resolves.toBeUndefined();
});

test('throws on non-OK HTTP response', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 500,
    text: async () => '',
  });

  await expect(createLogEntry(basePayload)).rejects.toThrow('HTTP 500');
});

test('throws with server error message when response body is non-empty', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 400,
    text: async () => 'Project not found',
  });

  await expect(createLogEntry(basePayload)).rejects.toThrow('Project not found');
});
