const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

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

export interface Entry {
  id: string;
  date: string;
  service: string;
  photo: string;
  teamSize: number;
  duration: string;
  description: string;
  category: string;
}

export function mapApiEntry(entry: ApiEntry): Entry {
  return {
    id: entry.id,
    date: entry.createdAt.slice(0, 10),
    service: entry.serviceType,
    photo: entry.photoKey ?? '',
    teamSize: entry.teamSize,
    duration: '',
    description: entry.formalDescription || entry.description,
    category: entry.serviceType,
  };
}

export async function fetchEntries(projectId: string, token?: string): Promise<Entry[]> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/projects/${projectId}/entries`, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  const data: ApiEntry[] = await res.json();
  return data.map(mapApiEntry);
}
