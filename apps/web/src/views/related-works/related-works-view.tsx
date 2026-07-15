'use client';

import { Search, ArrowDown, ArrowDownAZ, ArrowUp } from 'lucide-react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import {
  HistoryList,
  NewSearchModal,
  ResultDetail,
  useRelatedWorks,
  useCreatePriorResearch,
  useDeletePriorResearch,
  useRelatedWorksStore,
} from '@/features/related-works';
import type { SearchHistory } from '@/features/related-works';
import { useTopicPriorResearchStore } from '@/features/topic-selection';
import { DeleteConfirmModal } from '@/shared/ui/delete-confirm-modal';
import { PageHeader } from '@/shared/ui/page-header';
import { PageHeaderPrimaryButton } from '@/shared/ui/page-header-primary-button';
import { SortDropdown, type SortOption } from '@/shared/ui/sort-dropdown';

type HistorySortOrder = 'newest' | 'oldest' | 'name';

const HISTORY_SORT_OPTIONS: SortOption<HistorySortOrder>[] = [
  { value: 'newest', label: '최신순', icon: <ArrowDown className='size-4' /> },
  { value: 'oldest', label: '오래된순', icon: <ArrowUp className='size-4' /> },
  { value: 'name', label: '이름 순', icon: <ArrowDownAZ className='size-4' /> },
];

function sortHistories(histories: SearchHistory[], order: HistorySortOrder): SearchHistory[] {
  const sorted = [...histories].sort((a, b) => {
    if (order === 'name') {
      return (a.keyword ?? '').localeCompare(b.keyword ?? '', 'ko');
    }
    const da = new Date(a.createdAt).getTime();
    const db = new Date(b.createdAt).getTime();
    return order === 'newest' ? db - da : da - db;
  });
  return sorted;
}

