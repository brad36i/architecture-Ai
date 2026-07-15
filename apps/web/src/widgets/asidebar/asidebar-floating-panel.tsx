"use client"

import { useState, useRef, useLayoutEffect } from "react"
import { ResizableBox } from "react-resizable"
import { X } from "lucide-react"
import { Button } from "@/shared/ui/button"
import {
  useAsidebarStore,
  DEFAULT_PANEL_WIDTH,
  MIN_PANEL_WIDTH,
  MAX_PANEL_WIDTH,
} from "@/shared/stores/asidebar-store"

interface AsidebarFloatingPanelProps {
  title: string
  children: React.ReactNode
  /** 헤더 제목 오른쪽 (닫기·제목과 같은 줄) */
  headerRight?: React.ReactNode
}

export function AsidebarFloatingPanel({
  title,
  children,
  headerRight,
}: AsidebarFloatingPanelProps) {
  const [panelHeight, setPanelHeight] = useState(600)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasHydrated = useAsidebarStore((s) => s._hasHydrated)
  const panelWidth = useAsidebarStore((s) => s.panelWidth)
  const setPanelWidth = useAsidebarStore((s) => s.setPanelWidth)
  const closePanel = useAsidebarStore((s) => s.closePanel)
  const resolvedPanelWidth = hasHydrated ? panelWidth : DEFAULT_PANEL_WIDTH

  useLayoutEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const updateHeight = () => {
      const h = el.offsetHeight || el.clientHeight || 600
      setPanelHeight(h > 0 ? h : 600)
    }
    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleResize = (
    _e: React.SyntheticEvent,
    data: { node: HTMLElement; size: { width: number; height: number } }
  ) => {
    setPanelWidth(data.size.width)
  }

  return (
    <div ref={containerRef} className="absolute right-full top-0 z-[110] h-full">
      <ResizableBox
        width={resolvedPanelWidth}
        height={panelHeight}
        axis="x"
        resizeHandles={["w"]}
        minConstraints={[MIN_PANEL_WIDTH, panelHeight]}
        maxConstraints={[MAX_PANEL_WIDTH, panelHeight]}
        onResize={handleResize}
        handle={(_, ref) => (
          <div
            ref={ref}
            className="absolute left-0 top-0 z-10 h-full w-3 cursor-ew-resize bg-transparent opacity-0 transition-opacity hover:bg-zinc-600/50 hover:opacity-100"
            aria-hidden
          />
        )}
        className="asidebar-resizable asidebar-floating-panel flex h-full flex-col border-l border-zinc-700 bg-zinc-800 shadow-xl"
      >
        <div className="flex h-full flex-col">
          <div className="flex shrink-0 items-center gap-2 border-b border-zinc-700 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-zinc-400 hover:bg-zinc-700 hover:text-white"
              onClick={closePanel}
              aria-label="닫기"
            >
              <X className="size-4" />
            </Button>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-200">
              {title}
            </span>
            {headerRight ? (
              <div className="flex shrink-0 items-center">{headerRight}</div>
            ) : null}
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
            {children}
          </div>
        </div>
      </ResizableBox>
    </div>
  )
}
