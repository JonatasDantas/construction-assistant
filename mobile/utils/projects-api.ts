export interface ApiProject {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchProjects(token?: string): Promise<ApiProject[]> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}/projects`, { method: 'GET', headers });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(body || `Request failed with status ${response.status}`);
  }

  return response.json();
}
