'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { API_BASE } from '@/shared/config/api';

import type { ApiResponse, LegalReviewRecord, LegalReviewResponse } from './types';

const legalReviewQueryKey = (projectId: string, step: string) =>
  ['legalReview', 'v2', projectId, step] as const;

async function parseResponse(
  response: Response,
  fallbackMessage: string
): Promise<LegalReviewResponse> {
  let payload: ApiResponse<LegalReviewResponse>;

  try {
    payload = (await response.json()) as ApiResponse<LegalReviewResponse>;
  } catch {
    throw new Error(`${fallbackMessage} (${response.status})`);
  }

  if (!response.ok || !payload.success || payload.data === null) {
    throw new Error(payload.message?.trim() || `${fallbackMessage} (${response.status})`);
  }

  return payload.data;
}

export function useLegalReview(projectId: string, step: string) {
  const queryClient = useQueryClient();
  const enabled = Boolean(projectId && step);
  const queryKey = legalReviewQueryKey(projectId, step);

  const query = useQuery({
    queryKey,
    enabled,
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE}/api/v2/projects/${encodeURIComponent(projectId)}/legal-reviews/${encodeURIComponent(step)}`
      );
      return parseResponse(response, '법률 검토 기록을 불러오지 못했습니다.');
    },
  });

  const runReview = useMutation({
    mutationFn: async (): Promise<LegalReviewRecord> => {
      const response = await fetch(
        `${API_BASE}/api/v2/projects/${encodeURIComponent(projectId)}/legal-reviews/${encodeURIComponent(step)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      );
      const data = await parseResponse(response, '법률 검토를 완료하지 못했습니다.');
      if (!data.review) {
        throw new Error('법률 검토 결과가 비어 있습니다.');
      }
      return data.review;
    },
    onSuccess: (review) => {
      queryClient.setQueryData<LegalReviewResponse>(queryKey, { review });
    },
  });

  return { query, runReview };
}
