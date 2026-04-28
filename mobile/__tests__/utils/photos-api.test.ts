import { getPresignedUrl, uploadImageToS3 } from '../../utils/photos-api';

const mockUploadAsync = jest.fn();

jest.mock('expo-file-system', () => ({
  uploadAsync: (...args: unknown[]) => mockUploadAsync(...args),
  FileSystemUploadType: { BINARY_CONTENT: 'binary' },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as typeof fetch;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';
});

describe('getPresignedUrl', () => {
  it('calls the correct endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ uploadUrl: 'https://s3.example.com/put', key: 'photos/p1/l1/photo.jpg' }),
    });

    await getPresignedUrl('p1', 'l1', 'photo.jpg', 'image/jpeg');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/photos/upload-url',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('sends Content-Type: application/json header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ uploadUrl: '', key: '' }),
    });

    await getPresignedUrl('p1', 'l1', 'photo.jpg', 'image/jpeg');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
  });

  it('sends all required fields in the request body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ uploadUrl: '', key: '' }),
    });

    await getPresignedUrl('proj-1', 'log-42', 'image.png', 'image/png');

    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toEqual({
      project_id: 'proj-1',
      log_id: 'log-42',
      filename: 'image.png',
      content_type: 'image/png',
    });
  });

  it('returns uploadUrl and key on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        uploadUrl: 'https://s3.example.com/put',
        key: 'photos/proj-1/log-42/image.png',
      }),
    });

    const result = await getPresignedUrl('proj-1', 'log-42', 'image.png', 'image/png');

    expect(result).toEqual({
      uploadUrl: 'https://s3.example.com/put',
      key: 'photos/proj-1/log-42/image.png',
    });
  });

  it('throws on non-OK HTTP response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => '',
    });

    await expect(getPresignedUrl('p1', 'l1', 'photo.jpg', 'image/jpeg')).rejects.toThrow();
  });

  it('throws with server error message when response body is non-empty', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'project_id is required',
    });

    await expect(getPresignedUrl('', 'l1', 'photo.jpg', 'image/jpeg')).rejects.toThrow(
      'project_id is required',
    );
  });
});

describe('uploadImageToS3', () => {
  it('calls FileSystem.uploadAsync with correct parameters', async () => {
    mockUploadAsync.mockResolvedValueOnce({ status: 200 });

    await uploadImageToS3(
      'https://s3.example.com/presigned',
      'file:///local/photo.jpg',
      'image/jpeg',
    );

    expect(mockUploadAsync).toHaveBeenCalledWith(
      'https://s3.example.com/presigned',
      'file:///local/photo.jpg',
      expect.objectContaining({
        httpMethod: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
      }),
    );
  });

  it('resolves without error on 200 response', async () => {
    mockUploadAsync.mockResolvedValueOnce({ status: 200 });

    await expect(
      uploadImageToS3('https://s3.example.com/presigned', 'file:///local/photo.jpg', 'image/jpeg'),
    ).resolves.toBeUndefined();
  });

  it('throws on non-2xx upload status', async () => {
    mockUploadAsync.mockResolvedValueOnce({ status: 403 });

    await expect(
      uploadImageToS3('https://s3.example.com/presigned', 'file:///local/photo.jpg', 'image/jpeg'),
    ).rejects.toThrow('403');
  });
});
