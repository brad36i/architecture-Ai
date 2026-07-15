"use client"

import { RefreshCw } from "lucide-react"
import { useParams } from "next/navigation"

import { SubmissionChecklist } from "@/features/submission-checklist/ui/submission-checklist"
import { useTodos } from "@/features/todos"
import { cn } from "@/shared/lib/utils"
import { PageHeader } from "@/shared/ui/page-header"
import { PageHeaderPrimaryButton } from "@/shared/ui/page-header-primary-button"

export function SubmissionChecklistView() {
  const params = useParams()
  const projectId = (params?.id as string) ?? ""
  const { refetch, isFetching } = useTodos(projectId || undefined)

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title="제출 체크리스트"
        description="건축 제안서 제출 전 필수 항목을 확인하세요. 모든 항목을 체크한 후 제출할 수 있습니다."
        action={
          <PageHeaderPrimaryButton
            type="button"
            onClick={() => void refetch()}
            disabled={!projectId || isFetching}
          >
            <RefreshCw
              className={cn("mr-2 size-4", isFetching && "animate-spin")}
            />
            {isFetching ? "불러오는 중…" : "체크리스트 새로고침"}
          </PageHeaderPrimaryButton>
        }
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 pt-0">
        <SubmissionChecklist />
      </div>
    </div>
  )
}
