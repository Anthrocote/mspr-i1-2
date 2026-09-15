'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { CountryCode, Warehouse } from '@/types';
import { apiClient } from '@/lib/api/client';
import { fetchWarehouseConditions, fetchWarehouseMeasurements } from '@/lib/api/queries';
import type { ApiMeasurement } from '@/lib/api/types';
import Badge from '@/components/ui/Badge';
import ConditionChart from '@/components/charts/ConditionChart';
import { buildConditionSeries, type TimeRange } from '@/lib/series';
import { warehouseStatus, warehouseExceptions } from '@/lib/dashboard';
import { useLanguage } from '@/contexts/LanguageContext';

const RANGES: { key: TimeRange; label: string }[] = [
  { key: '24h', label: '24 h' },
  { key: '7j', label: '7 j' },
  { key: '30j', label: '30 j' },
];

const COUNTRY_ORDER: CountryCode[] = ['br', 'ec', 'co'];

const DAY_MS = 24 * 60 * 60 * 1000;
const RANGE_MS: Record<TimeRange, number> = {
  '24h': DAY_MS,
  '7j': 7 * DAY_MS,
  '30j': 30 * DAY_MS,
};

// A warehouse's ideal/tolerance are encoded as the [min, max] tolerance band the
// adapters derive from the country thresholds: the midpoint is the ideal, half
// the span is the tolerance.
function bandCenter([min, max]: [number, number]): { ideal: number; tolerance: number } {
  return { ideal: (min + max) / 2, tolerance: (max - min) / 2 };
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; warehouses: Warehouse[] };

// Client container: fetches the warehouse conditions (grouped by country in the
// selector), then the measurements of the selected warehouse over the chosen
// window, and builds the temperature/humidity series from the real readings.
export default function IoTPage() {
  const { t } = useLanguage();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [range, setRange] = useState<TimeRange>('24h');
  const [measurements, setMeasurements] = useState<ApiMeasurement[]>([]);

  // Warehouse list, once. Default the selection to the worst derived deviation.
  useEffect(() => {
    const controller = new AbortController();
    fetchWarehouseConditions(apiClient, { signal: controller.signal })
      .then((warehouses) => {
        setState({ status: 'ready', warehouses });
        const first = warehouseExceptions(warehouses)[0]?.warehouse ?? warehouses[0];
        setSelectedId((current) => current ?? first?.id ?? null);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setState({ status: 'error' });
      });
    return () => controller.abort();
  }, []);

  // Measurements for the selected warehouse + window. Refetched on either change.
  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    const from = new Date(Date.now() - RANGE_MS[range]).toISOString();
    setMeasurements([]);
    fetchWarehouseMeasurements(apiClient, selectedId, { from }, { signal: controller.signal })
      .then(setMeasurements)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        // Leave the series empty; the chart renders a neutral in-band state.
      });
    return () => controller.abort();
  }, [selectedId, range]);

  if (state.status === 'loading') {
    return <div className="py-16 text-center text-sm text-[#A08060]">{t('loading')}</div>;
  }

  if (state.status === 'error') {
    return <div className="py-16 text-center text-sm text-[#9B1C1C]">{t('load_error')}</div>;
  }

  const { warehouses } = state;
  const selected = warehouses.find((w) => w.id === selectedId) ?? warehouses[0];

  if (!selected) {
    return <div className="py-16 text-center text-sm text-[#A08060]">{t('load_error')}</div>;
  }

  const groups = COUNTRY_ORDER.map((code) => ({
    code,
    flag: warehouses.find((w) => w.countryCode === code)?.flag ?? '',
    items: warehouses.filter((w) => w.countryCode === code),
  })).filter((g) => g.items.length > 0);

  const selectedStatus = warehouseStatus(selected);
  const tempBand = bandCenter(selected.tempRange);
  const humBand = bandCenter(selected.humRange);
  const tempSeries = buildConditionSeries(measurements, 'temp', tempBand.ideal, tempBand.tolerance, range);
  const humSeries = buildConditionSeries(measurements, 'hum', humBand.ideal, humBand.tolerance, range);

  return (
    <motion.div
      className="max-w-[1320px] mx-auto w-full flex flex-col gap-[18px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Control bar */}
      <div className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-x-4 gap-y-3 justify-between">
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <label htmlFor="wh-select" className="text-[11px] font-semibold text-[#A08060] uppercase tracking-wider">{t('warehouse')}</label>
          <select
            id="wh-select"
            value={selected.id}
            onChange={(e) => setSelectedId(e.target.value)}
            className="border-[1.5px] border-[#E8D9C4] rounded-[10px] py-2 px-3 text-[13px] font-semibold text-[#1E0F06] bg-[#FDF9F4] outline-none focus:border-[#A0714F] transition-colors cursor-pointer"
          >
            {groups.map((g) => (
              <optgroup key={g.code} label={`${g.flag} ${t(g.code)}`}>
                {g.items.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <Badge variant={selectedStatus}>
            {t(selectedStatus === 'ok' ? 'status_ok' : selectedStatus === 'warn' ? 'status_warn' : 'status_err')}
          </Badge>
          <span className="text-xs text-[#A08060] hidden md:inline">
            {selected.country} · {selected.lots} {t('lots_count')} · {t('ideal').toLowerCase()} {selected.idealTemp} · {selected.idealHum}
          </span>
        </div>
        <div className="flex gap-[7px]">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`text-xs font-semibold py-1.5 px-[13px] rounded-full cursor-pointer transition-colors ${
                range === r.key
                  ? 'bg-espresso-800 text-parchment-100'
                  : 'bg-parchment-100 text-espresso-500 border border-parchment-400 hover:bg-parchment-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <ConditionChart key={`t-${selected.id}-${range}`} title={`${t('temperature')} · ${selected.name}`} series={tempSeries} />
      <ConditionChart key={`h-${selected.id}-${range}`} title={`${t('humidity')} · ${selected.name}`} series={humSeries} />
    </motion.div>
  );
}
