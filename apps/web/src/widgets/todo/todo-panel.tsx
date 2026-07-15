"use client"

import { useState } from "react"
import { Plus, Trash2, Check, Circle, Loader2 } from "lucide-react"
import { useParams } from "next/navigation"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib/utils"
import { useTodos } from "@/features/todos"
import type { TodoItemApi } from "@/features/todos"

export function TodoPanel() {
  const params = useParams()
  const projectId = (params?.id as string) ?? ""
  const {
    todos,
    summary,
    progress,
    isLoading,
    createTodo,
    createPending,
    updateTodo,
    deleteTodo,
    updatePending,
    deletePending,
  } = useTodos(projectId)

  const isMutating = updatePending || deletePending

  const [inputValue, setInputValue] = useState("")

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

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="size-8 animate-spin text-zinc-400" />
        <p className="text-sm">할일 목록을 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* 입력 폼 */}
      <form
        onSubmit={handleSubmit}
        className="mb-4 flex gap-2 border-b border-zinc-700 pb-3"
      >
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="새 할일 추가..."
          className="flex-1 border-zinc-600 bg-zinc-900 text-zinc-200 placeholder:text-zinc-500"
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

      {/* 진행률 (progress API) */}
      {progress && (
        <div className="mb-3 rounded-xs border border-zinc-700 bg-zinc-800/50 p-3">
          <p className="mb-1 text-xs font-medium text-zinc-400">
            {progress.currentStepLabel}
          </p>
          {progress.overallCompletion != null && (
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-700">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${progress.overallCompletion * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* 완료 현황 */}
      {totalCount > 0 && (
        <p className="mb-3 text-xs text-zinc-500">
          {doneCount}/{totalCount} 완료
          {summary?.completionRate != null &&
            ` (${Math.round(summary.completionRate * 100)}%)`}
        </p>
      )}

      {/* 리스트 */}
      <div className="flex-1 space-y-2 overflow-auto">
        {todos.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-zinc-500">
            <Circle className="mb-2 size-10 text-zinc-600" />
            <p className="text-sm">할일이 없습니다</p>
            <p className="mt-1 text-xs text-zinc-600">
              위 입력란에 새 할일을 추가해보세요
            </p>
          </div>
        ) : (
          todos.map((item) => (
            <TodoItem
              key={item.id}
              item={item}
              onToggle={() => handleToggle(item)}
              onRemove={() => handleRemove(item)}
              disabled={isMutating}
            />
          ))
        )}
      </div>
    </div>
  )
}

function TodoItem({
  item,
  onToggle,
  onRemove,
  disabled,
}: {
  item: TodoItemApi
  onToggle: () => void
  onRemove?: () => void
  disabled?: boolean
}) {
  const isDone = item.isChecked
  const canDelete = !!onRemove

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-xs border border-zinc-700 bg-zinc-800 px-3 py-2",
        isDone && "opacity-60"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="shrink-0 text-zinc-400 hover:text-emerald-400 disabled:opacity-50"
        aria-label={isDone ? "완료 취소" : "완료"}
      >
        {isDone ? (
          <Check className="size-5 text-emerald-500" />
        ) : (
          <Circle className="size-5" />
        )}
      </button>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        {item.groupPath.length > 0 && (
          <span className="text-xs text-zinc-500">
            {item.groupPath.join(" › ")}
          </span>
        )}
        <span
          className={cn(
            "text-sm text-zinc-300",
            isDone && "line-through text-zinc-500"
          )}
        >
          {item.content}
        </span>
        {item.required === true && (
          <span className="text-xs font-medium text-amber-500/90">필수</span>
        )}
      </span>
      {canDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={disabled}
          className="size-6 shrink-0 p-0 text-zinc-500 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
          aria-label="삭제"
        >
          <Trash2 className="size-3.5" />
        </Button>
      )}
    </div>
  )
}
