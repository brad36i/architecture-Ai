import { API_BASE } from '@/shared/config/api';

import { type SelectedTopicContent, type TopicContent } from './types';

export type TopicSelectionStreamEvent =
  | {
      type: 'progress';
      step?: string;
      message?: string;
      done?: boolean;
      source?: string;
      slot?: string;
      context_chars?: number;
      selected_docs?: number;
      status?: string;
    }
  | { type: 'thinking'; step?: string; content?: string; topic_id?: string }
  | {
      type: 'chat';
      data?:
        | { topics?: BackendTopic[]; nodes?: BackendTopic[] }
        | { id?: string; nodeId?: string; node_id?: string; type?: string; content?: unknown };
    }
  | { type: 'done'; data: TopicSelectionDoneData }
  | { type: 'error'; message: string };

/** BE 응답 topic 구조 (chat/done 이벤트) */
export interface BackendTopic {
  nodeId?: string;
  node_id?: string;
  id?: string;
  label?: string;
  title?: string;
  overview?: string;
  content?: string;
  keywords?: string[] | string;
  detail?: string;
  depth?: number;
  parentNodeId?: string | null;
  parent_node_id?: string | null;
  isLastNode?: boolean;
  is_last_node?: boolean;
  version?: number;
  reasoning?: string;
}

export interface TopicSelectionDoneData {
  id?: string;
  title?: string;
  label?: string;
  overview?: string;
  content?: string;
  keywords?: string[];
  /** AI 추론 본문 — 노드 `detail`과 동일 용도 */
  detail?: string;
  reasoning?: string;
  depth?: number;
  parentNodeId?: string | null;
  parent_node_id?: string | null;
  isLastNode?: boolean;
  is_last_node?: boolean;
  message?: string;
  suggestedText?: string;
  topics?: BackendTopic[];
  nodes?: BackendTopic[];
  nodeId?: string;
  goalText?: string;
  researchContent?: string;
  expectedEffectAndPlan?: string;
  progress?: Array<{ type?: string; step?: string; message?: string; done?: boolean }>;
  chat?: unknown[];
  thinking?: Array<{ type?: string; step?: string; content?: string }>;
  success?: boolean;
  statusCode?: number;
  data?: {
    id?: string;
    title?: string;
    label?: string;
    overview?: string;
    content?: string;
    keywords?: string[];
    detail?: string;
    reasoning?: string;
    depth?: number;
    parentNodeId?: string | null;
    parent_node_id?: string | null;
    isLastNode?: boolean;
    is_last_node?: boolean;
    message?: string;
    suggestedText?: string;
    topics?: BackendTopic[];
    nodes?: BackendTopic[];
    nodeId?: string;
    goalText?: string;
    researchContent?: string;
    expectedEffectAndPlan?: string;
    progress?: Array<{ type?: string; step?: string; message?: string; done?: boolean }>;
    chat?: unknown[];
    thinking?: Array<{ type?: string; step?: string; content?: string }>;
  };
}

function extractTopicSelectionErrorMessage(payload: Record<string, unknown>): string {
  const pick = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const joinValidationDetail = (detail: unknown): string | null => {
    if (!Array.isArray(detail)) return null;
    const parts = detail
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>;
          const loc = Array.isArray(record.loc)
            ? record.loc.map((part) => String(part)).join('.')
            : null;
          const msg = pick(record.msg);
          if (loc && msg) return `${loc}: ${msg}`;
          return msg;
        }
        return null;
      })
      .filter((part): part is string => Boolean(part));

    return parts.length > 0 ? parts.join(' | ') : null;
  };

  const fromObject = (obj: Record<string, unknown>): string | null =>
    pick(obj.message) ?? pick(obj.detail) ?? joinValidationDetail(obj.detail) ?? pick(obj.error);

  return (
    fromObject(payload) ??
    (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
      ? fromObject(payload.data as Record<string, unknown>)
      : null) ??
    '요청 처리에 실패했습니다.'
  );
}

function pickBackendTopics(source?: {
  topics?: BackendTopic[];
  nodes?: BackendTopic[];
}): BackendTopic[] {
  if (!source) return [];
  if (Array.isArray(source.topics) && source.topics.length > 0) return source.topics;
  if (Array.isArray(source.nodes) && source.nodes.length > 0) return source.nodes;
  return [];
}

