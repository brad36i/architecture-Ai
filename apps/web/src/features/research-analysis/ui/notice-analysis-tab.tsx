'use client';

import { ChevronDownIcon } from 'lucide-react';
import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

import { API_BASE } from '@/shared/config/api';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/shared/ui/collapsible';
import { StateTag } from '@/shared/ui/state-tag';

import type { Notice, SubProgram } from '../model/notice';

type AssignSubProgramResponse = {
  success: boolean;
  statusCode: number;
  data: Record<string, never> | null;
};

async function assignSubProgram(projectId: string, subProgramId: string) {
  const res = await fetch(`${API_BASE}/api/v2/projects/${encodeURIComponent(projectId)}/subprogram`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subProgramId }),
  });

  let json: AssignSubProgramResponse | null = null;

  try {
    json = (await res.json()) as AssignSubProgramResponse;
  } catch {
    throw new Error(`세부과제를 지정할 수 없습니다. (${res.status})`);
  }

  if (!res.ok || json.statusCode !== 200) {
    throw new Error(`세부과제를 지정할 수 없습니다. (${res.status})`);
  }
}

/* =================================================================
 * 섹션 ID 상수
 * ================================================================= */

const SECTION_IDS = {
  basic: 'section-basic',
  funding: 'section-funding',
  summary: 'section-summary',
  overview: 'section-overview',
  requirements: 'section-requirements',
  evaluation: 'section-evaluation',
  checklist: 'section-checklist',
  subprograms: 'section-subprograms',
} as const;

/* =================================================================
 * OutlineSidebar
 * ================================================================= */

const OutlineSidebar = React.memo(function OutlineSidebar({
  items,
  scrollRef,
}: {
  items: readonly { readonly id: string; readonly label: string }[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const handleClick = React.useCallback(
    (id: string) => {
      const container = scrollRef.current;
      if (!container) return;
      const target = container.querySelector(`#${id}`);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [scrollRef]
  );

  return (
    <aside className='w-[176px] shrink-0'>
      {' '}
      {/* w-[176px]: 목차 너비 조절 */}
      <nav className='rounded-lg border border-zinc-200 bg-zinc-50 p-3 sticky top-0'>
        <h3 className='mb-3 text-xs font-semibold text-zinc-500'>목차</h3>
        <ul className='space-y-1'>
          {items.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleClick(item.id)}
                className='block w-full text-left text-sm text-zinc-600 hover:text-zinc-900 rounded px-1.5 py-1 hover:bg-zinc-100 transition-colors'
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
});

/* =================================================================
 * InfoSection - Headless Compound Pattern
 * ================================================================= */

const InfoSectionRoot = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-2', className)} {...props}>
      {children}
    </div>
  )
);
InfoSectionRoot.displayName = 'InfoSectionRoot';

// 섹션 헤더: 제목
const InfoSectionHeader = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-xl font-semibold text-black-700 pb-1.5 scroll-mt-4', className)}
    {...props}
  >
    {children}
  </h3>
));
InfoSectionHeader.displayName = 'InfoSectionHeader';

const InfoSectionGrid = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 gap-6', // gap-6: 컬럼 사이 및 행 사이 간격
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
InfoSectionGrid.displayName = 'InfoSectionGrid';

type InfoItemProps = React.HTMLAttributes<HTMLDivElement> & {
  label: string;
  full?: boolean;
};

const InfoItem = React.forwardRef<HTMLDivElement, InfoItemProps>(
  ({ label, full, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-baseline justify-between gap-3 py-2.5 min-w-0 border-b border-zinc-300', // py-2.5: 상하 패딩, border-b: 각 아이템 아래 border
        full && 'sm:col-span-2',
        className
      )}
      {...props}
    >
      <span className='shrink-0 text-sm text-zinc-500'>{label}</span>
      <div className='min-w-0 text-right text-base font-pretendard font-medium text-zinc-800 wrap-break-word'>
        {children}
      </div>
    </div>
  )
);
InfoItem.displayName = 'InfoItem';

