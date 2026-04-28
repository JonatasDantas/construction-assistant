import { mapApiEntry, fetchEntries, ApiEntry } from '../../utils/api';

const baseEntry: ApiEntry = {
  id: 'entry-001',
  projectId: 'proj-abc',
  serviceType: 'Concretagem',
  teamSize: 8,
  description: 'Raw description',
  formalDescription: 'Formal description',
  photoKey: 'photos/proj-abc/entry-001/img.jpg',
  createdAt: '2026-04-17T16:22:18+00:00',
};

describe('mapApiEntry', () => {
  it('extracts YYYY-MM-DD date from ISO createdAt', () => {
    const result = mapApiEntry(baseEntry);
    expect(result.date).toBe('2026-04-17');
  });

  it('maps serviceType to service and category', () => {
    const result = mapApiEntry(baseEntry);
    expect(result.service).toBe('Concretagem');
    expect(result.category).toBe('Concretagem');
  });

  it('prefers formalDescription over description', () => {
    const result = mapApiEntry(baseEntry);
    expect(result.description).toBe('Formal description');
  });

  it('falls back to description when formalDescription is empty', () => {
    const result = mapApiEntry({ ...baseEntry, formalDescription: '' });
    expect(result.description).toBe('Raw description');
  });

  it('maps teamSize correctly', () => {
    const result = mapApiEntry({ ...baseEntry, teamSize: 4 });
    expect(result.teamSize).toBe(4);
  });

  it('maps photoKey to photo field', () => {
    const result = mapApiEntry(baseEntry);
    expect(result.photo).toBe('photos/proj-abc/entry-001/img.jpg');
  });

  it('sets photo to empty string when photoKey is empty', () => {
    const result = mapApiEntry({ ...baseEntry, photoKey: '' });
    expect(result.photo).toBe('');
  });

  it('preserves entry id', () => {
    const result = mapApiEntry(baseEntry);
    expect(result.id).toBe('entry-001');
  });
});

describe('fetchEntries', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('calls the correct URL with project ID', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    await fetchEntries('proj-123');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-123/entries'),
      expect.any(Object)
    );
  });

  it('returns mapped entries on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [baseEntry],
    }) as unknown as typeof fetch;

    const result = await fetchEntries('proj-abc');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('entry-001');
    expect(result[0].service).toBe('Concretagem');
  });

  it('throws on non-OK HTTP response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
    }) as unknown as typeof fetch;

    await expect(fetchEntries('proj-abc')).rejects.toThrow('Failed to fetch entries: 401');
  });

  it('includes Authorization header when token is provided', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    await fetchEntries('proj-abc', 'my-token');

    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].headers['Authorization']).toBe('Bearer my-token');
  });
});
