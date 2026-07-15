'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { API_BASE } from '@/shared/config/api';

import type {
  ProjectFileRecord,
  ProjectFileListResponse,
  ProjectFileUploadResponse,
  ProjectFilePinData,
} from './types';

interface BaseResponse<T> {
  success: boolean;
  statusCode?: number;
  data: T | null;
}

const QUERY_KEY = ['projectFiles', 'panel'] as const;

async function fetchFiles(projectId: string): Promise<ProjectFileRecord[]> {
  const res = await fetch(`${API_BASE}/api/v2/projects/${projectId}/files`);
  if (!res.ok) throw new Error('파일 목록을 불러오지 못했습니다');
  const json = (await res.json()) as BaseResponse<ProjectFileListResponse>;
  if (!json.success || !json.data) return [];
  return json.data.files ?? [];
}

async function uploadFile(projectId: string, file: File): Promise<ProjectFileUploadResponse> {
  const formData = new FormData();
  formData.append('files', file);

  const res = await fetch(`${API_BASE}/api/v2/projects/${projectId}/files`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('파일 업로드에 실패했습니다');
  const json = (await res.json()) as BaseResponse<ProjectFileUploadResponse>;
  if (!json.success || !json.data) throw new Error('업로드 응답 오류');
  return json.data;
}

async function deleteFile(projectId: string, fileId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v2/projects/${projectId}/files/${fileId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('파일 삭제에 실패했습니다');
  if (res.status === 204) return;
  const text = await res.text();
  if (!text.trim()) return;
  try {
    const json = JSON.parse(text) as BaseResponse<{ fileId: string } | null>;
    if (!json.success) throw new Error('파일 삭제에 실패했습니다');
  } catch (e) {
    if (e instanceof SyntaxError) return;
    throw e;
  }
}

async function pinFile(projectId: string, fileId: string, pinned: boolean): Promise<void> {
  const url = `${API_BASE}/api/v2/projects/${projectId}/files/${encodeURIComponent(fileId)}/pin`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pinned }),
  });

  const text = await res.text();

  if (!res.ok) {
    let message = `고정 설정에 실패했습니다 (${res.status})`;
    if (text.trim()) {
      try {
        const j = JSON.parse(text) as { detail?: unknown; data?: unknown };
        if (typeof j.data === 'string') message = j.data;
      } catch {
        /* ignore */
      }
    }
    throw new Error(message);
  }

  if (!text.trim()) return;
  try {
    const json = JSON.parse(text) as BaseResponse<ProjectFilePinData | null>;
    if (!json.success || !json.data) throw new Error('고정 설정에 실패했습니다');
  } catch (e) {
    if (e instanceof SyntaxError) return;
    throw e;
  }
}

export function useProjectFilesPanel(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = [...QUERY_KEY, projectId] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => fetchFiles(projectId!),
    enabled: !!projectId,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadFile(projectId!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => deleteFile(projectId!, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const pinMutation = useMutation({
    mutationFn: ({ fileId, pinned }: { fileId: string; pinned: boolean }) =>
      pinFile(projectId!, fileId, pinned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    files: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    upload: uploadMutation.mutateAsync,
    uploadPending: uploadMutation.isPending,
    deleteFile: deleteMutation.mutateAsync,
    deletePending: deleteMutation.isPending,
    pinFile: pinMutation.mutateAsync,
    pinPending: pinMutation.isPending,
    pinVariables: pinMutation.variables,
    pinError: pinMutation.error,
    resetPin: pinMutation.reset,
  };
}
