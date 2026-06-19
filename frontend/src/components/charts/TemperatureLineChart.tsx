'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface TemperatureLineChartProps {
  title?: string;
  subtitle?: string;
}

export default function TemperatureLineChart({ title, subtitle }: TemperatureLineChartProps) {
  const { t } = useLanguage();
  const resolvedTitle = title ?? t('temp_history');
  const resolvedSubtitle = subtitle ?? t('temp_subtitle');
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-parchment-0 border border-parchment-400 rounded-[18px] p-6"
      style={{ boxShadow: '0 2px 8px rgba(44,26,10,.08)' }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-display text-xl font-semibold text-espresso-900">{resolvedTitle}</div>
          <div className="text-xs text-parchment-700">{resolvedSubtitle}</div>
        </div>
        <div className="flex gap-[7px]">
          <span className="text-xs font-semibold py-1.5 px-[13px] rounded-full bg-parchment-100 text-espresso-500 border border-parchment-400 cursor-pointer hover:bg-parchment-200 transition-colors">24h</span>
          <span className="text-xs font-semibold py-1.5 px-[13px] rounded-full bg-espresso-800 text-parchment-100 cursor-pointer">7j</span>
          <span className="text-xs font-semibold py-1.5 px-[13px] rounded-full bg-parchment-100 text-espresso-500 border border-parchment-400 cursor-pointer hover:bg-parchment-200 transition-colors">30j</span>
        </div>
      </div>
      <svg width="100%" height="180" viewBox="0 0 620 180" preserveAspectRatio="none" className="block overflow-visible">
        <defs>
          <linearGradient id="tempArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2C1A0A" stopOpacity=".16"/>
            <stop offset="100%" stopColor="#2C1A0A" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <rect x="0" y="46" width="620" height="62" fill="#EDF7EE"/>
        <line x1="0" y1="77" x2="620" y2="77" stroke="#A5D6A7" strokeWidth="1.5" strokeDasharray="6 4"/>
        <polygon points="0,92 88,86 176,80 264,74 352,104 440,128 528,98 620,82 620,180 0,180" fill="url(#tempArea)"/>
        <motion.polyline
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          points="0,92 88,86 176,80 264,74 352,104 440,128 528,98 620,82"
          fill="none"
          stroke="#2C1A0A"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx="440" cy="128" r="5" fill="#9B1C1C" stroke="#fff" strokeWidth="2"/>
        <text x="440" y="120" textAnchor="middle" style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fill: '#9B1C1C', fontWeight: 700 }}>34°C</text>
        <text x="6" y="50" style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fill: '#A0714F' }}>32°</text>
        <text x="6" y="112" style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fill: '#A0714F' }}>26°</text>
      </svg>
      <div className="flex justify-between mt-2">
        {[t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')].map(d => (
          <span key={d} className="text-[11px] text-parchment-700">{d}</span>
        ))}
      </div>
    </motion.div>
  );
}
