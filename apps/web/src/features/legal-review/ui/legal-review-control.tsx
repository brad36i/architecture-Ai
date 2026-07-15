'use client';

import { Scale } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import { useLegalReview } from '@/features/legal-review/model/use-legal-review';
import { getArchitectureStage } from '@/shared/config/architecture-stages';
import { Button } from '@/shared/ui/button';

type LegalReviewControlProps = {
  projectId: string;
};

function formatReviewedAt(reviewedAt: string): string {
  const date = new Date(reviewedAt);
  if (Number.isNaN(date.getTime())) return reviewedAt;
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
}

export function LegalReviewControl({ projectId }: LegalReviewControlProps) {
  const searchParams = useSearchParams();
  const stage = getArchitectureStage(searchParams.get('step'));
  const { query, runReview } = useLegalReview(projectId, stage?.step ?? '');

  if (!stage) return null;

  const review = query.data?.review ?? null;
  const error = runReview.error ?? query.error;

  return (
    <div
      className='flex shrink-0 flex-col items-center gap-1'
      aria-label={`${stage.title} 법률 검토`}
    >
      <Button
        type='button'
        size='sm'
        className='h-9 border border-amber-700 bg-amber-600 px-3 text-white shadow-sm hover:bg-amber-700'
        onClick={() => runReview.mutate()}
        disabled={runReview.isPending || !projectId}
      >
        <Scale className='mr-2 size-4' aria-hidden />
        {runReview.isPending ? '법률 검토 중…' : '법률 검토 실행'}
      </Button>
      <p
        className={
          error
            ? 'max-w-64 text-center text-xs text-red-600'
            : 'whitespace-nowrap text-center text-xs text-zinc-500 tabular-nums'
        }
        aria-live='polite'
        aria-label={
          review ? `최근 법률 검토 완료 시각 ${formatReviewedAt(review.reviewedAt)}` : undefined
        }
      >
        {error instanceof Error
          ? error.message
          : query.isPending
            ? '최근 검토 기록을 확인하는 중…'
            : review
              ? formatReviewedAt(review.reviewedAt)
              : '아직 검토하지 않았습니다.'}
      </p>
    </div>
  );
}
