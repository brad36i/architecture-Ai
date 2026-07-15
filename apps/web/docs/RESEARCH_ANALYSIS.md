연구과제 공고문 분석 페이지

path: src/app/projects/[id]/research-analysis

```
Notice {
  notice_id: db
  notice_display_id: 보건복지부공고 제2025-961호
  title: db eg: 2026년도 제1차 보건의료기술 연구개발사업 신규지원 대상과제 통합공고
  ministry_names: [] 부처명 db
  order_agency_name: 주관기관명 db
  notice_types: [] 자유공모 | 지정공모
  status: 공고상태
  program_names: 보건의료기술 연구개발사업 외
  available_orgs: [] 대기업 | 중견기업 | 대학 | 국공립/민간연구기관

  program_budget: 사업규모
  fundings: 지원금
  funding_detail: string | 지원내용
  funding rate: 기관분담금
  period: 기간

  consortium_requirement:
  consortium_structure:

  summary: 공고요약
  overview: {
    background: 사업개요(기존 outline)
    objective: 과제목표
    content: 과제내용
  }
  trl_level: null

  common_requirements

  investigator_requirements: 연구책임자 요건
  research_lab_requirements: 기업부설연구소 요건
  location_requirements: 소재지
  concurrent_project_limit: 3책5공 관련

  additional_requirements: 기타등등

  // 대부분 공고는 없을 듯
  sub_programs: null | [
    {
      id:
      title:
      program_name: 이놈도 특수한 경우 아니면 없을듯 null
      keywords: []

      period: 연구기간(과제마다 다를수도)
      budget: null
      funding: 최대 2억원
      funding_detail: 지원내용
      funding rate: 기관분담금

      trl_level: 1~3단계 | null

      // RFP가 없으면 잘 안나올 듯
      summary: 공고요약
      overview: null | {
        background: 사업개요(기존 outline)
        objective: 과제목표
        content: 과제내용
      }
    }
  ]
}
```

"지원사업 요약" 탭을 "지원사업 공고 분석" 탭으로 변경해주고

```typescript
'use client';

import React from 'react';

import { cn } from '@/shared/lib/utils';

/* =================================================================
 * InfoSection - 정보 섹션 컴포넌트 (Headless Compound Pattern)
 * 테이블 형태로 정보를 표시하는 섹션 컴포넌트
 * Header, Container, Item 구조로 구성
 * =================================================================
 */

const InfoSectionRoot = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex w-full flex-col items-start justify-start gap-2.5 overflow-hidden self-stretch px-2.5 bg-white min-w-0',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
InfoSectionRoot.displayName = 'InfoSectionRoot';

const InfoSectionHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-end gap-2.5 overflow-hidden self-stretch text-base font-semibold text-blue-600',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
InfoSectionHeader.displayName = 'InfoSectionHeader';

const InfoSectionContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex w-full flex-col items-start justify-start gap-2.5 overflow-hidden self-stretch p-2.5 min-w-0',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
InfoSectionContainer.displayName = 'InfoSectionContainer';

// InfoItemRow - 한 행에 2개 아이템을 담는 컨테이너 (반응형: 작은 화면에서는 1열)
const InfoItemRow = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex w-full flex-col items-stretch justify-between gap-4 overflow-hidden self-stretch min-w-0 sm:flex-row sm:items-center',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
InfoItemRow.displayName = 'InfoItemRow';

// InfoItem - Headless Compound Pattern
const InfoItemRoot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    /**
     * 홀수 개 아이템일 때 마지막 아이템을 전체 너비로 표시할지 여부
     */
    fullWidth?: boolean;
  }
>(({ className, children, fullWidth, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'flex w-full items-start justify-between border-b border-neutral-200 py-2 overflow-hidden min-w-0',
        // 작은 화면에서는 w-full, 큰 화면에서는 flex-1로 유연하게 조정
        'sm:flex-1 sm:min-w-0',
        // md 이상에서는 최소 너비를 보장하되, 화면 크기에 따라 조정
        'md:min-w-[280px]',
        fullWidth && 'sm:flex-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
InfoItemRoot.displayName = 'InfoItemRoot';

const InfoItemLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'justify-center text-sm font-normal text-neutral-600 font-["Pretendard"] flex-shrink-0',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
InfoItemLabel.displayName = 'InfoItemLabel';

const InfoItemValue = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'justify-center overflow-hidden text-base font-semibold text-neutral-600 min-w-0 flex-1 text-right break-words',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
InfoItemValue.displayName = 'InfoItemValue';

const InfoItem = Object.assign(InfoItemRoot, {
  Root: InfoItemRoot,
  Label: InfoItemLabel,
  Value: InfoItemValue,
  Row: InfoItemRow, // InfoItemRow는 위에서 정의됨
});

const InfoSectionCompound = Object.assign(InfoSectionRoot, {
  Root: InfoSectionRoot,
  Header: InfoSectionHeader,
  Container: InfoSectionContainer,
  Item: InfoItem,
});
```

대충 이런 느낌으로 할꺼야. 그리고 몇개 키는 예를 들어 summary, overview들은 내용이 길꺼야. 그리고
여긴 grid layout으로 잡아주고, 보통은 two column이고 내용이 긴것들은 1 column으로 움직일꺼야.

지금은 서버랑 통신안하니깐 대충 가짜 데이터 해서 줘

내용 긴것 마크다운이긴한데 해봤자 item 정도? 불렛 정도만 들어갈것같어
