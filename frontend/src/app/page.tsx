'use client';

import { useEffect, useState } from 'react';
import type { Alert, StatusDistribution, Warehouse } from '@/types';
import { apiClient } from '@/lib/api/client';
import {
  fetchConsolidatedSummary,
  fetchRecentAlerts,
  fetchWarehouseConditions,
} from '@/lib/api/queries';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardView from './DashboardView';

interface DashboardData {
  totalLots: number;
  distribution: StatusDistribution;
  warehouses: Warehouse[];
  alerts: Alert[];
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: DashboardData };

// Client container: fetches the consolidated summary, warehouse conditions and
// recent alerts from the siège, then hands already-adapted presentation data to
// the pure DashboardView. `enTransit` is unavailable from the API (no such
// concept / aggregate), so it is passed as null and rendered as an em dash.
export default function DashboardPage() {
  const { t } = useLanguage();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };

    Promise.all([
      fetchConsolidatedSummary(apiClient, options),
      fetchWarehouseConditions(apiClient, options),
      fetchRecentAlerts(apiClient, 50, options),
    ])
      .then(([summary, warehouses, alerts]) => {
        setState({
          status: 'ready',
          data: {
            totalLots: summary.totalLots,
            distribution: summary.distribution,
            warehouses,
            alerts,
          },
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setState({ status: 'error' });
      });

    return () => controller.abort();
  }, []);

  if (state.status === 'loading') {
    return <div className="py-16 text-center text-sm text-[#A08060]">{t('loading')}</div>;
  }

  if (state.status === 'error') {
    return <div className="py-16 text-center text-sm text-[#9B1C1C]">{t('load_error')}</div>;
  }

  return (
    <DashboardView
      totalLots={state.data.totalLots}
      enTransit={null}
      distribution={state.data.distribution}
      warehouses={state.data.warehouses}
      alerts={state.data.alerts}
    />
  );
}
