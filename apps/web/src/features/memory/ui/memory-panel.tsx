"use client"

import { useParams } from "next/navigation"
import {
  Brain,
  Zap,
  Users,
  BarChart3,
  Calendar,
  Loader2,
} from "lucide-react"
import { useMemorySidebar } from "@/features/memory/model/use-memory-sidebar"
import { useMemorySidebarUsage } from "@/features/memory/model/use-memory-sidebar-usage"
import { cn } from "@/shared/lib/utils"

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatUsd(value: number): string {
  if (value < 0.01 && value > 0) return "<$0.01"
  return `$${value.toFixed(2)}`
}

export function MemoryPanel() {
  const params = useParams()
  const projectId = (params?.id as string) ?? ""
  const { data: sidebar, isLoading: loadingSidebar } = useMemorySidebar(projectId)
  const { data: usage, isLoading: loadingUsage } = useMemorySidebarUsage(
    projectId,
    30
  )

  const isLoading = loadingSidebar || loadingUsage

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="size-8 animate-spin text-zinc-400" />
        <p className="text-sm">메모리 정보를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto">
      {/* 현재 단계 */}
      <section className="rounded-xs border border-zinc-700 bg-zinc-800/50 p-3">
        <h3 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          <Brain className="size-3.5" />
          현재 단계
        </h3>
        <p className="text-sm font-medium text-zinc-200">
          {sidebar?.currentStepLabel ?? "—"}
        </p>
        {sidebar?.sessionCount != null && (
          <p className="mt-1 text-xs text-zinc-500">
            세션 {sidebar.sessionCount}건
          </p>
        )}
      </section>

      {/* 토큰 사용량 요약 */}
      <section className="rounded-xs border border-zinc-700 bg-zinc-800/50 p-3">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          <Zap className="size-3.5" />
          사용량 요약
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <StatItem
            label="입력 토큰"
            value={formatNumber(sidebar?.totalInputTokens ?? 0)}
          />
          <StatItem
            label="출력 토큰"
            value={formatNumber(sidebar?.totalOutputTokens ?? 0)}
          />
          <StatItem
            label="사고 토큰"
            value={formatNumber(sidebar?.totalThinkingTokens ?? 0)}
          />
          <StatItem
            label="예상 비용"
            value={formatUsd(sidebar?.estimatedCostUsd ?? 0)}
          />
        </div>
      </section>

      {/* 최근 30일 사용량 */}
      {usage && (
        <section className="rounded-xs border border-zinc-700 bg-zinc-800/50 p-3">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            <Calendar className="size-3.5" />
            최근 30일 사용량
          </h3>
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
            <StatItem
              label="입력"
              value={formatNumber(usage.totalInputTokens ?? 0)}
            />
            <StatItem
              label="출력"
              value={formatNumber(usage.totalOutputTokens ?? 0)}
            />
            <StatItem
              label="사고"
              value={formatNumber(usage.totalThinkingTokens ?? 0)}
            />
            <StatItem
              label="비용"
              value={formatUsd(usage.estimatedCostUsd ?? 0)}
            />
          </div>

          {usage.byAgent && usage.byAgent.length > 0 && (
            <div className="mb-3">
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <Users className="size-3" />
                에이전트별
              </h4>
              <div className="space-y-2">
                {usage.byAgent.map((agent, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xs border border-zinc-700 bg-zinc-900/50 px-2 py-1.5 text-xs"
                  >
                    <span className="text-zinc-300">
                      {agent.agentName ?? agent.agentId ?? `알 수 없음`}
                    </span>
                    <span className="text-zinc-500">
                      {formatUsd(agent.costUsd ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {usage.byDate && usage.byDate.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <BarChart3 className="size-3" />
                일별
              </h4>
              <div className="max-h-32 space-y-1.5 overflow-auto">
                {usage.byDate.slice(0, 14).map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xs border border-zinc-700 bg-zinc-900/50 px-2 py-1.5 text-xs"
                  >
                    <span className="text-zinc-300">
                      {item.date ?? "—"}
                    </span>
                    <span className="text-zinc-500">
                      {formatUsd(item.costUsd ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!usage.byAgent || usage.byAgent.length === 0) &&
            (!usage.byDate || usage.byDate.length === 0) && (
              <p className="text-xs text-zinc-500">
                최근 30일 사용 내역이 없습니다.
              </p>
            )}
        </section>
      )}
    </div>
  )
}

function StatItem({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xs border border-zinc-700 bg-zinc-900/50 px-2 py-1.5",
        className
      )}
    >
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium tabular-nums text-zinc-300">{value}</span>
    </div>
  )
}
