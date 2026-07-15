"use client"

import { useState } from "react"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { useParams } from "next/navigation"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { useTodos } from "@/features/todos"
import type { TodoItemApi } from "@/features/todos"
import { isHttpNotFoundError } from "@/shared/lib/http-error"
import { cn } from "@/shared/lib/utils"

export function SubmissionChecklist() {
  const params = useParams()
  const projectId = (params?.id as string) ?? ""
  const {
    todos,
    summary,
    progress,
    isLoading,
    isError,
    error,
    createTodo,
    createPending,
    updateTodo,
    deleteTodo,
    updatePending,
    deletePending,
  } = useTodos(projectId)

  const [inputValue, setInputValue] = useState("")
  const isMutating = updatePending || deletePending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = inputValue.trim()
    if (!text || !projectId) return
    await createTodo({
      content: text,
      groupPath: [],
      required: false,
      isChecked: false,
    })
    setInputValue("")
  }

  const handleToggle = async (item: TodoItemApi) => {
    if (!projectId) return
    await updateTodo({
      todoId: item.id,
      body: { isChecked: !item.isChecked },
    })
  }

  const handleRemove = async (item: TodoItemApi) => {
    if (!projectId) return
    await deleteTodo(item.id)
  }

  const doneCount =
    summary?.completed ?? todos.filter((t) => t.isChecked).length
  const totalCount = summary?.total ?? todos.length
  const allChecked = totalCount > 0 && doneCount === totalCount

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-zinc-500">
        <Loader2 className="size-8 animate-spin text-zinc-400" />
        <p className="text-sm">제출 체크리스트를 불러오는 중...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
        <p
          className={
            isHttpNotFoundError(error)
              ? "max-w-md text-center text-sm text-zinc-600"
              : "max-w-md text-center text-sm text-red-600"
          }
        >
          {isHttpNotFoundError(error)
            ? "건축 제안서 작성 후 제출 체크리스트를 확인해주세요."
            : error instanceof Error
              ? error.message
              : "제출 체크리스트를 불러오지 못했습니다."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 제출 준비 현황 + 진행률 */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-medium text-zinc-800">제출 준비 현황</span>
          <span
            className={cn(
              "text-sm font-medium",
              allChecked ? "text-emerald-600" : "text-amber-600"
            )}
          >
            {doneCount} / {totalCount} 완료
            {summary?.completionRate != null &&
              ` (${Math.round(summary.completionRate * 100)}%)`}
          </span>
        </div>
        {progress && progress.overallCompletion != null && (
          <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${progress.overallCompletion * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* 새 할일 추가 */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="새 할일 추가..."
          className="flex-1 border-zinc-200"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!inputValue.trim() || !projectId || createPending}
        >
          {createPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
        </Button>
      </form>

      {/* 할일 목록 */}
      <ul className="space-y-2">
        {todos.length === 0 ? (
          <li className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center text-sm text-zinc-500">
            할일이 없습니다. 위 입력란에 새 할일을 추가해보세요.
          </li>
        ) : (
          todos.map((item) => (
            <li key={item.id}>
              <label
                className={cn(
                  "group flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 transition-colors hover:bg-zinc-50",
                  item.isChecked && "opacity-70"
                )}
              >
                <input
                  type="checkbox"
                  checked={item.isChecked}
                  onChange={() => handleToggle(item)}
                  disabled={isMutating}
                  className="size-4 rounded border-zinc-300"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
                  {item.groupPath.length > 0 && (
                    <span className="text-xs text-zinc-400">
                      {item.groupPath.join(" › ")}
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-sm",
                      item.isChecked
                        ? "text-zinc-500 line-through"
                        : "text-zinc-800"
                    )}
                  >
                    {item.content}
                  </span>
                  {item.required === true && (
                    <span className="text-xs font-medium text-amber-700">
                      필수
                    </span>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    handleRemove(item)
                  }}
                  disabled={isMutating}
                  className="size-8 shrink-0 p-0 text-zinc-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                  aria-label="삭제"
                >
                  <Trash2 className="size-4" />
                </Button>
              </label>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
