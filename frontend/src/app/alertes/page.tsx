'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { fetchAlertsPage, type AlertStatusFilter, type AlertsPageResult } from '@/lib/api/queries';
import { useLanguage } from '@/contexts/LanguageContext';
import AlertesView from './AlertesView';

const PAGE_SIZE = 12;

// A day picked in the filter is a local calendar day; widen it to the full day
// so `from`/`to` are inclusive bounds on the triggered instant.
function dayStart(day: string): string | undefined {
  return day ? `${day}T00:00:00` : undefined;
}
function dayEnd(day: string): string | undefined {
  return day ? `${day}T23:59:59` : undefined;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; result: AlertsPageResult };

// Client container: the full alert history is filtered/sorted/paginated by the
// siège. This holds the filter + page state and refetches whenever it changes;
// the pure AlertesView renders the current page and reports intent back.
export default function AlertesPage() {
  const { t } = useLanguage();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  // Default to the complete history so the page opens on "everything", per the
  // requirement to see the full log rather than only active alerts.
  const [statusFilter, setStatusFilter] = useState<AlertStatusFilter>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => (current.status === 'ready' ? current : { status: 'loading' }));
    fetchAlertsPage(
      apiClient,
      { status: statusFilter, from: dayStart(from), to: dayEnd(to), page, limit: PAGE_SIZE },
      { signal: controller.signal },
    )
      .then((result) => setState({ status: 'ready', result }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setState({ status: 'error' });
      });
    return () => controller.abort();
  }, [statusFilter, from, to, page]);

  if (state.status === 'loading') {
    return <div className="py-16 text-center text-sm text-[#A08060]">{t('loading')}</div>;
  }
  if (state.status === 'error') {
    return <div className="py-16 text-center text-sm text-[#9B1C1C]">{t('load_error')}</div>;
  }

  const { result } = state;

  // Any filter change returns to the first page so the view can't land on an
  // out-of-range page.
  const changeStatus = (v: AlertStatusFilter) => { setStatusFilter(v); setPage(1); };
  const changeFrom = (v: string) => { setFrom(v); setPage(1); };
  const changeTo = (v: string) => { setTo(v); setPage(1); };
  const reset = () => { setStatusFilter('all'); setFrom(''); setTo(''); setPage(1); };

  return (
    <AlertesView
      alerts={result.alerts}
      page={result.page}
      pages={result.pages}
      total={result.total}
      status={statusFilter}
      from={from}
      to={to}
      onStatus={changeStatus}
      onFrom={changeFrom}
      onTo={changeTo}
      onReset={reset}
      onPage={(updater) => setPage(updater)}
    />
  );
}
