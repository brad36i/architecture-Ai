"use client"

import dynamic from "next/dynamic"

const Sidebar = dynamic(
  () => import("@/widgets/sidebar/sidebar").then((m) => ({ default: m.Sidebar })),
  {
    ssr: false,
    loading: () => (
      <aside
        className="fixed left-0 top-0 z-40 flex h-screen w-[220px] flex-col bg-zinc-800"
        aria-hidden
      />
    ),
  }
)

export function SidebarClient() {
  return <Sidebar />
}
