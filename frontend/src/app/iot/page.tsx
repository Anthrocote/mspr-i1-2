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

// The warehouses are instrumented in real time, so the page polls for fresh
// readings instead of relying on a manual reload.
const REFRESH_MS = 5000;

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

  // Clear the chart when switching warehouse or window, so a stale series is not
  // shown while the new one loads (a poll tick, in contrast, refreshes in place).
  // Done during render via the "adjust state on change" pattern rather than an
  // effect, so it applies before paint without a synchronous setState in effect.
  const seriesKey = `${selectedId ?? ''}-${range}`;
  const [prevSeriesKey, setPrevSeriesKey] = useState(seriesKey);
  if (seriesKey !== prevSeriesKey) {
    setPrevSeriesKey(seriesKey);
    setMeasurements([]);
  }

  // Poll tick: drives a periodic refetch so new readings show without a reload.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((value) => value + 1), REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  // Warehouse conditions (selector + current reading/status), refetched on each
  // poll tick. The selection is preserved; a poll failure never downgrades an
  // already-loaded page to the error state.
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
        setState((current) => (current.status === 'ready' ? current : { status: 'error' }));
      });
    return () => controller.abort();
  }, [tick]);

  // Measurements for the selected warehouse + window. Refetched on selection,
  // window, or poll tick change.
  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    const from = new Date(Date.now() - RANGE_MS[range]).toISOString();
    fetchWarehouseMeasurements(apiClient, selectedId, { from }, { signal: controller.signal })
      .then(setMeasurements)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        // Leave the series as-is; the chart keeps the last good readings.
      });
    return () => controller.abort();
  }, [selectedId, range, tick]);

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
  const sensorOffline = !!selected.sensorStatus && selected.sensorStatus !== 'online';
  const tempBand = bandCenter(selected.tempRange);
  const humBand = bandCenter(selected.humRange);
  const tempSeries = buildConditionSeries(measurements, 'temp', tempBand.ideal, tempBand.tolerance);
  const humSeries = buildConditionSeries(measurements, 'hum', humBand.ideal, humBand.tolerance);

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
          {sensorOffline ? (
            // A silent/errored sensor makes the last reading stale, so the
            // condition badge would be misleading — show the sensor state instead.
            <Badge variant="err">
              {selected.sensorStatus === 'sensor_error' ? 'Capteur en erreur' : 'Capteur hors ligne'}
            </Badge>
          ) : (
            <Badge variant={selectedStatus}>
              {t(selectedStatus === 'ok' ? 'status_ok' : 'out_of_range')}
            </Badge>
          )}
          <span className="text-xs text-[#A08060] hidden md:inline">
            {t(selected.countryCode)} · {selected.lots} {t('lots_count')} · {t('ideal').toLowerCase()} {selected.idealTemp} · {selected.idealHum}
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
