export interface CreateLogPayload {
  serviceType: string;
  teamSize: string;
  description: string;
  formalDescription: string;
  projectId: string;
  timestamp: string;
}

export async function createLogEntry(payload: CreateLogPayload): Promise<void> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const response = await fetch(`${apiUrl}/projects/${encodeURIComponent(payload.projectId)}/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      serviceType: payload.serviceType,
      teamSize: payload.teamSize,
      description: payload.description,
      formalDescription: payload.formalDescription,
    }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `HTTP ${response.status}`);
  }
}
