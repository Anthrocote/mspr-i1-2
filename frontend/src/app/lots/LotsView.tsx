'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Farm, Lot, WarehouseStay } from '@/types';
import type { ApiLotStatus } from '@/lib/api/types';
import type {
  LotAgeFilter,
  LotFilterOptions,
  LotSortField,
  SortOrder,
} from '@/lib/api/queries';
import { formatHumidity, formatTemperature } from '@/lib/api/adapters';
import Badge from '@/components/ui/Badge';
import CountryTag from '@/components/ui/CountryTag';
import { useLanguage } from '@/contexts/LanguageContext';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const rowVariant = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

export type LotStatusFilter = 'all' | ApiLotStatus;
export type LotAgeChoice = 'all' | LotAgeFilter;

const STATUS_OPTIONS: { value: LotStatusFilter; key: string }[] = [
  { value: 'all', key: 'all_statuses' },
  { value: 'compliant', key: 'status_ok' },
  { value: 'in_alert', key: 'status_warn' },
  { value: 'expired', key: 'status_err' },
];

const AGE_OPTIONS: { value: LotAgeChoice; key: string }[] = [
  { value: 'all', key: 'age_all' },
  { value: 'lt90', key: 'age_lt90' },
  { value: '90_180', key: 'age_90_180' },
  { value: '180_365', key: 'age_180_365' },
  { value: 'gt365', key: 'age_gt365' },
];

const GRID = 'grid-cols-[1.5fr_1fr_1.1fr_1fr_.8fr_1fr_.7fr]';

function durationColor(v: string) {
  if (v === 'err') return 'text-[#9B1C1C]';
  if (v === 'warn') return 'text-[#B45309]';
  return 'text-[#443524]';
}

// Detail enrichment fetched lazily when a lot is opened. In production the
// container wires this to `fetchLotDetail`; view tests can omit it, in which
// case the row's own data is shown as-is.
export interface LotDetailExtras {
  stays: WarehouseStay[];
  temp?: number;
  hum?: number;
}

export interface LotsViewProps {
  lots: Lot[];
  farms: Farm[];
  page: number;
  pages: number;
  total: number;
  filterOptions: LotFilterOptions;
  // Filter/sort state (owned by the container so the server query is the single
  // source of truth).
  location: string; // 'all' | `country:${id}` | `wh:${uuid}`
  statusFilter: LotStatusFilter;
  ageFilter: LotAgeChoice;
  sortField: LotSortField | null;
  sortOrder: SortOrder;
  onLocation: (v: string) => void;
  onStatus: (v: LotStatusFilter) => void;
  onAge: (v: LotAgeChoice) => void;
  onSort: (field: LotSortField) => void;
  onReset: () => void;
  onPage: (updater: (p: number) => number) => void;
  loadDetail?: (lot: Lot) => Promise<LotDetailExtras>;
}

