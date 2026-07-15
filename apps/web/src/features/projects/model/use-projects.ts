import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { API_BASE } from '@/shared/config/api';
import { useAuthStore } from '@/shared/stores/auth-store';

import type {
  BaseResponse,
  ProjectInitCreateResponseV2,
  ProjectInitDetailRequest,
  ProjectListDataV2,
  ProjectListItemV2,
  ProjectMeResponse,
  ProjectPatchRequestV2,
  ProjectPinResponse,
} from './api-types';
import type { ProjectCard } from './types';

export type UpdateProjectPayload = Partial<Omit<ProjectCard, 'id'>>;

function cardUpdateToPatchRequest(p: UpdateProjectPayload): ProjectPatchRequestV2 {
  const body: ProjectPatchRequestV2 = {};
  if (p.topic !== undefined) body.llmTitle = p.topic || null;
  if (p.irisUrl !== undefined) body.url = p.irisUrl || null;
  if (p.keywords !== undefined) {
    body.keywords = p.keywords?.length ? p.keywords : null;
  }
  if (p.organizingInstitution !== undefined) {
    body.ministryNames = p.organizingInstitution ? [p.organizingInstitution] : null;
  }
  if (p.competitionType !== undefined) {
    body.noticeTypes = p.competitionType ? [p.competitionType] : null;
  }
  if (p.supportProjectName !== undefined) {
    body.budgetProject = p.supportProjectName || null;
  }
  if (p.totalBudget !== undefined) {
    const t = p.totalBudget || null;
    body.programBudget = t;
    body.fundings = t;
  }
  if (p.startDate !== undefined) body.startDate = p.startDate || null;
  if (p.endDate !== undefined) body.endDate = p.endDate || null;
  return body;
}

function mapProjectListItemToCard(item: ProjectListItemV2): ProjectCard {
  const topic = item.llmTitle ?? item.noticeTitle ?? '제목 없음';
  const supportProjectName = item.budgetProject ?? item.programBudget ?? '';
  const organizingInstitution = item.ministryNames?.[0] ?? '';
  const totalBudget = item.programBudget ?? item.fundings ?? '';
  const applicationPeriod =
    [item.startDate, item.endDate].filter(Boolean).join(' ~ ') ||
    [item.createdAt, item.updatedAt].filter(Boolean).join(' ~ ') ||
    '-';
  const competitionType = (item.noticeTypes?.[0] as ProjectCard['competitionType']) ?? '자유공모';
  const editedAt = item.updatedAt ? formatRelativeDate(item.updatedAt) : '방금 전 편집';

  return {
    id: item.id,
    topic,
    supportProjectName,
    organizingInstitution,
    totalBudget,
    applicationPeriod,
    competitionType,
    editedAt,
    starred: item.isPinned ?? false,
    irisUrl: item.url ?? undefined,
    keywords: item.keywords ?? [],
    startDate: item.startDate ?? undefined,
    endDate: item.endDate ?? undefined,
  };
}

function buildInitDetailJsonBody(payload: ProjectInitDetailRequest): Record<string, unknown> {
  const { noticeId, ...rest } = payload;
  const body: Record<string, unknown> = { noticeId: noticeId.trim() };
  for (const [key, value] of Object.entries(rest)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && !value.trim()) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    body[key] = value;
  }
  return body;
}

function formatRelativeDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return '방금 전';
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    return d.toLocaleDateString('ko-KR');
  } catch {
    return '방금 전 편집';
  }
}

function mapProjectMeToCard(me: ProjectMeResponse): ProjectCard {
  const topic = me.llmTitle ?? '제목 없음';
  const supportProjectName = me.budgetProject ?? '';
  const organizingInstitution = me.ministryNames?.[0] ?? '';
  const totalBudget = me.programBudget ?? me.fundings ?? '';
  const applicationPeriod = [me.startDate, me.endDate].filter(Boolean).join(' ~ ') || '-';
  const competitionType = (me.noticeTypes?.[0] as ProjectCard['competitionType']) ?? '자유공모';
  const editedAt = me.updatedAt ? formatRelativeDate(me.updatedAt) : '방금 전 편집';

  return {
    id: me.id,
    topic,
    supportProjectName,
    organizingInstitution,
    totalBudget,
    applicationPeriod,
    competitionType,
    editedAt,
    starred: me.isPinned ?? false,
    irisUrl: me.url ?? undefined,
    ezrndNoticeId: me.noticeId ?? undefined,
    keywords: me.keywords ?? [],
    startDate: me.startDate ?? undefined,
    endDate: me.endDate ?? undefined,
    userId: me.userId,
    currentStep: me.currentStep,
    elaborationScore: me.elaborationScore,
    elaborationDetail: me.elaborationDetail ?? undefined,
    createdAt: me.createdAt ?? undefined,
  };
}

