'use client';

import { motion } from 'framer-motion';

interface GaugeChartProps {
  value: number | string;
  unit?: string;
  label: string;
  ideal: string;
  isOk: boolean;
  color?: string;
  fillOffset?: number;
}

export default function GaugeChart({ value, unit = '', label, ideal, isOk, color, fillOffset }: GaugeChartProps) {
  const fillColor = color || (isOk ? '#2E7D32' : '#9B1C1C');
  const statusText = isOk ? '✓ Conforme' : '⚠ Hors plage';
  const statusColor = isOk ? '#2E7D32' : '#9B1C1C';
  const valueColor = isOk ? '#1E0F06' : '#9B1C1C';
  const displayValue = typeof value === 'number' ? `${value}${unit}` : value;
  const offset = fillOffset ?? (isOk ? 113 : 74);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-parchment-0 border border-parchment-400 rounded-[18px] p-6 text-center"
      style={{ boxShadow: '0 2px 8px rgba(44,26,10,.08)' }}
    >
      <div className="text-xs font-semibold text-parchment-700 uppercase tracking-[.08em] mb-[14px]">{label}</div>
      <svg width="190" height="116" viewBox="0 0 180 110" className="mx-auto overflow-visible block">
        <path d="M18 95 A72 72 0 0 1 162 95" fill="none" stroke="#E8D9C4" strokeWidth="14" strokeLinecap="round"/>
        <path d="M18 95 A72 72 0 0 1 162 95" fill="none" stroke="#C1EAC3" strokeWidth="14" strokeLinecap="round" strokeDasharray="226" strokeDashoffset="68"/>
        <motion.path
          initial={{ strokeDashoffset: 226 }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' as const, delay: 0.2 }}
          d="M18 95 A72 72 0 0 1 162 95" fill="none" stroke={fillColor} strokeWidth="14" strokeLinecap="round" strokeDasharray="226"
        />
        <text x="90" y="84" textAnchor="middle" style={{ fontFamily: 'var(--font-body)', fontSize: '28px', fontWeight: 700, fill: valueColor }}>{displayValue}</text>
      </svg>
      <div className="mt-2 text-xs text-parchment-700">
        {ideal} · <span style={{ color: statusColor }} className="font-semibold">{statusText}</span>
      </div>
    </motion.div>
  );
}
