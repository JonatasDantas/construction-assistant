import { generateReport } from '@/utils/reports-api';

const MOCK_API_URL = 'https://api.example.com';

beforeEach(() => {
  jest.resetAllMocks();
  process.env.EXPO_PUBLIC_API_URL = MOCK_API_URL;
});

describe('generateReport', () => {
  it('returns pdfUrl on successful API call', async () => {
    const pdfUrl = 'https://s3.example.com/reports/proj/report.pdf';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ pdfUrl }),
    } as unknown as Response);

    const result = await generateReport('proj-123');

    expect(result.pdfUrl).toBe(pdfUrl);
  });

  it('calls POST to the correct endpoint with project_id as query param', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ pdfUrl: 'https://s3.example.com/r.pdf' }),
    } as unknown as Response);

    await generateReport('proj-abc');

    expect(fetch).toHaveBeenCalledWith(
      `${MOCK_API_URL}/reports?project_id=proj-abc`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('sends Content-Type: application/json header', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ pdfUrl: 'https://s3.example.com/r.pdf' }),
    } as unknown as Response);

    await generateReport('proj-abc');

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
      text: () => Promise.resolve(''),
    } as unknown as Response);

    await expect(generateReport('proj-123')).rejects.toThrow('Request failed with status 500');
  });

  it('throws with server error message from response body', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      text: () => Promise.resolve('project_id is required'),
    } as unknown as Response);

    await expect(generateReport('proj-123')).rejects.toThrow('project_id is required');
  });

  it('throws on network failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network request failed'));

    await expect(generateReport('proj-123')).rejects.toThrow('Network request failed');
  });

  it('URL-encodes the project ID in the query param', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ pdfUrl: 'https://s3.example.com/r.pdf' }),
    } as unknown as Response);

    await generateReport('proj id with spaces');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('project_id=proj%20id%20with%20spaces'),
      expect.anything(),
    );
  });
});
