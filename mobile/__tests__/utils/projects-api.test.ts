import { fetchProjects, ApiProject } from '../../utils/projects-api';

const MOCK_PROJECTS: ApiProject[] = [
  {
    id: 'proj-1',
    name: 'Edifício Residencial Parque das Flores',
    description: 'Construção de edifício residencial de 10 andares',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
  },
  {
    id: 'proj-2',
    name: 'Centro Comercial Boa Vista',
    description: 'Construção de centro comercial',
    status: 'active',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },
];

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV, EXPO_PUBLIC_API_URL: 'https://api.example.com' };
  global.fetch = jest.fn();
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
  jest.resetAllMocks();
});

describe('fetchProjects', () => {
  it('returns ApiProject[] on a successful API call', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_PROJECTS,
    });

    const result = await fetchProjects();

    expect(result).toEqual(MOCK_PROJECTS);
  });

  it('calls GET to the correct endpoint', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await fetchProjects();

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/projects',
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  it('sends Authorization header when token is provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await fetchProjects('my-token');

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.headers['Authorization']).toBe('Bearer my-token');
  });

  it('does NOT send Authorization header when no token is provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await fetchProjects();

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.headers['Authorization']).toBeUndefined();
  });

  it('throws on non-OK HTTP response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => '',
    });

    await expect(fetchProjects()).rejects.toThrow('Failed to fetch projects: 401');
  });

  it('throws with server error message from response body', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    await expect(fetchProjects()).rejects.toThrow('Internal Server Error');
  });

  it('throws on network failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'));

    await expect(fetchProjects()).rejects.toThrow('Network request failed');
  });
});
