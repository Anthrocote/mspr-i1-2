'use client';

import { motion } from 'framer-motion';
import type { StatusDistribution } from '@/types';
import { conformityRate } from '@/lib/dashboard';
import { useLanguage } from '@/contexts/LanguageContext';

interface ConformityBarProps {
  distribution: StatusDistribution;
}

const SEGMENTS: { key: keyof StatusDistribution; labelKey: string; color: string }[] = [
  { key: 'conforme', labelKey: 'status_ok', color: '#2C1A0A' },
  { key: 'alerte', labelKey: 'in_alert_chart', color: '#B45309' },
  { key: 'perime', labelKey: 'expired_chart', color: '#9B1C1C' },
];

// Single home for the lot conformity split. Replaces the donut and the two
// per-status KPI tiles, so conformity is stated once and derived from data.
export default function ConformityBar({ distribution }: ConformityBarProps) {
  const { t } = useLanguage();
  const total = distribution.conforme + distribution.alerte + distribution.perime;
  const rate = conformityRate(distribution);

  return (
    <div
      className="h-full bg-parchment-0 border border-parchment-400 rounded-[18px] px-6 py-[22px] flex flex-col justify-between gap-3"
      style={{ boxShadow: '0 2px 8px rgba(44,26,10,.08)' }}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[.08em] text-parchment-700">{t('lots_status')}</span>
        <span className="text-sm text-parchment-700">
          <b className="font-mono text-lg text-espresso-900">{rate}%</b> {t('compliant')}
        </span>
      </div>

      <div className="flex h-[10px] rounded-full overflow-hidden bg-parchment-200">
        {SEGMENTS.map((seg) => {
          const pct = total === 0 ? 0 : (distribution[seg.key] / total) * 100;
          return (
            <motion.div
              key={seg.key}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
              style={{ backgroundColor: seg.color }}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {SEGMENTS.map((seg) => (
          <div key={seg.key} className="flex items-center gap-[7px] text-[12px] text-neutral-700">
            <span className="w-[10px] h-[10px] rounded-[3px]" style={{ backgroundColor: seg.color }} />
            {t(seg.labelKey)} · <b className="font-mono text-espresso-900">{distribution[seg.key]}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
