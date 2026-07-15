'use client';

import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  isDeleting?: boolean;
}

export function DeleteConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteConfirmModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-sm' showCloseButton>
        <DialogHeader>
          <DialogTitle>삭제하시겠습니까?</DialogTitle>
        </DialogHeader>
        <DialogFooter className='gap-2 sm:justify-end'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            아니오
          </Button>
          <Button
            type='button'
            variant='destructive'
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? '삭제 중...' : '예'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
