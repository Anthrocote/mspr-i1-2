'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Alert, StatusDistribution, Warehouse } from '@/types';
import { warehouseExceptions, sortAlertsBySeverity } from '@/lib/dashboard';
import MetricCard from '@/components/ui/MetricCard';
import ConformityBar from '@/components/dashboard/ConformityBar';
import WarehouseWatchlist from '@/components/dashboard/WarehouseWatchlist';
import { useLanguage } from '@/contexts/LanguageContext';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

// How many alerts the dashboard previews before the "+N" link takes over.
const ALERT_PREVIEW = 4;

export interface DashboardViewProps {
  totalLots: number;
  // The siège has no "in transit" concept yet; the container passes null and we
  // render 0 (no lot known to be in transit) rather than a placeholder.
  enTransit: number | null;
  distribution: StatusDistribution;
  warehouses: Warehouse[];
  alerts: Alert[];
}

// Pure presentation. Takes already-adapted presentation data so it can be
// tested with the mock fixtures and reused regardless of the data source.
export default function DashboardView({
  totalLots,
  enTransit,
  distribution,
  warehouses,
  alerts,
}: DashboardViewProps) {
  const { t } = useLanguage();
  const exceptions = warehouseExceptions(warehouses);
  const sortedAlerts = sortAlertsBySeverity(alerts);
  const criticalCount = alerts.filter((a) => a.severity === 'critique').length;
  const shownAlerts = sortedAlerts.slice(0, ALERT_PREVIEW);
  const moreAlerts = sortedAlerts.length - shownAlerts.length;

  return (
    <motion.div
      className="flex flex-col gap-[22px] max-w-[1320px] mx-auto w-full"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Headline: volume/logistics KPIs + the single conformity representation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px]">
        <motion.div variants={item}>
          <MetricCard
            label={t('total_lots')}
            value={String(totalLots)}
            variant="dark"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DFC0A0" strokeWidth="2">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              </svg>
            }
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label={t('in_transit')}
            value={String(enTransit ?? 0)}
            variant="green"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            }
          />
        </motion.div>
        <motion.div variants={item} className="sm:col-span-2">
          <ConformityBar distribution={distribution} />
        </motion.div>
      </div>

      {/* Live conditions to act on */}
      <motion.div variants={item}>
        <WarehouseWatchlist exceptions={exceptions} />
      </motion.div>

      {/* Recent alerts, most severe first */}
      <motion.div variants={item} className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-[18px]">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-xl font-semibold text-[#1E0F06]">{t('recent_alerts')}</h3>
            <span className="inline-flex items-center rounded-full bg-[#FEF2F2] border border-[#FCA5A5] px-[10px] py-[3px] text-[11px] font-semibold text-[#9B1C1C]">
              {sortedAlerts.length} {t('alerts_label')}{criticalCount > 0 ? ` · ${criticalCount} ${t('critical_label')}` : ''}
            </span>
          </div>
          <Link href="/alertes" className="text-xs text-[#1E5220] font-semibold hover:underline">{t('see_all_alerts')}</Link>
        </div>
        <div className="flex flex-col gap-[11px]">
          {shownAlerts.map((a) => (
            <div key={a.id} className="flex items-start gap-3 py-[13px] px-[15px] rounded-xl" style={{ background: a.bgColor, borderLeft: `4px solid ${a.borderColor}` }}>
              <span className="text-base leading-none mt-0.5">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[#1E0F06]">{a.title}</div>
                <div className="text-xs text-[#6B5540] mt-0.5">{a.description}</div>
              </div>
              <span className="text-[11px] text-[#A08060] whitespace-nowrap self-center">{a.time}</span>
            </div>
          ))}
        </div>
        {moreAlerts > 0 && (
          <Link href="/alertes" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1E5220] hover:underline">
            +{moreAlerts} {t('more_alerts')}
          </Link>
        )}
      </motion.div>
    </motion.div>
  );
}
