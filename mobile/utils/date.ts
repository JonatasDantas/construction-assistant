/**
 * Returns a human-readable date label in pt-BR.
 * "Hoje" / "Ontem" / "8 de abril"
 */
export function formatEntryDate(dateString: string, today: string, yesterday: string): string {
  if (dateString === today) return 'Hoje';
  if (dateString === yesterday) return 'Ontem';
  return new Date(dateString + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
  });
}

/**
 * Returns today and yesterday as YYYY-MM-DD strings.
 */
export function getTodayAndYesterday(): { today: string; yesterday: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return { today: fmt(now), yesterday: fmt(yesterday) };
}
