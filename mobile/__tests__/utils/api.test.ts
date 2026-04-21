import { mapApiEntry, fetchEntries, ApiEntry } from '../../utils/api';

const mockApiEntry: ApiEntry = {
  id: 'entry-123',
  projectId: 'proj-abc',
  serviceType: 'Concretagem',
  teamSize: 8,
  description: 'Concretagem da laje',
  formalDescription: 'Execução da concretagem da laje conforme projeto',
  photoKey: 'photos/proj-abc/log-1/photo.jpg',
  createdAt: '2026-04-17T16:22:18+00:00',
};

describe('mapApiEntry', () => {
  it('extracts YYYY-MM-DD date from ISO createdAt', () => {
    const entry = mapApiEntry(mockApiEntry);
    expect(entry.date).toBe('2026-04-17');
  });

  it('maps serviceType to service and category', () => {
    const entry = mapApiEntry(mockApiEntry);
    expect(entry.service).toBe('Concretagem');
    expect(entry.category).toBe('Concretagem');
  });

  it('prefers formalDescription over description', () => {
    const entry = mapApiEntry(mockApiEntry);
    expect(entry.description).toBe('Execução da concretagem da laje conforme projeto');
  });

  it('falls back to description when formalDescription is empty', () => {
    const entry = mapApiEntry({ ...mockApiEntry, formalDescription: '' });
    expect(entry.description).toBe('Concretagem da laje');
  });

  it('maps teamSize correctly', () => {
    const entry = mapApiEntry(mockApiEntry);
    expect(entry.teamSize).toBe(8);
  });

  it('maps photoKey to photo', () => {
    const entry = mapApiEntry(mockApiEntry);
    expect(entry.photo).toBe('photos/proj-abc/log-1/photo.jpg');
  });

  it('sets duration to empty string', () => {
    const entry = mapApiEntry(mockApiEntry);
    expect(entry.duration).toBe('');
  });

  it('preserves entry id', () => {
    const entry = mapApiEntry(mockApiEntry);
    expect(entry.id).toBe('entry-123');
  });
});

describe('fetchEntries', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('calls the correct URL with project ID', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockApiEntry],
    });

    await fetchEntries('proj-abc');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-abc/entries'),
      expect.any(Object)
    );
  });

  it('returns mapped entries on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockApiEntry],
    });

    const entries = await fetchEntries('proj-abc');
    expect(entries).toHaveLength(1);
    expect(entries[0].service).toBe('Concretagem');
    expect(entries[0].date).toBe('2026-04-17');
  });

  it('throws on non-OK HTTP response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    await expect(fetchEntries('proj-abc')).rejects.toThrow('Internal Server Error');
  });

  it('includes Authorization header when token is provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await fetchEntries('proj-abc', 'my-token');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-token',
        }),
      })
    );
  });
});
