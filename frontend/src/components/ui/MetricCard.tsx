'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type MetricVariant = 'dark' | 'light' | 'green' | 'alert';

export interface MetricCardProps {
  label: string;
  value: string;
  valueColor?: string;
  icon: ReactNode;
  variant?: MetricVariant;
  barGradient?: string;
}

const VARIANT_CONFIG: Record<MetricVariant, { card: string; label: string; value: string; iconBg: string }> = {
  dark: {
    card: 'bg-espresso-800 border-espresso-700',
    label: 'text-espresso-300',
    value: 'text-parchment-100',
    iconBg: 'bg-white/10',
  },
  light: {
    card: 'bg-parchment-0 border-parchment-400',
    label: 'text-parchment-700',
    value: 'text-espresso-900',
    iconBg: 'bg-parchment-200',
  },
  green: {
    card: 'border-[#2E7D32]',
    label: 'text-[#C1EAC3]',
    value: 'text-white',
    iconBg: 'bg-white/15',
  },
  alert: {
    card: 'bg-parchment-0 border-parchment-400',
    label: 'text-parchment-700',
    value: 'text-[#B45309]',
    iconBg: 'bg-[#FEF3E2]',
  },
};

export default function MetricCard({
  label,
  value,
  valueColor,
  icon,
  variant = 'light',
  barGradient = 'linear-gradient(90deg, #A0714F, #DFC0A0)',
}: MetricCardProps) {
  const cfg = VARIANT_CONFIG[variant];
  const cardBg = variant === 'green' ? 'bg-[#1E5220]' : '';
  const resolvedValueColor = valueColor || cfg.value;

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(44,26,10,.15)' }}
      className={`relative overflow-hidden rounded-[18px] p-[22px_24px] border ${cfg.card} ${cardBg}`}
      style={{
        boxShadow: variant === 'dark'
          ? '0 4px 20px rgba(44,26,10,.20)'
          : variant === 'green'
            ? '0 4px 16px rgba(46,125,50,.22)'
            : '0 2px 8px rgba(44,26,10,.08)',
      }}
    >
      <div className={`absolute top-5 right-5 w-[38px] h-[38px] rounded-[11px] ${cfg.iconBg} flex items-center justify-center`}>
        {icon}
      </div>
      <div className={`text-[11px] font-semibold uppercase tracking-[.08em] mb-[10px] ${cfg.label}`}>{label}</div>
      <div className={`font-mono text-[38px] font-bold leading-[.9] tracking-tight ${resolvedValueColor}`}>{value}</div>
      <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: barGradient }} />
    </motion.div>
  );
}
