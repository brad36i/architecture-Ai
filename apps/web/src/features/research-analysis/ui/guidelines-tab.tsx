"use client"

import { useState, useEffect } from "react"
import { Button } from "@/shared/ui/button"
import { useProjectGuidelines, useUpdateProjectGuidelines } from "../model/use-project-guidelines"

type GuidelinesTabProps = {
  projectId: string
}

export function GuidelinesTab({ projectId }: GuidelinesTabProps) {
  const { data: guidelines, isPending, isError } = useProjectGuidelines(projectId)
  const { mutate: updateGuidelines, isPending: isSaving } =
    useUpdateProjectGuidelines(projectId)
  const [value, setValue] = useState("")

  useEffect(() => {
    queueMicrotask(() => setValue(guidelines ?? ""))
  }, [guidelines])

  const handleSave = () => {
    updateGuidelines({ content: value })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault()
      handleSave()
    }
  }

  if (isPending) {
    return <p className="p-6 text-sm text-zinc-500">로딩 중...</p>
  }

  if (isError) {
    return (
      <p className="p-6 text-sm text-red-500">
        GUIDELINES를 불러올 수 없습니다. API 서버 연결을 확인해 주세요.
      </p>
    )
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col gap-2"
      onKeyDown={handleKeyDown}
    >
      <div className="flex shrink-0 items-center justify-between gap-2">
        <p className="text-xs text-zinc-500">
          AI가 생성한 지침을 수정할 수 있습니다. 건축 제안서 작성 시 참조됩니다.
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "저장 중..." : "저장"}
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-full w-full resize-none overflow-y-auto rounded-lg border-0 p-4 font-mono text-sm leading-relaxed text-zinc-800 outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-inset"
          placeholder="# 건축 제안서 작성 지침..."
          spellCheck={false}
        />
      </div>
    </div>
  )
}
