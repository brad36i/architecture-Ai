'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';

import { useNoticeAnalysis } from '@/features/research-analysis/model/use-notice-analysis';
import { useProjectFiles } from '@/features/research-analysis/model/use-project-files';
import { AnnouncementTab } from '@/features/research-analysis/ui/announcement-tab';
import { GuidelinesTab } from '@/features/research-analysis/ui/guidelines-tab';
import { NoticeAnalysisTab } from '@/features/research-analysis/ui/notice-analysis-tab';
import { PageHeader } from '@/shared/ui/page-header';
import { Tabs, TabsContent } from '@/shared/ui/tabs';
import { UnderlineTabList } from '@/shared/ui/underline-tab-list';


export function ResearchAnalysisView() {
  const params = useParams();
  const projectId = params?.id as string;
  const [activeTab, setActiveTab] = useState('notice-analysis');
  const {
    data: notice,
    isPending: noticePending,
    isError: noticeError,
  } = useNoticeAnalysis(projectId);
  const {
    data: attachments,
    isPending: attachmentsPending,
    isError: attachmentsError,
  } = useProjectFiles(projectId);

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <PageHeader
        title='건축 공고 분석'
        description='지원사업 공고를 분석하고 가이드라인을 확인하세요'
      />
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='flex min-h-0 flex-1 flex-col p-6 pt-0'
      >
        <div className='shrink-0 -mx-6 bg-white px-6 pt-2'>
          <UnderlineTabList
            tone='light'
            items={[
              {
                value: 'notice-analysis',
                label: '공모 자료 분석',
              },
              {
                value: 'announcement',
                label: '공모 자료 원문',
              },
              {
                value: 'guidelines',
                label: 'GUIDELINES.md',
              },
            ]}
          />
        </div>
        <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
          <TabsContent
            value='notice-analysis'
            className='m-0 flex-1 overflow-hidden pt-4 data-[state=inactive]:hidden'
          >
            {noticePending ? (
              <p className='p-6 text-sm text-zinc-500'>공고 분석 로딩 중...</p>
            ) : noticeError || !notice ? (
              <p className='p-6 text-sm text-red-500'>
                공고 분석을 불러올 수 없습니다. API 서버 연결을 확인해 주세요.
              </p>
            ) : (
              <NoticeAnalysisTab notice={notice} projectId={projectId} />
            )}
          </TabsContent>
          <TabsContent
            value='announcement'
            className='-mx-6 -mb-6 m-0 flex-1 overflow-hidden data-[state=inactive]:hidden'
          >
            {attachmentsPending ? (
              <p className='p-6 text-sm text-zinc-500'>공고문 원문 로딩 중...</p>
            ) : attachmentsError ? (
              <p className='p-6 text-sm text-red-500'>
                공고문 원문을 불러올 수 없습니다. API 서버 연결을 확인해 주세요.
              </p>
            ) : (
              <AnnouncementTab attachments={attachments ?? []} />
            )}
          </TabsContent>
          <TabsContent
            value='guidelines'
            className='m-0 flex min-h-0 flex-1 flex-col overflow-hidden pt-4 data-[state=inactive]:hidden'
          >
            <GuidelinesTab projectId={projectId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