function normalizeKeywordList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getBackendTopicIdentifier(topic: Partial<BackendTopic> | null | undefined): string {
  if (!topic) return '';
  return String(topic.nodeId ?? topic.node_id ?? topic.id ?? '').trim();
}

function mergeTopicCollections(primary: BackendTopic[], fallback: BackendTopic[]): BackendTopic[] {
  const merged = new Map<string, BackendTopic>();

  const upsert = (topic: BackendTopic) => {
    const identifier = getBackendTopicIdentifier(topic);
    if (!identifier) return;
    const prev = merged.get(identifier) ?? {};
    merged.set(identifier, {
      ...prev,
      ...topic,
      id: topic.id ?? prev.id ?? identifier,
      nodeId: topic.nodeId ?? prev.nodeId ?? identifier,
      keywords:
        normalizeKeywordList(topic.keywords).length > 0
          ? normalizeKeywordList(topic.keywords)
          : normalizeKeywordList(prev.keywords),
    });
  };

  fallback.forEach(upsert);
  primary.forEach(upsert);

  return [...merged.values()];
}

/**
 * SSE JSON이 `{ "type": "done", ... }` 또는 `{ "data": { "type": "done", ... } }` 처럼
 * type이 최상위가 아닐 수 있어 한 줄로 정규화한다.
 */
function normalizeStreamPayload(parsed: Record<string, unknown>): {
  eventType: string;
  body: Record<string, unknown>;
} {
  const top = parsed?.type;
  if (typeof top === 'string' && top.length > 0) {
    return { eventType: top, body: parsed };
  }
  const wrapped = parsed?.data;
  if (wrapped && typeof wrapped === 'object' && !Array.isArray(wrapped)) {
    const inner = wrapped as Record<string, unknown>;
    const nested = inner.type;
    if (typeof nested === 'string' && nested.length > 0) {
      return { eventType: nested, body: inner };
    }
  }
  return { eventType: '', body: parsed };
}

/** done 이벤트에서 topics/nodes 등 실제 페이로드 추출 */
function extractDoneInnerPayload(body: Record<string, unknown>): TopicSelectionDoneData {
  const nested = body.data;
  if (
    nested !== undefined &&
    nested !== null &&
    typeof nested === 'object' &&
    !Array.isArray(nested)
  ) {
    return nested as TopicSelectionDoneData;
  }
  const { type, ...rest } = body;
  void type;
  return rest as TopicSelectionDoneData;
}

/** BE topic → TopicContent 매핑. content는 "필요성: ... 방법론: ... 기대효과: ... 신규성: ..." 형식 */
export function mapBackendTopicToTopicContent(t: BackendTopic): TopicContent {
  const subject = t.title?.trim() || t.label?.trim() || t.content?.trim() || '';
  const raw = t.content ?? '';
  const hasStructuredSections =
    raw.includes('필요성:') || raw.includes('방법론:') || raw.includes('기대효과:');
  const necessity = hasStructuredSections
    ? (raw.match(/필요성:\s*([\s\S]*?)(?=\s*방법론:|$)/)?.[1]?.trim() ?? '')
    : raw.trim();
  const methodology = raw.match(/방법론:\s*([\s\S]*?)(?=\s*기대효과:|$)/)?.[1]?.trim() ?? '';
  const expectedEffect = raw.match(/기대효과:\s*([\s\S]*?)(?=\s*신규성:|$)/)?.[1]?.trim() ?? '';
  const overview = t.overview?.trim();
  const detailExplicit = t.detail?.trim() ?? '';
  const reasoningRaw = t.reasoning?.trim() ?? '';
  const isReasoningLevel = ['high', 'medium', 'low'].includes(reasoningRaw);
  const detailFromReasoning = reasoningRaw && !isReasoningLevel ? reasoningRaw : '';
  const detail = detailExplicit || detailFromReasoning || undefined;
  return {
    subject,
    necessity,
    methodology,
    expectedEffect,
    keywords: normalizeKeywordList(t.keywords),
    ...(overview ? { overview } : {}),
    fullContent: raw,
    ...(detail ? { detail } : {}),
  };
}

