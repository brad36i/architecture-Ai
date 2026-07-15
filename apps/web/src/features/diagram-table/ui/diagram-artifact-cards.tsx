"use client"

import { cn } from "@/shared/lib/utils"
import type { DiagramArtifact } from "@/features/diagram-table/model/mock"
import { ImageIcon, BarChart3Icon, CalendarIcon, Table2Icon } from "lucide-react"

const TYPE_ICONS = {
  concept: ImageIcon,
  roadmap: BarChart3Icon,
  gantt: CalendarIcon,
  comparison: Table2Icon,
}

const TYPE_LABELS: Record<string, string> = {
  concept: "연구개념도",
  roadmap: "기술로드맵",
  gantt: "Gantt 일정표",
  comparison: "선행기술 비교표",
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric", year: "numeric" })
}

export function DiagramArtifactCards({
  artifacts,
  selectedId,
  onSelect,
}: {
  artifacts: DiagramArtifact[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  if (artifacts.length === 0) {
    return (
      <div className="grid h-full place-items-center rounded-md border border-dashed border-zinc-300/80 bg-zinc-100/50 text-sm text-zinc-500">
        아직 생성된 이력이 없습니다.
      </div>
    )
  }

  return (
    <div className="flex h-full gap-3 overflow-x-auto pb-1">
      {artifacts.map((item) => {
        const Icon = TYPE_ICONS[item.type]
        const isSelected = selectedId === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              "flex h-full min-w-[220px] max-w-[260px] flex-col overflow-hidden rounded-md border border-zinc-200 bg-white/95 text-left shadow-xs transition",
              "hover:border-zinc-300 hover:shadow-sm",
              isSelected && "border-zinc-500 ring-2 ring-zinc-400/25"
            )}
          >
            <div className="flex h-[100px] w-full shrink-0 items-center justify-center overflow-hidden border-b border-zinc-200 bg-zinc-100/60">
              {item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt="" className="size-full object-cover" />
              ) : (
                <Icon className="size-8 text-zinc-400" aria-hidden />
              )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs text-zinc-500">{TYPE_LABELS[item.type] ?? item.type}</span>
                <span className="text-xs text-zinc-400">{formatDate(item.createdAt)}</span>
              </div>
              <div className="line-clamp-2 font-medium text-sm text-zinc-900">
                {item.caption}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
