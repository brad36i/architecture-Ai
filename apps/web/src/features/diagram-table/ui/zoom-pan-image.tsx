'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';

const MIN_SCALE = 0.2;
const MAX_SCALE = 8;

type ZoomPanImageProps = {
  src: string;
  alt: string;
  className?: string;
};

export function ZoomPanImage({ src, alt, className }: ZoomPanImageProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef(pan);
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setScale(1);
      setPan({ x: 0, y: 0 });
    });
  }, [src]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.002);
      setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * factor)));
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = panRef.current;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: p.x,
      originY: p.y,
    };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    setPan({ x: d.originX + dx, y: d.originY + dy });
  }, []);

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div
      ref={viewportRef}
      className={cn(
        'relative h-full min-h-[200px] w-full overflow-hidden rounded border border-zinc-200 bg-zinc-100/80',
        className
      )}
    >
      <div
        role='presentation'
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className='flex h-full w-full cursor-grab touch-none items-center justify-center active:cursor-grabbing'
      >
        <div
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
            transformOrigin: 'center center',
          }}
          className='flex h-full items-center justify-center will-change-transform'
        >
          <img
            src={src}
            alt={alt}
            draggable={false}
            className='h-full w-auto max-h-full select-none'
          />
        </div>
      </div>
      <p className='pointer-events-none absolute bottom-2 left-2 right-2 text-center text-[10px] text-zinc-400'>
        Ctrl+휠 줌 · 드래그로 이동
      </p>
    </div>
  );
}
