// Set EXPO_PUBLIC_API_URL in your .env file for non-local environments.
export const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
