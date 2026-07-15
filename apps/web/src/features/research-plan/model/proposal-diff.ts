interface UnifiedDiffHunk {
  oldStart: number
  oldCount: number
  newStart: number
  newCount: number
  lines: string[]
}

function normalizeUnifiedDiffText(diffText: string) {
  return diffText
    .replace(/\r\n/g, "\n")
    .replace(/(--- [^\n]*?)(?=\+\+\+ )/g, "$1\n")
    .replace(/(\+\+\+ [^\n]*?)(?=@@ -)/g, "$1\n")
}

function parseUnifiedDiff(diffText: string): UnifiedDiffHunk[] {
  const lines = normalizeUnifiedDiffText(diffText).split("\n")
  const hunks: UnifiedDiffHunk[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const match = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line)

    if (!match) {
      index += 1
      continue
    }

    const hunk: UnifiedDiffHunk = {
      oldStart: Number(match[1]),
      oldCount: Number(match[2] ?? "1"),
      newStart: Number(match[3]),
      newCount: Number(match[4] ?? "1"),
      lines: [],
    }

    index += 1

    while (index < lines.length) {
      const nextLine = lines[index]
      if (nextLine.startsWith("@@ ")) break
      if (nextLine.startsWith("@@")) break
      if (
        nextLine.startsWith(" ") ||
        nextLine.startsWith("+") ||
        nextLine.startsWith("-") ||
        nextLine === "\\ No newline at end of file"
      ) {
        hunk.lines.push(nextLine)
        index += 1
        continue
      }
      break
    }

    hunks.push(hunk)
  }

  return hunks
}

export function applyUnifiedDiffToText(
  originalText: string,
  diffText: string
): string {
  const hunks = parseUnifiedDiff(diffText)
  if (hunks.length === 0) {
    throw new Error("적용 가능한 diff hunk를 찾지 못했습니다.")
  }

  const normalized = originalText.replace(/\r\n/g, "\n")
  const sourceLines = normalized.length > 0 ? normalized.split("\n") : []
  const result: string[] = []
  let sourceIndex = 0

  for (const hunk of hunks) {
    const oldStartIndex = Math.max(0, hunk.oldStart - 1)
    result.push(...sourceLines.slice(sourceIndex, oldStartIndex))

    let localIndex = oldStartIndex

    for (const line of hunk.lines) {
      if (line === "\\ No newline at end of file") continue

      const kind = line[0]
      const value = line.slice(1)

      if (kind === " ") {
        result.push(sourceLines[localIndex] ?? value)
        localIndex += 1
        continue
      }

      if (kind === "-") {
        localIndex += 1
        continue
      }

      if (kind === "+") {
        result.push(value)
      }
    }

    sourceIndex = localIndex
  }

  result.push(...sourceLines.slice(sourceIndex))
  return result.join("\n")
}
