'use client';

import { motion } from 'framer-motion';

export default function DonutChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-parchment-0 border border-parchment-400 rounded-[18px] p-6"
      style={{ boxShadow: '0 2px 8px rgba(44,26,10,.08)' }}
    >
      <div className="font-display text-xl font-semibold text-espresso-900 mb-1.5">Statut des Lots</div>
      <div className="text-xs text-parchment-700 mb-[18px]">Répartition globale</div>
      <div className="flex items-center gap-[22px]">
        <svg width="128" height="128" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="36" fill="none" stroke="#E8D9C4" strokeWidth="16"/>
          <motion.circle
            initial={{ strokeDashoffset: 226 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            cx="50" cy="50" r="36" fill="none" stroke="#2C1A0A" strokeWidth="16"
            strokeDasharray="226" transform="rotate(-90 50 50)"
          />
          <circle cx="50" cy="50" r="36" fill="none" stroke="#B45309" strokeWidth="16"
            strokeDasharray="226" strokeDashoffset="158" transform="rotate(-90 50 50)"/>
          <circle cx="50" cy="50" r="36" fill="none" stroke="#9B1C1C" strokeWidth="16"
            strokeDasharray="226" strokeDashoffset="211" transform="rotate(-90 50 50)"/>
          <text x="50" y="48" textAnchor="middle" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 700, fill: '#1E0F06' }}>70%</text>
          <text x="50" y="61" textAnchor="middle" style={{ fontFamily: 'var(--font-body)', fontSize: '7px', fill: '#A0714F' }}>conformes</text>
        </svg>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-[9px] text-[13px] text-neutral-700">
            <span className="w-[11px] h-[11px] rounded-[3px] bg-espresso-800" />
            Conforme · <b className="text-espresso-900">174</b>
          </div>
          <div className="flex items-center gap-[9px] text-[13px] text-neutral-700">
            <span className="w-[11px] h-[11px] rounded-[3px] bg-[#B45309]" />
            En alerte · <b className="text-espresso-900">72</b>
          </div>
          <div className="flex items-center gap-[9px] text-[13px] text-neutral-700">
            <span className="w-[11px] h-[11px] rounded-[3px] bg-[#9B1C1C]" />
            Périmé · <b className="text-espresso-900">2</b>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
