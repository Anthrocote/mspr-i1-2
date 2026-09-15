'use client';

import { useEffect, useState } from 'react';
import type { Farm, Lot } from '@/types';
import { apiClient } from '@/lib/api/client';
import { fetchExploitations, fetchLotDetail, fetchLots } from '@/lib/api/queries';
import { useLanguage } from '@/contexts/LanguageContext';
import LotsView, { type LotDetailExtras } from './LotsView';

interface LotsData {
  lots: Lot[];
  farms: Farm[];
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: LotsData };

// Client container: fetches the lots table and the partner exploitations (used
// by the detail view + location filter) from the siège, then hands already-
// adapted presentation data to the pure LotsView. The read-only detail (stay
// history + current conditions) is fetched lazily on open via fetchLotDetail.
export default function LotsPage() {
  const { t } = useLanguage();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };

    Promise.all([
      fetchLots(apiClient, undefined, options),
      fetchExploitations(apiClient, options),
    ])
      .then(([lots, farms]) => {
        setState({ status: 'ready', data: { lots, farms } });
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

  const loadDetail = async (lot: Lot): Promise<LotDetailExtras> => {
    if (!lot.uuid) return { stays: lot.stays };
    const detail = await fetchLotDetail(apiClient, lot.uuid);
    return { stays: detail.stays, temp: detail.temp, hum: detail.hum };
  };

  return <LotsView lots={state.data.lots} farms={state.data.farms} loadDetail={loadDetail} />;
}
