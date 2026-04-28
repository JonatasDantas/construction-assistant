import { Entry } from '@/data/mock-data';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export interface ApiEntry {
  id: string;
  projectId: string;
  serviceType: string;
  teamSize: number;
  description: string;
  formalDescription: string;
  photoKey: string;
  createdAt: string;
}

export function mapApiEntry(apiEntry: ApiEntry): Entry {
  return {
    id: apiEntry.id,
    date: apiEntry.createdAt.slice(0, 10),
    service: apiEntry.serviceType,
    category: apiEntry.serviceType,
    teamSize: apiEntry.teamSize,
    description: apiEntry.formalDescription || apiEntry.description,
    photo: apiEntry.photoKey ?? '',
    duration: '',
  };
}

export async function fetchEntries(
  projectId: string,
  token?: string
): Promise<Entry[]> {
  const url = `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/entries`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch entries: ${response.status}`);
  }

  const data: ApiEntry[] = await response.json();
  return data.map(mapApiEntry);
}