const InfoItemBlock = React.forwardRef<HTMLDivElement, InfoItemProps>(
  ({ label, full: _full, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'sm:col-span-2 flex flex-col gap-1.5 py-2 border-t border-zinc-100 first:border-t-0',
        className
      )}
      {...props}
    >
      <span className='text-sm font-medium text-zinc-500'>{label}</span>
      <div className='min-w-0 text-sm text-zinc-700 leading-relaxed'>{children}</div>
    </div>
  )
);
InfoItemBlock.displayName = 'InfoItemBlock';

/* =================================================================
 * 마크다운 렌더러
 * ================================================================= */

const mdComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className='leading-relaxed text-zinc-700'>{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className='list-disc list-inside space-y-0.5 text-zinc-700 pl-1'>{children}</ul>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className='leading-relaxed'>{children}</li>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className='list-decimal list-inside space-y-0.5 text-zinc-700 pl-1'>{children}</ol>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className='font-semibold text-zinc-800'>{children}</strong>
  ),
};

const Md = React.memo(function Md({ children }: { children: string }) {
  return <ReactMarkdown components={mdComponents}>{children}</ReactMarkdown>;
});

/* =================================================================
 * 배지
 * ================================================================= */

const Tag = React.memo(function Tag({ children }: { children: React.ReactNode }) {
  return (
    <StateTag variant='green' className='font-medium'>
      {children}
    </StateTag>
  );
});

const TagList = React.memo(function TagList({ items }: { items: string[] }) {
  return (
    <div className='flex flex-wrap justify-end gap-1'>
      {items.map((item) => (
        <Tag key={item}>{item}</Tag>
      ))}
    </div>
  );
});

/* =================================================================
 * SubProgramCard (Collapsible)
 * ================================================================= */

