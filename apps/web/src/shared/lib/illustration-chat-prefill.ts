const STORAGE_KEY = "ezrnd-flow:illustration-chat-prefill"

type Payload = { projectId: string; text: string }

export function stashIllustrationChatPrefill(projectId: string, text: string): void {
  if (typeof window === "undefined") return
  const payload: Payload = { projectId, text }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function peekIllustrationChatPrefill(projectId: string): string | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Payload
    if (p.projectId !== projectId || typeof p.text !== "string") return null
    return p.text
  } catch {
    return null
  }
}

export function clearIllustrationChatPrefill(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(STORAGE_KEY)
}
