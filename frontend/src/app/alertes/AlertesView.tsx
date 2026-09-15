'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Alert } from '@/types';
import type { AlertStatusFilter } from '@/lib/api/queries';
import Badge from '@/components/ui/Badge';
import { useLanguage } from '@/contexts/LanguageContext';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const row = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

const STATUS_OPTIONS: { value: AlertStatusFilter; key: string }[] = [
  { value: 'all', key: 'alert_status_all' },
  { value: 'active', key: 'alert_status_active' },
  { value: 'resolved', key: 'alert_status_resolved' },
];

const GRID = 'grid-cols-[1.6fr_1.3fr_1.2fr_0.9fr_1.2fr]';

// Pure presentation for the alert history table. Filtering, sorting (newest
// first) and pagination all happen on the siège, so this component only renders
// the current page and reports filter/page intent upward — nothing is capped or
// re-sorted client-side.
export interface AlertesViewProps {
  alerts: Alert[];
  page: number;
  pages: number;
  total: number;
  status: AlertStatusFilter;
  from: string; // yyyy-mm-dd (empty = no bound)
  to: string; // yyyy-mm-dd (empty = no bound)
  onStatus: (v: AlertStatusFilter) => void;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onReset: () => void;
  onPage: (updater: (p: number) => number) => void;
}

export default function AlertesView({
  alerts,
  page,
  pages,
  total,
  status,
  from,
  to,
  onStatus,
  onFrom,
  onTo,
  onReset,
  onPage,
}: AlertesViewProps) {
  const { t } = useLanguage();
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const activeFilters =
    (status !== 'all' ? 1 : 0) + (from !== '' ? 1 : 0) + (to !== '' ? 1 : 0);

  // Close the filter popover on outside click or Escape.
  useEffect(() => {
    if (!showFilterMenu) return;
    const onPointer = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilterMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowFilterMenu(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [showFilterMenu]);

  return (
    <div className="max-w-[1320px] mx-auto w-full">
      {/* Filter bar */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="text-[13px] text-[#A08060]">
          {total} {t('alerts_label')}
        </div>
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilterMenu((v) => !v)}
            className={`inline-flex items-center justify-center gap-[7px] py-[9px] px-4 rounded-full text-[13px] font-semibold border cursor-pointer transition-colors ${
              showFilterMenu || activeFilters > 0
                ? 'bg-[#2C1A0A] text-[#FAF4EC] border-transparent shadow-[0_2px_8px_rgba(44,26,10,.15)]'
                : 'bg-[#F5EDE0] text-[#5C3A1E] border-[#E8D9C4] hover:bg-[#EDE0D0]'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            {t('filter')}
            {activeFilters > 0 && (
              <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-[#FAF4EC] text-[#2C1A0A] text-[10px] font-bold px-1">
                {activeFilters}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showFilterMenu && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 z-30 bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl p-5 shadow-lg min-w-[280px] flex flex-col gap-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#A08060] uppercase tracking-wider">{t('filters_title')}</h4>
                  <button
                    onClick={() => setShowFilterMenu(false)}
                    aria-label={t('close_filters')}
                    className="p-1 -mr-1 rounded-md text-[#A08060] hover:text-[#5C3A1E] hover:bg-[#F5EDE0] transition-colors cursor-pointer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#A08060] uppercase tracking-wider mb-2">{t('status')}</h4>
                  <select
                    value={status}
                    onChange={(e) => onStatus(e.target.value as AlertStatusFilter)}
                    className="w-full border-[1.5px] border-[#E8D9C4] rounded-[10px] py-2 px-3 text-[13px] text-[#1E0F06] bg-[#FDF9F4] outline-none focus:border-[#A0714F] transition-colors"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{t(o.key)}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-[#A08060] uppercase tracking-wider mb-2">{t('date_from')}</h4>
                    <input
                      type="date"
                      value={from}
                      max={to || undefined}
                      onChange={(e) => onFrom(e.target.value)}
                      className="w-full border-[1.5px] border-[#E8D9C4] rounded-[10px] py-2 px-3 text-[13px] text-[#1E0F06] bg-[#FDF9F4] outline-none focus:border-[#A0714F] transition-colors"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-[#A08060] uppercase tracking-wider mb-2">{t('date_to')}</h4>
                    <input
                      type="date"
                      value={to}
                      min={from || undefined}
                      onChange={(e) => onTo(e.target.value)}
                      className="w-full border-[1.5px] border-[#E8D9C4] rounded-[10px] py-2 px-3 text-[13px] text-[#1E0F06] bg-[#FDF9F4] outline-none focus:border-[#A0714F] transition-colors"
                    />
                  </div>
                </div>

                {activeFilters > 0 && (
                  <button
                    onClick={onReset}
                    className="text-xs font-semibold text-[#9B1C1C] hover:underline text-left cursor-pointer"
                  >
                    {t('reset_filters')}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-[900px] bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl shadow-sm overflow-hidden mx-4 sm:mx-0">
          {/* Header */}
          <div className={`grid ${GRID} gap-0 py-[14px] px-6 bg-[#FAF4EC] border-b border-[#E8D9C4] select-none`}>
            {[t('alert_type'), t('alert_subject'), t('triggered_at'), t('status'), t('resolved_at')].map((label, i) => (
              <div key={i} className="text-[11px] font-semibold text-[#A08060] uppercase tracking-wide">{label}</div>
            ))}
          </div>
          {/* Rows */}
          <motion.div key={`${status}-${from}-${to}-${page}`} variants={container} initial="hidden" animate="show">
            {alerts.map((a) => (
              <motion.div
                key={a.id}
                variants={row}
                className={`grid ${GRID} gap-0 items-center py-[15px] px-6 border-b border-[#F0E6D8]`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[15px] shrink-0">{a.icon}</span>
                  <span className="text-[13px] font-semibold text-[#1E0F06] truncate">{t('alert_type_' + a.type)}</span>
                </div>
                <div className="text-[13px] text-[#443524] truncate">{a.subject}</div>
                <div className="text-[13px] text-[#443524]">{a.dateTime}</div>
                <div>
                  <Badge variant={a.status === 'resolved' ? 'ok' : 'warn'}>
                    {t(a.status === 'resolved' ? 'status_resolved' : 'status_active')}
                  </Badge>
                </div>
                <div className="text-[13px] text-[#A08060]">{a.resolvedDateTime ?? '—'}</div>
              </motion.div>
            ))}
            {alerts.length === 0 && (
              <div className="py-12 text-center text-sm text-[#A08060]">{t('no_alerts_match')}</div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-xs text-[#A08060]">{t('page_word')} {page} / {pages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => onPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="py-[7px] px-4 rounded-full text-xs font-semibold bg-[#F5EDE0] text-[#5C3A1E] border border-[#E8D9C4] cursor-pointer hover:bg-[#EDE0D0] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('prev_page')}
            </button>
            <button
              onClick={() => onPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="py-[7px] px-4 rounded-full text-xs font-semibold bg-[#F5EDE0] text-[#5C3A1E] border border-[#E8D9C4] cursor-pointer hover:bg-[#EDE0D0] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('next_page')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
