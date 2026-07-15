"use client"

import { usePathname } from "next/navigation"
import { ProjectsShell } from "@/widgets/projects-shell"

export default function ProjectsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const useProjectsShell = pathname === "/projects"

  if (!useProjectsShell) {
    return <>{children}</>
  }

  return <ProjectsShell>{children}</ProjectsShell>
}
