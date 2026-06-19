'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LOTS } from '@/data/mock';
import type { Lot, CountryCode } from '@/types';
import Badge from '@/components/ui/Badge';
import CountryTag from '@/components/ui/CountryTag';
import { useLanguage } from '@/contexts/LanguageContext';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const row = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

type Filter = 'all' | CountryCode | 'alertes';
type SortField = 'id' | 'country' | 'warehouse' | 'storageDate' | 'durationDays' | 'status';
type SortOrder = 'asc' | 'desc';

const FILTERS: { key: Filter }[] = [
  { key: 'all' },
  { key: 'br' },
  { key: 'ec' },
  { key: 'co' },
  { key: 'alertes' },
];

function durationColor(v: string) {
  if (v === 'err') return 'text-[#9B1C1C]';
  if (v === 'warn') return 'text-[#B45309]';
  return 'text-[#443524]';
}

export default function LotsPage() {
  const { t } = useLanguage();
  const [lotsList, setLotsList] = useState<Lot[]>(LOTS);
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  // Advanced Filtering States
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Creation Modal State
  const [showAddLotModal, setShowAddLotModal] = useState(false);

  // Sorting States
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const selectedLot = lotsList.find((l) => l.id === selectedLotId) ?? null;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filtered = lotsList.filter((l) => {
    // 1. Quick Filters (Country / Alert indicator)
    if (filter !== 'all') {
      if (filter === 'alertes') {
        if (l.statusVariant === 'ok') return false;
      } else if (l.countryCode !== filter) {
        return false;
      }
    }
    // 2. Warehouse Filter
    if (warehouseFilter !== 'all' && l.warehouse !== warehouseFilter) return false;
    // 3. Status Filter
    if (statusFilter !== 'all' && l.statusVariant !== statusFilter) return false;

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;

    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (sortField === 'storageDate') {
      aVal = a.durationDays;
      bVal = b.durationDays;
      return sortOrder === 'asc' ? bVal - aVal : aVal - bVal;
    }

    if (typeof aVal === 'string') {
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    if (typeof aVal === 'number') {
      return sortOrder === 'asc'
        ? aVal - bVal
        : bVal - aVal;
    }

    return 0;
  });

  if (selectedLot) {
    return <LotDetail lot={selectedLot} onBack={() => setSelectedLotId(null)} />;
  }

  return (
    <div className="max-w-[1320px] mx-auto w-full">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-[10px] mb-5">
        <div className="flex items-center gap-[6px] sm:gap-[10px] flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1.5 py-[7px] px-[12px] sm:px-[14px] rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                filter === f.key
                  ? 'bg-[#2C1A0A] text-[#FAF4EC]'
                  : 'bg-[#FFFCF8] text-[#7A5235] border border-[#E8D9C4] hover:bg-[#F5EDE0]'
              }`}
            >
              {t('filter_' + f.key)}
            </button>
          ))}
        </div>
        <div className="flex gap-[10px] w-full sm:w-auto sm:ml-auto justify-between sm:justify-start relative">
          <button
            onClick={() => {
              setShowFilterMenu(!showFilterMenu);
              setShowAddLotModal(false);
            }}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-[7px] py-[9px] px-4 rounded-full text-[13px] font-semibold border cursor-pointer transition-colors ${
              showFilterMenu
                ? 'bg-[#2C1A0A] text-[#FAF4EC] border-transparent shadow-[0_2px_8px_rgba(44,26,10,.15)]'
                : 'bg-[#F5EDE0] text-[#5C3A1E] border-[#E8D9C4] hover:bg-[#EDE0D0]'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            {t('filter')}
          </button>

          {/* Filter Popover Menu */}
          {showFilterMenu && (
            <div className="absolute right-0 top-12 z-30 bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl p-5 shadow-lg min-w-[280px] flex flex-col gap-4 text-left">
              <div>
                <h4 className="text-xs font-bold text-[#A08060] uppercase tracking-wider mb-2">{t('warehouse')}</h4>
                <select
                  value={warehouseFilter}
                  onChange={(e) => setWarehouseFilter(e.target.value)}
                  className="w-full border-[1.5px] border-[#E8D9C4] rounded-[10px] py-2 px-3 text-[13px] text-[#1E0F06] bg-[#FDF9F4] outline-none focus:border-[#A0714F] transition-colors"
                >
                  <option value="all">{t('all_warehouses')}</option>
                  <option value="São Paulo A">🇧🇷 São Paulo A</option>
                  <option value="Rio C">🇧🇷 Rio C</option>
                  <option value="Quito B">🇪🇨 Quito B</option>
                  <option value="Guayaquil A">🇪🇨 Guayaquil A</option>
                  <option value="Bogotá C">🇨🇴 Bogotá C</option>
                  <option value="Medellín D">🇨🇴 Medellín D</option>
                </select>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#A08060] uppercase tracking-wider mb-2">{t('status')}</h4>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border-[1.5px] border-[#E8D9C4] rounded-[10px] py-2 px-3 text-[13px] text-[#1E0F06] bg-[#FDF9F4] outline-none focus:border-[#A0714F] transition-colors"
                >
                  <option value="all">{t('all_statuses')}</option>
                  <option value="ok">{t('status_ok')}</option>
                  <option value="warn">{t('status_warn')}</option>
                  <option value="err">{t('status_err')}</option>
                </select>
              </div>

              {(warehouseFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setWarehouseFilter('all');
                    setStatusFilter('all');
                  }}
                  className="text-xs font-semibold text-[#9B1C1C] hover:underline text-left cursor-pointer"
                >
                  {t('reset_filters')}
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => {
              setShowAddLotModal(true);
              setShowFilterMenu(false);
            }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-[7px] py-[9px] px-[18px] rounded-full text-[13px] font-semibold bg-[#2C1A0A] text-[#FAF4EC] border-none cursor-pointer shadow-[0_4px_20px_rgba(44,26,10,.20)] hover:bg-[#1E0F06]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t('new_lot')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-[850px] bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl shadow-sm overflow-hidden mx-4 sm:mx-0">
          {/* Header */}
          <div className="grid grid-cols-[1.5fr_1fr_1.1fr_1fr_.8fr_1fr_.7fr] gap-0 py-[14px] px-6 bg-[#FAF4EC] border-b border-[#E8D9C4] select-none">
            {[
              { label: t('id_lot'), field: 'id' as SortField },
              { label: t('country'), field: 'country' as SortField },
              { label: t('warehouse'), field: 'warehouse' as SortField },
              { label: t('stored_on'), field: 'storageDate' as SortField },
              { label: t('duration'), field: 'durationDays' as SortField },
              { label: t('status'), field: 'status' as SortField },
              { label: '', field: null }
            ].map((h, i) => {
              if (!h.field) {
                return <div key={i} />;
              }
              const isSorted = sortField === h.field;
              return (
                <button
                  key={i}
                  onClick={() => handleSort(h.field!)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#A08060] uppercase tracking-wide hover:text-[#5C3A1E] transition-colors cursor-pointer text-left outline-none border-none bg-transparent"
                >
                  {h.label}
                  {isSorted && (
                    <span className="text-[9px] text-[#A0714F]">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Rows */}
          <motion.div variants={container} initial="hidden" animate="show">
            <AnimatePresence mode="popLayout">
              {sorted.map((l) => (
                <motion.div
                  key={l.id}
                  variants={row}
                  exit={{ opacity: 0, height: 0 }}
                  layout
                  onClick={() => setSelectedLotId(l.id)}
                  className="grid grid-cols-[1.5fr_1fr_1.1fr_1fr_.8fr_1fr_.7fr] gap-0 items-center py-[15px] px-6 border-b border-[#F0E6D8] cursor-pointer hover:bg-[#FAF4EC] transition-colors"
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
                  <div className="text-[13px] text-[#443524]">{l.storageDate}</div>
                  <div className={`text-[13px] font-semibold ${durationColor(l.durationVariant)}`}>
                    {l.duration}
                  </div>
                  <div>
                    <Badge variant={l.statusVariant}>{t('status_' + l.statusVariant)}</Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-[#1E5220]">{t('see')}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Creation Modal - Nouveau Lot */}
      <AnimatePresence>
        {showAddLotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowAddLotModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Modal sheet card dialog */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-10 w-full max-w-md bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-[#2C1A0A] p-5 py-4 flex items-center justify-between text-[#FAF4EC]">
                <h3 className="font-display text-lg font-semibold">{t('add_new_lot')}</h3>
                <button
                  onClick={() => setShowAddLotModal(false)}
                  className="p-1 rounded-md text-espresso-300 hover:text-parchment-100 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Form component */}
              <AddLotForm
                onAdd={(newLot) => {
                  setLotsList([newLot, ...lotsList]);
                  setShowAddLotModal(false);
                }}
                onCancel={() => setShowAddLotModal(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Lot Detail ── */
function LotDetail({ lot, onBack }: { lot: Lot; onBack: () => void }) {
  const { t } = useLanguage();
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
              <DetailField label={`${t('country')} / Exploitation`} value={`${lot.flag} ${t(lot.countryCode)}`} />
              <DetailField label={t('stored_on')} value={lot.storageDate} />
              <DetailField
                label="Durée en stock"
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

        {/* Right – timeline + actions */}
        <div className="flex flex-col gap-[18px]">
          {/* Timeline */}
          <div className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl p-6 shadow-sm">
            <h3 className="font-display text-[19px] font-semibold text-[#1E0F06] mb-[18px]">{t('fifo_traceability')}</h3>
            <div className="flex flex-col">
              <TimelineStep color="#2E7D32" title={t('harvested')} desc={`Exploitation · ${t(lot.countryCode)}`} hasLine />
              <TimelineStep color="#2E7D32" title={t('stored')} desc={`${lot.warehouse} · ${lot.storageDate}`} hasLine />
              <TimelineStep color="#C49A78" title={t('monitoring_ongoing')} desc={`${lot.duration} en stock`} hasLine={false} />
            </div>
          </div>
          {/* Actions */}
          <div className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl p-[22px] shadow-sm flex flex-col gap-[10px]">
            <button className="w-full inline-flex items-center justify-center gap-2 py-[11px] rounded-full text-[13px] font-semibold bg-[#1E5220] text-white border-none cursor-pointer shadow-[0_4px_16px_rgba(46,125,50,.22)]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {t('validate_conforming')}
            </button>
            <button className="w-full inline-flex items-center justify-center gap-2 py-[11px] rounded-full text-[13px] font-semibold bg-[#F5EDE0] text-[#5C3A1E] border border-[#E8D9C4] cursor-pointer">
              {t('mark_in_transit')}
            </button>
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

// ── Form and Mock Data for New Lot Creation ──

const WAREHOUSES_BY_COUNTRY = {
  br: [
    { name: 'São Paulo A', temp: '29°C', hum: '55%' },
    { name: 'Rio C', temp: '27°C', hum: '58%' }
  ],
  ec: [
    { name: 'Quito B', temp: '31°C', hum: '60%' },
    { name: 'Guayaquil A', temp: '30°C', hum: '64%' }
  ],
  co: [
    { name: 'Bogotá C', temp: '26°C', hum: '82%' },
    { name: 'Medellín D', temp: '25°C', hum: '78%' }
  ]
};

const COUNTRY_NAMES = {
  br: { name: 'br', flag: '🇧🇷' },
  ec: { name: 'ec', flag: '🇪🇨' },
  co: { name: 'co', flag: '🇨🇴' }
};

interface AddLotFormProps {
  onAdd: (newLot: Lot) => void;
  onCancel: () => void;
}

function AddLotForm({ onAdd, onCancel }: AddLotFormProps) {
  const { t } = useLanguage();
  const [countryCode, setCountryCode] = useState<'br' | 'ec' | 'co'>('br');
  const [warehouse, setWarehouse] = useState('São Paulo A');
  const [temp, setTemp] = useState('29');
  const [hum, setHum] = useState('55');

  const handleCountryChange = (cc: 'br' | 'ec' | 'co') => {
    setCountryCode(cc);
    const whs = WAREHOUSES_BY_COUNTRY[cc];
    setWarehouse(whs[0].name);
    setTemp(whs[0].temp.replace('°C', ''));
    setHum(whs[0].hum.replace('%', ''));
  };

  const handleWarehouseChange = (whName: string) => {
    setWarehouse(whName);
    const whs = WAREHOUSES_BY_COUNTRY[countryCode];
    const match = whs.find(w => w.name === whName);
    if (match) {
      setTemp(match.temp.replace('°C', ''));
      setHum(match.hum.replace('%', ''));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cInfo = COUNTRY_NAMES[countryCode];
    const rand = Math.floor(100 + Math.random() * 900);
    const id = `LOT-${countryCode.toUpperCase()}-2026-00${rand}`;

    let idealTemp = '29°C ±3';
    let idealHum = '55% ±2';
    if (countryCode === 'ec') {
      idealTemp = '31°C ±3';
      idealHum = '60% ±3';
    } else if (countryCode === 'co') {
      idealTemp = '26°C ±3';
      idealHum = '80% ±3';
    }

    const newLot: Lot = {
      id,
      countryCode,
      country: t(cInfo.name),
      flag: cInfo.flag,
      warehouse,
      storageDate: '19 juin 2026',
      duration: '0 j',
      durationDays: 0,
      status: t('status_ok'),
      statusVariant: 'ok',
      durationVariant: '',
      temp: `${temp}°C`,
      hum: `${hum}%`,
      idealTemp,
      idealHum
    };

    onAdd(newLot);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-left">
      <div>
        <label className="block text-[11px] font-semibold text-[#A08060] uppercase tracking-wider mb-1.5">
          {t('origin_country')}
        </label>
        <select
          value={countryCode}
          onChange={(e) => handleCountryChange(e.target.value as any)}
          className="w-full border-[1.5px] border-[#E8D9C4] rounded-[10px] py-2 px-3 text-[13px] text-[#1E0F06] bg-[#FDF9F4] outline-none focus:border-[#A0714F] transition-colors"
        >
          <option value="br">🇧🇷 {t('br')}</option>
          <option value="ec">🇪🇨 {t('ec')}</option>
          <option value="co">🇨🇴 {t('co')}</option>
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-[#A08060] uppercase tracking-wider mb-1.5">
          {t('storage_warehouse')}
        </label>
        <select
          value={warehouse}
          onChange={(e) => handleWarehouseChange(e.target.value)}
          className="w-full border-[1.5px] border-[#E8D9C4] rounded-[10px] py-2 px-3 text-[13px] text-[#1E0F06] bg-[#FDF9F4] outline-none focus:border-[#A0714F] transition-colors"
        >
          {WAREHOUSES_BY_COUNTRY[countryCode].map((w) => (
            <option key={w.name} value={w.name}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-[#A08060] uppercase tracking-wider mb-1.5">
            {t('temperature')} (°C)
          </label>
          <input
            type="number"
            value={temp}
            onChange={(e) => setTemp(e.target.value)}
            required
            className="w-full border-[1.5px] border-[#E8D9C4] rounded-[10px] py-2 px-3 text-[13px] text-[#1E0F06] bg-[#FDF9F4] outline-none focus:border-[#A0714F] transition-colors"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-[#A08060] uppercase tracking-wider mb-1.5">
            {t('humidity')} (%)
          </label>
          <input
            type="number"
            value={hum}
            onChange={(e) => setHum(e.target.value)}
            required
            className="w-full border-[1.5px] border-[#E8D9C4] rounded-[10px] py-2 px-3 text-[13px] text-[#1E0F06] bg-[#FDF9F4] outline-none focus:border-[#A0714F] transition-colors"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="py-2 px-4 rounded-full text-xs font-semibold bg-[#F5EDE0] text-[#5C3A1E] border border-[#E8D9C4] cursor-pointer hover:bg-[#EDE0D0]"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          className="py-2 px-5 rounded-full text-xs font-semibold bg-[#2C1A0A] text-[#FAF4EC] border-none cursor-pointer hover:bg-[#1E0F06]"
        >
          {t('add_lot_btn')}
        </button>
      </div>
    </form>
  );
}
