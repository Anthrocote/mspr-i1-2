'use client';

import { motion } from 'framer-motion';

interface TopbarProps {
  title: string;
  subtitle: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="sticky top-0 z-20 border-b border-parchment-400 py-4 px-8 flex items-center justify-between gap-6"
      style={{ background: 'rgba(253,249,244,.88)', backdropFilter: 'blur(10px)' }}
    >
      <div>
        <h1 className="font-display text-[25px] font-bold text-espresso-900 leading-[1.05]">{title}</h1>
        <p className="text-xs text-parchment-700 mt-[1px]">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <label className="flex items-center gap-[9px] bg-parchment-100 border-[1.5px] border-parchment-400 rounded-full py-[9px] px-4 text-parchment-700 text-[13px] min-w-[240px] cursor-text">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            placeholder="Rechercher un lot, un entrepôt…"
            className="border-none bg-transparent outline-none font-[inherit] text-[13px] text-espresso-900 w-full placeholder:text-parchment-700"
          />
        </label>

        {/* Notification bell */}
        <button className="relative w-10 h-10 rounded-[11px] bg-parchment-100 border border-parchment-400 flex items-center justify-center text-espresso-600 hover:bg-parchment-200 transition-colors">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          <span className="absolute top-2 right-[9px] w-[7px] h-[7px] bg-[#9B1C1C] rounded-full border-2 border-parchment-50" />
        </button>

        {/* User */}
        <div className="flex items-center gap-[10px] pl-1.5">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-parchment-100 font-bold text-[13px] border-2 border-parchment-50" style={{ background: 'linear-gradient(135deg, #3D2610, #A0714F)' }}>
            MJ
          </div>
          <div className="leading-[1.2]">
            <div className="text-[13px] font-semibold text-espresso-900">Marina Joaquim</div>
            <div className="text-[11px] text-parchment-700">Responsable Qualité</div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
