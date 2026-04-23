export interface ApiProject {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchProjects(token?: string): Promise<ApiProject[]> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${apiUrl}/projects`, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `Failed to fetch projects: ${res.status}`);
  }
  return res.json() as Promise<ApiProject[]>;
}
