"use client"

import { StateTag } from "@/shared/ui/state-tag"
import { cn } from "@/shared/lib/utils"
import type { DocumentType } from "../model/types"

const DOCUMENT_TYPE_CONFIG: Record<DocumentType, { label: string }> = {
  report: { label: "건축사례" },
  paper: { label: "논문" },
  patent: { label: "특허" },
  article: { label: "기사" },
  blog: { label: "블로그" },
}

export function DocumentTypeTag({
  type,
  className,
}: {
  type: DocumentType
  className?: string
}) {
  const { label } = DOCUMENT_TYPE_CONFIG[type]
  return (
    <StateTag variant="green" bordered className={cn(className)}>
      {label}
    </StateTag>
  )
}
