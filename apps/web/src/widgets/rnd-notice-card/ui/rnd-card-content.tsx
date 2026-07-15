'use client';

import React from 'react';

import {
  formatDateDot,
  formatNoticeId,
  formatPeriodDot,
  formatRndDeadlineLine,
} from '../lib/rnd-notice-format';
import type { RndNoticeCardData } from '../model/types';
import {
  getRndStatusBadgeLines,
  NoticeCardTitle,
  NoticeStateLabel,
  OfferingTypePill,
  ProjectCreateFromNoticeButton,
  PublishedAt,
  QualificationBadge,
  RndMetaPlaceholder,
  RouterButton,
  SubTitle,
  TimeLeftStatus,
} from './rnd-notice-card-parts';

const EZRND_NOTICE_BASE = 'https://app.ezrnd.co.kr/notice/rnd';

function getOrganizationLine(data: RndNoticeCardData): string {
  if (data.organizationLine?.trim()) return data.organizationLine.trim();
  const org = [data.ministry?.title, data.orderAgency?.title].filter(Boolean).join(' ');
  const num = data.announcementNum ? formatNoticeId(data.announcementNum) : '';
  if (org && num) return `${org} · ${num}`;
  return org || num || '-';
}

/** 스크린샷·`.old/rnd-card-content` 요소 정렬 */
export function RndCardContent({
  data,
  onCreateProject,
}: {
  data: RndNoticeCardData;
  /** 건축 공고 ID로 프로젝트 만들기 진입 */
  onCreateProject?: (ezrndNoticeId: string) => void;
}) {
  const badge = getRndStatusBadgeLines(data.status);
  const orgLine = getOrganizationLine(data);
  const periodFundLine = `접수기간 ${formatPeriodDot(data.startDateTime, data.endDateTime)} · 사업비 ${data.fund ?? '미정'}`;
  const deadlineLine = formatRndDeadlineLine(data.dDay, data.deadlineDisplay);
  const showDeadline = !!deadlineLine;
  const ezrndNoticeIdForProject = data.noticeId?.trim() || data.id;

  return (
    <div className='flex h-full flex-col'>
      <QualificationBadge>
        <QualificationBadge.Icon />
        <QualificationBadge.Text>
          {data.qualificationNotice ?? '건축 공고 참가자격 정보가 준비 중입니다'}
        </QualificationBadge.Text>
      </QualificationBadge>

      <div className='flex w-full items-start gap-2 py-2.5'>
        <NoticeStateLabel variant={badge.variant} line1={badge.line1} line2={badge.line2} />
        <div className='min-w-0 flex-1'>
          <div className='flex w-full items-start justify-between gap-2'>
            <div className='min-w-0 flex-1'>
              <SubTitle.Root className='min-w-0 gap-1.5 pt-0 text-sm leading-snug text-zinc-500'>
                <SubTitle.Logo src={data.logo ?? '/gov.png'} alt='' />
                <SubTitle.Text className='min-w-0 break-words'>{orgLine}</SubTitle.Text>
              </SubTitle.Root>
            </div>
            {showDeadline ? (
              <div className='shrink-0 pt-0.5'>
                <TimeLeftStatus line={deadlineLine} />
              </div>
            ) : null}
          </div>
          <div className='mt-1.5 w-full min-w-0'>
            <NoticeCardTitle>{data.title || ''}</NoticeCardTitle>
          </div>
          <p className='mt-1.5 text-sm text-zinc-600'>{periodFundLine}</p>
        </div>
      </div>

      <div className='mt-1 flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3'>
        <div className='flex min-w-0 flex-1 flex-wrap items-center gap-1.5'>
          {data.noticeId ? (
            <RouterButton url={`${EZRND_NOTICE_BASE}/${encodeURIComponent(data.noticeId)}`}>
              <RouterButton.Icon />
              <RouterButton.Text>공고 상세</RouterButton.Text>
            </RouterButton>
          ) : null}
          {onCreateProject && ezrndNoticeIdForProject ? (
            <ProjectCreateFromNoticeButton onPress={() => onCreateProject(ezrndNoticeIdForProject)} />
          ) : null}
          {data.redirectUrl?.irisUrl && (
            <RouterButton url={data.redirectUrl.irisUrl}>
              <RouterButton.Icon />
              <RouterButton.Text>아이리스</RouterButton.Text>
            </RouterButton>
          )}
          {data.redirectUrl?.applyUrl && (
            <RouterButton url={data.redirectUrl.applyUrl}>
              <RouterButton.Icon />
              <RouterButton.Text>공고접수</RouterButton.Text>
            </RouterButton>
          )}
          {data.offeringType ? <OfferingTypePill label={data.offeringType} /> : null}
        </div>
        <div className='flex shrink-0 flex-wrap items-center gap-3 text-sm text-zinc-500'>
          <PublishedAt>
            <PublishedAt.Icon />
            <PublishedAt.Title>공고게시일자</PublishedAt.Title>
            <PublishedAt.Value>
              {data.publishedAt ? formatDateDot(data.publishedAt) : '-'}
            </PublishedAt.Value>
          </PublishedAt>
          <RndMetaPlaceholder noticeId={data.noticeId ?? data.id} />
        </div>
      </div>
    </div>
  );
}
