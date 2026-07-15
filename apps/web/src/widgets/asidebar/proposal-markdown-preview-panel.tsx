"use client"

import { useMemo } from "react"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import type { Components } from "react-markdown"
import ReactMarkdown from "react-markdown"
import { useProposalDraft, useResearchPlanStore } from "@/features/research-plan"

const mdComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-3 mt-5 text-base font-semibold text-zinc-100 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 text-sm font-semibold text-zinc-100">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-3 text-sm font-medium text-zinc-200">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="leading-relaxed text-zinc-300">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-inside list-disc space-y-1 pl-1 text-zinc-300">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-inside list-decimal space-y-1 pl-1 text-zinc-300">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-zinc-100">{children}</strong>
  ),
  em: ({ children }) => <em className="text-zinc-200">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-zinc-500 pl-3 text-zinc-400">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const inline = !className
    if (inline) {
      return (
        <code className="rounded bg-zinc-900 px-1 py-0.5 font-mono text-xs text-zinc-200">
          {children}
        </code>
      )
    }
    return (
      <code className="font-mono text-xs text-zinc-200">{children}</code>
    )
  },
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-md bg-zinc-900 p-3 text-xs">{children}</pre>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-sky-400 underline-offset-2 hover:underline"
      target="_blank"
      rel="noreferrer noopener"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-4 border-zinc-600" />,
}

function resolveSessionId(
  pageSlug: string,
  urlSession: number,
  projectId: string,
  storeProjectId: string | null,
  storeSessionId: number
): number {
  if (pageSlug === "research-plan") return urlSession
  if (storeProjectId === projectId && projectId) return storeSessionId
  return 1
}

export function ProposalMarkdownPreviewPanel() {
  const params = useParams()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const projectId = (params?.id as string) ?? ""

  const pathParts = pathname.split("/").filter(Boolean)
  const pageSlug = pathParts[2] ?? ""

  const sessionParam = Number(searchParams.get("sessionId") ?? "1")
  const urlSession =
    Number.isFinite(sessionParam) && sessionParam > 0 ? sessionParam : 1

  const storeProjectId = useResearchPlanStore((s) => s.projectId)
  const storeSessionId = useResearchPlanStore((s) => s.sessionId)

  const sessionId = useMemo(
    () =>
      resolveSessionId(
        pageSlug,
        urlSession,
        projectId,
        storeProjectId,
        storeSessionId
      ),
    [pageSlug, urlSession, projectId, storeProjectId, storeSessionId]
  )

  const { data, isPending, isError, error } = useProposalDraft(
    projectId,
    sessionId
  )

  const markdown = data?.proposalContent?.trim() ?? ""

  if (!projectId) {
    return (
      <p className="text-center text-sm text-zinc-500">
        프로젝트를 선택한 뒤 미리보기를 열어 주세요.
      </p>
    )
  }

  if (isPending) {
    return (
      <p className="text-center text-sm text-zinc-400">
        건축 제안서 내용을 불러오는 중…
      </p>
    )
  }

  if (isError) {
    return (
      <p className="text-center text-sm text-red-400">
        {error instanceof Error && error.message
          ? error.message
          : "건축 제안서를 불러올 수 없습니다."}
      </p>
    )
  }

  if (!markdown) {
    return (
      <p className="text-center text-sm text-zinc-500">
        저장된 건축 제안서 본문이 없습니다.
      </p>
    )
  }

  return (
    <div className="min-h-0 flex-1 select-text">
      <p className="mb-3 text-xs text-zinc-500">
        세션 {sessionId} · 서버에 저장된 초안(읽기 전용)
      </p>
      <article className="max-w-none space-y-2 text-sm [&_*:first-child]:mt-0">
        <ReactMarkdown components={mdComponents}>{markdown}</ReactMarkdown>
      </article>
    </div>
  )
}
