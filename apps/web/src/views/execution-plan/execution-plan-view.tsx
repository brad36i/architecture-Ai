'use client';

import { RefreshCw } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { GanttTab, MilestoneTab, useProjectWbs } from '@/features/execution-plan';
import { isHttpNotFoundError } from '@/shared/lib/http-error';
import { PageHeader } from '@/shared/ui/page-header';
import {
  PageHeaderOutlineButton,
  PageHeaderPrimaryButton,
} from '@/shared/ui/page-header-primary-button';
import { Tabs, TabsContent } from '@/shared/ui/tabs';
import { UnderlineTabList } from '@/shared/ui/underline-tab-list';

export function ExecutionPlanView() {
  const params = useParams();
  const projectId = (params?.id as string) ?? '';
  const [activeTab, setActiveTab] = useState('gantt');
  const { query, generate, empty, ganttTasks, milestones } = useProjectWbs(projectId || undefined);

  const headerActions = (
    <div className='flex flex-wrap items-center justify-end gap-2'>
      <PageHeaderOutlineButton
        type='button'
        disabled={query.isFetching || !projectId}
        onClick={() => query.refetch()}
      >
        <RefreshCw className='mr-2 size-4' />
        일정 새로고침
      </PageHeaderOutlineButton>
      <PageHeaderPrimaryButton
        type='button'
        disabled={generate.isPending || !projectId}
        onClick={() => generate.mutate()}
      >
        {generate.isPending ? '생성 중…' : empty ? '실행계획 생성' : '일정 다시 생성'}
      </PageHeaderPrimaryButton>
    </div>
  );

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <PageHeader
        title='실행계획 생성'
        description='건축 제안서가 선정되면 향후 실제 건축 수행을 위한 일정계획을 수립합니다.'
        action={headerActions}
      />
      <div className='flex min-h-0 flex-1 flex-col p-6 pt-0'>
        {!projectId ? (
          <p className='text-sm text-zinc-500'>프로젝트를 선택한 뒤 이용할 수 있습니다.</p>
        ) : query.isPending ? (
          <p className='text-sm text-zinc-500'>실행계획을 불러오는 중…</p>
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
                ? '건축 제안서 작성 후 실행계획을 생성해주세요.'
                : query.error instanceof Error
                  ? query.error.message
                  : '실행계획을 불러오지 못했습니다. API 연결을 확인해 주세요.'}
            </p>
          </div>
        ) : empty ? (
          <div className='flex flex-1 flex-col items-center justify-center gap-4 py-16'>
            <p className='max-w-md text-center text-sm text-zinc-600'>
              저장된 실행계획이 없습니다. 상단의 &quot;실행계획 생성&quot;으로 WBS를 만들 수
              있습니다.
            </p>
            {generate.isError ? (
              <p
                className={
                  isHttpNotFoundError(generate.error)
                    ? 'max-w-md text-center text-sm text-zinc-600'
                    : 'max-w-md text-center text-sm text-red-600'
                }
              >
                {isHttpNotFoundError(generate.error)
                  ? '건축 제안서 작성 후 실행계획을 생성해주세요.'
                  : generate.error instanceof Error
                    ? generate.error.message
                    : '실행계획 생성에 실패했습니다.'}
              </p>
            ) : null}
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className='flex min-h-0 flex-1 flex-col'
          >
            {generate.isError ? (
              <p
                className={
                  isHttpNotFoundError(generate.error)
                    ? 'mb-3 text-sm text-zinc-600'
                    : 'mb-3 text-sm text-red-600'
                }
              >
                {isHttpNotFoundError(generate.error)
                  ? '건축 제안서 작성 후 실행계획을 생성해주세요.'
                  : generate.error instanceof Error
                    ? generate.error.message
                    : '실행계획 생성에 실패했습니다.'}
              </p>
            ) : null}
            <div className='shrink-0 -mx-6 bg-white px-6 pt-2'>
              <UnderlineTabList
                tone='light'
                items={[
                  { value: 'gantt', label: '간트(Gantt) 차트' },
                  { value: 'milestone', label: '마일스톤' },
                ]}
              />
            </div>
            <div className='flex min-h-0 flex-1 flex-col overflow-hidden pt-4'>
              <TabsContent
                value='gantt'
                className='m-0 flex-1 overflow-auto data-[state=inactive]:hidden'
              >
                <GanttTab tasks={ganttTasks} />
              </TabsContent>
              <TabsContent
                value='milestone'
                className='m-0 flex-1 overflow-auto data-[state=inactive]:hidden'
              >
                <MilestoneTab milestones={milestones} />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
}
