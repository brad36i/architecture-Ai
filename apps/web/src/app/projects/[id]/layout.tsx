import { AsidebarMenu } from '@/widgets/asidebar';
import { Header } from '@/widgets/header';
import { ProjectLayoutShell } from '@/widgets/sidebar';

export default async function ProjectLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  return (
    <ProjectLayoutShell projectId={id}>
      <Header projectId={id} />
      <div className='flex flex-1 overflow-hidden'>
        <div className='flex min-h-0 flex-1 flex-col overflow-auto' data-scroll-container>
          {children}
        </div>
        <AsidebarMenu />
      </div>
    </ProjectLayoutShell>
  );
}
