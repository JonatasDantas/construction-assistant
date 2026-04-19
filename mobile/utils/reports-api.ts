const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export interface GenerateReportResponse {
  pdfUrl: string;
}

export async function generateReport(projectId: string): Promise<GenerateReportResponse> {
  const url = `${API_URL}/reports?project_id=${encodeURIComponent(projectId)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `HTTP ${response.status}`);
  }

  return response.json() as Promise<GenerateReportResponse>;
}
