'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Bookmark, Calendar, Clock, Link2, Megaphone, Plus } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

import { cn } from '@/shared/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/tooltip';

/* ——— NoticeStateLabel + getNoticeStatus (.old/notice-state-label) ——— */

export type NoticeStatusResult = {
  text: string;
  variant: 'open' | 'pending' | 'closed' | 'plan' | 'preSpec' | 'default' | 'sampleTest';
};

export function getNoticeStatus(status: string): NoticeStatusResult {
  switch (status) {
    case '공고접수중':
      return { text: '접수 진행', variant: 'open' };
    case '공고예고':
      return { text: '접수예정', variant: 'pending' };
    case '공고마감':
      return { text: '공고마감', variant: 'closed' };
    case '발주계획':
      return { text: status, variant: 'plan' };
    case '사전규격':
      return { text: status, variant: 'preSpec' };
    case '입찰공고':
      return { text: status, variant: 'open' };
    case '개찰결과':
      return { text: status, variant: 'closed' };
    case 'sampleTest':
      return { text: status, variant: 'sampleTest' };
    default:
      return { text: status, variant: 'default' };
  }
}

/** 스크린샷용 2줄 상태 배지 문구 */
export function getRndStatusBadgeLines(status: string): {
  variant: VariantProps<typeof stateLabelSquare>['variant'];
  line1: string;
  line2?: string;
} {
  switch (status) {
    case '공고접수중':
      return { variant: 'open', line1: '접수', line2: '진행' };
    case '공고예고':
      return { variant: 'pending', line1: '접수', line2: '예정' };
    default: {
      const { text, variant } = getNoticeStatus(status);
      return { variant, line1: text };
    }
  }
}

const stateLabelSquare = cva(
  'inline-flex min-h-[52px] w-[52px] shrink-0 flex-col items-center justify-center rounded-xs border px-1 text-center text-[10px] font-semibold leading-tight',
  {
    variants: {
      variant: {
        default: 'border-zinc-200 bg-zinc-100 text-zinc-800',
        open: 'border-emerald-600 bg-emerald-600 text-white',
        closed: 'border-red-200 bg-red-50 text-red-800',
        pending: 'border-amber-500 bg-amber-500 text-white',
        plan: 'border-sky-200 bg-sky-50 text-sky-900',
        preSpec: 'border-violet-200 bg-violet-50 text-violet-900',
        sampleTest: 'border-emerald-600 bg-emerald-600 text-white',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export const NoticeStateLabel = React.memo(
  ({
    className,
    line1,
    line2,
    variant,
  }: {
    className?: string;
    line1: string;
    line2?: string;
    variant?: VariantProps<typeof stateLabelSquare>['variant'];
  }) => {
    return (
      <div className={cn(stateLabelSquare({ variant }), className)}>
        <span>{line1}</span>
        {line2 ? <span>{line2}</span> : null}
      </div>
    );
  }
);
NoticeStateLabel.displayName = 'NoticeStateLabel';

/* ——— SubTitle (.old/subtitle) ——— */

const SubTitleRoot = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center gap-1 text-sm text-zinc-500', className)} {...props}>
    {children}
  </div>
);

const SubTitleLogo = ({
  src = '/gov.png',
  alt = '',
  className,
  ...props
}: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'> & { src?: string; alt?: string }) => {
  if (!src) return null;
  return (
    <Image
      src={src}
      width={16}
      height={16}
      alt={alt}
      className={cn('size-4 shrink-0 rounded-xs object-contain', className)}
      {...props}
    />
  );
};

const SubTitleText = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  if (!children || (typeof children === 'string' && !children.trim())) return null;
  return (
    <span className={cn(className)} {...props}>
      {children}
    </span>
  );
};

export const SubTitle = {
  Root: SubTitleRoot,
  Logo: SubTitleLogo,
  Text: SubTitleText,
};

/* ——— NoticeCardTitle (line-clamp + tooltip) ——— */

export const NoticeCardTitle = React.memo(
  ({ className, children }: { className?: string; children: React.ReactNode }) => {
    const titleText = typeof children === 'string' ? children : String(children ?? '');
    const titleEl = (
      <div
        className={cn(
          'font-topic text-base font-bold leading-snug tracking-tight text-zinc-900 md:text-lg',
          'line-clamp-2',
          className
        )}
      >
        {children}
      </div>
    );

    if (titleText.trim().length > 48) {
      return (
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>{titleEl}</TooltipTrigger>
          <TooltipContent side='top' className='max-w-sm rounded-xs'>
            {titleText}
          </TooltipContent>
        </Tooltip>
      );
    }

    return titleEl;
  }
);
NoticeCardTitle.displayName = 'NoticeCardTitle';

/* ——— TimeLeftStatus ——— */

export const TimeLeftStatus = React.memo(
  ({
    className,
    line,
  }: {
    className?: string;
    line: string | null | undefined;
  }) => {
    if (!line) return null;
    return (
      <div className={cn('flex min-w-0 items-center text-sm', className)}>
        <span className='flex items-center gap-1 font-normal text-sky-700'>
          <Clock className='size-3.5 shrink-0' />
          <span>{line}</span>
        </span>
      </div>
    );
  }
);
TimeLeftStatus.displayName = 'TimeLeftStatus';

/* ——— NoticeContentRow ——— */

const NoticeContentRowRoot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex w-full flex-wrap items-center gap-1 px-2', className)} {...props} />
));
NoticeContentRowRoot.displayName = 'NoticeContentRowRoot';

