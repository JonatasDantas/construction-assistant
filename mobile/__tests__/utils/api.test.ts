import { mapApiEntry, fetchEntries, ApiEntry } from '../../utils/api';

const mockApiEntry: ApiEntry = {
  id: 'entry-1',
  projectId: 'proj-1',
  serviceType: 'Concretagem',
  teamSize: 8,
  description: 'Some description',
  formalDescription: 'Formal description',
  photoKey: 'photos/proj/log/file.jpg',
  createdAt: '2026-04-17T16:22:18+00:00',
};

describe('mapApiEntry', () => {
  it('extracts YYYY-MM-DD from ISO createdAt', () => {
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
    expect(entry.description).toBe('Formal description');
  });

  it('falls back to description when formalDescription is empty', () => {
    const entry = mapApiEntry({ ...mockApiEntry, formalDescription: '' });
    expect(entry.description).toBe('Some description');
  });

  it('maps teamSize correctly', () => {
    const entry = mapApiEntry(mockApiEntry);
    expect(entry.teamSize).toBe(8);
  });

  it('maps photoKey to photo', () => {
    const entry = mapApiEntry(mockApiEntry);
    expect(entry.photo).toBe('photos/proj/log/file.jpg');
  });

  it('sets duration to empty string', () => {
    const entry = mapApiEntry(mockApiEntry);
    expect(entry.duration).toBe('');
  });

  it('preserves entry id', () => {
    const entry = mapApiEntry(mockApiEntry);
    expect(entry.id).toBe('entry-1');
  });
});

describe('fetchEntries', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    global.fetch = jest.fn();
    process.env = { ...originalEnv, EXPO_PUBLIC_API_URL: 'https://api.example.com' };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetAllMocks();
  });

  it('calls the correct URL with project ID', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [mockApiEntry],
    });

    await fetchEntries('proj-1');

    expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/projects/proj-1/entries');
  });

  it('returns mapped entries on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [mockApiEntry],
    });

    const entries = await fetchEntries('proj-1');

    expect(entries).toHaveLength(1);
    expect(entries[0].service).toBe('Concretagem');
    expect(entries[0].date).toBe('2026-04-17');
  });

  it('throws on non-OK HTTP response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(fetchEntries('proj-1')).rejects.toThrow('Failed to fetch entries: 500');
  });
});
