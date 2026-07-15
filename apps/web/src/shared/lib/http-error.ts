/** 백엔드가 연구계획서 미작성 등으로 404를 줄 때, fetch 헬퍼가 `… (404)` 형태 메시지를 씁니다. */
export function isHttpNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return /\(\s*404\s*\)/.test(error.message)
}
