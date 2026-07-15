"use client"

import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { Tabs } from "@/shared/ui/tabs"
import { UnderlineTabList } from "@/shared/ui/underline-tab-list"

export interface FloatingLineTabItem {
  value: string
  label: React.ReactNode
  badge?: React.ReactNode
  disabled?: boolean
}

interface FloatingLineTabsProps {
  value: string
  onValueChange: (value: string) => void
  items: FloatingLineTabItem[]
  /** `light`: 밝은 배경용(진한 글자). `dark`: 어두운 배경용(흰 글자). 기본 dark */
  tone?: "light" | "dark"
  className?: string
  listClassName?: string
  triggerClassName?: string
  fullWidth?: boolean
}

export function FloatingLineTabs({
  value,
  onValueChange,
  items,
  tone = "dark",
  className,
  listClassName,
  triggerClassName,
  fullWidth = false,
}: FloatingLineTabsProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className={cn("shrink-0", className)}>
      <UnderlineTabList
        items={items}
        tone={tone}
        fullWidth={fullWidth}
        className={listClassName}
        triggerClassName={triggerClassName}
      />
    </Tabs>
  )
}