export function RelatedWorksView() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = (params?.id as string) ?? '';
  const returnTo = searchParams.get('returnTo');
  const focusNode = searchParams.get('focusNode');
  const urlHistoryId = searchParams.get('historyId');
  const { selectedHistoryId, setSelectedHistory } = useRelatedWorksStore();
  const effectiveHistoryId = selectedHistoryId ?? urlHistoryId;
  const getNodeIdByHistoryId = useTopicPriorResearchStore((s) => s.getNodeIdByHistoryId);
  const isNodeDeleted = useTopicPriorResearchStore((s) => s.isNodeDeleted);
  const {
    histories,
    selectedHistory,
    results,
    resultsByType,
    isPriorListPending,
    isPriorListFetched,
  } = useRelatedWorks(projectId, effectiveHistoryId);
  const createPriorResearch = useCreatePriorResearch(projectId);
  const deletePriorResearch = useDeletePriorResearch(projectId);

  useEffect(() => {
    if (urlHistoryId && !selectedHistoryId) {
      setSelectedHistory(urlHistoryId);
    }
  }, [urlHistoryId, selectedHistoryId, setSelectedHistory]);

  useEffect(() => {
    if (!urlHistoryId && selectedHistoryId) {
      setSelectedHistory(null);
    }
  }, [urlHistoryId, selectedHistoryId, setSelectedHistory]);

  // TODO: 나중에 확인하고 삭제
  const handleBack = () => {
    if (returnTo === 'topic-selection' && focusNode && projectId) {
      router.push(`/projects/${projectId}/topic-selection?focusNode=${focusNode}`);
    } else {
      setSelectedHistory(null);
      const params = new URLSearchParams();
      if (returnTo) params.set('returnTo', returnTo);
      if (focusNode) params.set('focusNode', focusNode);
      const query = params.toString();
      router.replace(`/projects/${projectId}/related-works${query ? `?${query}` : ''}`);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteClick = (researchId: string) => {
    setDeleteConfirmId(researchId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    try {
      await deletePriorResearch.mutateAsync(deleteConfirmId);
      if (effectiveHistoryId === deleteConfirmId) {
        setSelectedHistory(null);
      }
    } catch {
      // 에러는 mutation에서 처리
    }
  };

  const [newSearchOpen, setNewSearchOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<HistorySortOrder>('newest');
  const sortedHistories = useMemo(
    () => sortHistories(histories, sortOrder),
    [histories, sortOrder]
  );

  const historyNotFound =
    !!effectiveHistoryId && isPriorListFetched && !isPriorListPending && !selectedHistory;

  const handleNewSearchSubmit = async (content: string) => {
    try {
      const created = await createPriorResearch.mutateAsync(content);
      setNewSearchOpen(false);
      setSelectedHistory(created.id);
      const params = new URLSearchParams();
      params.set('historyId', created.id);
      if (returnTo) params.set('returnTo', returnTo);
      if (focusNode) params.set('focusNode', focusNode);
      router.push(`/projects/${projectId}/related-works?${params.toString()}`);
    } catch {
      // 에러는 mutation에서 처리 (toast 등)
    }
  };

  return (
    <>
      <div className='flex h-full min-h-0 flex-col'>
        {!effectiveHistoryId ? (
          <>
            <PageHeader
              title='선행연구 조사'
              description='주제별 검색 히스토리를 확인하고 관련 문헌을 탐색하세요'
              action={
                <PageHeaderPrimaryButton onClick={() => setNewSearchOpen(true)}>
                  <Search className='mr-2 size-4' />
                  선행연구 검색
                </PageHeaderPrimaryButton>
              }
            />
            <div className='min-h-0 flex-1 overflow-y-auto bg-zinc-100'>
              <div className='flex items-center justify-end px-6 py-2'>
                <SortDropdown
                  options={HISTORY_SORT_OPTIONS}
                  value={sortOrder}
                  onChange={setSortOrder}
                />
              </div>
              <div className='p-6 pt-0'>
                <HistoryList
                  histories={sortedHistories}
                  selectedId={effectiveHistoryId}
                  projectId={projectId}
                  getNodeIdByHistoryId={getNodeIdByHistoryId}
                  isNodeDeleted={isNodeDeleted}
                  onSelect={(id) => {
                    setSelectedHistory(id);
                    const params = new URLSearchParams();
                    params.set('historyId', id);
                    if (returnTo) params.set('returnTo', returnTo);
                    if (focusNode) params.set('focusNode', focusNode);
                    router.push(`/projects/${projectId}/related-works?${params.toString()}`);
                  }}
                  onDelete={handleDeleteClick}
                  onNewSearchClick={() => setNewSearchOpen(true)}
                />
              </div>
            </div>
          </>
        ) : effectiveHistoryId && isPriorListPending ? (
          <div className='flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-zinc-100 p-6'>
            <div className='flex min-h-[40vh] items-center justify-center text-sm text-zinc-500'>
              선행연구 정보를 불러오는 중…
            </div>
          </div>
        ) : historyNotFound ? (
          <div className='flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-zinc-100 p-6'>
            <div className='flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center'>
              <p className='text-sm text-zinc-600'>
                목록에 없는 선행연구입니다. 서버에 저장된 항목만 표시됩니다.
              </p>
              <PageHeaderPrimaryButton type='button' onClick={handleBack}>
                목록으로
              </PageHeaderPrimaryButton>
            </div>
          </div>
        ) : effectiveHistoryId && selectedHistory ? (
          <ResultDetail
            results={results}
            resultsByType={resultsByType}
            keyword={selectedHistory.keyword}
            onBack={handleBack}
            backLabel={
              returnTo === 'topic-selection' && focusNode ? '주제 선정으로 돌아가기' : '뒤로'
            }
            topicNodeId={focusNode ?? getNodeIdByHistoryId(effectiveHistoryId)}
            projectId={projectId}
            isTopicNodeDeleted={(() => {
              const nodeId = focusNode ?? getNodeIdByHistoryId(effectiveHistoryId);
              return nodeId ? isNodeDeleted(nodeId) : false;
            })()}
          />
        ) : null}
      </div>
      <NewSearchModal
        open={newSearchOpen}
        onOpenChange={setNewSearchOpen}
        onSubmit={handleNewSearchSubmit}
        isSubmitting={createPriorResearch.isPending}
      />
      <DeleteConfirmModal
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deletePriorResearch.isPending}
      />
    </>
  );
}
