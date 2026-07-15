import { API_BASE } from '@/shared/config/api';

import type { DiagramArtifact, DiagramTableType } from './mock';

export type DiagramPromptPresetId = 'diagram' | 'flowchart' | 'table' | 'timeline';
export type IllustrationSessionId = string | number;

/** 백엔드 `visual_type` 힌트 (table | chart | diagram | flowchart | graph) */
export type IllustrationVisualType = 'table' | 'chart' | 'diagram' | 'flowchart' | 'graph';

export function mapPresetToVisualType(presetId: DiagramPromptPresetId): IllustrationVisualType {
  switch (presetId) {
    case 'flowchart':
      return 'flowchart';
    case 'table':
      return 'table';
    case 'timeline':
      return 'graph';
    case 'diagram':
    default:
      return 'diagram';
  }
}

export interface DiagramPromptPreset {
  id: DiagramPromptPresetId;
  label: string;
  prompt: string;
}

export interface DiagramChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface DiagramStreamProgress {
  step: string;
  message: string;
  done: boolean;
}

export interface GeneratedDiagramPreview {
  title: string;
  description: string;
  imageDataUrl?: string;
}

/** GET `/illustration/chat/stream` 쿼리 (OpenAPI + 백엔드 계약) */
export interface IllustrationChatRequest {
  content: string;
  visual_intent: string;
  visual_type?: IllustrationVisualType | string | null;
  session_id?: IllustrationSessionId;
  pipeline_mode?: string;
  max_critic_rounds?: number;
  profile?: string | null;
}

