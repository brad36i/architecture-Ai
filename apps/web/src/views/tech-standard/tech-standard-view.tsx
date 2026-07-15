'use client';

import { Sparkles } from 'lucide-react';
import { useParams } from 'next/navigation';

import {
  SystemClassificationCard,
  useTechClassification,
} from '@/features/tech-standard';
import { isHttpNotFoundError } from '@/shared/lib/http-error';
import { PageHeader } from '@/shared/ui/page-header';
import { PageHeaderPrimaryButton } from '@/shared/ui/page-header-primary-button';

export function TechStandardView() {
  const params = useParams();
  const projectId = (params?.id as string) ?? '';
  const { query, recommendClassification } = useTechClassification(projectId || undefined);
  const isRecommendDisabled = recommendClassification.isPending || !projectId;

  const actionLabel =
    query.data?.kind === 'classification' ? '기술표준분류 다시 추천받기' : '기술표준분류 추천받기';

  const recommendActionButton = (
    <PageHeaderPrimaryButton
      onClick={() => recommendClassification.mutate()}
      disabled={isRecommendDisabled}
    >
      <Sparkles className='mr-2 size-4' />
      {recommendClassification.isPending ? '추천 생성 중…' : actionLabel}
    </PageHeaderPrimaryButton>
  );

  return (
    <div className='flex min-h-full flex-col bg-zinc-50'>
      <PageHeader
        title='기술표준분류'
        description='국가과학기술표준분류(NESTI)에 맞춰 기술코드를 추천·조회합니다. 건축 제안서에는 우선순위별 소분류와 비중(%)을 기재해야 합니다.'
        action={recommendActionButton}
      />
      <div className='mx-auto flex min-h-0 max-w-[1600px] flex-1 flex-col gap-4 p-6'>
        {query.isPending ? (
          <p className='text-sm text-zinc-500'>기술표준분류를 불러오는 중…</p>
        ) : query.isError ? (
          <div className='flex flex-1 flex-col items-center justify-center'>
            <p
              className={
                isHttpNotFoundError(query.error)
                  ? 'max-w-md text-center text-sm text-zinc-600'
                  : 'max-w-md text-center text-sm text-red-600'
              }
            >
              {isHttpNotFoundError(query.error)
                ? '기술표준분류를 생성해주세요.'
                : query.error instanceof Error
                  ? query.error.message
                  : '기술표준분류를 불러올 수 없습니다. API 서버 연결을 확인해 주세요.'}
            </p>
          </div>
        ) : query.data?.kind === 'empty' ? (
          <div className='flex flex-1 flex-col items-center justify-center gap-4 py-10'>
            <div className='flex w-full max-w-xl flex-col items-center gap-5 rounded-xs border border-zinc-200 bg-white px-8 py-10 text-center shadow-sm'>
              <div className='space-y-2'>
                <h2 className='text-lg font-semibold text-zinc-900'>
                  아직 생성된 기술표준분류가 없습니다
                </h2>
                <p className='text-sm leading-6 text-zinc-600'>{query.data.detail}</p>
              </div>
              {recommendActionButton}
            </div>
            {recommendClassification.isError ? (
              <p
                className={
                  isHttpNotFoundError(recommendClassification.error)
                    ? 'max-w-md text-center text-sm text-zinc-600'
                    : 'max-w-md text-center text-sm text-red-600'
                }
              >
                {isHttpNotFoundError(recommendClassification.error)
                  ? '기술표준분류를 생성해주세요.'
                  : recommendClassification.error instanceof Error
                    ? recommendClassification.error.message
                    : '기술표준분류 추천에 실패했습니다.'}
              </p>
            ) : null}
          </div>
        ) : query.data?.kind === 'classification' ? (
          <>
            {recommendClassification.isError ? (
              <p
                className={
                  isHttpNotFoundError(recommendClassification.error)
                    ? 'text-sm text-zinc-600'
                    : 'text-sm text-red-600'
                }
              >
                {isHttpNotFoundError(recommendClassification.error)
                  ? '기술표준분류를 생성해주세요.'
                  : recommendClassification.error instanceof Error
                    ? recommendClassification.error.message
                    : '기술표준분류 추천에 실패했습니다.'}
              </p>
            ) : null}

            <div className='grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]'>
              <section className='rounded-xs border border-zinc-200 bg-white p-4'>
                <p className='text-xs font-medium uppercase tracking-wide text-zinc-500'>
                  추론 도메인
                </p>
                <p className='mt-2 text-sm leading-6 text-zinc-800'>
                  {query.data.data.domain || '-'}
                </p>
              </section>

              <section className='rounded-xs border border-zinc-200 bg-white p-4'>
                <p className='text-xs font-medium uppercase tracking-wide text-zinc-500'>
                  핵심 기술
                </p>
                <div className='mt-3 flex flex-wrap gap-2'>
                  {query.data.data.coreTechnologies.length > 0 ? (
                    query.data.data.coreTechnologies.map((technology) => (
                      <span
                        key={technology}
                        className='rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm text-zinc-700'
                      >
                        {technology}
                      </span>
                    ))
                  ) : (
                    <span className='text-sm text-zinc-500'>핵심 기술 정보가 없습니다.</span>
                  )}
                </div>
              </section>
            </div>

            {query.data.data.warnings.length > 0 ? (
              <section className='rounded-xs border border-amber-200 bg-amber-50 px-4 py-3'>
                <p className='text-sm font-medium text-amber-900'>확인 필요</p>
                <ul className='mt-2 space-y-1 text-sm text-amber-800'>
                  {query.data.data.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <div className='space-y-4'>
              {query.data.data.groupedRecommendations.map((group) => (
                <SystemClassificationCard key={group.taxonomyFamily} group={group} />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
