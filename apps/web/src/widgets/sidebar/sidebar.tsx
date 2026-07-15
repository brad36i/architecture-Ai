'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRef, useLayoutEffect, useState } from 'react';
import { ResizableBox } from 'react-resizable';

import { ARCHITECTURE_STAGES, type ArchitectureStage } from '@/shared/config/architecture-stages';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

import {
  useSidebarStore,
  DEFAULT_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
} from './model/sidebarStore';

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeStep = searchParams.get('step');
  const pathParts = pathname.split('/').filter(Boolean);
  const projectId = pathParts[1] ?? '';
  const currentSlug = pathParts[2] ?? '';

  const hasHydrated = useSidebarStore((s) => s._hasHydrated);
  const sidebarWidth = useSidebarStore((s) => s.sidebarWidth);
  const setSidebarWidth = useSidebarStore((s) => s.setSidebarWidth);

  const [panelHeight, setPanelHeight] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const updateHeight = () => {
      setPanelHeight(el.offsetHeight || el.clientHeight || 600);
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const getHref = (item: ArchitectureStage) =>
    `/projects/${projectId}/${item.route}?step=${item.step}`;

  const isActive = (item: ArchitectureStage) =>
    currentSlug === item.route && activeStep === item.step;

  const handleResize = (
    _e: React.SyntheticEvent,
    data: { node: HTMLElement; size: { width: number; height: number } }
  ) => {
    setSidebarWidth(data.size.width);
  };

  return (
    <div ref={containerRef} className='fixed left-0 top-0 z-40 h-screen'>
      <ResizableBox
        width={hasHydrated ? sidebarWidth : DEFAULT_SIDEBAR_WIDTH}
        height={panelHeight}
        axis='x'
        resizeHandles={['e']}
        minConstraints={[MIN_SIDEBAR_WIDTH, panelHeight]}
        maxConstraints={[MAX_SIDEBAR_WIDTH, panelHeight]}
        onResize={handleResize}
        handle={(_, ref) => (
          <div
            ref={ref}
            className='absolute right-0 top-0 z-10 h-full w-2 cursor-ew-resize bg-transparent opacity-0 transition-opacity hover:bg-zinc-600/50 hover:opacity-100'
            aria-hidden
          />
        )}
        className='sidebar-resizable flex flex-col border-r border-zinc-700 bg-zinc-800 text-white'
        style={{ height: '100dvh' }}
      >
        <div className='flex min-w-0 flex-col gap-2 p-4'>
          <h2 className='flex min-w-0 items-center gap-2 text-base'>
            <Image
              src='/logo.png'
              alt='이지알앤디'
              width={24}
              height={24}
              className='shrink-0'
              unoptimized
            />
            <span className='line-clamp-1 min-w-0 flex-1'>
              <span className='font-gowun-batang-bold font-semibold text-zinc-100'>
                내 프로젝트{' '}
              </span>
              <span className='font-gowun-batang italic text-zinc-100'>Architecture Agent</span>
            </span>
          </h2>
          <Button
            variant='ghost'
            size='sm'
            className='w-full justify-start gap-2 text-zinc-300 hover:bg-zinc-700 hover:text-white'
            asChild
          >
            <Link href='/projects'>
              <span className='text-sm'>← 건축 프로젝트로 돌아가기</span>
            </Link>
          </Button>
        </div>

        <nav className='flex min-w-0 flex-1 flex-col overflow-auto px-2 py-2'>
          <ul className='flex min-w-0 flex-col gap-1'>
            {ARCHITECTURE_STAGES.map((item) => {
              const active = isActive(item);
              return (
                <li key={item.step} className='min-w-0'>
                  <Link
                    href={getHref(item)}
                    className={cn(
                      'flex w-full min-w-0 items-center gap-2 rounded-md border border-transparent px-2 py-2 text-left text-sm font-medium text-zinc-300',
                      'hover:bg-zinc-700 hover:text-white',
                      active && 'border-zinc-600 bg-zinc-700/70 text-white'
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span
                      className='flex size-5 shrink-0 items-center justify-center text-base opacity-75 grayscale'
                      aria-hidden
                    >
                      {item.emoji}
                    </span>
                    <span className='min-w-0 flex-1 line-clamp-1'>{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </ResizableBox>
    </div>
  );
}
