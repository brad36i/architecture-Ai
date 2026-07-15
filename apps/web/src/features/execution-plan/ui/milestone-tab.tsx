"use client"

import { Flag, FileText } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import type { MilestoneItem } from "@/features/execution-plan/model/mock"

export function MilestoneTab({ milestones }: { milestones: MilestoneItem[] }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">주요 이정표와 산출물을 확인하세요.</p>
      <div className="space-y-3">
        {milestones.map((m) => (
          <div key={m.id} className="flex gap-4 rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-100">
              <Flag className="size-5 text-indigo-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-zinc-900">{m.title}</h3>
                <span className="shrink-0 text-sm text-zinc-500">{m.dueDate}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-zinc-600">
                <FileText className="size-4 shrink-0" />{m.deliverable}
              </div>
              <span className={cn("mt-2 inline-block rounded px-2 py-0.5 text-xs",
                m.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600")}>
                {m.status === "completed" ? "완료" : "예정"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
