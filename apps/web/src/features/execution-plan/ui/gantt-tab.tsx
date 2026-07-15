"use client"

import { cn } from "@/shared/lib/utils"
import type { GanttTask } from "@/features/execution-plan/model/mock"

const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"]

/** 10·11·12월(두 자리) 기준으로 모든 월 칼럼 너비를 동일하게 유지 */
const MONTH_COL = "w-10 min-w-10 max-w-10 border border-zinc-200 px-0 text-center tabular-nums"

export function GanttTab({ tasks }: { tasks: GanttTask[] }) {
  const years = [...new Set(tasks.map((t) => t.year))].sort()
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[500px] table-fixed border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-40 border border-zinc-200 bg-zinc-100 px-3 py-2 text-left font-medium text-zinc-800">과제</th>
            {years.map((year) => (
              <th key={year} colSpan={12} className="border border-zinc-200 bg-zinc-100 px-2 py-2 text-center font-medium text-zinc-800">
                {year}년차
              </th>
            ))}
          </tr>
          <tr>
            <th className="border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-left text-xs text-zinc-600">월</th>
            {years.flatMap((year) =>
              MONTHS.map((m, i) => (
                <th
                  key={`${year}-${i}`}
                  className={cn(MONTH_COL, "bg-zinc-50 py-1.5 text-xs text-zinc-500")}
                >
                  {m.replace("월", "")}
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td className="border border-zinc-200 px-3 py-2 font-medium text-zinc-800">{task.name}</td>
              {years.flatMap((year) => {
                const bars = Array(12).fill(null)
                if (task.year === year) {
                  for (let m = task.startMonth; m <= task.endMonth; m++) bars[m - 1] = true
                }
                return bars.map((filled, idx) => (
                  <td key={`${year}-${idx}`} className={cn(MONTH_COL, "py-1 align-middle")}>
                    <div
                      className={cn(
                        "mx-0.5 h-6 rounded-none",
                        filled ? "bg-primary" : "bg-transparent"
                      )}
                    />
                  </td>
                ))
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
