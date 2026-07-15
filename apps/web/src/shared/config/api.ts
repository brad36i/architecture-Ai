/** 슬래시 없이. 비어 있으면 브라우저에서 현재 오리진 기준 `/api/...` 상대 요청 */
function normalizeApiBase(raw: string | undefined): string {
  const t = raw?.trim() ?? ""
  if (!t) return ""
  return t.replace(/\/$/, "")
}

const configuredApiBase = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL)

export const API_BASE =
  configuredApiBase || (process.env.NODE_ENV === "production" ? "" : "http://localhost:4000")