export interface IllustrationDoneData {
  progress?: Array<{ type?: string; step?: string; message?: string; done?: boolean }>;
  chat?: Array<{
    type?: string;
    data?: {
      message?: string;
      paperbanana?: Record<string, unknown>;
      pipeline_info?: {
        mode?: string;
        critic_rounds?: number;
        has_pipeline_data?: boolean;
        eval_image_field?: string;
      };
    };
  }>;
  /** BE SSE `done` 페이로드 (camelCase) */
  finalResponse?: {
    previewImageBase64?: string;
    [key: string]: unknown;
  };
  final_response?: {
    preview_image_base64?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/** GET `/illustration/chat/history` — `IllustrationChatHistoryResponseItem` */
export interface IllustrationChatHistoryItem {
  role: string;
  content: string;
  createdAt?: string | null;
  previewImageBase64?: string | null;
  paperbanana?: Record<string, unknown> | null;
}

interface IllustrationHistoryApiResponse {
  success: boolean;
  statusCode: number;
  data: IllustrationChatHistoryItem[] | null;
}

/** GET `/illustration/session` — `IllustrationSessionResponse` */
export interface IllustrationSessionRow {
  sessionId: number;
  title: string;
  updatedAt: string | null;
  messageCount: number;
  hasImage: boolean;
}

interface IllustrationSessionsApiResponse {
  success: boolean;
  statusCode: number;
  data: IllustrationSessionRow[] | null;
}

/** 히스토리에 저장된 `content: …\nvisual_intent: …` 형태를 채팅 UI용으로 정리 */
export function formatIllustrationHistoryUserContent(raw: string): string {
  const text = raw?.trim() ?? '';
  if (!text.includes('visual_intent:')) return text;

  const split = text.split(/\nvisual_intent:\s*/);
  const head = split[0]?.replace(/^content:\s*/i, '').trim() ?? '';
  const intent = split[1]?.trim() ?? '';
  if (intent && head) return `[${intent}]\n\n${head}`;
  if (intent) return `[${intent}]`;
  return head || text;
}

export function pickLatestIllustrationSessionId(sessions: IllustrationSessionRow[]): number | null {
  if (!sessions.length) return null;
  const sorted = [...sessions].sort((a, b) => {
    const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return tb - ta;
  });
  return sorted[0]?.sessionId ?? null;
}

export async function fetchIllustrationSessions(projectId: string): Promise<IllustrationSessionRow[]> {
  const res = await fetch(
    `${API_BASE}/api/v2/projects/${encodeURIComponent(projectId)}/illustration/session`
  );
  let json: IllustrationSessionsApiResponse;
  try {
    json = (await res.json()) as IllustrationSessionsApiResponse;
  } catch {
    throw new Error(`도식/표 세션 목록 조회 실패 (${res.status})`);
  }
  if (!res.ok) {
    const msg = (json as { message?: string }).message;
    throw new Error(
      typeof msg === 'string' && msg.trim() ? msg : `도식/표 세션 목록 조회 실패 (${res.status})`
    );
  }
  if (!json.success || !json.data) return [];
  return json.data;
}

export function mapHistoryToChatMessages(rows: IllustrationChatHistoryItem[]): DiagramChatMessage[] {
  return rows.map((row, index) => ({
    id: `hist-${row.createdAt ?? index}-${index}`,
    role:
      row.role === 'user'
        ? 'user'
        : row.role === 'agent' || row.role === 'assistant'
          ? 'assistant'
          : 'assistant',
    content:
      row.role === 'user'
        ? formatIllustrationHistoryUserContent(row.content ?? '')
        : (row.content ?? ''),
  }));
}

function toImageDataUrl(base64?: string) {
  if (!base64) return undefined;
  const normalized = base64.replace(/\s+/g, '');
  if (!normalized) return undefined;
  if (normalized.startsWith('data:')) return normalized;
  return `data:image/jpeg;base64,${normalized}`;
}

function paperbananaFirstDiagram(pb: Record<string, unknown> | null | undefined) {
  if (!pb || typeof pb !== 'object') return null;
  const diagrams = pb.diagrams;
  if (!Array.isArray(diagrams) || diagrams.length === 0) return null;
  const first = diagrams[0];
  return first && typeof first === 'object' ? (first as Record<string, unknown>) : null;
}

function artifactTypeFromPaperbanana(
  pb: Record<string, unknown> | null | undefined
): DiagramTableType {
  const d = paperbananaFirstDiagram(pb);
  const t = String(d?.type ?? '').toLowerCase();
  if (t === 'flowchart') return 'roadmap';
  if (t === 'table' || t === 'chart') return 'comparison';
  if (t === 'graph' || t === 'timeline' || t === 'gantt') return 'gantt';
  return 'concept';
}

function titleFromHistoryRow(row: IllustrationChatHistoryItem): string {
  const d = paperbananaFirstDiagram(row.paperbanana ?? undefined);
  const fromDiagram = typeof d?.title === 'string' ? d.title.trim() : '';
  if (fromDiagram) return fromDiagram;
  const goal = typeof d?.goal === 'string' ? d.goal.trim() : '';
  if (goal) return goal.slice(0, 60) + (goal.length > 60 ? '…' : '');
  const line = row.content?.trim().split('\n')[0] ?? '';
  return line.slice(0, 48) || '생성 결과';
}

function captionFromHistoryRow(row: IllustrationChatHistoryItem): string {
  const c = row.content?.trim() ?? '';
  if (c.length <= 100) return c || '생성 결과';
  return `${c.slice(0, 97)}…`;
}

/** 생성 이력 카드용: 히스토리 API의 agent 응답만 최신순 `DiagramArtifact[]`로 변환 */
export function mapIllustrationHistoryToArtifacts(
  rows: IllustrationChatHistoryItem[] | undefined
): DiagramArtifact[] {
  if (!rows?.length) return [];

  const agents = rows.filter((r) => r.role === 'agent' || r.role === 'assistant');
  const sorted = [...agents].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

  return sorted.map((row, index) => {
    const type = artifactTypeFromPaperbanana(row.paperbanana ?? undefined);
    const id = `illustration-hist-${row.createdAt ?? 'na'}-${index}`;
    const thumb =
      row.previewImageBase64 != null && String(row.previewImageBase64).trim() !== ''
        ? toImageDataUrl(String(row.previewImageBase64).trim())
        : undefined;

    return {
      id,
      type,
      caption: captionFromHistoryRow(row),
      createdAt: row.createdAt ?? new Date().toISOString(),
      thumbnailUrl: thumb,
      draft: {
        type,
        title: titleFromHistoryRow(row),
        content: row.content ?? '',
      },
    };
  });
}

export async function fetchIllustrationChatHistory(
  projectId: string,
  sessionId: IllustrationSessionId = 1
): Promise<IllustrationChatHistoryItem[]> {
  const params = new URLSearchParams();
  params.set('session_id', String(sessionId));
  const res = await fetch(
    `${API_BASE}/api/v2/projects/${encodeURIComponent(projectId)}/illustration/chat/history?${params.toString()}`
  );
  let json: IllustrationHistoryApiResponse;
  try {
    json = (await res.json()) as IllustrationHistoryApiResponse;
  } catch {
    throw new Error(`도식/표 히스토리 조회 실패 (${res.status})`);
  }
  if (!res.ok) {
    const msg = (json as { message?: string }).message;
    throw new Error(
      typeof msg === 'string' && msg.trim() ? msg : `도식/표 히스토리 조회 실패 (${res.status})`
    );
  }
  if (!json.success || !json.data) return [];
  return json.data;
}

export interface IllustrationChatCallbacks {
  onProgress?: (progress: DiagramStreamProgress) => void;
  onChat?: (message: string) => void;
  onDone?: (data: IllustrationDoneData) => void;
  onError?: (message: string) => void;
}

/** SSE `type: "error"` 페이로드에서 표시용 문구 추출 (빈 객체·FastAPI `detail` 등 대응) */
export function extractIllustrationSseErrorMessage(payload: Record<string, unknown>): string {
  const pick = (v: unknown): string | null => {
    if (typeof v !== 'string') return null;
    const t = v.trim();
    return t.length > 0 ? t : null;
  };

  const joinValidationDetail = (detail: unknown): string | null => {
    if (!Array.isArray(detail)) return null;
    const parts = detail
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object' && 'msg' in item) {
          return pick((item as { msg?: unknown }).msg);
        }
        return null;
      })
      .filter((s): s is string => Boolean(s));
    return parts.length > 0 ? parts.join(' ') : null;
  };

  const fromObj = (o: Record<string, unknown>): string | null =>
    pick(o.message) ??
    pick(typeof o.detail === 'string' ? o.detail : null) ??
    joinValidationDetail(o.detail) ??
    (typeof o.error === 'string' ? pick(o.error) : null);

  const top = fromObj(payload);
  if (top) return top;

  const err = payload.error;
  if (err && typeof err === 'object' && !Array.isArray(err)) {
    const nested = fromObj(err as Record<string, unknown>);
    if (nested) return nested;
  }

  const data = payload.data;
  if (typeof data === 'string') {
    const s = pick(data);
    if (s) return s;
  } else if (data && typeof data === 'object' && !Array.isArray(data)) {
    const fromData = fromObj(data as Record<string, unknown>);
    if (fromData) return fromData;
  }

  const detailAlone = joinValidationDetail(payload.detail);
  if (detailAlone) return detailAlone;

  const keys = Object.keys(payload).filter((k) => k !== 'type');
  if (keys.length === 0) {
    return '도식/표 생성 중 서버에서 오류가 발생했습니다. (상세 메시지가 없습니다)';
  }

  try {
    const compact = JSON.stringify(payload);
    if (compact.length > 280) {
      return `도식/표 생성 오류: ${compact.slice(0, 277)}…`;
    }
    return `도식/표 생성 오류: ${compact}`;
  } catch {
    return '도식/표 생성 중 오류가 발생했습니다.';
  }
}

