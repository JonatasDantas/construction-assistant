import { requestPresignedUrl, uploadToS3 } from '../../utils/photos-api';

const UPLOAD_URL = 'https://s3.example.com/bucket/key?sig=abc';
const FILE_URI = 'file:///tmp/photo.jpg';
const CONTENT_TYPE = 'image/jpeg';

const mockFetch = jest.fn();
global.fetch = mockFetch;

afterEach(() => {
  mockFetch.mockReset();
});

// ── requestPresignedUrl ─────────────────────────────────────────────────────

describe('requestPresignedUrl', () => {
  it('returns uploadUrl and key on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ uploadUrl: UPLOAD_URL, key: 'photos/p1/l1/photo.jpg' }),
    });

    const result = await requestPresignedUrl('p1', 'l1', 'photo.jpg', CONTENT_TYPE);

    expect(result).toEqual({ uploadUrl: UPLOAD_URL, key: 'photos/p1/l1/photo.jpg' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/upload-url'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          project_id: 'p1',
          log_id: 'l1',
          filename: 'photo.jpg',
          content_type: CONTENT_TYPE,
        }),
      }),
    );
  });

  it('throws when server returns non-OK status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'project_id, log_id, and filename are required',
    });

    await expect(requestPresignedUrl('', '', '', CONTENT_TYPE)).rejects.toThrow('400');
  });

  it('throws on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(requestPresignedUrl('p1', 'l1', 'photo.jpg', CONTENT_TYPE)).rejects.toThrow(
      'Network error',
    );
  });
});

// ── uploadToS3 ──────────────────────────────────────────────────────────────

describe('uploadToS3', () => {
  it('resolves when PUT returns 200', async () => {
    const mockBlob = new Blob(['data'], { type: CONTENT_TYPE });
    // First fetch: read local file as blob
    mockFetch.mockResolvedValueOnce({ blob: async () => mockBlob });
    // Second fetch: PUT to S3
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

    await expect(uploadToS3(UPLOAD_URL, FILE_URI, CONTENT_TYPE)).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(FILE_URI);
    expect(mockFetch).toHaveBeenCalledWith(
      UPLOAD_URL,
      expect.objectContaining({ method: 'PUT', headers: { 'Content-Type': CONTENT_TYPE } }),
    );
  });

  it('throws when S3 PUT returns error status', async () => {
    const mockBlob = new Blob(['data'], { type: CONTENT_TYPE });
    mockFetch.mockResolvedValueOnce({ blob: async () => mockBlob });
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });

    await expect(uploadToS3(UPLOAD_URL, FILE_URI, CONTENT_TYPE)).rejects.toThrow('403');
  });

  it('throws when local file fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch local file'));

    await expect(uploadToS3(UPLOAD_URL, FILE_URI, CONTENT_TYPE)).rejects.toThrow(
      'Failed to fetch local file',
    );
  });
});
