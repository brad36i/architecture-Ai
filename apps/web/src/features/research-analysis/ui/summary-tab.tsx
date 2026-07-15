"use client"

import { useMemo } from "react"
import type { Components } from "react-markdown"
import ReactMarkdown from "react-markdown"

function slugify(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()
}

function extractOutline(markdown: string): { level: 2 | 3; text: string; id: string }[] {
  const outline: { level: 2 | 3; text: string; id: string }[] = []
  const count = new Map<string, number>()
  for (const line of markdown.split("\n")) {
    const h2 = line.match(/^##\s+(.+)$/)
    const h3 = line.match(/^###\s+(.+)$/)
    if (h2) {
      const text = h2[1].replace(/\*\*/g, "").trim()
      const baseId = slugify(text)
      const n = (count.get(baseId) ?? 0) + 1
      count.set(baseId, n)
      outline.push({ level: 2, text, id: n === 1 ? baseId : `${baseId}-${n}` })
    } else if (h3) {
      const text = h3[1].replace(/\*\*/g, "").trim()
      const baseId = slugify(text)
      const n = (count.get(baseId) ?? 0) + 1
      count.set(baseId, n)
      outline.push({ level: 3, text, id: n === 1 ? baseId : `${baseId}-${n}` })
    }
  }
  return outline
}

function createHeadingComponents(outline: { level: 2 | 3; text: string; id: string }[]): Components {
  // children 텍스트를 기반으로 outline에서 매칭
  const findOutlineItem = (children: React.ReactNode) => {
    const text = String(children).replace(/\*\*/g, "").trim()
    return outline.find(item => item.text === text)
  }

  return {
    h2: ({ children }) => {
      const item = findOutlineItem(children)
      return <h2 id={item?.id} className="mt-6 scroll-mt-24 text-base font-semibold text-zinc-800 first:mt-0">{children}</h2>
    },
    h3: ({ children }) => {
      const item = findOutlineItem(children)
      return <h3 id={item?.id} className="mt-4 scroll-mt-24 text-sm font-semibold text-zinc-700">{children}</h3>
    },
    p: ({ children }) => <p className="leading-relaxed text-zinc-600">{children}</p>,
    ul: ({ children }) => <ul className="list-inside list-disc space-y-1 pl-5 text-zinc-600">{children}</ul>,
    li: ({ children }) => <li className="my-0.5">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold text-zinc-800">{children}</strong>,
  }
}

function OutlineSidebar({ outline }: { outline: { level: 2 | 3; text: string; id: string }[] }) {
  if (outline.length === 0) return null
  return (
    <aside className="w-[200px] shrink-0">
      <nav className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
        <h3 className="mb-3 text-xs font-semibold text-zinc-500">목차</h3>
        <ul className="space-y-1.5">
          {outline.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className={`block text-sm text-zinc-600 hover:text-zinc-900 ${item.level === 3 ? "pl-3" : "font-medium"}`}>
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

type SummaryTabProps = {
  summary: string
}

export function SummaryTab({ summary }: SummaryTabProps) {
  const outline = useMemo(() => extractOutline(summary), [summary])
  const markdownComponents = useMemo(() => createHeadingComponents(outline), [outline])

  return (
    <div className="flex h-full min-h-0 gap-6">
      <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <article className="h-full overflow-y-auto p-6">
          <div className="space-y-4 text-sm">
            <ReactMarkdown components={markdownComponents}>{summary}</ReactMarkdown>
          </div>
        </article>
      </div>
      <div className="shrink-0">
        <OutlineSidebar outline={outline} />
      </div>
    </div>
  )
}
