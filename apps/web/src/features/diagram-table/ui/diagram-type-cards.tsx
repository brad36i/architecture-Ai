"use client"

import { Badge } from "@/shared/ui/badge"
import { cn } from "@/shared/lib/utils"
import type { DiagramTypeItem } from "@/features/diagram-table/model/mock"

export function DiagramTypeCards({ types, selectedId, onSelect }: {
  types: DiagramTypeItem[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {types.map((item) => (
        <button key={item.id} type="button" onClick={() => onSelect(item.id)}
          className={cn(
            "group flex flex-col items-start rounded-lg border bg-white p-4 text-left shadow-sm transition-all",
            "hover:border-zinc-300 hover:shadow-md",
            selectedId === item.id && "border-indigo-500 ring-2 ring-indigo-500/20"
          )}>
          <div className="flex w-full items-center justify-between gap-2">
            <span className="font-medium text-zinc-900">{item.label}</span>
            {item.badge && <Badge variant="secondary" className="shrink-0 text-xs">{item.badge}</Badge>}
          </div>
          <p className="mt-1.5 text-sm text-zinc-600">{item.description}</p>
        </button>
      ))}
    </div>
  )
}
