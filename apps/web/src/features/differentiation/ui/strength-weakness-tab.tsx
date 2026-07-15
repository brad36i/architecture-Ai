"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import type { StrengthWeaknessItem } from "@/features/differentiation/model/mock"

export function StrengthWeaknessTab({ items }: { items: StrengthWeaknessItem[] }) {
  const strengths = items.filter((i) => i.type === "strength")
  const weaknesses = items.filter((i) => i.type === "weakness")

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto">
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-800">
          <TrendingUp className="size-4 text-emerald-500" />강점
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {strengths.map((item, idx) => (
            <div key={`s-${idx}`} className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-4">
              <div className="font-medium text-emerald-800">{item.title}</div>
              <p className="mt-1 text-sm text-emerald-700/90">{item.content}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-800">
          <TrendingDown className="size-4 text-amber-500" />약점
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {weaknesses.map((item, idx) => (
            <div key={`w-${idx}`} className="rounded-lg border border-amber-200 bg-amber-50/30 p-4">
              <div className="font-medium text-amber-800">{item.title}</div>
              <p className="mt-1 text-sm text-amber-700/90">{item.content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
