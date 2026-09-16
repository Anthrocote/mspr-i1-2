'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import HelpDrawer from '@/components/help/HelpDrawer';
import { PAGE_META, type PageId } from '@/types';
import { PAGE_TO_SLUG } from '@/content/help/types';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { SearchProvider } from '@/contexts/SearchContext';

function pageIdFromPath(pathname: string): string {
  if (pathname === '/') return 'dashboard';
  const seg = pathname.split('/').filter(Boolean)[0];
  // Object.hasOwn, not `in`: `/constructor` must not match Object.prototype.
  if (seg && Object.hasOwn(PAGE_META, seg)) return seg;
  return 'not-found';
}

function InnerClientShell({ children }: { children: React.ReactNode }) {
  // All hooks are called unconditionally, in the same order, on every render.
  // The `/secret` bypass only branches on the JSX that is returned afterward —
  // it must NOT early-return before these calls. Next.js's App Router does not
  // remount this component across a client-side navigation (there is a single
  // root layout hosting it), so an early return here before these hooks would
  // be a genuine conditional-hook-call bug, not a safe "fresh mount" case.
  const pathname = usePathname();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  if (pathname === '/secret') {
    return <>{children}</>;
  }

  const pageId = pageIdFromPath(pathname);
  const title = pageId === 'not-found' ? t('page_not_found') : t(pageId);
  const subtitle = pageId === 'not-found' ? t('error_404') : t(`${pageId}_subtitle`);

  // The contextual "?" only exists where the current page maps to an article.
  // The help center (/aide) and not-found carry no drawer of their own.
  const helpSlug = pageId === 'not-found' ? undefined : PAGE_TO_SLUG[pageId as PageId];

  return (
    <div className="flex min-h-screen" style={{ background: '#EFE7DA' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setSidebarOpen(true)}
          onHelpClick={helpSlug ? () => setHelpOpen(true) : undefined}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-[30px_32px_48px]">
          {children}
        </main>
      </div>
      {helpSlug && (
        <HelpDrawer slug={helpSlug} open={helpOpen} onClose={() => setHelpOpen(false)} />
      )}
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
