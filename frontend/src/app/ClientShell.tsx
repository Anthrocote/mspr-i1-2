'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { PAGE_META } from '@/types';
import type { PageId } from '@/types';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { SearchProvider } from '@/contexts/SearchContext';

function pageIdFromPath(pathname: string): string {
  if (pathname === '/') return 'dashboard';
  const seg = pathname.split('/').filter(Boolean)[0];
  if (seg && seg in PAGE_META) return seg;
  return 'not-found';
}

function InnerClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageId = pageIdFromPath(pathname);
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const title = pageId === 'not-found' ? t('page_not_found') : t(pageId);
  const subtitle = pageId === 'not-found' ? t('error_404') : t(`${pageId}_subtitle`);

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
      <SearchProvider>
        <InnerClientShell>{children}</InnerClientShell>
      </SearchProvider>
    </LanguageProvider>
  );
}
