'use client';

import { useState } from 'react';

import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';

interface NewSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (content: string) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function NewSearchModal({ open, onOpenChange, onSubmit, isSubmitting }: NewSearchModalProps) {
  const [keyword, setKeyword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (!trimmed) return;

    await onSubmit?.(trimmed);
    setKeyword('');
    onOpenChange(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setKeyword('');
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-w-md' showCloseButton>
        <DialogHeader>
          <DialogTitle>선행연구 검색</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='mb-1.5 block text-sm font-medium text-zinc-700'>검색어</label>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder='검색할 키워드를 입력하세요'
            />
          </div>
          <DialogFooter className='gap-2'>
            <Button type='button' variant='outline' onClick={() => handleOpenChange(false)}>
              취소
            </Button>
            <Button type='submit' disabled={!keyword.trim() || isSubmitting}>
              {isSubmitting ? '검색 중...' : '전송'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