export function useProject(id: string | undefined | null) {
  return useQuery({
    queryKey: ['projects', 'me', id],
    queryFn: async () => {
      if (!id) throw new Error('Project ID required');
      const res = await fetch(`${API_BASE}/api/v2/projects/${id}/me`);
      if (!res.ok) throw new Error('Failed to fetch project');
      const json = (await res.json()) as BaseResponse<ProjectMeResponse>;
      if (!json.success || !json.data) throw new Error('Project not found');
      return mapProjectMeToCard(json.data);
    },
    enabled: !!id,
  });
}

// TODO: 향후 삭제 — userId 없으면 쿼리 비활성은 임시 인증 전제, 실제 인증 시 정리
export function useProjects() {
  const userId = useAuthStore((s) => s.userId);
  const effectiveUserId = userId ?? 1;

  return useQuery({
    queryKey: ['projects', 'v2', effectiveUserId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v2/users/${effectiveUserId}/projects`);
      if (!res.ok) throw new Error('Failed to fetch projects');
      const json = (await res.json()) as BaseResponse<ProjectListDataV2>;
      if (!json.success || !json.data?.projects) return [] as ProjectCard[];
      return json.data.projects.map(mapProjectListItemToCard);
    },
  });
}

export function useToggleProjectStar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, starred }: { id: string; starred: boolean }) => {
      const res = await fetch(`${API_BASE}/api/v2/projects/${id}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: starred }),
      });
      const json = (await res.json()) as BaseResponse<ProjectPinResponse>;
      if (!res.ok || !json.success || !json.data) {
        throw new Error('Failed to update project pin');
      }
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

const PENDING_PROJECT_ID_PREFIX = '__pending_init__';

function makePendingProjectCard(tempId: string, noticeId: string): ProjectCard {
  return {
    id: tempId,
    topic: '공고 분석 중…',
    supportProjectName: '준비 중',
    organizingInstitution: '—',
    totalBudget: '—',
    applicationPeriod: '—',
    competitionType: '자유공모',
    editedAt: '생성 중',
    starred: false,
    isPendingInit: true,
    ezrndNoticeId: noticeId,
  };
}

// TODO: 향후 삭제 — 임시 인증(userId) 가드
export function useInitProjectDetail() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.userId);
  const effectiveUserId = userId ?? 1;

  return useMutation({
    mutationFn: async (payload: ProjectInitDetailRequest) => {
      const res = await fetch(`${API_BASE}/api/v2/workflows/${effectiveUserId}/projects/init-detail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildInitDetailJsonBody(payload)),
      });
      const json = (await res.json()) as BaseResponse<ProjectInitCreateResponseV2> & {
        detail?: { msg?: string }[] | string;
      };
      if (res.ok && json.success && json.data) return json.data;
      let message = '프로젝트를 만들 수 없습니다';
      if (Array.isArray(json.detail) && json.detail[0]?.msg) {
        message = json.detail[0].msg;
      } else if (typeof json.detail === 'string') {
        message = json.detail;
      }
      throw new Error(message);
    },
    onMutate: async (payload) => {
      const queryKey = ['projects', 'v2', effectiveUserId] as const;
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ProjectCard[]>(queryKey);
      const tempId = `${PENDING_PROJECT_ID_PREFIX}${crypto.randomUUID()}`;
      const pendingCard = makePendingProjectCard(tempId, payload.noticeId.trim());
      queryClient.setQueryData<ProjectCard[]>(queryKey, (old) => [pendingCard, ...(old ?? [])]);
      return { previous, tempId, queryKey };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous !== undefined && context.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
    },
    onSuccess: (_data, _payload, context) => {
      if (context?.tempId && context.queryKey) {
        queryClient.setQueryData<ProjectCard[]>(context.queryKey, (old) =>
          (old ?? []).filter((p) => p.id !== context.tempId)
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateProjectPayload & { id: string }) => {
      const body = cardUpdateToPatchRequest(payload);
      const res = await fetch(`${API_BASE}/api/v2/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as BaseResponse<ProjectMeResponse>;
      if (!res.ok || !json.success) {
        throw new Error('Failed to update project');
      }
      return json.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'me', variables.id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const res = await fetch(`${API_BASE}/api/v2/projects/${projectId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete project');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
