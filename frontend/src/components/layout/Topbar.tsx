'use client';

import { motion } from 'framer-motion';

interface TopbarProps {
  title: string;
  subtitle: string;
  onMenuClick: () => void;
}

export default function Topbar({ title, subtitle, onMenuClick }: TopbarProps) {
  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="sticky top-0 z-20 border-b border-parchment-400 py-3 sm:py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sm:gap-6"
      style={{ background: 'rgba(253,249,244,.88)', backdropFilter: 'blur(10px)' }}
    >
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg text-espresso-900 hover:bg-parchment-200 lg:hidden transition-colors cursor-pointer"
          aria-label="Ouvrir le menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div>
          <h1 className="font-display text-[20px] sm:text-[25px] font-bold text-espresso-900 leading-[1.05]">{title}</h1>
          <p className="text-[10px] sm:text-xs text-parchment-700 mt-[1px]">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search - Hidden on small mobile */}
        <label className="hidden sm:flex items-center gap-[9px] bg-parchment-100 border-[1.5px] border-parchment-400 rounded-full py-[7px] sm:py-[9px] px-3 sm:px-4 text-parchment-700 text-[13px] w-auto sm:w-[180px] md:w-[240px] cursor-text">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            placeholder="Rechercher…"
            className="border-none bg-transparent outline-none font-[inherit] text-[13px] text-espresso-900 w-full placeholder:text-parchment-700"
          />
        </label>

        {/* Notification bell */}
        <button className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-[11px] bg-parchment-100 border border-parchment-400 flex items-center justify-center text-espresso-600 hover:bg-parchment-200 transition-colors cursor-pointer">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          <span className="absolute top-1.5 sm:top-2 right-[7px] sm:right-[9px] w-[6px] h-[6px] sm:w-[7px] sm:h-[7px] bg-[#9B1C1C] rounded-full border-2 border-parchment-50" />
        </button>

        {/* User */}
        <div className="flex items-center gap-[6px] sm:gap-[10px] pl-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-parchment-100 font-bold text-[13px] border-2 border-parchment-50 shrink-0" style={{ background: 'linear-gradient(135deg, #3D2610, #A0714F)' }}>
            MJ
          </div>
          <div className="leading-[1.2] hidden md:block">
            <div className="text-[13px] font-semibold text-espresso-900">Marina Joaquim</div>
            <div className="text-[11px] text-parchment-700">Responsable Qualité</div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
