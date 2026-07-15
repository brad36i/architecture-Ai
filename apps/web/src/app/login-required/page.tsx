// TODO: 향후 삭제 — 임시 미인증 안내 페이지 (실제 인증 플로우에 흡수)
import Link from 'next/link'

import { Button } from '@/shared/ui/button'

export default function LoginRequiredPage() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center gap-6 bg-stone-100/80 px-4'>
      <p className='text-center text-base text-zinc-700'>로그인하세요.</p>
      <Button asChild className='min-w-[8rem]'>
        <Link href='/'>로그인</Link>
      </Button>
    </div>
  )
}
