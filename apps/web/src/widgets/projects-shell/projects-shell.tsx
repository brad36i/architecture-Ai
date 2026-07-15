'use client';

import { Search, Plus, User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { ProjectFormProvider, useProjectForm } from '@/features/projects';
import { useUserAccount } from '@/features/researcher';
import { cn } from '@/shared/lib/utils';
import { useProjectsViewStore } from '@/shared/stores/projects-view-store';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Input } from '@/shared/ui/input';
import { ProfileContent } from '@/widgets/profile-content';

// TODO: 삭제예정 — 임시 하드코딩 표시용 사용자 번호 (API account.id 대신)
const SIDEBAR_USER_DISPLAY_ID = '11897892';

const PROJECT_SEARCH_PLANNED_TOAST = '건축 프로젝트 검색은 구현 예정 중입니다.';

function ProjectsShellInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { sidebarSection, setSidebarSection, sidebarProjects } = useProjectsViewStore();
  const { openNewProject } = useProjectForm();
  const { data: account } = useUserAccount();
  const sidebarUserLabel = account
    ? `${account.lastName}${account.firstName}(${SIDEBAR_USER_DISPLAY_ID})`
    : '건축가';

  const handleProjectClick = (id: string) => {
    router.push(`/projects/${id}`);
  };

  const showNewProjectButton =
    sidebarSection !== 'rnd-recommendations' && sidebarSection !== 'profile';

  return (
    <div className='flex h-dvh min-h-0 w-full overflow-hidden bg-zinc-100'>
      {/* Left Sidebar — 뷰포트 높이 고정, 본문 스크롤과 분리 */}
      <aside className='flex h-full min-h-0 w-64 shrink-0 flex-col border-r border-zinc-200 bg-white'>
        <div className='flex flex-col gap-2 p-4'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type='button'
                className='flex w-full items-center gap-3 rounded-lg bg-white px-3 py-2 text-left transition-colors hover:bg-zinc-50'
                aria-label='메뉴 열기'
              >
                <span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-600'>
                  <User className='size-5' />
                </span>
                <span className='min-w-0 flex-1 truncate text-sm font-medium text-zinc-700'>
                  {sidebarUserLabel}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start' className='min-w-[160px]'>
              <DropdownMenuItem onClick={() => setSidebarSection('profile')} className='gap-2'>
                <User className='size-4' />
                건축가 정보보기
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* TODO: 향후 삭제/수정 — 임시 로그아웃(홈만 이동), 실제 세션 종료·스토어 정리로 교체 */}
              <DropdownMenuItem
                onClick={() => router.push('/')}
                className='gap-2 text-red-600 focus:text-red-600'
              >
                <LogOut className='size-4' />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className='relative'>
            <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400' />
            <Input
              readOnly
              placeholder='건축 프로젝트 검색'
              aria-readonly='true'
              className='cursor-default border-zinc-200 bg-zinc-50 pl-9 text-zinc-800 placeholder:text-zinc-500'
              onClick={() => toast.info(PROJECT_SEARCH_PLANNED_TOAST)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toast.info(PROJECT_SEARCH_PLANNED_TOAST);
                }
              }}
            />
          </div>
        </div>
        <nav className='min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-2'>
          <button
            type='button'
            onClick={() => setSidebarSection('rnd-recommendations')}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm',
              sidebarSection === 'rnd-recommendations'
                ? 'font-medium text-zinc-900 bg-zinc-100'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            )}
          >
            건축 공고
          </button>
          <button
            type='button'
            onClick={() => setSidebarSection('research-plans')}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm',
              sidebarSection === 'research-plans'
                ? 'font-medium text-zinc-900 bg-zinc-100'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            )}
          >
            내 프로젝트
          </button>
          <button
            type='button'
            onClick={() => setSidebarSection('profile')}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm',
              sidebarSection === 'profile'
                ? 'font-medium text-zinc-900 bg-zinc-100'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            )}
          >
            건축가 정보
          </button>
          <button
            type='button'
            onClick={() => setSidebarSection('favorites')}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm',
              sidebarSection === 'favorites'
                ? 'font-medium text-zinc-900 bg-zinc-100'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            )}
          >
            즐겨찾기
          </button>
        </nav>
        <div className='border-t border-zinc-200 p-4'>
          <h3 className='mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500'>
            빠른 접근
          </h3>
          <ul className='space-y-0.5 text-sm text-zinc-600'>
            {sidebarProjects.slice(0, 4).map((project) => (
              <li key={project.id}>
                <button
                  onClick={() => handleProjectClick(project.id)}
                  className='w-full rounded-md px-2 py-1.5 text-left hover:bg-zinc-100 hover:text-zinc-900 truncate'
                  title={project.topic}
                >
                  {project.topic}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main Content — 헤더 고정, 아래 영역만 세로 스크롤 */}
      <main className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>
        {/* Header - 고정 */}
        <header className='flex h-14 min-h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6'>
          <h1 className='text-sm font-medium leading-none text-zinc-800'>
            {sidebarSection === 'profile'
              ? '건축가 정보'
              : sidebarSection === 'rnd-recommendations'
                ? '건축 공고'
                : '건축 프로젝트'}
          </h1>
          {showNewProjectButton ? (
            <Button size='sm' onClick={() => openNewProject()}>
              <Plus className='size-4' />
              새 건축 프로젝트
            </Button>
          ) : null}
        </header>

        {/* Content Container */}
        <div
          className='min-h-0 flex-1 overflow-y-auto overscroll-contain p-6'
          data-projects-main-scroll
        >
          {sidebarSection === 'profile' ? <ProfileContent /> : children}
        </div>
      </main>
    </div>
  );
}

export function ProjectsShell({ children }: { children: React.ReactNode }) {
  return (
    <ProjectFormProvider>
      <ProjectsShellInner>{children}</ProjectsShellInner>
    </ProjectFormProvider>
  );
}
