"use client"

import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent as ShadcnDialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./shadcn/dialog"

function DialogContent(
  props: React.ComponentProps<typeof ShadcnDialogContent>
) {
  return <ShadcnDialogContent {...props} closeButtonLabel="닫기" />
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