export const DIAGRAM_PROMPT_PRESETS: DiagramPromptPreset[] = [
  {
    id: 'diagram',
    label: '다이어그램',
    prompt:
      '아래 연구 방법론을 바탕으로 핵심 구성요소와 상호관계가 한눈에 드러나는 연구 다이어그램을 제안하세요.',
  },
  {
    id: 'flowchart',
    label: '플로우차트',
    prompt:
      '아래 연구 방법론을 바탕으로 단계별 수행 절차와 의사결정 흐름이 드러나는 플로우차트를 제안하세요.',
  },
  {
    id: 'table',
    label: '표',
    prompt: '아래 연구 방법론을 바탕으로 비교, 정리, 요약에 적합한 표 구조를 제안하세요.',
  },
  {
    id: 'timeline',
    label: '타임라인',
    prompt:
      '아래 연구 방법론을 바탕으로 연차별 또는 단계별 추진 일정을 보여주는 타임라인 형태를 제안하세요.',
  },
];

export function getDiagramPromptPreset(presetId: DiagramPromptPresetId): DiagramPromptPreset {
  return (
    DIAGRAM_PROMPT_PRESETS.find((preset) => preset.id === presetId) ?? DIAGRAM_PROMPT_PRESETS[0]
  );
}

export function extractMethodologyContent(draft: string): string {
  const text = draft.trim();
  if (!text) return '';

  const methodologySection =
    text.match(/##\s*4\.\s*연구 내용 및 방법([\s\S]*?)(?=\n##\s+\d+\.|\s*$)/)?.[0] ??
    text.match(/##\s*연구 내용 및 방법([\s\S]*?)(?=\n##\s|\s*$)/)?.[0];

  return methodologySection?.trim() ?? text;
}

export function buildIllustrationContent(body: string) {
  return body.trim();
}

function previewTextForLog(value: string, limit = 180) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit)}…`;
}

function serializeErrorForLog(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    };
  }
  return { value: error };
}

function findBase64Value(input: unknown): string | undefined {
  if (!input) return undefined;

  if (typeof input === 'string') {
    const normalized = input.replace(/\s+/g, '');
    if (
      normalized.startsWith('data:image/') ||
      normalized.startsWith('/9j/') ||
      normalized.startsWith('iVBOR') ||
      normalized.startsWith('R0lGOD')
    ) {
      return normalized;
    }
    return undefined;
  }

  if (Array.isArray(input)) {
    for (const item of input) {
      const found = findBase64Value(item);
      if (found) return found;
    }
    return undefined;
  }

  if (typeof input === 'object') {
    const record = input as Record<string, unknown>;

    const preferredKeys = [
      'previewImageBase64',
      'preview_image_base64',
      'image_base64',
      'base64',
      'target_diagram_critic_desc0_base64_jpg',
      'target_diagram_critic_desc0_base64_png',
    ];

    const fr = record.finalResponse ?? record.final_response;
    if (fr && typeof fr === 'object') {
      const nested = findBase64Value(fr);
      if (nested) return nested;
    }

    for (const key of preferredKeys) {
      const value = record[key];
      const found = findBase64Value(value);
      if (found) return found;
    }

    for (const [key, value] of Object.entries(record)) {
      if (
        key.includes('base64') ||
        key.includes('image') ||
        key.includes('jpg') ||
        key.includes('png')
      ) {
        const found = findBase64Value(value);
        if (found) return found;
      }
    }

    for (const value of Object.values(record)) {
      const found = findBase64Value(value);
      if (found) return found;
    }
  }

  return undefined;
}

export function buildGeneratedPreview(
  data: IllustrationDoneData,
  fallbackDescription: string
): GeneratedDiagramPreview {
  const imageBase64 = findBase64Value(data);
  console.log('[diagram-table][preview][source]', {
    hasFinalResponse: Boolean(data.finalResponse ?? data.final_response),
    imageBase64Length: imageBase64?.length ?? 0,
    data,
  });

  return {
    title: '생성된 도식/표 미리보기',
    description: fallbackDescription,
    imageDataUrl: toImageDataUrl(imageBase64),
  };
}

function buildIllustrationStreamUrl(projectId: string, payload: IllustrationChatRequest): string {
  const params = new URLSearchParams();
  params.set('content', payload.content);
  if (payload.visual_intent?.trim()) {
    params.set('visual_intent', payload.visual_intent.trim());
  }
  if (payload.visual_type?.trim()) {
    params.set('visual_type', String(payload.visual_type).trim());
  }
  params.set('session_id', String(payload.session_id ?? 1));
  params.set('pipeline_mode', payload.pipeline_mode ?? 'dev_full');
  params.set('max_critic_rounds', String(payload.max_critic_rounds ?? 2));
  if (payload.profile != null && String(payload.profile).trim() !== '') {
    params.set('profile', String(payload.profile).trim());
  }
  return `/api/projects/${encodeURIComponent(projectId)}/illustration/chat/stream?${params.toString()}`;
}

export async function fetchIllustrationChatStream(
  projectId: string,
  payload: IllustrationChatRequest,
  callbacks: IllustrationChatCallbacks = {},
  signal?: AbortSignal
): Promise<IllustrationDoneData | null> {
  const { onProgress, onChat, onDone, onError } = callbacks;
  const url = buildIllustrationStreamUrl(projectId, payload);

  console.log('[diagram-table][request][start]', {
    url,
    urlLength: url.length,
    method: 'GET',
    requestTarget: 'next-proxy',
    upstreamApiBase: API_BASE,
    contentLength: payload.content.length,
    contentPreview: previewTextForLog(payload.content),
    visualIntentLength: payload.visual_intent?.length ?? 0,
    visualIntentPreview: previewTextForLog(payload.visual_intent ?? ''),
    session_id: payload.session_id ?? 1,
    pipeline_mode: payload.pipeline_mode ?? 'dev_full',
    visual_type: payload.visual_type,
    profile: payload.profile,
  });

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
      },
      signal,
    });
  } catch (error) {
    const serializedError = serializeErrorForLog(error);
    console.error('[diagram-table][request][fetch-error]', {
      ...serializedError,
      url,
      urlLength: url.length,
      requestTarget: 'next-proxy',
      upstreamApiBase: API_BASE,
      contentLength: payload.content.length,
      visualIntentLength: payload.visual_intent?.length ?? 0,
      session_id: payload.session_id ?? 1,
      pipeline_mode: payload.pipeline_mode ?? 'dev_full',
      visual_type: payload.visual_type,
      aborted: signal?.aborted ?? false,
    });

    const errorMessage =
      error instanceof DOMException && error.name === 'AbortError'
        ? '도식/표 생성 요청이 취소되었습니다.'
        : error instanceof TypeError
          ? '도식/표 생성 요청에 실패했습니다. 네트워크 연결 또는 CORS 응답을 확인해 주세요.'
          : '도식/표 생성 요청 중 알 수 없는 오류가 발생했습니다.';
    onError?.(errorMessage);
    throw error;
  }

  console.log('[diagram-table][request][response]', {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    contentType: res.headers.get('content-type'),
  });

  if (!res.ok) {
    const errorMessage = `도식/표 생성 API 오류: ${res.status}`;
    console.error('[diagram-table][request][http-error]', errorMessage);
    onError?.(errorMessage);
    throw new Error(errorMessage);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    const errorMessage = '도식/표 생성 스트림을 읽을 수 없습니다.';
    console.error('[diagram-table][request][reader-missing]', errorMessage);
    onError?.(errorMessage);
    throw new Error(errorMessage);
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let dataBuffer = '';
  let doneData: IllustrationDoneData | null = null;

  const processPayload = (raw: string) => {
    const text = raw.trim();
    if (!text) return;

    try {
      console.log('[diagram-table][sse][raw]', text);
      const parsed = JSON.parse(text) as Record<string, unknown>;
      const type = String(parsed.type ?? '');
      console.log('[diagram-table][sse][parsed]', { type, parsed });

      if (type === 'progress') {
        onProgress?.({
          step: String(parsed.step ?? ''),
          message: String(parsed.message ?? ''),
          done: Boolean(parsed.done),
        });
        return;
      }

      if (type === 'chat') {
        const chatData = parsed.data as
          | { message?: string; paperbanana?: Record<string, unknown> }
          | undefined;
        const message = chatData?.message?.trim();
        console.log('[diagram-table][sse][chat]', chatData);
        if (message) onChat?.(message);
        return;
      }

      if (type === 'done') {
        doneData = (parsed.data as IllustrationDoneData | undefined) ?? null;
        console.log('[diagram-table][sse][done]', doneData);
        if (doneData) onDone?.(doneData);
        return;
      }

      if (type === 'error') {
        const errorMessage = extractIllustrationSseErrorMessage(parsed);
        console.error('[diagram-table][sse][error]', {
          message: errorMessage,
          payload: parsed,
          rawPreview: text.length > 400 ? `${text.slice(0, 400)}…` : text,
        });
        onError?.(errorMessage);
      }
    } catch (error) {
      console.error('[diagram-table][sse][parse-error]', error, text);
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      console.log('[diagram-table][sse][chunk]', {
        done,
        chunkLength: value?.length ?? 0,
      });
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const normalizedLine = line.replace(/\r$/, '');

        if (normalizedLine.startsWith('data:')) {
          dataBuffer += (dataBuffer ? '\n' : '') + normalizedLine.slice(5).trimStart();
        } else if (normalizedLine === '' && dataBuffer) {
          processPayload(dataBuffer);
          dataBuffer = '';
        } else if (normalizedLine !== '' && !normalizedLine.startsWith('event:')) {
          dataBuffer += '\n' + normalizedLine;
        }
      }

      if (done) break;
    }

    if (dataBuffer) processPayload(dataBuffer);
    console.log('[diagram-table][sse][complete]');
  } finally {
    reader.releaseLock();
  }

  return doneData;
}
