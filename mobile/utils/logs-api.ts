export interface CreateLogPayload {
  serviceType: string;
  teamSize: string;
  description: string;
  formalDescription: string;
  projectId: string;
  timestamp: string;
}

export async function createLogEntry(payload: CreateLogPayload): Promise<void> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
  const res = await fetch(`${apiUrl}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
}
