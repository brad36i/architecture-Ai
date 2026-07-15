"use client"

import { Badge } from "@/shared/ui/badge"
import type { SuggestionItem } from "@/features/differentiation/model/mock"

const priorityConfig = {
  high: { label: "높음", variant: "destructive" as const },
  medium: { label: "중간", variant: "secondary" as const },
  low: { label: "낮음", variant: "outline" as const },
}

export function SuggestionTab({ suggestions }: { suggestions: SuggestionItem[] }) {
  return (
    <div className="space-y-4 overflow-y-auto">
      <p className="text-sm text-zinc-600">약점에 대한 구체적 보완 제안입니다. 건축 제안서에 반영해 보세요.</p>
      {suggestions.map((item, idx) => {
        const config = priorityConfig[item.priority]
        return (
          <div key={idx} className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium text-zinc-800">{item.target}</span>
              <Badge variant={config.variant} className="shrink-0 text-xs">{config.label}</Badge>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">{item.suggestion}</p>
          </div>
        )
      })}
    </div>
  )
}
