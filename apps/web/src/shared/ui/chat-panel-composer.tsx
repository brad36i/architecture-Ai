"use client"

import type { ComponentPropsWithoutRef } from "react"
import { Loader2, Send } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

/** Auto-resize textarea `style.maxHeight`와 맞춤 */
export const CHAT_PANEL_COMPOSER_MAX_INPUT_HEIGHT_PX = 120

export const chatPanelComposerFormClassName =
  "shrink-0 border-t border-zinc-300 bg-zinc-200/90 p-3"

export const chatPanelComposerStackClassName = "flex flex-col gap-2"

export const chatPanelComposerFieldClassName =
  "flex min-w-0 flex-col gap-1.5 rounded-md border border-zinc-300 bg-white/95 px-3 py-2 shadow-xs focus-within:ring-2 focus-within:ring-zinc-400 focus-within:ring-offset-0"

export const chatPanelComposerTextareaClassName =
  "min-h-[24px] min-w-[120px] w-full resize-none border-none bg-transparent py-1 text-sm text-zinc-800 outline-none placeholder:text-zinc-400"

export const chatPanelComposerFooterClassName =
  "flex items-center justify-between gap-2"

export function ChatPanelComposerForm({
  className,
  ...props
}: ComponentPropsWithoutRef<"form">) {
  return (
    <form className={cn(chatPanelComposerFormClassName, className)} {...props} />
  )
}

export function ChatPanelComposerField({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return <div className={cn(chatPanelComposerFieldClassName, className)} {...props} />
}

export function ChatPanelComposerFooter({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return <div className={cn(chatPanelComposerFooterClassName, className)} {...props} />
}

type ChatPanelComposerSendButtonProps = Omit<
  ComponentPropsWithoutRef<typeof Button>,
  "children" | "size"
> & {
  pending?: boolean
}

export function ChatPanelComposerSendButton({
  pending = false,
  className,
  disabled,
  type = "submit",
  "aria-label": ariaLabel = "보내기",
  ...props
}: ChatPanelComposerSendButtonProps) {
  return (
    <Button
      type={type}
      size="icon-sm"
      aria-label={ariaLabel}
      className={cn("shrink-0", className)}
      disabled={disabled}
      {...props}
    >
      {pending ? (
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
      ) : (
        <Send className="size-4 shrink-0" aria-hidden />
      )}
    </Button>
  )
}
