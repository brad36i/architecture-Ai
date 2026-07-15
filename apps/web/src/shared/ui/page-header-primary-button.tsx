import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

export type PageHeaderPrimaryButtonProps = React.ComponentProps<typeof Button>

/** `PageHeader` 우측 주요 액션 (선행연구 조사 · 제출 체크리스트 등과 동일) */
export function PageHeaderPrimaryButton({
  className,
  variant = "default",
  size = "sm",
  ...props
}: PageHeaderPrimaryButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      {...props}
    />
  )
}

export type PageHeaderOutlineButtonProps = React.ComponentProps<typeof Button>

/** `PageHeader` 우측 보조 액션 (outline, 도식/표 상단 툴바와 동일 톤) */
export function PageHeaderOutlineButton({
  className,
  variant = "outline",
  size = "sm",
  ...props
}: PageHeaderOutlineButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "h-8 min-h-8 border-zinc-300 bg-white px-2.5 text-xs leading-none text-zinc-800 shadow-xs hover:bg-zinc-50",
        className
      )}
      {...props}
    />
  )
}
