'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Lot } from '@/types';
import type { ApiLotStatus } from '@/lib/api/types';
import { apiClient } from '@/lib/api/client';
import {
  fetchExploitations,
  fetchLotDetail,
  fetchLotFilterOptions,
  fetchLotsServer,
  type LotFilterOptions,
  type LotSortField,
  type LotsPageResult,
  type SortOrder,
} from '@/lib/api/queries';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSearch } from '@/contexts/SearchContext';
import LotsView, {
  type LotAgeChoice,
  type LotDetailExtras,
  type LotStatusFilter,
} from './LotsView';
import type { Farm } from '@/types';

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 300;

// Decode the location select value into the server filter params. The value is
// `all`, `country:<id>` or `wh:<uuid>` (country > warehouse hierarchy).
function locationParams(location: string): { countryId?: number; warehouseId?: string } {
  if (location.startsWith('country:')) return { countryId: Number(location.slice(8)) };
  if (location.startsWith('wh:')) return { warehouseId: location.slice(3) };
  return {};
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; result: LotsPageResult };

// Client container: the lots table is filtered/sorted/paginated by the siège.
// This owns the filter/sort/page state, debounces the global search into the
// query, and hands already-adapted data to the pure LotsView. The location
// filter options come from the country/warehouse list endpoints (the current
// page no longer contains every location).
export default function LotsPage() {
  const { t } = useLanguage();
  const { searchQuery } = useSearch();

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [farms, setFarms] = useState<Farm[]>([]);
  const [filterOptions, setFilterOptions] = useState<LotFilterOptions>({ countries: [], warehouses: [] });

  const [location, setLocation] = useState('all');
  const [statusFilter, setStatusFilter] = useState<LotStatusFilter>('all');
  const [ageFilter, setAgeFilter] = useState<LotAgeChoice>('all');
  const [sortField, setSortField] = useState<LotSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [page, setPage] = useState(1);

  // Debounce the global search so typing doesn't fire a request per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // A new search term changes the result set, so return to the first page.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Static data: partner exploitations (detail view) + location filter options.
  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    Promise.all([
      fetchExploitations(apiClient, options),
      fetchLotFilterOptions(apiClient, options),
    ])
      .then(([farmList, opts]) => {
        setFarms(farmList);
        setFilterOptions(opts);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        // The table can still load without the filter options; leave them empty.
      });
    return () => controller.abort();
  }, []);

  const loc = useMemo(() => locationParams(location), [location]);

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => (current.status === 'ready' ? current : { status: 'loading' }));
    fetchLotsServer(
      apiClient,
      {
        status: statusFilter === 'all' ? undefined : (statusFilter as ApiLotStatus),
        countryId: loc.countryId,
        warehouseId: loc.warehouseId,
        search: debouncedSearch || undefined,
        age: ageFilter === 'all' ? undefined : ageFilter,
        sort: sortField ?? undefined,
        order: sortField ? sortOrder : undefined,
        page,
        limit: PAGE_SIZE,
      },
      { signal: controller.signal },
    )
      .then((result) => setState({ status: 'ready', result }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setState({ status: 'error' });
      });
    return () => controller.abort();
  }, [statusFilter, loc, ageFilter, sortField, sortOrder, debouncedSearch, page]);

  if (state.status === 'loading') {
    return <div className="py-16 text-center text-sm text-[#A08060]">{t('loading')}</div>;
  }
  if (state.status === 'error') {
    return <div className="py-16 text-center text-sm text-[#9B1C1C]">{t('load_error')}</div>;
  }

  const loadDetail = async (lot: Lot): Promise<LotDetailExtras> => {
    if (!lot.uuid) return { stays: lot.stays };
    const detail = await fetchLotDetail(apiClient, lot.uuid);
    return { stays: detail.stays, temp: detail.temp, hum: detail.hum, idealTemp: detail.idealTemp, idealHum: detail.idealHum };
  };

  // Filter changes reset to the first page so the view can't land out of range.
  const changeLocation = (v: string) => { setLocation(v); setPage(1); };
  const changeStatus = (v: LotStatusFilter) => { setStatusFilter(v); setPage(1); };
  const changeAge = (v: LotAgeChoice) => { setAgeFilter(v); setPage(1); };
  const reset = () => { setLocation('all'); setStatusFilter('all'); setAgeFilter('all'); setPage(1); };

  // Toggle sort direction on the active column, else sort the new column asc.
  const changeSort = (field: LotSortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  return (
    <LotsView
      lots={state.result.lots}
      farms={farms}
      page={state.result.page}
      pages={state.result.pages}
      total={state.result.total}
      filterOptions={filterOptions}
      location={location}
      statusFilter={statusFilter}
      ageFilter={ageFilter}
      sortField={sortField}
      sortOrder={sortOrder}
      onLocation={changeLocation}
      onStatus={changeStatus}
      onAge={changeAge}
      onSort={changeSort}
      onReset={reset}
      onPage={(updater) => setPage(updater)}
      loadDetail={loadDetail}
    />
  );
}
