function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function formatDateOnly(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** UI 스크린샷 형식 `2026.03.20` */
export function formatDateDot(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`;
}

/** 접수기간 등 구간 표기 (하이픈) */
export function formatDateStartEnd(
  start?: string | null,
  end?: string | null
): string | null {
  if (!start && !end) return null;
  const a = start ? formatDateOnly(start) : '미정';
  const b = end ? formatDateOnly(end) : '미정';
  return `${a} ~ ${b}`;
}

/** 카드 본문 한 줄용 `2026.03.20 ~ 2026.03.31` */
export function formatPeriodDot(start?: string | null, end?: string | null): string {
  const a = start ? formatDateDot(start) : '미정';
  const b = end ? formatDateDot(end) : '미정';
  return `${a} ~ ${b}`;
}

/** 공고게시일자 등 짧은 표기 */
export function formatCompactDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d
    .toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .replace(/\s/g, '');
}

export function formatNoticeId(num: string | number): string {
  return String(num).trim();
}

/** 마감까지 남은 일수/문구 (D-n 등) */
export function leftDateCalc(dDay: string | undefined): string | null {
  if (!dDay) return null;
  const end = new Date(dDay);
  if (Number.isNaN(end.getTime())) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diff = Math.ceil((end.getTime() - now.getTime()) / 86_400_000);

  if (diff < 0) return '마감됨';
  if (diff === 0) return '오늘마감';
  if (diff === 1) return '내일 마감';
  return `D-${diff}`;
}

/**
 * 스크린샷 형태: `마감 1주 1일 전`, `마감 4주 전`
 * (마감일 당일 기준 남은 일수로 주·일 계산)
 */
export function leftUntilDeadlineWeekPhrase(dDay: string | undefined): string | null {
  if (!dDay) return null;
  const end = new Date(dDay);
  if (Number.isNaN(end.getTime())) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diff = Math.ceil((end.getTime() - now.getTime()) / 86_400_000);

  if (diff < 0) return '마감됨';
  if (diff === 0) return '오늘마감';
  if (diff === 1) return '내일 마감';

  const weeks = Math.floor(diff / 7);
  const days = diff % 7;
  if (weeks === 0) return `${diff}일 전`;
  if (days === 0) return `${weeks}주 전`;
  return `${weeks}주 ${days}일 전`;
}

/** 카드 우측 마감 한 줄 (`마감 1주 1일 전` / `deadlineDisplay` 우선) */
export function formatRndDeadlineLine(
  dDay?: string,
  deadlineDisplay?: string
): string | null {
  if (deadlineDisplay?.trim()) return deadlineDisplay.trim();
  const inner = leftUntilDeadlineWeekPhrase(dDay);
  if (!inner) return null;
  if (inner === '마감됨' || inner === '오늘마감' || inner === '내일 마감') return inner;
  return `마감 ${inner}`;
}
