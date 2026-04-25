const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export const API_BASE_URL = BASE_URL;

export const ENDPOINTS = {
  voiceSubmit: '/voice/submit',
  projects: '/projects',
  entries: (projectId: string) => `/projects/${projectId}/entries`,
  photoUploadUrl: '/photos/upload-url',
  reports: '/reports',
} as const;
