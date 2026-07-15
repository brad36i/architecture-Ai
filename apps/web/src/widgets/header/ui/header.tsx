'use client';

import { Gauge } from 'lucide-react';

import { LegalReviewControl } from '@/features/legal-review';
import { useProject } from '@/features/projects';
import { cn } from '@/shared/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/shared/ui/popover';
import { StateTag } from '@/shared/ui/state-tag';

type HeaderProps = {
  /** 프로젝트 상세 레이아웃에서 전달되는 프로젝트 ID (없으면 기본 placeholder 표시) */
  projectId?: string | null;
};

function getScoreBarColor(value: number): string {
  if (value >= 70) return 'bg-emerald-500';
  if (value >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function getScoreLabel(value: number): string {
  if (value >= 90) return '매우 우수';
  if (value >= 75) return '안정적';
  if (value >= 60) return '보완 가능';
  return '집중 보완 필요';
}

function getElaborationSummary(
  score: number,
  subScores: Array<{
    category: string;
    score: number;
    maxScore?: number;
    feedback?: string;
  }>
): string {
  if (subScores.length === 0) {
    return '세부 평가가 아직 없어 전체 구체화 수준만 확인할 수 있습니다.';
  }

  const normalized = subScores.map((item) => {
    const max = item.maxScore ?? 100;
    const ratio = max > 0 ? item.score / max : 0;
    return { ...item, max, ratio };
  });
  const best = normalized.reduce((prev, current) => (current.ratio > prev.ratio ? current : prev));
  const weakest = normalized.reduce((prev, current) =>
    current.ratio < prev.ratio ? current : prev
  );

  if (score >= 85) {
    return `${best.category}는 강점으로 보이며, ${weakest.category}를 조금만 더 다듬으면 완성도가 한층 올라갑니다.`;
  }

  if (score >= 70) {
    return `전반적인 방향은 잘 잡혀 있습니다. 다음 보완 우선순위는 ${weakest.category}입니다.`;
  }

  return `${weakest.category}를 중심으로 근거와 세부 설계를 보강하면 점수를 빠르게 끌어올릴 수 있습니다.`;
}

export function Header({ projectId }: HeaderProps) {
  const { data: project, isPending, isError } = useProject(projectId);

  if (!projectId) {
    return (
      <header className='flex shrink-0 flex-col gap-2 border-b border-zinc-200 bg-white px-6 py-3'>
        <div className='flex min-w-0 items-center gap-3'>
          <span className='text-sm text-zinc-500'>프로젝트를 선택해 주세요</span>
        </div>
      </header>
    );
  }

  if (isPending) {
    return (
      <header className='flex shrink-0 flex-col gap-2 border-b border-zinc-200 bg-white px-6 py-3'>
        <div className='h-9 animate-pulse rounded bg-zinc-100' />
      </header>
    );
  }

  if (isError || !project) {
    return (
      <header className='flex shrink-0 flex-col gap-2 border-b border-zinc-200 bg-white px-6 py-3'>
        <span className='text-sm text-red-500'>프로젝트를 불러올 수 없습니다</span>
      </header>
    );
  }

  const keywords = project.keywords ?? [];
  const score = project.elaborationScore ?? 0;
  const subScores = project.elaborationDetail?.subScores ?? [];
  const summary = getElaborationSummary(score, subScores);
  const showMeMeta =
    Boolean(project.elaborationDetail?.evaluatedAt) ||
    (project.currentStep !== undefined && project.currentStep !== '') ||
    Boolean(project.createdAt);

  return (
    <header className='flex shrink-0 flex-col gap-2 border-b border-zinc-200 bg-white px-6 py-3'>
      {/* 위: 주관기관 | 사업명 | 건축 주제 (한줄, 클램프) | 우측: 구체화 점수 */}
      <div className='flex min-w-0 items-center gap-3'>
        <div className='flex min-w-0 flex-1 items-center gap-2 text-sm text-zinc-600'>
          <span className='shrink-0'>{project.organizingInstitution}</span>
          <span className='shrink-0 text-zinc-300'>|</span>
          <span className='shrink-0'>{project.supportProjectName}</span>
          <span className='shrink-0 text-zinc-300'>|</span>
          <span className='font-topic min-w-0 flex-1 truncate text-xl font-medium text-zinc-800'>
            {project.topic}
          </span>
        </div>
        <div className='flex shrink-0 flex-wrap items-start justify-end gap-3'>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type='button'
                className='flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-base font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100'
              >
                <Gauge className='size-4 text-zinc-500' />
                <span>
                  구체화 점수 <span className='text-emerald-700'>{score}</span>
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              side='bottom'
              align='end'
              className='w-120 max-w-[calc(100vw-2rem)] rounded-2xl border border-zinc-200 p-0 shadow-xl'
            >
              <div className='overflow-hidden rounded-2xl'>
                <div className='bg-linear-to-br border-b border-zinc-200 from-emerald-50 via-white to-teal-50 px-5 py-4'>
                  <div className='flex items-start justify-between gap-4'>
                    <div className='min-w-0 space-y-2'>
                      <div className='flex items-center gap-2'>
                        <p className='text-sm font-medium text-zinc-600'>구체화 점수 요약</p>
                        <span className='rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100'>
                          {getScoreLabel(score)}
                        </span>
                      </div>
                      <h3 className='text-xl font-semibold tracking-tight text-zinc-900'>
                        {score}
                        <span className='ml-1 text-sm font-medium text-zinc-500'>/100</span>
                      </h3>
                      <p className='text-sm leading-6 text-zinc-600'>{summary}</p>
                    </div>
                    <div className='w-24 shrink-0'>
                      <div className='mb-2 h-2.5 overflow-hidden rounded-full bg-white/80 ring-1 ring-zinc-200'>
                        <div
                          className={cn('h-full rounded-full', getScoreBarColor(score))}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <p className='text-right text-xs font-medium text-zinc-500'>전체 점수</p>
                    </div>
                  </div>
                </div>

                <div className='max-h-112 space-y-4 overflow-y-auto px-5 py-4'>
                  <div className='space-y-1'>
                    <p className='text-sm font-semibold text-zinc-800'>세부 평가</p>
                    <p className='text-xs text-zinc-500'>
                      항목별 강점과 보완 포인트를 함께 확인할 수 있습니다.
                    </p>
                  </div>

                  {subScores.length === 0 ? (
                    <div className='rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-500'>
                      세부 항목 점수가 아직 없습니다.
                    </div>
                  ) : (
                    <div className='space-y-3'>
                      {subScores.map((item, index) => {
                        const max = item.maxScore ?? 100;
                        const widthPct = max > 0 ? Math.min(100, (item.score / max) * 100) : 0;
                        const key = `${item.category}-${index}`;

                        return (
                          <div
                            key={key}
                            className='rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm'
                          >
                            <div className='flex items-center gap-3'>
                              <span className='w-28 shrink-0 text-sm font-medium text-zinc-700'>
                                {item.category}
                              </span>
                              <div className='h-2 flex-1 overflow-hidden rounded-full bg-zinc-100'>
                                <div
                                  className={cn(
                                    'h-full rounded-full',
                                    getScoreBarColor(item.score)
                                  )}
                                  style={{ width: `${widthPct}%` }}
                                />
                              </div>
                              <span className='w-16 shrink-0 text-right text-sm font-semibold text-zinc-800 tabular-nums'>
                                {item.score}/{max}
                              </span>
                            </div>
                            {item.feedback ? (
                              <p className='mt-2 pl-0 text-sm leading-6 text-zinc-600'>
                                {item.feedback}
                              </p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {showMeMeta ? (
                    <div className='space-y-2 border-t border-zinc-100 pt-4 text-xs text-zinc-500'>
                      {project.elaborationDetail?.evaluatedAt ? (
                        <p>
                          평가 시점:{' '}
                          {new Date(project.elaborationDetail.evaluatedAt).toLocaleString('ko-KR')}
                        </p>
                      ) : null}
                      {project.currentStep !== undefined && project.currentStep !== '' ? (
                        <p>현재 단계: {String(project.currentStep)}</p>
                      ) : null}
                      {project.createdAt ? (
                        <p>생성: {new Date(project.createdAt).toLocaleString('ko-KR')}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <LegalReviewControl projectId={projectId} />
        </div>
      </div>
      {/* 아래: 키워드 */}
      {keywords.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {keywords.map((keyword) => (
            <StateTag key={keyword} variant='green' className='font-normal'>
              {keyword}
            </StateTag>
          ))}
        </div>
      )}
    </header>
  );
}
