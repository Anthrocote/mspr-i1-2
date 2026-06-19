'use client';

import { motion } from 'framer-motion';

const BARS = [
  { label: '🇧🇷 Brésil',   value: 118, pct: 88, gradient: 'linear-gradient(to top, #2C1A0A, #7A5235)' },
  { label: '🇪🇨 Équateur', value: 72,  pct: 54, gradient: 'linear-gradient(to top, #B45309, #D97706)' },
  { label: '🇨🇴 Colombie', value: 58,  pct: 44, gradient: 'linear-gradient(to top, #5C3A1E, #A0714F)' },
];

export default function BarChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-parchment-0 border border-parchment-400 rounded-[18px] p-6"
      style={{ boxShadow: '0 2px 8px rgba(44,26,10,.08)' }}
    >
      <div className="font-display text-xl font-semibold text-espresso-900 mb-1">Lots par Pays</div>
      <div className="text-xs text-parchment-700 mb-[22px]">Répartition du stock actif</div>
      <div className="flex items-end gap-[26px] h-[170px] px-[10px]">
        {BARS.map((bar, i) => (
          <div key={bar.label} className="flex-1 flex flex-col items-center gap-[10px] h-full justify-end">
            <div className="text-[13px] font-bold text-espresso-900">{bar.value}</div>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${bar.pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 + i * 0.1 }}
              className="w-full rounded-t-lg"
              style={{ background: bar.gradient }}
            />
            <div className="text-xs text-parchment-700">{bar.label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