// Pure presentation for the lots table + read-only detail. Filtering, sorting
// and pagination are performed by the siège; this component renders the current
// page and reports filter/sort/page intent upward. The detail (stay history +
// current conditions) is still fetched lazily when a row is opened.
export default function LotsView({
  lots,
  farms,
  page,
  pages,
  total,
  filterOptions,
  location,
  statusFilter,
  ageFilter,
  sortField,
  sortOrder,
  onLocation,
  onStatus,
  onAge,
  onSort,
  onReset,
  onPage,
  loadDetail,
}: LotsViewProps) {
  const { t } = useLanguage();
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [detailExtras, setDetailExtras] = useState<LotDetailExtras | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

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

  const selectedLot = selectedLotId ? lots.find((l) => l.id === selectedLotId) ?? null : null;

  // Fetch the stay history + current conditions when a lot is opened. Guarded so
  // a late response for a previously-selected lot can't overwrite the view.
  useEffect(() => {
    setDetailExtras(null);
    if (!selectedLot || !loadDetail) return;
    let active = true;
    loadDetail(selectedLot)
      .then((extras) => {
        if (active) setDetailExtras(extras);
      })
      .catch(() => {
        // Keep the base lot rendered; the detail simply stays unenriched.
      });
    return () => {
      active = false;
    };
  }, [selectedLot, loadDetail]);

  const activeFilters =
    (location !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (ageFilter !== 'all' ? 1 : 0);

  if (selectedLot) {
    const mergedLot: Lot = {
      ...selectedLot,
      stays: detailExtras?.stays ?? selectedLot.stays,
      temp: detailExtras?.temp != null ? formatTemperature(detailExtras.temp) : selectedLot.temp,
      hum: detailExtras?.hum != null ? formatHumidity(detailExtras.hum) : selectedLot.hum,
    };
    return <LotDetail lot={mergedLot} farms={farms} onBack={() => setSelectedLotId(null)} />;
  }

  const headers: { label: string; field: LotSortField | null }[] = [
    { label: t('id_lot'), field: 'id' },
    { label: t('country'), field: 'country' },
    { label: t('warehouse'), field: 'warehouse' },
    { label: t('constituted_on'), field: null },
    { label: t('duration'), field: 'duration' },
    { label: t('status'), field: 'status' },
    { label: '', field: null },
  ];

  return (
    <div className="max-w-[1320px] mx-auto w-full">
      {/* Filter bar */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="text-[13px] text-[#A08060]">
          {total} {t('lots_count')}
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

                <FilterSelect label={t('location')} value={location} onChange={onLocation}>
                  <option value="all">{t('all_locations')}</option>
                  {filterOptions.countries.map((c) => (
                    <optgroup key={c.id} label={`${c.flag} ${c.name}`}>
                      <option value={`country:${c.id}`}>{c.name} {t('location_all_suffix')}</option>
                      {filterOptions.warehouses
                        .filter((w) => w.countryId === c.id)
                        .map((w) => (
                          <option key={w.id} value={`wh:${w.id}`}>{w.name}</option>
                        ))}
                    </optgroup>
                  ))}
                </FilterSelect>

                <FilterSelect label={t('status')} value={statusFilter} onChange={(v) => onStatus(v as LotStatusFilter)}>
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{t(o.key)}</option>
                  ))}
                </FilterSelect>

                <FilterSelect label={t('age')} value={ageFilter} onChange={(v) => onAge(v as LotAgeChoice)}>
                  {AGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{t(o.key)}</option>
                  ))}
                </FilterSelect>

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
        <div className="min-w-[850px] bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl shadow-sm overflow-hidden mx-4 sm:mx-0">
          {/* Header */}
          <div className={`grid ${GRID} gap-0 py-[14px] px-6 bg-[#FAF4EC] border-b border-[#E8D9C4] select-none`}>
            {headers.map((h, i) => {
              if (!h.field) return <div key={i} className="text-[11px] font-semibold text-[#A08060] uppercase tracking-wide">{h.label}</div>;
              const isSorted = sortField === h.field;
              return (
                <button
                  key={i}
                  onClick={() => onSort(h.field!)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#A08060] uppercase tracking-wide hover:text-[#5C3A1E] transition-colors cursor-pointer text-left outline-none border-none bg-transparent"
                >
                  {h.label}
                  {isSorted && <span className="text-[9px] text-[#A0714F]">{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                </button>
              );
            })}
          </div>
          {/* Rows */}
          <motion.div key={`${location}-${statusFilter}-${ageFilter}-${sortField}-${sortOrder}-${page}`} variants={container} initial="hidden" animate="show">
            {lots.map((l) => (
              <motion.div
                key={l.id}
                variants={rowVariant}
                onClick={() => setSelectedLotId(l.id)}
                className={`grid ${GRID} gap-0 items-center py-[15px] px-6 border-b border-[#F0E6D8] cursor-pointer hover:bg-[#FAF4EC] transition-colors`}
              >
                <div>
                  <span className="font-mono text-xs font-bold text-[#3D2610] bg-[#F5EDE0] py-[3px] px-2 rounded border border-[#E8D9C4]">
                    {l.id}
                  </span>
                </div>
                <div>
                  <CountryTag countryCode={l.countryCode}>
                    {l.flag} {t(l.countryCode)}
                  </CountryTag>
                </div>
                <div className="text-[13px] text-[#443524]">{l.warehouse}</div>
                <div className="text-[13px] text-[#443524]">{l.constitutedAt}</div>
                <div className={`text-[13px] font-semibold ${durationColor(l.durationVariant)}`}>{l.duration}</div>
                <div>
                  <Badge variant={l.statusVariant}>{t('status_' + l.statusVariant)}</Badge>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-[#1E5220]">{t('see')}</span>
                </div>
              </motion.div>
            ))}
            {lots.length === 0 && (
              <div className="py-12 text-center text-sm text-[#A08060]">{t('no_lots_match')}</div>
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

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-[#A08060] uppercase tracking-wider mb-2">{label}</h4>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-[1.5px] border-[#E8D9C4] rounded-[10px] py-2 px-3 text-[13px] text-[#1E0F06] bg-[#FDF9F4] outline-none focus:border-[#A0714F] transition-colors"
      >
        {children}
      </select>
    </div>
  );
}

/* ── Lot Detail (read-only) ── */
function LotDetail({ lot, farms, onBack }: { lot: Lot; farms: Farm[]; onBack: () => void }) {
  const { t } = useLanguage();
  const exploitation = farms.find((e) => e.id === lot.exploitationId);
  return (
    <motion.div
      className="max-w-[1100px] mx-auto w-full"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' as const }}
    >
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 py-2 px-4 rounded-full text-[13px] font-semibold bg-[#F5EDE0] text-[#5C3A1E] border border-[#E8D9C4] cursor-pointer hover:bg-[#EDE0D0] mb-5"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        {t('back_to_lots')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-[18px] items-start">
        {/* Left – info */}
        <div className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl shadow-sm overflow-hidden">
          {/* Dark header */}
          <div className="bg-[#2C1A0A] py-6 px-7 flex items-center justify-between">
            <div>
              <div className="font-mono text-[13px] font-bold text-[#DFC0A0] tracking-wide">{lot.id}</div>
              <div className="font-display text-[26px] font-semibold text-[#FAF4EC] mt-1">{lot.warehouse}</div>
            </div>
            <Badge variant={lot.statusVariant}>{t('status_' + lot.statusVariant)}</Badge>
          </div>
          {/* Body */}
          <div className="p-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px] mb-6">
              <DetailField label={t('exploitation')} value={exploitation ? `${exploitation.flag} ${exploitation.name}` : `${lot.flag} ${t(lot.countryCode)}`} />
              <DetailField label={t('constituted_on')} value={lot.constitutedAt} />
              <DetailField
                label={t('duration_in_stock')}
                value={lot.duration}
                valueColor={lot.durationVariant === 'err' ? '#9B1C1C' : lot.durationVariant === 'warn' ? '#B45309' : '#1E0F06'}
                bold
              />
              <DetailField label={t('warehouse')} value={lot.warehouse} />
            </div>
            <div className="h-px bg-[#F0E6D8] mb-6" />
            <div className="text-[11px] font-semibold text-[#A08060] uppercase tracking-widest mb-[14px]">
              {t('current_conditions')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
              <div className="border border-[#E8D9C4] rounded-[13px] p-[18px] text-center bg-[#FDF9F4]">
                <div className="text-[11px] font-semibold text-[#A08060] uppercase tracking-wide mb-1.5">{t('temperature')}</div>
                <div className="font-mono text-[28px] font-bold text-[#1E0F06] leading-none">{lot.temp}</div>
                <div className="text-[11px] text-[#A08060] mt-1.5">{t('ideal')} : {lot.idealTemp}</div>
              </div>
              <div className="border border-[#E8D9C4] rounded-[13px] p-[18px] text-center bg-[#FDF9F4]">
                <div className="text-[11px] font-semibold text-[#A08060] uppercase tracking-wide mb-1.5">{t('humidity')}</div>
                <div className="font-mono text-[28px] font-bold text-[#1E0F06] leading-none">{lot.hum}</div>
                <div className="text-[11px] text-[#A08060] mt-1.5">{t('ideal')} : {lot.idealHum}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right – traceability timeline with the warehouse-stay history (read-only) */}
        <div className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl p-6 shadow-sm">
          <h3 className="font-display text-[19px] font-semibold text-[#1E0F06] mb-[18px]">{t('lot_journey')}</h3>
          <div className="flex flex-col">
            <TimelineStep color="#2E7D32" title={t('constituted_step')} desc={`${t(lot.countryCode)} · ${lot.constitutedAt}`} hasLine />
            {lot.stays.map((s, i) => (
              <TimelineStep
                key={`${s.warehouse}-${i}`}
                color={s.sortie ? '#A0714F' : '#B45309'}
                title={`${t('stored_step')} · ${s.warehouse}`}
                desc={`${s.entree} → ${s.sortie ?? t('in_progress')}`}
                hasLine={i < lot.stays.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DetailField({ label, value, valueColor, bold }: { label: string; value: string; valueColor?: string; bold?: boolean }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-[#A08060] uppercase tracking-wide mb-[5px]">{label}</div>
      <div className={`text-[15px] ${bold ? 'font-semibold' : 'font-medium'} text-[#1E0F06]`} style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </div>
    </div>
  );
}

function TimelineStep({ color, title, desc, hasLine }: { color: string; title: string; desc: string; hasLine: boolean }) {
  return (
    <div className="flex gap-[13px]">
      <div className="flex flex-col items-center">
        <div className="w-[11px] h-[11px] rounded-full" style={{ background: color }} />
        {hasLine && <div className="w-[2px] flex-1 bg-[#E8D9C4]" />}
      </div>
      <div className={hasLine ? 'pb-[18px]' : ''}>
        <div className="text-[13px] font-semibold text-[#1E0F06]">{title}</div>
        <div className="text-xs text-[#A08060]">{desc}</div>
      </div>
    </div>
  );
}
