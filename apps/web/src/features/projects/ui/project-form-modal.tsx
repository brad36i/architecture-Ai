"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import type {
  ProjectCard,
  OpenNewProjectOptions,
  ProjectInitDetailRequest,
} from "@/features/projects"
import { useInitProjectDetail, useUpdateProject } from "@/features/projects"
import { API_BASE } from "@/shared/config/api"

type ProjectFormState = Omit<ProjectCard, "id" | "editedAt" | "starred">

type ProjectFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 편집 시 프로젝트 데이터, 없으면 생성 모드 */
  project?: ProjectCard | null
  /** 생성 모드일 때만 적용되는 프리필 */
  createPrefill?: OpenNewProjectOptions | null
  onSuccess?: () => void
}

const DEFAULT_FORM: ProjectFormState = {
  topic: "",
  supportProjectName: "",
  organizingInstitution: "",
  totalBudget: "",
  applicationPeriod: "",
  competitionType: "자유공모",
  irisUrl: "",
  ezrndNoticeId: "",
}

export function ProjectFormModal({
  open,
  onOpenChange,
  project,
  createPrefill,
  onSuccess,
}: ProjectFormModalProps) {
  const isEdit = !!project?.id
  const [form, setForm] = useState<ProjectFormState>(DEFAULT_FORM)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const { mutateAsync: initProjectDetail, isPending: isCreating } = useInitProjectDetail()
  const { mutateAsync: updateProject, isPending: isUpdating } = useUpdateProject()
  const isPending = isCreating || isUpdating || isUploading

  useEffect(() => {
    if (!open) return
    queueMicrotask(() => {
      setSubmitError(null)
      setSelectedFiles([])
      setForm(
        project
          ? {
              topic: project.topic,
              supportProjectName: project.supportProjectName,
              organizingInstitution: project.organizingInstitution,
              totalBudget: project.totalBudget,
              applicationPeriod: project.applicationPeriod,
              competitionType: project.competitionType,
              irisUrl: project.irisUrl ?? "",
              ezrndNoticeId: project.ezrndNoticeId ?? "",
            }
          : {
              ...DEFAULT_FORM,
              ...(createPrefill?.ezrndNoticeId
                ? { ezrndNoticeId: createPrefill.ezrndNoticeId }
                : {}),
            }
      )
    })
  }, [open, project, createPrefill])

  const uploadProjectFiles = async (projectId: string) => {
    if (selectedFiles.length === 0) return

    const body = new FormData()
    selectedFiles.forEach((file) => body.append("files", file))

    setIsUploading(true)
    try {
      const res = await fetch(`${API_BASE}/api/v2/projects/${projectId}/files`, {
        method: "POST",
        body,
      })
      if (!res.ok) {
        throw new Error("파일 업로드에 실패했습니다.")
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    if (isEdit && project) {
      if (!form.topic.trim()) {
        setSubmitError("건축 프로젝트명을 입력해 주세요.")
        return
      }
      try {
        await updateProject({
          id: project.id,
          topic: form.topic,
          editedAt: "방금 전 편집",
        })
        onOpenChange(false)
        onSuccess?.()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "건축 프로젝트를 저장할 수 없습니다.")
      }
      return
    }
    const projectName = form.topic.trim()
    if (!projectName) {
      setSubmitError("건축 프로젝트명을 입력해 주세요.")
      return
    }
    const noticeId =
      form.ezrndNoticeId?.trim() ||
      createPrefill?.ezrndNoticeId?.trim() ||
      `manual-${crypto.randomUUID()}`
    const payload: ProjectInitDetailRequest = {
      noticeId,
      noticeTitle: projectName,
    }
    try {
      const data = await initProjectDetail(payload)
      try {
        await uploadProjectFiles(String(data.projectId))
        toast.success(
          selectedFiles.length > 0
            ? "건축 프로젝트와 첨부파일을 저장했습니다."
            : data.message
        )
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "파일 업로드에 실패했습니다.")
        toast.success(data.message)
      }
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "건축 프로젝트를 만들 수 없습니다.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "건축 프로젝트 편집" : "건축 프로젝트 만들기"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              건축 프로젝트명
            </label>
            <Input
              value={form.topic}
              onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
              placeholder="예: AI 기반 스마트 건축물 에너지 최적화 설계"
              required
              aria-invalid={!!submitError}
            />
          </div>
          {!isEdit ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                파일 업로드
              </label>
              <Input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.hwp,.hwpx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
                onChange={(e) => setSelectedFiles(Array.from(e.target.files ?? []))}
                disabled={isPending}
                className="cursor-pointer"
              />
              <p className="mt-1 text-xs text-zinc-500">
                공고문, 지침서, 대지 자료, 도면, 이미지 등을 첨부할 수 있습니다. 파일당 최대 25MB, 최대 10개.
              </p>
              {selectedFiles.length > 0 ? (
                <ul className="mt-2 space-y-1 rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-600">
                  {selectedFiles.map((file) => (
                    <li
                      key={`${file.name}-${file.lastModified}`}
                      className="flex justify-between gap-2"
                    >
                      <span className="min-w-0 truncate">{file.name}</span>
                      <span className="shrink-0">
                        {Math.ceil(file.size / 1024).toLocaleString()}KB
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          {submitError ? (
            <p className="text-sm text-red-600" role="alert">
              {submitError}
            </p>
          ) : null}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isUploading ? "파일 업로드 중..." : isPending ? "저장 중..." : isEdit ? "저장" : "만들기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
