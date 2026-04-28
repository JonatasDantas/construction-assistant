import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiProject, fetchProjects } from '@/utils/projects-api';

const ACTIVE_PROJECT_KEY = 'active_project_id';

interface ProjectContextValue {
  projects: ApiProject[];
  activeProject: ApiProject | null;
  setActiveProject: (id: string) => void;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, storedId] = await Promise.all([
        fetchProjects(),
        AsyncStorage.getItem(ACTIVE_PROJECT_KEY),
      ]);
      setProjects(data);
      setActiveProjectId(storedId ?? data[0]?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function setActiveProject(id: string) {
    setActiveProjectId(id);
    AsyncStorage.setItem(ACTIVE_PROJECT_KEY, id);
  }

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  return (
    <ProjectContext.Provider value={{ projects, activeProject, setActiveProject, loading, error, refetch: load }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within a ProjectProvider');
  return ctx;
}
