"use client"

import { Sparkles } from "lucide-react"
import { useParams } from "next/navigation"

import {
  ComparisonReviewPanel,
  useDifferentiationReview,
} from "@/features/differentiation"
import { isHttpNotFoundError } from "@/shared/lib/http-error"
import { PageHeader } from "@/shared/ui/page-header"
import { PageHeaderPrimaryButton } from "@/shared/ui/page-header-primary-button"

export function DifferentiationView() {
  const params = useParams()
  const projectId = (params?.id as string) ?? ""
  const { query, runReview } = useDifferentiationReview(projectId || undefined)
  const handleRunReviewClick = (source: "header" | "empty-state") => {
    console.info("[differentiation][view][run-review-click]", {
      source,
      projectId,
    })
    runReview.mutate()
  }

  const reviewButton = (
    <PageHeaderPrimaryButton
      onClick={() => handleRunReviewClick("header")}
      disabled={runReview.isPending || !projectId}
    >
      <Sparkles className="mr-2 size-4" />
      {runReview.isPending ? "검토 중…" : "차별성 검토하기"}
    </PageHeaderPrimaryButton>
  )

  return (
    <div className="flex min-h-full flex-col bg-zinc-100">
      <PageHeader
        title="차별성 검토"
        description="계획설계 단계의 구조·설비·친환경 방향과 대안별 장단점을 비교해 최종 계획안을 확정하세요."
        action={reviewButton}
      />
      <div className="flex min-h-0 flex-1 flex-col p-6 pb-12">
        {query.isPending ? (
          <p className="text-sm text-zinc-500">차별성 검토를 불러오는 중…</p>
        ) : query.isError ? (
          <div className="flex flex-1 flex-col items-center justify-center">
            <p
              className={
                isHttpNotFoundError(query.error)
                  ? "max-w-md text-center text-sm text-zinc-600"
                  : "max-w-md text-center text-sm text-red-600"
              }
            >
              {isHttpNotFoundError(query.error)
                ? "차별성 검토를 시작해주세요."
                : query.error instanceof Error
                  ? query.error.message
                  : "차별성 검토를 불러올 수 없습니다. API 서버 연결을 확인해 주세요."}
            </p>
          </div>
        ) : query.data?.kind === "empty" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-16">
            <p className="max-w-md text-center text-sm text-zinc-600">
              {query.data.detail}
            </p>
            <PageHeaderPrimaryButton
              onClick={() => handleRunReviewClick("empty-state")}
              disabled={runReview.isPending || !projectId}
            >
              <Sparkles className="mr-2 size-4" />
              {runReview.isPending ? "검토 중…" : "차별성 검토하기"}
            </PageHeaderPrimaryButton>
            {runReview.isError ? (
              <p
                className={
                  isHttpNotFoundError(runReview.error)
                    ? "max-w-md text-center text-sm text-zinc-600"
                    : "max-w-md text-center text-sm text-red-600"
                }
              >
                {isHttpNotFoundError(runReview.error)
                  ? "차별성 검토를 시작해주세요."
                  : runReview.error instanceof Error
                    ? runReview.error.message
                    : "차별성 검토 실행에 실패했습니다."}
              </p>
            ) : null}
          </div>
        ) : query.data?.kind === "review" ? (
          <>
            {runReview.isError ? (
              <p
                className={
                  isHttpNotFoundError(runReview.error)
                    ? "mb-4 text-sm text-zinc-600"
                    : "mb-4 text-sm text-red-600"
                }
              >
                {isHttpNotFoundError(runReview.error)
                  ? "차별성 검토를 시작해주세요."
                  : runReview.error instanceof Error
                    ? runReview.error.message
                    : "차별성 검토 실행에 실패했습니다."}
              </p>
            ) : null}
            <ComparisonReviewPanel review={query.data.data} />
          </>
        ) : null}
      </div>
    </div>
  )
}
