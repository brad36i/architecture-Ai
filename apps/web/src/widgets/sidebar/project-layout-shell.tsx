"use client"

import {
  useSidebarStore,
  DEFAULT_SIDEBAR_WIDTH,
} from "./model/sidebarStore"
import { SidebarClient } from "./sidebar-client"

interface ProjectLayoutShellProps {
  projectId: string
  children: React.ReactNode
}

export function ProjectLayoutShell({ projectId, children }: ProjectLayoutShellProps) {
  void projectId
  const hasHydrated = useSidebarStore((s) => s._hasHydrated)
  const sidebarWidth = useSidebarStore((s) => s.sidebarWidth)

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarClient />
      <main
        className="flex flex-1 flex-col overflow-hidden transition-[margin] duration-150"
        style={{ marginLeft: hasHydrated ? sidebarWidth : DEFAULT_SIDEBAR_WIDTH }}
      >
        {children}
      </main>
    </div>
  )
}