const NoticeContentRowItemRoot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex min-w-0 flex-1 flex-col gap-0.5 text-left sm:flex-row sm:items-baseline sm:gap-2', className)} {...props} />
));
NoticeContentRowItemRoot.displayName = 'NoticeContentRowItemRoot';

const NoticeContentRowItemTitle = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span ref={ref} className={cn('shrink-0 text-sm text-zinc-500', className)} {...props} />
));
NoticeContentRowItemTitle.displayName = 'NoticeContentRowItemTitle';

const NoticeContentRowItemValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, children, ...props }, ref) => (
  <span ref={ref} className={cn('text-sm font-semibold text-zinc-600', className)} {...props}>
    {children}
  </span>
));
NoticeContentRowItemValue.displayName = 'NoticeContentRowItemValue';

export const NoticeContentRowItem = Object.assign(NoticeContentRowItemRoot, {
  Title: NoticeContentRowItemTitle,
  Value: NoticeContentRowItemValue,
});

const NoticeContentRowSeparator = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span ref={ref} className={cn('mx-1 text-zinc-400', className)} {...props}>
    ⋅
  </span>
));
NoticeContentRowSeparator.displayName = 'NoticeContentRowSeparator';

export { NoticeContentRowRoot, NoticeContentRowSeparator };

/* ——— RouterButton ——— */

const RouterButtonRoot = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { url: string }
>(({ className, children, url, onClick, ...props }, ref) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    window.open(url, '_blank', 'noopener,noreferrer');
    onClick?.(e);
  };

  return (
    <button
      ref={ref}
      type='button'
      className={cn(
        'flex cursor-pointer items-center gap-1 rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors',
        'hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-900',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
});
RouterButtonRoot.displayName = 'RouterButtonRoot';

const projectCreateFromNoticeButtonClass =
  'flex cursor-pointer items-center gap-1 rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-900';

/** 건축 공고 카드 — 공고 상세 링크 옆 건축 프로젝트 생성 (모달·섹션 전환은 부모에서 처리) */
export function ProjectCreateFromNoticeButton({
  className,
  onPress,
}: {
  className?: string;
  onPress: () => void;
}) {
  return (
    <button
      type='button'
      className={cn(projectCreateFromNoticeButtonClass, className)}
      onClick={(e) => {
        e.stopPropagation();
        onPress();
      }}
    >
      <Plus className='size-3' />
      <span>건축 프로젝트 생성</span>
    </button>
  );
}

export const RouterButton = Object.assign(RouterButtonRoot, {
  Icon: ({ className }: { className?: string }) => (
    <Link2 className={cn('size-3', className)} />
  ),
  Text: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <span className={cn(className)}>{children}</span>,
});

/* ——— CategoryBadges ——— */

const CategoryBadgesRoot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    categories: Array<{ categoryCode: number; categoryName: string; score: number }>;
  }
>(({ className, children, categories, ...props }, ref) => {
  if (!categories?.length) return null;
  return (
    <div ref={ref} className={cn('flex flex-wrap gap-1.5', className)} {...props}>
      {children}
    </div>
  );
});
CategoryBadgesRoot.displayName = 'CategoryBadgesRoot';

const CategoryBadge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { categoryName: string }
>(({ className, categoryName, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      'flex items-center rounded-md border border-blue-600 bg-white px-2.5 py-1 text-xs font-medium text-blue-700',
      className
    )}
    {...props}
  >
    {categoryName}
  </span>
));
CategoryBadge.displayName = 'CategoryBadge';

export const CategoryBadges = Object.assign(CategoryBadgesRoot, {
  Badge: CategoryBadge,
});

/** 공모구분 등 스크린샷의 파란 테두리 태그 1개 */
export function OfferingTypePill({ label }: { label: string }) {
  return (
    <span className='rounded-md border border-blue-600 bg-white px-2.5 py-1 text-xs font-medium text-blue-700'>
      {label}
    </span>
  );
}

/* ——— QualificationBadge ——— */

const QualificationBadgeRoot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center gap-2', className)} {...props} />
));
QualificationBadgeRoot.displayName = 'QualificationBadgeRoot';

export const QualificationBadge = Object.assign(QualificationBadgeRoot, {
  Icon: ({ className }: { className?: string }) => (
    <Megaphone className={cn('size-3.5 shrink-0 text-orange-500', className)} />
  ),
  Text: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={cn('text-xs font-normal text-zinc-500', className)}>{children}</div>
  ),
});

/* ——— PublishedAt ——— */

const PublishedAtRoot = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-wrap items-center gap-x-2 text-sm text-zinc-500', className)}
      {...props}
    />
  )
);
PublishedAtRoot.displayName = 'PublishedAtRoot';

export const PublishedAt = Object.assign(PublishedAtRoot, {
  Icon: ({ className }: { className?: string }) => (
    <Calendar className={cn('size-3.5 shrink-0', className)} />
  ),
  Title: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <span className={cn(className)}>{children}</span>,
  Value: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <span className={cn(className)}>{children}</span>,
});

/* ——— Meta: 스크랩 자리 (API 없음 — 목업 전용) ——— */

export const RndMetaPlaceholder = React.memo(({ noticeId }: { noticeId: string }) => (
  <div className='flex min-w-[72px] items-center justify-end text-sm text-zinc-500'>
    <button
      type='button'
      className='group flex items-center gap-1 rounded-xs text-zinc-500'
      aria-label='스크랩 (준비 중)'
      title='준비 중'
      data-id={noticeId}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <Bookmark className='size-4 stroke-[1.5] text-zinc-500' />
      <span className='text-xs font-normal'>스크랩</span>
    </button>
  </div>
));
RndMetaPlaceholder.displayName = 'RndMetaPlaceholder';
