export interface GenerateReportResponse {
  pdfUrl: string;
}

export async function generateReport(projectId: string): Promise<GenerateReportResponse> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
  const url = `${apiUrl}/reports?project_id=${encodeURIComponent(projectId)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Network error');
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(body || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<GenerateReportResponse>;
}
