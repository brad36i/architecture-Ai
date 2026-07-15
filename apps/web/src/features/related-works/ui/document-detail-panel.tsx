'use client';

import { ExternalLink, Users, Building2, Calendar, Bookmark } from 'lucide-react';
import { useParams } from 'next/navigation';

import { useRelatedWorksStore } from '@/features/related-works/model/related-works-store';
import {
  useClippings,
  searchResultToClippingCreate,
} from '@/features/related-works/model/use-clippings';
import { DocumentTypeTag } from '@/features/related-works/ui/document-type-tag';
import { Button } from '@/shared/ui/button';
import { StateTag } from '@/shared/ui/state-tag';

export function DocumentDetailPanel() {
  const params = useParams();
  const projectId = (params?.id as string) ?? '';
  const previewItem = useRelatedWorksStore((s) => s.previewItem);
  const { createClipping, createPending } = useClippings(projectId);

  if (!previewItem) {
    return (
      <div className='flex flex-1 items-center justify-center text-center text-zinc-500'>
        <p className='text-sm'>문헌을 클릭하여 상세 정보를 확인하세요</p>
      </div>
    );
  }

  const handleAddBookmark = async () => {
    if (!projectId) return;
    await createClipping(searchResultToClippingCreate(previewItem));
  };

  const date = new Date(previewItem.publishedAt);
  const formattedDate = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className='flex h-full flex-col overflow-auto'>
      <div className='mb-4 flex items-start justify-between gap-3'>
        <DocumentTypeTag type={previewItem.type} />
        <Button
          variant='ghost'
          size='sm'
          onClick={handleAddBookmark}
          disabled={!projectId || createPending}
          className='size-8 p-0 text-zinc-400 hover:text-zinc-200'
        >
          <Bookmark className='size-4' />
        </Button>
      </div>

      <h2 className='font-gowun-batang-bold mb-4 text-xl font-semibold leading-tight text-zinc-100'>
        {previewItem.title}
      </h2>

      <div className='mb-4 space-y-2 text-sm text-zinc-400'>
        {previewItem.authors.length > 0 && (
          <div className='flex items-center gap-2'>
            <Users className='size-4' />
            <span>{previewItem.authors.join(', ')}</span>
          </div>
        )}
        {previewItem.organization && (
          <div className='flex items-center gap-2'>
            <Building2 className='size-4' />
            <span>{previewItem.organization}</span>
          </div>
        )}
        <div className='flex items-center gap-2'>
          <Calendar className='size-4' />
          <span>{formattedDate}</span>
        </div>
        {previewItem.doi && previewItem.doiUrl && (
          <div className='flex items-start gap-2'>
            <ExternalLink className='mt-0.5 size-4 shrink-0' />
            <a
              href={previewItem.doiUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='break-all text-zinc-300 underline-offset-2 hover:text-white hover:underline'
            >
              DOI: {previewItem.doi}
            </a>
          </div>
        )}
      </div>

      <div className='mb-4 flex flex-wrap gap-2'>
        {previewItem.keywords.map((keyword) => (
          <StateTag key={keyword} variant='darkgray'>
            {keyword}
          </StateTag>
        ))}
      </div>

      <div className='mb-4 border-t border-zinc-700' />

      <div className='mb-4 flex-1'>
        <h3 className='mb-2 text-sm font-semibold text-zinc-300'>초록</h3>
        <p className='text-sm leading-relaxed text-zinc-400'>{previewItem.abstract}</p>
      </div>

      {previewItem.url && (
        <div className='border-t border-zinc-700 pt-4'>
          <Button
            variant='outline'
            size='sm'
            asChild
            className='w-full border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          >
            <a href={previewItem.url} target='_blank' rel='noopener noreferrer'>
              <ExternalLink className='mr-2 size-4' />
              원문 보기
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
