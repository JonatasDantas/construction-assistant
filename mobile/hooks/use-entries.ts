import { useState, useEffect, useCallback } from 'react';
import { Entry } from '@/data/mock-data';
import { fetchEntries } from '@/utils/api';

interface UseEntriesResult {
  entries: Entry[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEntries(projectId: string | null): UseEntriesResult {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) {
      setEntries([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEntries(projectId);
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar registros');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  return { entries, loading, error, refetch: load };
}
