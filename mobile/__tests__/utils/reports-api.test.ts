import { generateReport } from '../../utils/reports-api';

const MOCK_API_URL = 'https://api.example.com';

beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = MOCK_API_URL;
  jest.resetAllMocks();
});

describe('generateReport', () => {
  it('returns pdfUrl on successful API call', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ pdfUrl: 'https://s3.example.com/report.pdf' }),
    } as Response);

    const result = await generateReport('proj-1');

    expect(result.pdfUrl).toBe('https://s3.example.com/report.pdf');
  });

  it('calls POST to the correct endpoint with project_id as query param', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ pdfUrl: 'https://s3.example.com/report.pdf' }),
    } as Response);

    await generateReport('proj-abc');

    expect(fetch).toHaveBeenCalledWith(
      `${MOCK_API_URL}/reports?project_id=proj-abc`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('sends Content-Type: application/json header', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ pdfUrl: 'https://s3.example.com/report.pdf' }),
    } as Response);

    await generateReport('proj-1');

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('throws on non-OK HTTP response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => '',
    } as unknown as Response);

    await expect(generateReport('proj-1')).rejects.toThrow('HTTP 500');
  });

  it('throws with server error message from response body', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Project not found',
    } as unknown as Response);

    await expect(generateReport('proj-1')).rejects.toThrow('Project not found');
  });

  it('throws on network failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network request failed'));

    await expect(generateReport('proj-1')).rejects.toThrow('Network request failed');
  });

  it('URL-encodes the project ID in the query param', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ pdfUrl: 'https://s3.example.com/report.pdf' }),
    } as Response);

    await generateReport('proj id with spaces');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('project_id=proj%20id%20with%20spaces'),
      expect.any(Object),
    );
  });
});