/** suggestedText를 TopicContent[]로 파싱. JSON 배열이면 그대로, 아니면 단일 주제로 변환 */
export function parseSuggestedTextToTopics(suggestedText: string): TopicContent[] {
  if (!suggestedText?.trim()) return [];

  const trimmed = suggestedText.trim();

  // JSON 배열 시도: [{"subject":"...","necessity":"...",...}, ...]
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item) => {
        const o = item as Record<string, unknown>;
        return {
          subject: String(o.subject ?? o.label ?? ''),
          necessity: String(o.necessity ?? ''),
          methodology: String(o.methodology ?? ''),
          expectedEffect: String(o.expectedEffect ?? ''),
          keywords: Array.isArray(o.keywords) ? (o.keywords as string[]) : [],
        };
      });
    }
    if (parsed && typeof parsed === 'object' && 'subject' in parsed) {
      const o = parsed as Record<string, unknown>;
      return [
        {
          subject: String(o.subject ?? o.label ?? ''),
          necessity: String(o.necessity ?? ''),
          methodology: String(o.methodology ?? ''),
          expectedEffect: String(o.expectedEffect ?? ''),
          keywords: Array.isArray(o.keywords) ? (o.keywords as string[]) : [],
        },
      ];
    }
  } catch {
    /* not JSON */
  }

  // 줄바꿈/번호로 분리: "1. 주제1\n2. 주제2\n3. 주제3" 또는 "주제1\n\n주제2\n\n주제3"
  const lines = trimmed.split(/\n+/).filter((l) => l.trim());
  if (lines.length >= 2) {
    return lines.slice(0, 5).map((line) => {
      const subject = line.replace(/^\d+[\.\)]\s*/, '').trim() || line;
      return {
        subject,
        necessity: '',
        methodology: '',
        expectedEffect: '',
        keywords: [],
      };
    });
  }

  // 단일 텍스트
  return [
    {
      subject: trimmed.slice(0, 200),
      necessity: '',
      methodology: '',
      expectedEffect: '',
      keywords: [],
    },
  ];
}

export interface TopicSelectionStreamCallbacks {
  /** progress: { type, step, message, done } */
  onProgress?: (step?: string, message?: string, done?: boolean) => void;
  /** thinking: { type, step, content } */
  onThinking?: (content?: string, step?: string) => void;
  /** chat: { type, data: { topics } } - 중간 결과 (선택) */
  onChat?: (topics: BackendTopic[]) => void;
  /** done: { type, data: { topics, ... } } - 최종 결과 */
  onDone?: (data: TopicSelectionDoneData) => void;
  onError?: (message: string) => void;
}

