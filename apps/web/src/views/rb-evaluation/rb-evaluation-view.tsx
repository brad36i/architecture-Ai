'use client';

import { Sparkles } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import {
  EvaluationChecklist,
  EvaluationSummary,
  LegacyEvaluationComments,
  useRbEvaluation,
} from '@/features/rb-evaluation';
import { isHttpNotFoundError } from '@/shared/lib/http-error';
import { PageHeader } from '@/shared/ui/page-header';
import { PageHeaderPrimaryButton } from '@/shared/ui/page-header-primary-button';
import { Tabs, TabsContent } from '@/shared/ui/tabs';
import { UnderlineTabList } from '@/shared/ui/underline-tab-list';

export function RbEvaluationView() {
  const params = useParams();
  const projectId = (params?.id as string) ?? '';
  const [activeTab, setActiveTab] = useState('ezrnd');
  const { query, runEvaluation } = useRbEvaluation(projectId || undefined);
  const isRunDisabled = runEvaluation.isPending || !projectId;

  const actionLabel =
    query.data?.kind === 'evaluation' ? '건축 제안서 다시 평가하기' : '건축 제안서 평가하기';

  const renderRunEvaluationButton = () => (
    <PageHeaderPrimaryButton
      type='button'
      onClick={() => runEvaluation.mutate()}
      disabled={isRunDisabled}
    >
      <Sparkles className='mr-2 size-4' />
      {runEvaluation.isPending ? '평가 중…' : actionLabel}
    </PageHeaderPrimaryButton>
  );

  if (query.isPending) {
    return (
      <div className='flex h-full min-h-0 flex-col'>
        <PageHeader
          title='전문기관 평가의견'
          description='사업 공고 평가 항목에 맞춰 제출 전 자가 점검하세요. 누락·약점을 보완할 수 있습니다.'
          action={renderRunEvaluationButton()}
        />
        <div className='flex flex-1 items-center justify-center p-6'>
          <p className='text-sm text-zinc-500'>전문기관 평가의견을 불러오는 중…</p>
        </div>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className='flex h-full min-h-0 flex-col'>
        <PageHeader
          title='전문기관 평가의견'
          description='사업 공고 평가 항목에 맞춰 제출 전 자가 점검하세요. 누락·약점을 보완할 수 있습니다.'
          action={renderRunEvaluationButton()}
        />
        <div className='flex flex-1 items-center justify-center p-6'>
          <p
            className={
              isHttpNotFoundError(query.error)
                ? 'max-w-md text-center text-sm text-zinc-600'
                : 'max-w-md text-center text-sm text-red-600'
            }
          >
            {isHttpNotFoundError(query.error)
              ? '건축 제안서 작성 후 전문기관 평가의견을 확인해주세요.'
              : query.error instanceof Error
                ? query.error.message
                : '전문기관 평가의견을 불러올 수 없습니다. API 서버 연결을 확인해 주세요.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <PageHeader
        title='전문기관 평가의견'
        description='사업 공고 평가 항목에 맞춰 제출 전 자가 점검하세요. 누락·약점을 보완할 수 있습니다.'
        action={renderRunEvaluationButton()}
      />
      {query.data?.kind === 'empty' ? (
        <div className='flex flex-1 flex-col items-center justify-center gap-4 p-6'>
          <div className='flex w-full max-w-xl flex-col items-center gap-5 rounded-xs border border-zinc-200 bg-white px-8 py-10 text-center shadow-sm'>
            <div className='space-y-2'>
              <h2 className='text-lg font-semibold text-zinc-900'>
                아직 생성된 전문기관 평가의견이 없습니다
              </h2>
              <p className='text-sm leading-6 text-zinc-600'>{query.data.detail}</p>
            </div>
            {renderRunEvaluationButton()}
          </div>
          {runEvaluation.isError ? (
            <p
              className={
                isHttpNotFoundError(runEvaluation.error)
                  ? 'max-w-md text-center text-sm text-zinc-600'
                  : 'max-w-md text-center text-sm text-red-600'
              }
            >
              {isHttpNotFoundError(runEvaluation.error)
                ? '건축 제안서 작성 후 전문기관 평가의견을 확인해주세요.'
                : runEvaluation.error instanceof Error
                  ? runEvaluation.error.message
                  : '건축 제안서 평가에 실패했습니다.'}
            </p>
          ) : null}
        </div>
      ) : query.data?.kind === 'evaluation' ? (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='flex min-h-0 flex-1 flex-col p-6 pt-0'
        >
          <div className='shrink-0 -mx-6 bg-white px-6 pt-2'>
            <UnderlineTabList
              tone='light'
              items={[
                { value: 'legacy', label: '평가 코멘트(레거시)' },
                { value: 'ezrnd', label: '이지알앤디 평가결과' },
              ]}
            />
          </div>
          <div className='flex min-h-0 flex-1 flex-col overflow-hidden pt-4'>
            <TabsContent
              value='legacy'
              className='m-0 flex-1 overflow-auto data-[state=inactive]:hidden'
            >
              <LegacyEvaluationComments evaluators={query.data.data.legacy.evaluators} />
            </TabsContent>
            <TabsContent
              value='ezrnd'
              className='m-0 flex-1 overflow-auto data-[state=inactive]:hidden'
            >
              {runEvaluation.isError ? (
                <p
                  className={
                    isHttpNotFoundError(runEvaluation.error)
                      ? 'mb-4 text-sm text-zinc-600'
                      : 'mb-4 text-sm text-red-600'
                  }
                >
                  {isHttpNotFoundError(runEvaluation.error)
                    ? '건축 제안서 작성 후 전문기관 평가의견을 확인해주세요.'
                    : runEvaluation.error instanceof Error
                      ? runEvaluation.error.message
                      : '건축 제안서 평가에 실패했습니다.'}
                </p>
              ) : null}
              <EvaluationSummary
                summary={query.data.data.evaluationSummary}
                categories={query.data.data.ezrnd}
              />
              <EvaluationChecklist categories={query.data.data.ezrnd} />
            </TabsContent>
          </div>
        </Tabs>
      ) : null}
    </div>
  );
}
