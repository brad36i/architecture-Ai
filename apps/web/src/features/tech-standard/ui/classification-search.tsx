"use client"

import { useState } from "react"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib/utils"
import type { ClassificationItem } from "@/features/tech-standard/model/mock"

export function ClassificationSearch({ items, onSelect, suggestedKeywords = [] }: {
  items: ClassificationItem[]
  onSelect: (item: ClassificationItem) => void
  suggestedKeywords?: string[]
}) {
  const [query, setQuery] = useState("")
  const filtered = query.trim() === ""
    ? items
    : items.filter((i) =>
        i.name.toLowerCase().includes(query.toLowerCase()) ||
        i.code.includes(query) ||
        i.path.toLowerCase().includes(query.toLowerCase())
      )

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Input placeholder="키워드 또는 코드 검색..." value={query} onChange={(e) => setQuery(e.target.value)} className="mb-3" />
      {suggestedKeywords.length > 0 && query === "" && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {suggestedKeywords.map((kw) => (
            <button key={kw} type="button" onClick={() => setQuery(kw)}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50">
              {kw}
            </button>
          ))}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">검색 결과가 없습니다.</p>
        ) : (
          <ul className="space-y-1">
            {filtered.map((item) => (
              <li key={item.code}>
                <button type="button" onClick={() => onSelect(item)}
                  className={cn("w-full rounded-md px-3 py-2 text-left text-sm transition-colors", "hover:bg-zinc-100")}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-zinc-900">{item.name}</span>
                    <span className="text-xs text-zinc-500">{item.code}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">{item.path}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
