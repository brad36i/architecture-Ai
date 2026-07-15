"use client"

import { ExternalLink } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

interface IrisLinkProps {
  href: string
  className?: string
  onClick?: (e: React.MouseEvent) => void
}

/** 한국연구재단 IRIS 시스템 링크 버튼 */
export function IrisLink({ href, className, onClick }: IrisLinkProps) {
  return (
    <Button
      variant="outline"
      size="xs"
      asChild
      className={cn("h-6 gap-1 px-2 text-xs", className)}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
      >
        <ExternalLink className="size-3" />
        아이리스
      </a>
    </Button>
  )
}
