import { generateReport } from '@/utils/reports-api';

const MOCK_URL = 'https://api.example.com';

beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = MOCK_URL;
  jest.resetAllMocks();
});

describe('generateReport', () => {
  it('returns pdfUrl on a successful API call', async () => {
    const pdfUrl = 'https://s3.example.com/reports/proj-1/report.pdf';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ pdfUrl }),
      text: () => Promise.resolve(''),
    } as unknown as Response);

    const result = await generateReport('proj-1');

    expect(result.pdfUrl).toBe(pdfUrl);
  });

  it('calls POST to the correct endpoint with project_id as a query param', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ pdfUrl: 'https://s3.example.com/report.pdf' }),
      text: () => Promise.resolve(''),
    } as unknown as Response);

    await generateReport('proj-abc');

    expect(global.fetch).toHaveBeenCalledWith(
      `${MOCK_URL}/reports?project_id=proj-abc`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('sends Content-Type application/json header', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ pdfUrl: 'https://s3.example.com/report.pdf' }),
      text: () => Promise.resolve(''),
    } as unknown as Response);

    await generateReport('proj-1');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
  });

  it('throws on a non-OK HTTP response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve(''),
    } as unknown as Response);

    await expect(generateReport('proj-1')).rejects.toThrow('500');
  });

  it('throws with the server error message when the response body is non-empty', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve('project_id is required'),
    } as unknown as Response);

    await expect(generateReport('proj-1')).rejects.toThrow('project_id is required');
  });

  it('throws on network failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network request failed'));

    await expect(generateReport('proj-1')).rejects.toThrow('Network request failed');
  });

  it('URL-encodes the project ID in the query param', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ pdfUrl: 'https://s3.example.com/report.pdf' }),
      text: () => Promise.resolve(''),
    } as unknown as Response);

    await generateReport('proj id/special');

    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain('project_id=proj%20id%2Fspecial');
  });
});
