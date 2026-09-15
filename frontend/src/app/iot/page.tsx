'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { WAREHOUSES } from '@/data/mock';
import type { CountryCode } from '@/types';
import Badge from '@/components/ui/Badge';
import ConditionChart from '@/components/charts/ConditionChart';
import { warehouseSeries, type TimeRange } from '@/lib/series';
import { warehouseStatus, warehouseExceptions } from '@/lib/dashboard';
import { useLanguage } from '@/contexts/LanguageContext';

const RANGES: { key: TimeRange; label: string }[] = [
  { key: '24h', label: '24 h' },
  { key: '7j', label: '7 j' },
  { key: '30j', label: '30 j' },
];

const COUNTRY_ORDER: CountryCode[] = ['br', 'ec', 'co'];

// Default to the warehouse with the worst derived deviation.
const firstAtRisk = warehouseExceptions(WAREHOUSES)[0]?.warehouse ?? WAREHOUSES[0];

export default function IoTPage() {
  const { t } = useLanguage();
  const [selectedId, setSelectedId] = useState<string>(firstAtRisk.id);
  const [range, setRange] = useState<TimeRange>('24h');

  const groups = COUNTRY_ORDER.map((code) => ({
    code,
    flag: WAREHOUSES.find((w) => w.countryCode === code)?.flag ?? '',
    items: WAREHOUSES.filter((w) => w.countryCode === code),
  }));

  const selected = WAREHOUSES.find((w) => w.id === selectedId) ?? WAREHOUSES[0];
  const selectedStatus = warehouseStatus(selected);
  const tempSeries = warehouseSeries(selected, 'temp', range);
  const humSeries = warehouseSeries(selected, 'hum', range);

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
            value={selectedId}
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
