'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { PAGE_META } from '@/types';
import type { PageId } from '@/types';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';

function pageIdFromPath(pathname: string): PageId {
  if (pathname === '/') return 'dashboard';
  const seg = pathname.split('/').filter(Boolean)[0];
  if (seg && seg in PAGE_META) return seg as PageId;
  return 'dashboard';
}

function InnerClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageId = pageIdFromPath(pathname);
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const title = t(pageId);
  const subtitle = t(`${pageId}_subtitle`);

  return (
    <div className="flex min-h-screen" style={{ background: '#EFE7DA' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar 
          title={title} 
          subtitle={subtitle} 
          onMenuClick={() => setSidebarOpen(true)} 
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-[30px_32px_48px]">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <InnerClientShell>{children}</InnerClientShell>
    </LanguageProvider>
  );
}
