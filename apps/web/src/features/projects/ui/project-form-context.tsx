"use client"

import { createContext, useContext, useState, useCallback } from "react"
import { ProjectFormModal } from "./project-form-modal"
import type { OpenNewProjectOptions, ProjectCard } from "@/features/projects"

interface ProjectFormContextValue {
  openNewProject: (options?: OpenNewProjectOptions) => void
  openEditProject: (project: ProjectCard) => void
}

const ProjectFormContext = createContext<ProjectFormContextValue | null>(null)

export function ProjectFormProvider({ children }: { children: React.ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectCard | null>(null)
  const [createPrefill, setCreatePrefill] = useState<OpenNewProjectOptions | null>(null)

  const openNewProject = useCallback((options?: OpenNewProjectOptions) => {
    setEditingProject(null)
    setCreatePrefill(
      options?.ezrndNoticeId?.trim() ? { ezrndNoticeId: options.ezrndNoticeId.trim() } : null
    )
    setModalOpen(true)
  }, [])

  const openEditProject = useCallback((project: ProjectCard) => {
    setCreatePrefill(null)
    setEditingProject(project)
    setModalOpen(true)
  }, [])

  return (
    <ProjectFormContext.Provider value={{ openNewProject, openEditProject }}>
      {children}
      <ProjectFormModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) {
            setEditingProject(null)
            setCreatePrefill(null)
          }
        }}
        project={editingProject}
        createPrefill={createPrefill}
      />
    </ProjectFormContext.Provider>
  )
}

export function useProjectForm() {
  const ctx = useContext(ProjectFormContext)
  if (!ctx) {
    throw new Error("useProjectForm must be used within ProjectFormProvider")
  }
  return ctx
}
