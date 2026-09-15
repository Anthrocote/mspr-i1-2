'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Alert } from '@/types';
import { apiClient } from '@/lib/api/client';
import { fetchRecentAlerts } from '@/lib/api/queries';
import Badge from '@/components/ui/Badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSearch } from '@/contexts/SearchContext';

type AlertFilter = 'all' | 'critique' | 'alerte';

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; alerts: Alert[] };

// Read-only consolidation view: the siège consults alerts fetched from the API;
// treatment happens at the local (country) tier, so there is no per-alert action
// here. Counts and filters are derived from the real alerts.
export default function AlertesPage() {
  const [filter, setFilter] = useState<AlertFilter>('all');
  const { t } = useLanguage();
  const { searchQuery } = useSearch();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    fetchRecentAlerts(apiClient, 100, { signal: controller.signal })
      .then((alerts) => setState({ status: 'ready', alerts }))
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

  const { alerts } = state;

  const filtered = alerts.filter((a) => {
    if (filter !== 'all' && a.severity !== filter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.level.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const critiques = alerts.filter((a) => a.severity === 'critique').length;
  const avertissements = alerts.filter((a) => a.severity === 'alerte').length;

  return (
    <div className="max-w-[920px] mx-auto w-full flex flex-col gap-[14px]">
      {/* Filter chips */}
      <div className="flex gap-[10px] mb-1.5 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`inline-flex items-center gap-1.5 py-[7px] px-[14px] rounded-full text-xs font-semibold cursor-pointer transition-colors ${
            filter === 'all'
              ? 'bg-[#2C1A0A] text-[#FAF4EC]'
              : 'bg-[#FFFCF8] text-[#7A5235] border border-[#E8D9C4] hover:bg-[#F5EDE0]'
          }`}
        >
          {t('all')} · {alerts.length}
        </button>
        <button
          onClick={() => setFilter('critique')}
          className={`inline-flex items-center gap-1.5 py-[7px] px-[14px] rounded-full text-xs font-medium cursor-pointer transition-colors ${
            filter === 'critique'
              ? 'bg-[#FEF2F2] text-[#9B1C1C] border border-[#FCA5A5]'
              : 'bg-[#FFFCF8] text-[#9B1C1C] border border-[#FCA5A5] hover:bg-[#FEF2F2]'
          }`}
        >
          {t('critical')} · {critiques}
        </button>
        <button
          onClick={() => setFilter('alerte')}
          className={`inline-flex items-center gap-1.5 py-[7px] px-[14px] rounded-full text-xs font-medium cursor-pointer transition-colors ${
            filter === 'alerte'
              ? 'bg-[#FEF3E2] text-[#B45309] border border-[#F6CC7A]'
              : 'bg-[#FFFCF8] text-[#B45309] border border-[#F6CC7A] hover:bg-[#FEF3E2]'
          }`}
        >
          {t('warnings')} · {avertissements}
        </button>
      </div>

      {/* Alert list */}
      <AnimatePresence mode="popLayout">
        {filtered.map((a) => (
          <motion.div
            key={a.id}
            variants={item}
            initial="hidden"
            animate="show"
            exit="exit"
            layout
            className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-[13px] p-4 px-5 flex flex-col sm:flex-row items-start gap-[14px] shadow-[0_2px_8px_rgba(44,26,10,.06)]"
            style={{ borderLeft: `4px solid ${a.borderColor}` }}
          >
            <div className="flex items-start gap-[14px] flex-1 w-full">
              <div
                className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center shrink-0 text-[15px]"
                style={{ background: a.bgColor }}
              >
                {a.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-[10px]">
                  <div className="text-sm font-semibold text-[#1E0F06]">{a.title}</div>
                  <Badge variant={a.variant}>{a.level}</Badge>
                </div>
                <div className="text-[13px] text-[#6B5540] mt-[3px]">{a.description}</div>
              </div>
            </div>
            <div className="text-[11px] text-[#A08060] shrink-0 w-full sm:w-auto sm:text-right border-t border-dashed border-[#E8D9C4] sm:border-none pt-2 sm:pt-0">
              {a.time}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
