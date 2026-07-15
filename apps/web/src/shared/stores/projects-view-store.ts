'use client';

import { create } from 'zustand';

export type SidebarProjectItem = {
  id: string;
  topic: string;
  starred: boolean;
};

export type SidebarSection =
  | 'rnd-recommendations'
  | 'research-plans'
  | 'profile'
  | 'favorites';

type ProjectsViewState = {
  sidebarSection: SidebarSection;
  setSidebarSection: (section: SidebarSection) => void;
  sidebarProjects: SidebarProjectItem[];
  setSidebarProjects: (projects: SidebarProjectItem[]) => void;
};

export const useProjectsViewStore = create<ProjectsViewState>()((set) => ({
  sidebarSection: 'research-plans',
  setSidebarSection: (section) => set({ sidebarSection: section }),
  sidebarProjects: [],
  setSidebarProjects: (projects) => set({ sidebarProjects: projects }),
}));
