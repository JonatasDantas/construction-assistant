import { fetchProjects } from '../../utils/projects-api';

const MOCK_URL = 'https://api.example.com';

beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = MOCK_URL;
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

const mockProjects = [
  { id: '1', name: 'Project A', description: 'Desc A', status: 'active', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '2', name: 'Project B', description: 'Desc B', status: 'active', createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
];

function makeResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  } as Response);
}

test('returns ApiProject[] on successful API call', async () => {
  (global.fetch as jest.Mock).mockReturnValue(makeResponse(mockProjects));
  const result = await fetchProjects();
  expect(result).toEqual(mockProjects);
});

test('calls GET to the correct endpoint', async () => {
  (global.fetch as jest.Mock).mockReturnValue(makeResponse([]));
  await fetchProjects();
  expect(global.fetch).toHaveBeenCalledWith(
    `${MOCK_URL}/projects`,
    expect.objectContaining({ method: 'GET' }),
  );
});

test('sends Authorization header when token is provided', async () => {
  (global.fetch as jest.Mock).mockReturnValue(makeResponse([]));
  await fetchProjects('my-token');
  const [, options] = (global.fetch as jest.Mock).mock.calls[0];
  expect(options.headers['Authorization']).toBe('Bearer my-token');
});

test('does NOT send Authorization header when no token provided', async () => {
  (global.fetch as jest.Mock).mockReturnValue(makeResponse([]));
  await fetchProjects();
  const [, options] = (global.fetch as jest.Mock).mock.calls[0];
  expect(options.headers['Authorization']).toBeUndefined();
});

test('throws on non-OK HTTP response', async () => {
  (global.fetch as jest.Mock).mockReturnValue(makeResponse('Unauthorized', 401));
  await expect(fetchProjects()).rejects.toThrow();
});

test('throws with server error message from response body', async () => {
  (global.fetch as jest.Mock).mockReturnValue(makeResponse('Project not found', 404));
  await expect(fetchProjects()).rejects.toThrow('Project not found');
});

test('throws on network failure', async () => {
  (global.fetch as jest.Mock).mockRejectedValue(new Error('Network Error'));
  await expect(fetchProjects()).rejects.toThrow('Network Error');
});
