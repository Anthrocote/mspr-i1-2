'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LOTS } from '@/data/mock';
import type { Lot, CountryCode } from '@/types';
import Badge from '@/components/ui/Badge';
import CountryTag from '@/components/ui/CountryTag';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const row = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

type Filter = 'all' | CountryCode | 'alertes';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tous les lots' },
  { key: 'br', label: '🇧🇷 Brésil' },
  { key: 'ec', label: '🇪🇨 Équateur' },
  { key: 'co', label: '🇨🇴 Colombie' },
  { key: 'alertes', label: 'Alertes actives' },
];

function durationColor(v: string) {
  if (v === 'err') return 'text-[#9B1C1C]';
  if (v === 'warn') return 'text-[#B45309]';
  return 'text-[#443524]';
}

export default function LotsPage() {
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  const selectedLot = LOTS.find((l) => l.id === selectedLotId) ?? null;

  const filtered = LOTS.filter((l) => {
    if (filter === 'all') return true;
    if (filter === 'alertes') return l.statusVariant !== 'ok';
    return l.countryCode === filter;
  });

  if (selectedLot) {
    return <LotDetail lot={selectedLot} onBack={() => setSelectedLotId(null)} />;
  }

  return (
    <div className="max-w-[1320px]">
      {/* Filter bar */}
      <div className="flex items-center gap-[10px] flex-wrap mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`inline-flex items-center gap-1.5 py-[7px] px-[14px] rounded-full text-xs font-semibold cursor-pointer transition-colors ${
              filter === f.key
                ? 'bg-[#2C1A0A] text-[#FAF4EC]'
                : 'bg-[#FFFCF8] text-[#7A5235] border border-[#E8D9C4] hover:bg-[#F5EDE0]'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto flex gap-[10px]">
          <button className="inline-flex items-center gap-[7px] py-[9px] px-4 rounded-full text-[13px] font-semibold bg-[#F5EDE0] text-[#5C3A1E] border border-[#E8D9C4] cursor-pointer hover:bg-[#EDE0D0]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filtrer
          </button>
          <button className="inline-flex items-center gap-[7px] py-[9px] px-[18px] rounded-full text-[13px] font-semibold bg-[#2C1A0A] text-[#FAF4EC] border-none cursor-pointer shadow-[0_4px_20px_rgba(44,26,10,.20)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nouveau Lot
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1.5fr_1fr_1.1fr_1fr_.8fr_1fr_.7fr] gap-0 py-[14px] px-6 bg-[#FAF4EC] border-b border-[#E8D9C4]">
          {['ID Lot', 'Pays', 'Entrepôt', 'Stocké le', 'Durée', 'Statut', ''].map((h) => (
            <div key={h} className="text-[11px] font-semibold text-[#A08060] uppercase tracking-wide">
              {h}
            </div>
          ))}
        </div>
        {/* Rows */}
        <motion.div variants={container} initial="hidden" animate="show">
          <AnimatePresence mode="popLayout">
            {filtered.map((l) => (
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
                    {l.flag} {l.country}
                  </CountryTag>
                </div>
                <div className="text-[13px] text-[#443524]">{l.warehouse}</div>
                <div className="text-[13px] text-[#443524]">{l.storageDate}</div>
                <div className={`text-[13px] font-semibold ${durationColor(l.durationVariant)}`}>
                  {l.duration}
                </div>
                <div>
                  <Badge variant={l.statusVariant}>{l.status}</Badge>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-[#1E5220]">Voir →</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

/* ── Lot Detail ── */
function LotDetail({ lot, onBack }: { lot: Lot; onBack: () => void }) {
  return (
    <motion.div
      className="max-w-[1100px]"
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
        Retour aux lots
      </button>

      <div className="grid grid-cols-[1.4fr_1fr] gap-[18px] items-start">
        {/* Left – info */}
        <div className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl shadow-sm overflow-hidden">
          {/* Dark header */}
          <div className="bg-[#2C1A0A] py-6 px-7 flex items-center justify-between">
            <div>
              <div className="font-mono text-[13px] font-bold text-[#DFC0A0] tracking-wide">{lot.id}</div>
              <div className="font-display text-[26px] font-semibold text-[#FAF4EC] mt-1">{lot.warehouse}</div>
            </div>
            <Badge variant={lot.statusVariant}>{lot.status}</Badge>
          </div>
          {/* Body */}
          <div className="p-7">
            <div className="grid grid-cols-2 gap-[18px] mb-6">
              <DetailField label="Pays / Exploitation" value={`${lot.flag} ${lot.country}`} />
              <DetailField label="Date de stockage" value={lot.storageDate} />
              <DetailField
                label="Durée en stock"
                value={lot.duration}
                valueColor={lot.durationVariant === 'err' ? '#9B1C1C' : lot.durationVariant === 'warn' ? '#B45309' : '#1E0F06'}
                bold
              />
              <DetailField label="Entrepôt" value={lot.warehouse} />
            </div>
            <div className="h-px bg-[#F0E6D8] mb-6" />
            <div className="text-[11px] font-semibold text-[#A08060] uppercase tracking-widest mb-[14px]">
              Conditions actuelles (IoT)
            </div>
            <div className="grid grid-cols-2 gap-[14px]">
              <div className="border border-[#E8D9C4] rounded-[13px] p-[18px] text-center bg-[#FDF9F4]">
                <div className="text-[11px] font-semibold text-[#A08060] uppercase tracking-wide mb-1.5">Température</div>
                <div className="font-display text-[34px] font-bold text-[#1E0F06] leading-none">{lot.temp}</div>
                <div className="text-[11px] text-[#A08060] mt-1.5">Idéal : {lot.idealTemp}</div>
              </div>
              <div className="border border-[#E8D9C4] rounded-[13px] p-[18px] text-center bg-[#FDF9F4]">
                <div className="text-[11px] font-semibold text-[#A08060] uppercase tracking-wide mb-1.5">Humidité</div>
                <div className="font-display text-[34px] font-bold text-[#1E0F06] leading-none">{lot.hum}</div>
                <div className="text-[11px] text-[#A08060] mt-1.5">Idéal : {lot.idealHum}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right – timeline + actions */}
        <div className="flex flex-col gap-[18px]">
          {/* Timeline */}
          <div className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl p-6 shadow-sm">
            <h3 className="font-display text-[19px] font-semibold text-[#1E0F06] mb-[18px]">Traçabilité FIFO</h3>
            <div className="flex flex-col">
              <TimelineStep color="#2E7D32" title="Récolté" desc={`Exploitation · ${lot.country}`} hasLine />
              <TimelineStep color="#2E7D32" title="Stocké" desc={`${lot.warehouse} · ${lot.storageDate}`} hasLine />
              <TimelineStep color="#C49A78" title="Surveillance en cours" desc={`${lot.duration} en stock`} hasLine={false} />
            </div>
          </div>
          {/* Actions */}
          <div className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl p-[22px] shadow-sm flex flex-col gap-[10px]">
            <button className="w-full inline-flex items-center justify-center gap-2 py-[11px] rounded-full text-[13px] font-semibold bg-[#1E5220] text-white border-none cursor-pointer shadow-[0_4px_16px_rgba(46,125,50,.22)]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Valider conforme
            </button>
            <button className="w-full inline-flex items-center justify-center gap-2 py-[11px] rounded-full text-[13px] font-semibold bg-[#F5EDE0] text-[#5C3A1E] border border-[#E8D9C4] cursor-pointer">
              Marquer en transit
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
