'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { WAREHOUSES, DASHBOARD_ALERTS } from '@/data/mock';
import Badge from '@/components/ui/Badge';
import MetricCard from '@/components/ui/MetricCard';
import TemperatureLineChart from '@/components/charts/TemperatureLineChart';
import DonutChart from '@/components/charts/DonutChart';
import { useLanguage } from '@/contexts/LanguageContext';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export default function DashboardPage() {
  const { t } = useLanguage();
  const topWarehouses = WAREHOUSES.slice(0, 4);

  return (
    <motion.div
      className="flex flex-col gap-[22px] max-w-[1320px] mx-auto w-full"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Metric row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px]">
        <motion.div variants={item}>
          <MetricCard
            label={t('total_lots')}
            value="248"
            trend={t('trend_lots')}
            trendColor="#8ED492"
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
            label={t('in_alert')}
            value="7"
            valueColor="text-[#B45309]"
            trend={t('trend_alert')}
            trendColor="#9B1C1C"
            variant="alert"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            }
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label={t('expired_lots')}
            value="2"
            valueColor="text-[#9B1C1C]"
            trend={t('trend_fifo_delay')}
            trendColor="#A08060"
            variant="light"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9B1C1C" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label={t('in_transit')}
            value="14"
            trend={t('trend_transit')}
            trendColor="#8ED492"
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
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-[18px]">
        <motion.div variants={item}>
          <TemperatureLineChart />
        </motion.div>
        <motion.div variants={item}>
          <DonutChart />
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[18px]">
        {/* Warehouses */}
        <motion.div variants={item} className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-[18px]">
            <h3 className="font-display text-xl font-semibold text-[#1E0F06]">{t('monitored_warehouses')}</h3>
            <Link href="/iot" className="text-xs text-[#1E5220] font-semibold hover:underline">{t('see_all')}</Link>
          </div>
          <div className="flex flex-col gap-[11px]">
            {topWarehouses.map((w) => (
              <div key={w.id} className="flex items-center gap-[14px] p-3 px-[14px] border border-[#F0E6D8] rounded-[13px] bg-[#FDF9F4]">
                <div className="w-[38px] h-[38px] rounded-[10px] bg-[#F5EDE0] flex items-center justify-center text-[17px] shrink-0">
                  {w.flag}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#1E0F06]">{w.name}</div>
                  <div className="text-xs text-[#A08060]">{w.lots} {t('lots_count')} · {t(w.countryCode)}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-base font-bold leading-none" style={{ color: w.statusVariant === 'err' ? '#9B1C1C' : w.statusVariant === 'warn' ? '#B45309' : '#1E0F06' }}>
                     {w.temp}
                  </div>
                  <div className="text-[11px] text-[#A08060]">{w.hum} {t('hum_abbrev').toLowerCase()}.</div>
                </div>
                <Badge variant={w.statusVariant}>{t(w.statusVariant === 'ok' ? 'status_ok' : w.statusVariant === 'warn' ? 'status_warn' : 'status_err')}</Badge>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent alerts */}
        <motion.div variants={item} className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-[18px]">
            <h3 className="font-display text-xl font-semibold text-[#1E0F06]">{t('recent_alerts')}</h3>
            <Link href="/alertes" className="text-xs text-[#1E5220] font-semibold hover:underline">{t('see_all_alerts')}</Link>
          </div>
          <div className="flex flex-col gap-[11px]">
            {DASHBOARD_ALERTS.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-[13px] px-[15px] rounded-xl" style={{ background: a.bgColor, borderLeft: `4px solid ${a.borderColor}` }}>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-[#1E0F06]">{a.title}</div>
                  <div className="text-xs text-[#6B5540] mt-0.5">{a.description}</div>
                </div>
                <span className="text-[11px] text-[#A08060] whitespace-nowrap">{a.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
