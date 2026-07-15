'use client';

import {
  Star,
  Plus,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import {
  useProjects,
  useToggleProjectStar,
  useProjectForm,
  useDeleteProject,
} from '@/features/projects';
import type { ProjectCard } from '@/features/projects';
import { cn, formatDateTime } from '@/shared/lib/utils';
import { useProjectsViewStore } from '@/shared/stores/projects-view-store';
import { DeleteConfirmModal } from '@/shared/ui/delete-confirm-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { FloatingLineTabs } from '@/shared/ui/floating-line-tabs';
import { IrisLink } from '@/shared/ui/iris-link';
import { StateTag } from '@/shared/ui/state-tag';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { useRecommendations } from '@/features/rnd-recommendation';
import type { RndNoticeCardData } from '@/widgets/rnd-notice-card';
import { RndNoticeCard } from '@/widgets/rnd-notice-card';

const EMPTY_PROJECTS: ProjectCard[] = [];
const EMPTY_RECOMMENDATIONS: RndNoticeCardData[] = [];
type RecommendationTab = 'personalized' | 'freeCompetition';

export default function ProjectsPage() {
  const router = useRouter();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activeRecommendationTab, setActiveRecommendationTab] =
    useState<RecommendationTab>('personalized');
  const { data, isPending, isError } = useProjects();
  const projects = data ?? EMPTY_PROJECTS;
  const { mutate: toggleStar } = useToggleProjectStar();
  const { mutateAsync: deleteProject, isPending: isDeleting } = useDeleteProject();
  const { sidebarSection, setSidebarSection, setSidebarProjects } = useProjectsViewStore();
  const isRndRecommendations = sidebarSection === 'rnd-recommendations';
  const { openNewProject, openEditProject } = useProjectForm();
  const {
    data: recommendationData,
    isPending: isRecommendationsPending,
    isError: isRecommendationsError,
    error: recommendationsError,
  } = useRecommendations();

  const sortedProjects = useMemo(
    () =>
      [...projects]
        .filter((p) => sidebarSection !== 'favorites' || p.starred)
        .sort((a, b) => {
          if (a.isPendingInit && !b.isPendingInit) return -1;
          if (!a.isPendingInit && b.isPendingInit) return 1;
          return a.starred === b.starred ? 0 : a.starred ? -1 : 1;
        }),
    [projects, sidebarSection]
  );

  const recommendationItems =
    activeRecommendationTab === 'personalized'
      ? recommendationData?.personalizedItems ?? EMPTY_RECOMMENDATIONS
      : recommendationData?.freeCompetitionItems ?? EMPTY_RECOMMENDATIONS;

  useEffect(() => {
    setSidebarProjects(
      sortedProjects
        .filter((p) => !p.isPendingInit)
        .map((p) => ({ id: p.id, topic: p.topic, starred: p.starred }))
    );
  }, [sortedProjects, setSidebarProjects]);

  const handleProjectClick = (project: ProjectCard) => {
    if (project.isPendingInit) return;
    router.push(`/projects/${project.id}`);
  };

  const handleToggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const project = projects.find((p) => p.id === id);
    if (project) {
      toggleStar({ id, starred: !project.starred });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    await deleteProject(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  if (!isRndRecommendations && isPending) {
    return <p className='text-sm text-zinc-500'>로딩 중...</p>;
  }

  if (!isRndRecommendations && isError) {
    return (
      <p className='text-sm text-red-500'>
        프로젝트를 불러올 수 없습니다. API 서버 연결을 확인해 주세요.
      </p>
    );
  }

  return (
    <>
      <DeleteConfirmModal
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
      <TooltipProvider delayDuration={200}>
      {isRndRecommendations ? (
        isRecommendationsPending ? (
          <p className='text-sm text-zinc-500'>로딩 중...</p>
        ) : isRecommendationsError ? (
          <p className='text-sm text-red-500'>
            {recommendationsError instanceof Error
              ? recommendationsError.message
              : '건축 공고를 불러올 수 없습니다. API 서버 연결을 확인해 주세요.'}
          </p>
        ) : (
          <div className='mx-auto w-full max-w-5xl'>
            <div className='mb-4 space-y-4'>
              <FloatingLineTabs
                tone='light'
                value={activeRecommendationTab}
                onValueChange={(value) => setActiveRecommendationTab(value as RecommendationTab)}
                items={[
                  {
                    value: 'personalized',
                    label: '맞춤 건축 공고',
                    badge: recommendationData?.personalizedItems.length ?? 0,
                  },
                  {
                    value: 'freeCompetition',
                    label: '공개 건축 공고',
                    badge: recommendationData?.freeCompetitionItems.length ?? 0,
                  },
                ]}
              />
              <p className='text-sm text-zinc-500'>
                건축 공고 {recommendationItems.length}건
              </p>
            </div>
            <div className='flex flex-col gap-3'>
              {recommendationItems.length === 0 ? (
                <p className='text-sm text-zinc-500'>건축 공고가 없습니다.</p>
              ) : (
                recommendationItems.map((notice) => (
                  <RndNoticeCard
                    key={notice.id}
                    data={notice}
                    onCreateProject={(ezrndNoticeId) => {
                      setSidebarSection('research-plans');
                      openNewProject({ ezrndNoticeId });
                    }}
                  />
                ))
              )}
            </div>
          </div>
        )
      ) : (
        <>
      <div className='mb-4 flex items-center justify-between'>
        <p className='text-sm text-zinc-500'>
          {sidebarSection === 'favorites'
            ? sortedProjects.length === 0
              ? '즐겨찾기한 건축 프로젝트가 없습니다'
              : `즐겨찾기 ${sortedProjects.length}개`
            : `총 ${sortedProjects.length}개의 건축 프로젝트`}
        </p>
      </div>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {/* New Project Card */}
        <button
          type='button'
          className={cn(
            'group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 bg-white py-12 text-center transition-colors shadow-sm',
            'hover:border-zinc-400 hover:bg-zinc-50'
          )}
          onClick={() => openNewProject()}
        >
          <div className='flex size-14 items-center justify-center rounded-full bg-zinc-100 group-hover:bg-zinc-200'>
            <Plus className='size-7 text-zinc-500' />
          </div>
          <div>
            <p className='text-sm font-medium text-zinc-700 group-hover:text-zinc-900'>
              건축 프로젝트 만들기
            </p>
            <p className='mt-0.5 text-xs text-zinc-500'>수동으로 새 건축 프로젝트를 시작합니다</p>
          </div>
        </button>

        {/* Project Cards */}
        {sortedProjects.map((project) => (
          <div
            key={project.id}
            role={project.isPendingInit ? 'status' : 'button'}
            tabIndex={project.isPendingInit ? undefined : 0}
            aria-busy={project.isPendingInit ? true : undefined}
            aria-live={project.isPendingInit ? 'polite' : undefined}
            onClick={() => handleProjectClick(project)}
            onKeyDown={(e) => {
              if (project.isPendingInit) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleProjectClick(project);
              }
            }}
            className={cn(
              'group relative flex flex-col rounded-xl border text-left transition-all',
              project.isPendingInit
                ? 'topic-node-loading-shell project-card-loading-shell cursor-default overflow-visible border-transparent bg-transparent'
                : 'cursor-pointer overflow-hidden border-zinc-200 bg-white shadow-sm hover:border-zinc-300 hover:shadow-md'
            )}
          >
            <div
              className={cn(
                project.isPendingInit
                  ? 'relative z-[1] m-[2px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] bg-white shadow-sm'
                  : 'contents'
              )}
            >
              <div className='flex items-center justify-between gap-2 border-b border-zinc-100 bg-zinc-50/80 px-4 py-2'>
                <div className='flex min-w-0 flex-1 items-center gap-2 overflow-hidden'>
                  <StateTag
                    variant='darkgray'
                    bordered
                    className='min-w-0 max-w-[140px] shrink line-clamp-1 wrap-break-word'
                  >
                    {project.supportProjectName}
                  </StateTag>
                  <StateTag
                    variant='green'
                    bordered
                    className='min-w-0 max-w-[140px] shrink line-clamp-1 wrap-break-word'
                  >
                    {project.competitionType}
                  </StateTag>
                </div>
                <div className='flex shrink-0 items-center gap-0.5'>
                  {project.isPendingInit ? (
                    <Loader2
                      className='size-4 shrink-0 animate-spin text-indigo-500'
                      aria-label='건축 프로젝트 생성 중'
                    />
                  ) : (
                    <>
                      <button
                        type='button'
                        onClick={(e) => handleToggleStar(project.id, e)}
                        className='flex size-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-amber-500'
                        aria-label={project.starred ? '즐겨찾기 해제' : '즐겨찾기'}
                      >
                        <Star
                          className={cn('size-4', project.starred && 'fill-amber-400 text-amber-400')}
                        />
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type='button'
                            onClick={(e) => e.stopPropagation()}
                            className='flex size-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700'
                            aria-label='메뉴 열기'
                          >
                            <MoreHorizontal className='size-4' />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' className='min-w-[140px]'>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditProject(project);
                            }}
                            className='gap-2'
                          >
                            <Pencil className='size-3.5' />
                            편집
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(project.id);
                            }}
                            className='gap-2 text-red-600 focus:text-red-600'
                          >
                            <Trash2 className='size-3.5' />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              </div>

              <div className='min-w-0 flex-1 p-4'>
                <div className='flex items-center gap-2 text-sm text-zinc-500'>
                  <Image
                    src='/gov.png'
                    alt=''
                    width={16}
                    height={16}
                    className='size-4 shrink-0 object-contain'
                  />
                  <span className='truncate'>{project.organizingInstitution}</span>
                </div>
                <h3 className='mt-2 font-topic line-clamp-2 text-lg leading-snug text-zinc-900'>
                  {project.topic}
                </h3>
                <div className='mt-2 space-y-1 pl-4 text-sm text-zinc-500'>
                  <p>
                    <span className='font-medium text-zinc-600'>총 사업비</span> {project.totalBudget}
                  </p>
                  <p>
                    <span className='font-medium text-zinc-600'>제안서 작성기간</span>{' '}
                    {project.startDate && project.endDate
                      ? `${formatDateTime(project.startDate)} ~ ${formatDateTime(project.endDate)}`
                      : '-'}
                  </p>
                </div>
                {project.keywords && project.keywords.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className='mt-2 line-clamp-1 text-sm text-primary'>
                        {project.keywords.join(', ')}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent side='top' className='max-w-sm'>
                      {project.keywords.join(', ')}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              <div className='flex items-center justify-between border-t border-zinc-100 px-4 py-2.5'>
                <div className='flex items-center gap-2'>
                  {!project.isPendingInit && project.irisUrl && (
                    <IrisLink href={project.irisUrl} onClick={(e) => e.stopPropagation()} />
                  )}
                  <span className='text-xs text-zinc-500'>{project.editedAt}</span>
                </div>
                {!project.isPendingInit && (
                  <ChevronRight className='size-4 shrink-0 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100' />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
        </>
      )}
      </TooltipProvider>
    </>
  );
}
