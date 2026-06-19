'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { PAGE_META } from '@/types';
import type { PageId } from '@/types';

function pageIdFromPath(pathname: string): PageId {
  if (pathname === '/') return 'dashboard';
  const seg = pathname.split('/').filter(Boolean)[0];
  if (seg && seg in PAGE_META) return seg as PageId;
  return 'dashboard';
}

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageId = pageIdFromPath(pathname);
  const meta = PAGE_META[pageId];

  return (
    <div className="flex min-h-screen" style={{ background: '#EFE7DA' }}>
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar title={meta.title} subtitle={meta.subtitle} />
        <main className="flex-1 p-[30px_32px_48px]">
          {children}
        </main>
      </div>
    </div>
  );
}