const SubProgramCard = React.memo(function SubProgramCard({
  sub,
  projectId,
}: {
  sub: SubProgram;
  projectId: string;
}) {
  const [isSelecting, setIsSelecting] = React.useState(false);

  const handleSelectSubProgram = React.useCallback(async () => {
    if (!projectId || !sub.id || isSelecting) return;

    setIsSelecting(true);

    try {
      await assignSubProgram(projectId, sub.id);
      toast.success('세부과제가 지정되었습니다.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '세부과제를 지정할 수 없습니다.');
    } finally {
      setIsSelecting(false);
    }
  }, [isSelecting, projectId, sub.id]);

  return (
    <Collapsible defaultOpen={false}>
      <div className='rounded-lg border border-zinc-200 bg-zinc-50 overflow-hidden'>
        {/* 항상 표시: 제목 + 레이블 */}
        <CollapsibleTrigger className='w-full text-left'>
          <div className='flex items-center justify-between gap-2 px-4 py-3 hover:bg-zinc-100 transition-colors'>
            <div className='flex items-center gap-2 min-w-0'>
              <h4 className='text-sm font-semibold text-zinc-800 truncate'>{sub.title}</h4>
              {sub.trl_level && <StateTag variant='red'>TRL {sub.trl_level}</StateTag>}
            </div>
            <div className='flex items-center gap-2 shrink-0'>
              {sub.keywords.length > 0 && (
                <div className='hidden sm:flex flex-wrap gap-1'>
                  {sub.keywords.map((k) => (
                    <StateTag key={k} variant='blue' className='font-normal'>
                      {k}
                    </StateTag>
                  ))}
                </div>
              )}
              <ChevronDownIcon className='size-4 text-zinc-400 transition-transform duration-200 in-data-[state=open]:rotate-180' />
            </div>
          </div>
        </CollapsibleTrigger>

        {/* 접힌 상세 내용 */}
        <CollapsibleContent>
          <div className='flex flex-col gap-3 px-4 pb-4 border-t border-zinc-200'>
            {/* 모바일: 키워드 */}
            {sub.keywords.length > 0 && (
              <div className='sm:hidden flex flex-wrap gap-1 pt-3'>
                {sub.keywords.map((k) => (
                  <StateTag key={k} variant='blue' className='font-normal'>
                    {k}
                  </StateTag>
                ))}
              </div>
            )}

            <InfoSectionGrid className='divide-y-0 pt-1'>
              <InfoItem label='연구기간'>{sub.period}</InfoItem>
              <InfoItem label='지원금액'>{sub.funding}</InfoItem>
              <InfoItem label='기관분담금'>{sub.funding_rate}</InfoItem>
              {sub.budget && <InfoItem label='과제예산'>{sub.budget}</InfoItem>}
            </InfoSectionGrid>

            {sub.funding_detail && (
              <InfoItemBlock label='지원내용' className='border-t border-zinc-200 pt-3 mt-0'>
                <Md>{sub.funding_detail}</Md>
              </InfoItemBlock>
            )}

            {sub.summary && (
              <InfoItemBlock label='요약' className='border-t border-zinc-200 pt-3 mt-0'>
                <Md>{sub.summary}</Md>
              </InfoItemBlock>
            )}

            {sub.overview && (
              <div className='flex flex-col gap-2 border-t border-zinc-200 pt-3'>
                <span className='text-xs font-semibold text-zinc-500 uppercase tracking-wide'>
                  과제 개요
                </span>
                <InfoItemBlock label='배경'>
                  <Md>{sub.overview.background}</Md>
                </InfoItemBlock>
                <InfoItemBlock label='목표'>
                  <Md>{sub.overview.objective}</Md>
                </InfoItemBlock>
                <InfoItemBlock label='내용'>
                  <Md>{sub.overview.content}</Md>
                </InfoItemBlock>
              </div>
            )}

            <div className='flex justify-end border-t border-zinc-200 pt-3'>
              <Button
                type='button'
                size='sm'
                onClick={() => void handleSelectSubProgram()}
                disabled={!projectId || !sub.id || isSelecting}
              >
                {isSelecting ? '선택 중...' : '해당 세부과제 선택'}
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});

/* =================================================================
 * NoticeAnalysisTab
 * ================================================================= */

type NoticeAnalysisTabProps = {
  notice: Notice;
  projectId: string;
};

export const NoticeAnalysisTab = React.memo(function NoticeAnalysisTab({
  notice,
  projectId,
}: NoticeAnalysisTabProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasSubPrograms = notice.sub_programs && notice.sub_programs.length > 0;
  const hasEvaluation = notice.evaluation.length > 0;
  const hasChecklist = notice.submission_checklist_template.length > 0;

  const outline = React.useMemo(() => {
    const items: { id: string; label: string }[] = [
      { id: SECTION_IDS.basic, label: '공고 기본 정보' },
      { id: SECTION_IDS.funding, label: '지원 규모 및 조건' },
      { id: SECTION_IDS.summary, label: '공고 요약' },
      { id: SECTION_IDS.overview, label: '과제 개요' },
      { id: SECTION_IDS.requirements, label: '참여 요건' },
    ];
    if (hasEvaluation) items.push({ id: SECTION_IDS.evaluation, label: '평가 항목' });
    if (hasChecklist) items.push({ id: SECTION_IDS.checklist, label: '제출 체크리스트' });
    if (hasSubPrograms) items.push({ id: SECTION_IDS.subprograms, label: '세부 과제' });
    return items;
  }, [hasSubPrograms, hasEvaluation, hasChecklist]);

  return (
    <div className='flex h-full min-h-0 gap-6'>
      {' '}
      {/* gap-6: 메인 콘텐츠와 목차 사이 간격 */}
      {/* 메인 콘텐츠 */}
      <div ref={scrollRef} className='min-w-0 flex-1 overflow-y-auto'>
        {' '}
        {/* flex-1: 남은 공간 차지, max-w-* 추가 시 너비 제한 가능 */}
        <div className='space-y-8 p-4 pb-10'>
          {' '}
          {/* space-y-8: 섹션들 사이 간격, p-4: 좌우 패딩 조절 */}
          <InfoSectionRoot id={SECTION_IDS.basic}>
            <InfoSectionHeader>공고 기본 정보</InfoSectionHeader>
            <InfoSectionGrid>
              <InfoItem label='공고명' full>
                {notice.title}
              </InfoItem>
              <InfoItem label='공고번호' full>
                {notice.notice_display_id}
              </InfoItem>
              <InfoItem label='공고상태'>{notice.status}</InfoItem>
              <InfoItem label='주관기관'>{notice.order_agency_name}</InfoItem>
              <InfoItem label='부처명'>
                <TagList items={notice.ministry_names} />
              </InfoItem>
              <InfoItem label='공모유형'>
                <TagList items={notice.notice_types} />
              </InfoItem>
              <InfoItem label='지원가능기관'>
                <TagList items={notice.available_orgs} />
              </InfoItem>
              {notice.keywords.length > 0 && (
                <InfoItem label='추출 키워드' full>
                  <TagList items={notice.keywords} />
                </InfoItem>
              )}
              {notice.trl_level && <InfoItem label='TRL'>{notice.trl_level}</InfoItem>}
              <InfoItem label='사업명' full>
                {notice.program_names}
              </InfoItem>
            </InfoSectionGrid>
          </InfoSectionRoot>
          <InfoSectionRoot id={SECTION_IDS.funding}>
            <InfoSectionHeader>지원 규모 및 조건</InfoSectionHeader>
            <InfoSectionGrid>
              <InfoItem label='사업규모'>{notice.program_budget}</InfoItem>
              <InfoItem label='연구기간'>{notice.period}</InfoItem>
              <InfoItem label='지원금액'>{notice.fundings}</InfoItem>
              <InfoItem label='기관분담금'>{notice.funding_rate}</InfoItem>
              <InfoItemBlock label='지원내용'>
                <Md>{notice.funding_detail}</Md>
              </InfoItemBlock>
              {notice.consortium_requirement && (
                <InfoItem label='컨소시엄 요건' full>
                  {notice.consortium_requirement}
                </InfoItem>
              )}
              {notice.consortium_structure && (
                <InfoItemBlock label='컨소시엄 구조'>
                  <Md>{notice.consortium_structure}</Md>
                </InfoItemBlock>
              )}
            </InfoSectionGrid>
          </InfoSectionRoot>
          <InfoSectionRoot id={SECTION_IDS.summary}>
            <InfoSectionHeader>공고 요약</InfoSectionHeader>
            {/* <div className='rounded-lg border border-zinc-200 bg-white p-4 text-sm leading-relaxed'> */}
            <div>
              <Md>{notice.summary}</Md>
            </div>
          </InfoSectionRoot>
          <InfoSectionRoot id={SECTION_IDS.overview}>
            <InfoSectionHeader>과제 개요</InfoSectionHeader>
            <div className='grid grid-cols-1 gap-3'>
              <InfoItemBlock label='배경'>
                <Md>{notice.overview.background}</Md>
              </InfoItemBlock>
              <InfoItemBlock label='목표'>
                <Md>{notice.overview.objective}</Md>
              </InfoItemBlock>
              <InfoItemBlock label='내용'>
                <Md>{notice.overview.content}</Md>
              </InfoItemBlock>
            </div>
          </InfoSectionRoot>
          <InfoSectionRoot id={SECTION_IDS.requirements}>
            <InfoSectionHeader>참여 요건</InfoSectionHeader>
            <InfoSectionGrid>
              <InfoItemBlock label='공통 요건'>
                <Md>{notice.common_requirements}</Md>
              </InfoItemBlock>
              <InfoItemBlock label='연구책임자 요건'>
                <Md>{notice.investigator_requirements}</Md>
              </InfoItemBlock>
              {notice.research_lab_requirements && (
                <InfoItemBlock label='기업부설연구소 요건'>
                  <Md>{notice.research_lab_requirements}</Md>
                </InfoItemBlock>
              )}
              {notice.location_requirements && (
                <InfoItem label='소재지 요건' full>
                  {notice.location_requirements}
                </InfoItem>
              )}
              <InfoItemBlock label='3책5공'>
                <Md>{notice.concurrent_project_limit}</Md>
              </InfoItemBlock>
              {notice.additional_requirements && (
                <InfoItemBlock label='기타 요건'>
                  <Md>{notice.additional_requirements}</Md>
                </InfoItemBlock>
              )}
            </InfoSectionGrid>
          </InfoSectionRoot>
          {hasEvaluation && (
            <InfoSectionRoot id={SECTION_IDS.evaluation}>
              <InfoSectionHeader>평가 항목</InfoSectionHeader>
              <div className='overflow-x-auto rounded-lg border border-zinc-200'>
                <table className='w-full min-w-[520px] border-collapse text-sm'>
                  <thead>
                    <tr className='border-b border-zinc-200 bg-zinc-50 text-left'>
                      <th className='px-3 py-2 font-semibold text-zinc-700'>평가항목</th>
                      <th className='px-3 py-2 font-semibold text-zinc-700'>평가지표</th>
                      <th className='w-24 px-3 py-2 text-right font-semibold text-zinc-700'>
                        배점
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {notice.evaluation.map((row, i) => (
                      <tr
                        key={`${row.item}-${i}`}
                        className='border-b border-zinc-100 last:border-0'
                      >
                        <td className='px-3 py-2 align-top text-zinc-800'>{row.item}</td>
                        <td className='px-3 py-2 align-top text-zinc-600'>{row.metric}</td>
                        <td className='px-3 py-2 text-right tabular-nums text-zinc-800'>
                          {row.score_max}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </InfoSectionRoot>
          )}
          {hasChecklist && (
            <InfoSectionRoot id={SECTION_IDS.checklist}>
              <InfoSectionHeader>
                제출 체크리스트 ({notice.submission_checklist_template.length}개)
              </InfoSectionHeader>
              <ul className='flex flex-col gap-3'>
                {notice.submission_checklist_template.map((row, idx) => (
                  <li
                    key={row.id ? `${row.id}-${idx}` : `checklist-${idx}`}
                    className='rounded-lg border border-zinc-200 bg-zinc-50/80 px-4 py-3'
                  >
                    {row.group_path.length > 0 && (
                      <p className='mb-1 text-xs text-zinc-500'>{row.group_path.join(' › ')}</p>
                    )}
                    <div className='flex flex-wrap items-center gap-2'>
                      <StateTag variant='green'>{row.required ? '필수' : '선택'}</StateTag>
                      <StateTag variant='green' bordered>
                        {row.type}
                      </StateTag>
                      {row.source ? (
                        <span className='text-xs text-zinc-400'>출처: {row.source}</span>
                      ) : null}
                    </div>
                    <p className='mt-2 text-sm font-medium text-zinc-900'>{row.content}</p>
                    {row.description ? (
                      <p className='mt-1 text-xs leading-relaxed text-zinc-600'>
                        {row.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </InfoSectionRoot>
          )}
          {hasSubPrograms && (
            <InfoSectionRoot id={SECTION_IDS.subprograms}>
              <InfoSectionHeader>세부 과제 ({notice.sub_programs!.length}개)</InfoSectionHeader>
              <div className='flex flex-col gap-3'>
                {notice.sub_programs!.map((sub) => (
                  <SubProgramCard key={sub.id} sub={sub} projectId={projectId} />
                ))}
              </div>
            </InfoSectionRoot>
          )}
        </div>
      </div>
      {/* 아웃라인 사이드바 */}
      <OutlineSidebar items={outline} scrollRef={scrollRef} />
    </div>
  );
});
