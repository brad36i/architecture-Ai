"use client"

import { useCallback, useState } from "react"
import {
  Upload,
  FileText,
  Trash2,
  Pin,
  PinOff,
  Loader2,
} from "lucide-react"
import { useParams } from "next/navigation"
import { useProjectFilesPanel } from "@/features/project-files/model/use-project-files-panel"
import { DeleteConfirmModal } from "@/shared/ui/delete-confirm-modal"
import type { ProjectFileRecord } from "@/features/project-files/model/types"
import { cn } from "@/shared/lib/utils"

export function FilePanel() {
  const params = useParams()
  const projectId = (params?.id as string) ?? ""
  const {
    files,
    isLoading,
    upload,
    uploadPending,
    deleteFile,
    deletePending,
    pinFile,
    pinPending,
    pinVariables,
    pinError,
    resetPin,
  } = useProjectFilesPanel(projectId)

  const [deleteTarget, setDeleteTarget] = useState<ProjectFileRecord | null>(
    null
  )
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const items = e.dataTransfer.files
      if (!items?.length || !projectId) return
      const file = items[0]
      if (file) upload(file)
    },
    [projectId, upload]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file && projectId) upload(file)
      e.target.value = ""
    },
    [projectId, upload]
  )

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return
    await deleteFile(deleteTarget.id)
    setDeleteTarget(null)
  }, [deleteTarget, deleteFile])

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="size-8 animate-spin text-zinc-400" />
        <p className="text-sm">파일 목록을 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* 드래그앤드롭 업로드 영역 */}
      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xs border-2 border-dashed p-6 transition-colors",
          dragOver
            ? "border-zinc-500 bg-zinc-700/50"
            : "border-zinc-600 bg-zinc-800/50 hover:border-zinc-500 hover:bg-zinc-700/30"
        )}
      >
        <input
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploadPending || !projectId}
        />
        {uploadPending ? (
          <Loader2 className="mb-2 size-8 animate-spin text-zinc-400" />
        ) : (
          <Upload className="mb-2 size-8 text-zinc-500" />
        )}
        <p className="text-sm text-zinc-400">
          {uploadPending ? "업로드 중..." : "파일을 드래그하거나 클릭하여 업로드"}
        </p>
      </label>

      {/* 파일 카드 목록 */}
      <div className="flex-1 space-y-2 overflow-auto">
        {pinError && (
          <p className="rounded-xs border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {pinError.message}
            <button
              type="button"
              className="ml-2 underline"
              onClick={() => resetPin()}
            >
              닫기
            </button>
          </p>
        )}
        {files.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-500">
            업로드된 파일이 없습니다
          </p>
        ) : (
          files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              pinBusy={pinPending && pinVariables?.fileId === file.id}
              onDelete={() => setDeleteTarget(file)}
              onPin={() => {
                resetPin()
                void pinFile({ fileId: file.id, pinned: !file.isPinned })
              }}
            />
          ))
        )}
      </div>

      <DeleteConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deletePending}
      />
    </div>
  )
}

interface FileCardProps {
  file: ProjectFileRecord
  pinBusy?: boolean
  onDelete: () => void
  onPin: () => void
}

function FileCard({ file, pinBusy, onDelete, onPin }: FileCardProps) {
  const date = new Date(file.createdAt)
  const formattedDate = date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  const statusLabel =
    file.status === "pending"
      ? "처리 중"
      : file.status === "error"
        ? "오류"
        : null

  return (
    <div className="group rounded-xs border border-zinc-700 bg-zinc-800 p-3">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xs bg-zinc-700">
          <FileText className="size-4 text-zinc-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-200">
            {file.fileName}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
            <span>{formattedDate}</span>
            {statusLabel && (
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-xs",
                  file.status === "error" && "bg-red-500/20 text-red-400",
                  file.status === "pending" && "bg-amber-500/20 text-amber-400"
                )}
              >
                {statusLabel}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onPin}
            disabled={pinBusy}
            className="rounded-xs p-1.5 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-40"
            title={file.isPinned ? "고정 해제" : "고정"}
            aria-label={file.isPinned ? "고정 해제" : "고정"}
            aria-busy={pinBusy}
          >
            {pinBusy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : file.isPinned ? (
              <PinOff className="size-3.5" />
            ) : (
              <Pin className="size-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-xs p-1.5 text-zinc-500 hover:bg-zinc-700 hover:text-red-400"
            title="삭제"
            aria-label="삭제"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