async function fetchTopicSelectionStream(
  url: string,
  callbacks: TopicSelectionStreamCallbacks = {}
): Promise<TopicSelectionDoneData | null> {
  const { onProgress, onThinking, onChat, onDone, onError } = callbacks;
  const streamedTopics = new Map<string, BackendTopic>();
  console.info('[topic-selection][request:start]', { url });

  const res = await fetch(url, {
    headers: { Accept: 'text/event-stream' },
  });
  console.info('[topic-selection][request:response]', { url, status: res.status, ok: res.ok });

  if (!res.ok) {
    let errMsg = `API 오류: ${res.status}`;
    try {
      const text = await res.text();
      if (text.trim()) {
        try {
          const parsed = JSON.parse(text) as Record<string, unknown>;
          errMsg = extractTopicSelectionErrorMessage(parsed);
        } catch {
          errMsg = text.trim();
        }
      }
    } catch {
      /* ignore response body parse failure */
    }
    onError?.(errMsg);
    throw new Error(errMsg);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    onError?.('스트림을 읽을 수 없습니다');
    throw new Error('스트림을 읽을 수 없습니다');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let lastDoneData: TopicSelectionDoneData | null = null;
  let dataBuffer = '';

  const upsertTopicFromChatChunk = (payload: Record<string, unknown>): BackendTopic[] => {
    const identifier = String(
      payload.id ?? payload.nodeId ?? payload.node_id ?? payload.topic_id ?? ''
    ).trim();
    const field = String(payload.type ?? '').trim();
    if (!identifier || !field) return [...streamedTopics.values()];

    const prev = streamedTopics.get(identifier) ?? {
      id: identifier,
      nodeId: identifier,
    };
    const next: BackendTopic = {
      ...prev,
      id: prev.id ?? identifier,
      nodeId: prev.nodeId ?? identifier,
    };

    if (field === 'keywords') {
      next.keywords = normalizeKeywordList(payload.content);
    } else {
      const value = typeof payload.content === 'string' ? payload.content : '';
      if (field === 'label') next.label = value;
      else if (field === 'title') next.title = value;
      else if (field === 'overview') next.overview = value;
      else if (field === 'content') next.content = value;
      else if (field === 'detail') next.detail = value;
      else if (field === 'reasoning') next.reasoning = value;
    }

    streamedTopics.set(identifier, next);
    return [...streamedTopics.values()];
  };

  const processPayload = (raw: string) => {
    const str = raw.trim();
    if (!str) return;
    console.log('[topic-selection][sse][raw]', str);
    try {
      const parsed = JSON.parse(str) as Record<string, unknown>;
      const { eventType, body } = normalizeStreamPayload(parsed);
      console.log('[topic-selection][sse][parsed]', { eventType, payload: parsed });
      if (eventType === 'progress') {
        onProgress?.(String(body?.step ?? ''), String(body?.message ?? ''), Boolean(body?.done));
      } else if (eventType === 'thinking') {
        onThinking?.(String(body?.content ?? ''), String(body?.step ?? ''));
      } else if (eventType === 'chat') {
        const rawData =
          body.data !== undefined && body.data !== null && typeof body.data === 'object'
            ? (body.data as Record<string, unknown>)
            : body;
        const chatSource = rawData as { topics?: BackendTopic[]; nodes?: BackendTopic[] };
        const topicsFromLegacyPayload = pickBackendTopics(chatSource);
        const topics =
          topicsFromLegacyPayload.length > 0
            ? topicsFromLegacyPayload
            : upsertTopicFromChatChunk(rawData);
        console.log('[topic-selection][sse][chat-topics]', topics);
        if (topics.length > 0) onChat?.(topics);
      } else if (eventType === 'done') {
        const inner = extractDoneInnerPayload(body);
        const doneTopics = pickBackendTopics(inner);
        const mergedTopics = mergeTopicCollections(doneTopics, [...streamedTopics.values()]);
        const data: TopicSelectionDoneData = {
          ...inner,
          topics: mergedTopics,
          nodes: inner.nodes ?? inner.data?.nodes,
          data: inner.data
            ? {
                ...inner.data,
                topics: mergeTopicCollections(pickBackendTopics(inner.data), mergedTopics),
              }
            : inner.data,
        };
        console.log('[topic-selection][sse][done-data]', data);
        lastDoneData = data;
        onDone?.(data);
      } else if (eventType === 'error') {
        console.error('[topic-selection][sse][error]', parsed);
        onError?.(String(body?.message ?? body?.detail ?? parsed?.message ?? parsed?.detail ?? ''));
      }
    } catch (error) {
      console.error('[topic-selection][sse][parse-error]', error, str);
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
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
  } finally {
    reader.releaseLock();
  }

  return lastDoneData;
}

export async function fetchTopicSelectionStartStream(
  projectId: string,
  message: string,
  mode: 'opportunity_exploration' | 'concretization' = 'opportunity_exploration',
  callbacks: TopicSelectionStreamCallbacks = {},
  options: {
    model?: string;
    reasoning?: 'high' | 'medium' | 'low';
    jsonMode?: boolean;
  } = {}
): Promise<TopicSelectionDoneData | null> {
  const params = new URLSearchParams();
  if (message) params.set('message', message);
  params.set('mode', mode);
  if (options.model) params.set('model', options.model);
  if (options.reasoning) params.set('reasoning', options.reasoning);
  if (options.jsonMode !== undefined) params.set('json_mode', String(options.jsonMode));

  return fetchTopicSelectionStream(
    `${API_BASE}/api/v3/projects/${encodeURIComponent(projectId)}/topic/start/stream?${params}`,
    callbacks
  );
}

export interface TopicSelectionExpandStreamParams {
  nodeId: string;
  message?: string;
  finishAtDepth?: boolean;
  model?: string;
  reasoning?: 'high' | 'medium' | 'low';
  jsonMode?: boolean;
}

export interface TopicSelectionGenerateStreamParams {
  mode: 'add' | 'refresh';
  nodeIds?: string[];
  model?: string;
  reasoning?: 'high' | 'medium' | 'low';
}

export async function fetchTopicSelectionGenerateStream(
  projectId: string,
  {
    mode,
    nodeIds = [],
    model = 'gpt-5-mini',
    reasoning = 'low',
  }: TopicSelectionGenerateStreamParams,
  callbacks: TopicSelectionStreamCallbacks = {}
): Promise<TopicSelectionDoneData | null> {
  const params = new URLSearchParams();
  params.set('mode', mode);
  nodeIds.forEach((nodeId) => params.append('node_ids', nodeId));
  params.set('model', model);
  params.set('reasoning', reasoning);

  return fetchTopicSelectionStream(
    `${API_BASE}/api/v3/projects/${encodeURIComponent(projectId)}/topics/selection/generate/stream?${params}`,
    callbacks
  );
}

export async function fetchTopicSelectionExpandStream(
  projectId: string,
  {
    nodeId,
    message = '',
    finishAtDepth = false,
    model = 'gpt-5-mini',
    reasoning = 'low',
    jsonMode,
  }: TopicSelectionExpandStreamParams,
  callbacks: TopicSelectionStreamCallbacks = {}
): Promise<TopicSelectionDoneData | null> {
  const params = new URLSearchParams();
  params.set('node_id', nodeId);
  if (message) params.set('message', message);
  params.set('finish_at_depth', String(finishAtDepth));
  params.set('model', model);
  params.set('reasoning', reasoning);
  if (jsonMode !== undefined) params.set('json_mode', String(jsonMode));

  return fetchTopicSelectionStream(
    `${API_BASE}/api/v3/projects/${encodeURIComponent(projectId)}/topics/selection/expand/stream?${params}`,
    callbacks
  );
}

export interface TopicSelectionMergeStreamParams {
  nodeIds: string[];
  model?: string;
  reasoning?: 'high' | 'medium' | 'low';
  jsonMode?: boolean;
  message?: string;
}

export async function fetchTopicSelectionMergeStream(
  projectId: string,
  {
    nodeIds,
    model = 'gpt-5-mini',
    reasoning = 'low',
    jsonMode,
    message = '',
  }: TopicSelectionMergeStreamParams,
  callbacks: TopicSelectionStreamCallbacks = {}
): Promise<TopicSelectionDoneData | null> {
  const params = new URLSearchParams();
  nodeIds.forEach((nodeId) => params.append('node_ids', nodeId));
  params.set('model', model);
  params.set('reasoning', reasoning);
  if (jsonMode !== undefined) params.set('json_mode', String(jsonMode));
  if (message) params.set('message', message);

  return fetchTopicSelectionStream(
    `${API_BASE}/api/v3/projects/${encodeURIComponent(projectId)}/topics/selection/merge/stream?${params}`,
    callbacks
  );
}

export interface TopicSelectionFinishStreamParams {
  nodeId: string;
  mode?: 'finish' | 'refresh';
  id?: string;
}

export async function fetchTopicSelectionFinishStream(
  projectId: string,
  { nodeId, mode = 'finish', id }: TopicSelectionFinishStreamParams,
  callbacks: TopicSelectionStreamCallbacks = {}
): Promise<TopicSelectionDoneData | null> {
  const params = new URLSearchParams();
  params.set('mode', mode);
  if (id) params.set('id', id);

  return fetchTopicSelectionStream(
    `${API_BASE}/api/v3/projects/${projectId}/topics/${nodeId}/finish/stream?${params}`,
    callbacks
  );
}

export function mapFinishDoneDataToBackendTopic(data: TopicSelectionDoneData): BackendTopic | null {
  const source = data?.data ?? data;
  const id = source.id ?? source.nodeId;
  const title = source.title;
  const content = source.content;

  if (!id && !title && !content) return null;

  const detailStr = typeof source.detail === 'string' ? source.detail.trim() : '';

  return {
    id,
    nodeId: source.nodeId ?? source.id,
    label: source.label,
    title,
    overview: source.overview,
    content,
    detail: detailStr || undefined,
    keywords: Array.isArray(source.keywords) ? source.keywords : [],
    depth: source.depth,
    parentNodeId: source.parentNodeId ?? source.parent_node_id ?? null,
    isLastNode: Boolean(source.isLastNode ?? source.is_last_node),
    reasoning: source.reasoning,
  };
}

export function mapFinishDoneDataToSelectedContent(
  data: TopicSelectionDoneData,
  fallback?: Partial<SelectedTopicContent>
): SelectedTopicContent {
  const source = data?.data ?? data;
  return {
    finalObjective: source.goalText ?? fallback?.finalObjective ?? '',
    researchContent: source.researchContent ?? fallback?.researchContent ?? '',
    expectedEffectAndPlan: source.expectedEffectAndPlan ?? fallback?.expectedEffectAndPlan ?? '',
  };
}
