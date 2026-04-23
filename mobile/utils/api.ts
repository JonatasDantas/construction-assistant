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

export function mapApiEntry(apiEntry: ApiEntry): Entry {
  return {
    id: apiEntry.id,
    date: apiEntry.createdAt.slice(0, 10),
    service: apiEntry.serviceType,
    photo: apiEntry.photoKey,
    teamSize: apiEntry.teamSize,
    duration: '',
    description: apiEntry.formalDescription || apiEntry.description,
    category: apiEntry.serviceType,
  };
}

export async function fetchEntries(projectId: string): Promise<Entry[]> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  const response = await fetch(`${baseUrl}/projects/${projectId}/entries`);
  if (!response.ok) {
    throw new Error(`Failed to fetch entries: ${response.status}`);
  }
  const data: ApiEntry[] = await response.json();
  return data.map(mapApiEntry);
}
