'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Deviation, WarehouseException } from '@/lib/dashboard';
import { useLanguage } from '@/contexts/LanguageContext';

interface WarehouseWatchlistProps {
  exceptions: WarehouseException[];
}

function severityColor(dev: Deviation): string {
  if (!dev.atRisk) return '#1E0F06';
  return dev.ratio >= 1.5 ? '#9B1C1C' : '#B45309';
}

function deltaLabel(dev: Deviation, unit: string): string {
  const delta = Math.round(dev.value - dev.ideal);
  return `${delta > 0 ? '+' : ''}${delta}${unit}`;
}

function Reading({ label, dev, unit, display, vsIdeal, within }: {
  label: string;
  dev: Deviation;
  unit: string;
  display: string;
  vsIdeal: string;
  within: string;
}) {
  return (
    <div className="text-right w-[96px]">
      <div className="text-[10px] font-semibold uppercase tracking-[.08em] text-parchment-700">{label}</div>
      <div className="font-mono text-base font-bold leading-tight" style={{ color: severityColor(dev) }}>{display}</div>
      {dev.atRisk ? (
        <div className="text-[11px] font-semibold" style={{ color: severityColor(dev) }}>{deltaLabel(dev, unit)} {vsIdeal}</div>
      ) : (
        <div className="text-[11px] text-parchment-700">{within}</div>
      )}
    </div>
  );
}

export default function WarehouseWatchlist({ exceptions }: WarehouseWatchlistProps) {
  const { t } = useLanguage();
  const hasExceptions = exceptions.length > 0;

  return (
    <div className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-[18px]">
        <div>
          <h3 className="font-display text-xl font-semibold text-[#1E0F06]">{t('watchlist_title')}</h3>
          <div className="text-xs text-parchment-700 mt-0.5">
            {hasExceptions ? t('watchlist_sub') : t('watchlist_sub_ok')}
          </div>
        </div>
        <Link href="/iot" className="text-xs text-[#1E5220] font-semibold hover:underline whitespace-nowrap">{t('see_all')}</Link>
      </div>

      {!hasExceptions ? (
        <div className="flex items-center gap-3 py-6 text-sm text-[#2E7D32]">
          <span className="text-lg">✓</span>
          {t('watchlist_all_ok')}
        </div>
      ) : (
        <div className="flex flex-col gap-[11px]">
          {exceptions.map((e, i) => (
            <motion.div
              key={e.warehouse.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              className="flex items-center gap-[14px] p-3 px-[14px] border border-[#F0E6D8] rounded-[13px] bg-[#FDF9F4]"
            >
              <div className="w-[38px] h-[38px] rounded-[10px] bg-[#F5EDE0] flex items-center justify-center text-[17px] shrink-0">
                {e.warehouse.flag}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[#1E0F06] truncate">{e.warehouse.name}</div>
                <div className="text-xs text-[#A08060]">{e.warehouse.lots} {t('lots_count')} · {t(e.warehouse.countryCode)}</div>
              </div>
              <Reading label={t('temperature')} dev={e.temp} unit="°C" display={e.warehouse.temp} vsIdeal={t('vs_ideal')} within={t('within_threshold')} />
              <Reading label={t('humidity')} dev={e.hum} unit="%" display={e.warehouse.hum} vsIdeal={t('vs_ideal')} within={t('within_threshold')} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
