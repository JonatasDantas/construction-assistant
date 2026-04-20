import { fetchProjects, ApiProject } from '../../utils/projects-api';

const mockProject: ApiProject = {
  id: 'proj-1',
  name: 'Edifício Residencial',
  description: 'Obra residencial no centro',
  status: 'active',
  createdAt: '2026-04-01T10:00:00Z',
  updatedAt: '2026-04-10T12:00:00Z',
};

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv, EXPO_PUBLIC_API_URL: 'https://api.example.com' };
  global.fetch = jest.fn();
});

afterEach(() => {
  process.env = originalEnv;
  jest.resetAllMocks();
});

describe('fetchProjects', () => {
  it('returns ApiProject[] on successful API call', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockProject],
    });

    const result = await fetchProjects();

    expect(result).toEqual([mockProject]);
  });

  it('calls GET to the correct endpoint', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await fetchProjects();

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/projects',
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it('sends Authorization header when token is provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await fetchProjects('my-token');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer my-token' }),
      }),
    );
  });

  it('does NOT send Authorization header when no token', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await fetchProjects();

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.headers).not.toHaveProperty('Authorization');
  });

  it('throws on non-OK HTTP response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => '',
    });

    await expect(fetchProjects()).rejects.toThrow('401');
  });

  it('throws with server error message from response body', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal server error',
    });

    await expect(fetchProjects()).rejects.toThrow('Internal server error');
  });

  it('throws on network failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'));

    await expect(fetchProjects()).rejects.toThrow('Network request failed');
  });
});
