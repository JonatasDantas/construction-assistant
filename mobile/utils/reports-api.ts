export interface GenerateReportResponse {
  pdfUrl: string;
}

export async function generateReport(projectId: string): Promise<GenerateReportResponse> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
  const url = `${baseUrl}/reports?project_id=${encodeURIComponent(projectId)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    throw new Error(`Network error: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(body || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<GenerateReportResponse>;
}
