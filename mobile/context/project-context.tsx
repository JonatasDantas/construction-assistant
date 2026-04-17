import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { projects, Project } from '@/data/mock-data';

const ACTIVE_PROJECT_KEY = 'active_project_id';

interface ProjectContextValue {
  activeProject: Project | null;
  setActiveProject: (id: string) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(projects[0]?.id ?? null);

  useEffect(() => {
    AsyncStorage.getItem(ACTIVE_PROJECT_KEY).then((stored) => {
      if (stored) setActiveProjectId(stored);
    });
  }, []);

  function setActiveProject(id: string) {
    setActiveProjectId(id);
    AsyncStorage.setItem(ACTIVE_PROJECT_KEY, id);
  }

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  return (
    <ProjectContext.Provider value={{ activeProject, setActiveProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within a ProjectProvider');
  return ctx;
}
