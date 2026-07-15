'use client';

import {
  ArrowLeft,
  ArrowDown,
  ArrowDownAZ,
  ArrowUp,
  CheckSquare,
  Square,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';

import { useRelatedWorksStore } from '@/features/related-works/model/related-works-store';
import type { SearchResult, DocumentType } from '@/features/related-works/model/types';
import {
  useClippings,
  searchResultToClippingCreate,
} from '@/features/related-works/model/use-clippings';
import { ResultCard } from '@/features/related-works/ui/result-card';
import { useAsidebarStore } from '@/shared/stores/asidebar-store';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/page-header';
import {
  PageHeaderOutlineButton,
  PageHeaderPrimaryButton,
} from '@/shared/ui/page-header-primary-button';
import { SortDropdown, type SortOption } from '@/shared/ui/sort-dropdown';
import { UnderlineTabList } from '@/shared/ui/underline-tab-list';
import { Tabs } from '@/shared/ui/tabs';

type ResultSortOrder = 'name' | 'newest' | 'similarity';

const RESULT_SORT_OPTIONS: SortOption<ResultSortOrder>[] = [
  {
    value: 'similarity',
    label: '유사도 높은순',
    icon: (
      <>
        <Sparkles className='size-4' />
        <ArrowUp className='size-4' />
      </>
    ),
  },
  {
    value: 'newest',
    label: '최신순',
    icon: <ArrowDown className='size-4' />,
  },
  {
    value: 'name',
    label: '이름 순',
    icon: <ArrowDownAZ className='size-4' />,
  },
];

interface ResultDetailProps {
  results: SearchResult[];
  resultsByType: Record<DocumentType, SearchResult[]>;
  keyword: string;
  onBack: () => void;
  backLabel?: string;
  /** 주제 선정에서 생성된 히스토리 (API 결과 없음) */
  isTopicHistory?: boolean;
  /** 예상 결과 건수 (isTopicHistory일 때 resultCounts 합계) */
  estimatedTotal?: number;
  /** 주제 선정 노드 ID (있으면 바로가기 버튼 표시) */
  topicNodeId?: string | null;
  projectId?: string;
  /** 해당 노드가 삭제된 경우 (히스토리는 유지) */
  isTopicNodeDeleted?: boolean;
}

type TabType = 'report' | 'paper' | 'patent' | 'article';

const TAB_CONFIG: Record<TabType, { label: string }> = {
  report: { label: '건축사례' },
  paper: { label: '논문' },
  patent: { label: '특허' },
  article: { label: '기사·블로그' },
};

export function ResultDetail({
  results,
  resultsByType,
  keyword,
  onBack,
  backLabel = '뒤로',
  isTopicHistory,
  estimatedTotal,
  topicNodeId,
  projectId,
  isTopicNodeDeleted,
}: ResultDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('report');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<ResultSortOrder>('similarity');

  const onTabChange = (value: string) => setActiveTab(value as TabType);
  const { clippings, createClipping, createPending } = useClippings(projectId);
  const { openPanel } = useAsidebarStore();
  const tabResults = resultsByType[activeTab];
  const currentResults = useMemo(() => {
    const list = [...tabResults];
    if (sortOrder === 'name') {
      list.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '', 'ko'));
    } else if (sortOrder === 'similarity') {
      list.sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));
    } else {
      list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }
    return list;
  }, [tabResults, sortOrder]);
  const totalCount = estimatedTotal ?? results.length;

  const handleCardClick = (result: SearchResult) => {
    useRelatedWorksStore.setState({ previewItem: result });
    openPanel('문헌상세');
  };

  const allSelected = useMemo(
    () => currentResults.length > 0 && currentResults.every((r) => selectedIds.has(r.id)),
    [currentResults, selectedIds]
  );

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentResults.map((r) => r.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBookmarkSelected = async () => {
    const toBookmark = currentResults.filter((r) => selectedIds.has(r.id));
    if (!projectId || toBookmark.length === 0) return;
    for (const r of toBookmark) {
      await createClipping(searchResultToClippingCreate(r));
    }
    setSelectedIds(new Set());
  };

  const handleBookmark = async (result: SearchResult) => {
    if (!projectId) return;
    await createClipping(searchResultToClippingCreate(result));
  };

  // TODO: 나중에 확인하고 삭제
  const handleGoToTopicSelection =
    topicNodeId && projectId && !isTopicNodeDeleted
      ? () => router.push(`/projects/${projectId}/topic-selection?focusNode=${topicNodeId}`)
      : undefined;

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='shrink-0 bg-white'>
        <PageHeader
          title={keyword}
          description={`총 ${totalCount}건의 결과를 유형별로 검토하고 비교하세요. 현재 탭 ${currentResults.length}건 · 갈무리 ${clippings.length}건`}
          action={
            <div className='flex shrink-0 flex-wrap items-center justify-end gap-2'>
              {topicNodeId &&
                (isTopicNodeDeleted ? (
                  <span className='rounded-xs border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-500'>
                    노드 삭제됨
                  </span>
                ) : (
                  handleGoToTopicSelection && (
                    <PageHeaderOutlineButton type='button' onClick={handleGoToTopicSelection}>
                      <MapPin className='mr-2 size-4' />
                      주제 선정으로
                    </PageHeaderOutlineButton>
                  )
                ))}
              <PageHeaderPrimaryButton type='button' onClick={onBack}>
                <ArrowLeft className='mr-2 size-4' />
                {backLabel}
              </PageHeaderPrimaryButton>
            </div>
          }
        />
        <div className='bg-white px-6 pt-2'>
          <Tabs value={activeTab} onValueChange={onTabChange} className='w-full'>
            <UnderlineTabList
              items={(Object.keys(TAB_CONFIG) as TabType[]).map((tab) => ({
                value: tab,
                label: TAB_CONFIG[tab].label,
                badge: resultsByType[tab].length,
              }))}
            />
          </Tabs>
        </div>
      </div>

      <div className='min-h-0 flex-1 overflow-y-auto bg-zinc-100 p-6'>
        {currentResults.length > 0 && (
          <div className='mb-4 flex flex-wrap items-center justify-end gap-2'>
            <SortDropdown options={RESULT_SORT_OPTIONS} value={sortOrder} onChange={setSortOrder} />
            <Button
              variant='outline'
              size='sm'
              onClick={handleToggleAll}
              className='h-8 rounded-xs border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
            >
              {allSelected ? (
                <CheckSquare className='mr-2 size-4' />
              ) : (
                <Square className='mr-2 size-4' />
              )}
              {allSelected ? '전체 해제' : '전체 선택'}
            </Button>
            {selectedIds.size > 0 && (
              <Button
                variant='default'
                size='sm'
                onClick={handleBookmarkSelected}
                disabled={!projectId || createPending}
                className='h-8 rounded-xs'
              >
                {createPending ? '저장 중...' : `${selectedIds.size}건 갈무리`}
              </Button>
            )}
          </div>
        )}

        {currentResults.length > 0 ? (
          <div className='grid gap-4'>
            {currentResults.map((result) => (
              <div key={result.id} onClick={() => handleCardClick(result)} className='cursor-pointer'>
                <ResultCard
                  result={result}
                  isBookmarked={false}
                  isSelected={selectedIds.has(result.id)}
                  onBookmark={projectId ? () => handleBookmark(result) : undefined}
                >
                  <ResultCard.Header
                    showCheckbox
                    checked={selectedIds.has(result.id)}
                    onCheckedChange={() => handleToggleSelect(result.id)}
                  />
                  <ResultCard.Body />
                  <ResultCard.Footer />
                </ResultCard>
              </div>
            ))}
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center gap-2 rounded-xs border border-dashed border-zinc-300 bg-white py-16 text-center text-zinc-600'>
            {isTopicHistory ? (
              <p className='text-sm'>
                주제 선정에서 자동 생성된 히스토리입니다.
                <br />새 검색을 통해 선행연구를 조사해 보세요.
              </p>
            ) : (
              <p>해당 유형의 결과가 없습니다.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
