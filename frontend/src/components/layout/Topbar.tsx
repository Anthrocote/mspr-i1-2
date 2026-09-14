'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Language } from '@/translations';
import { useSearch } from '@/contexts/SearchContext';

interface TopbarProps {
  title: string;
  subtitle: string;
  onMenuClick: () => void;
}

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
];

export default function Topbar({ title, subtitle, onMenuClick }: TopbarProps) {
  const { t, language, setLanguage } = useLanguage();
  const { searchQuery, setSearchQuery } = useSearch();
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
          aria-label={t('open_menu')}
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
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-none bg-transparent outline-none font-[inherit] text-[13px] text-espresso-900 w-full placeholder:text-parchment-700"
          />
        </label>

        {/* Language switcher */}
        <select
          aria-label={t('language')}
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="bg-parchment-100 border-[1.5px] border-parchment-400 rounded-full py-[7px] sm:py-[9px] px-3 text-[13px] font-semibold text-espresso-900 outline-none focus:border-[#A0714F] cursor-pointer"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
      </div>
    </motion.header>
  );
}
