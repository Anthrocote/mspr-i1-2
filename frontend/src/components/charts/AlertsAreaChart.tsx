'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AlertsAreaChart() {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-parchment-0 border border-parchment-400 rounded-[18px] p-6"
      style={{ boxShadow: '0 2px 8px rgba(44,26,10,.08)' }}
    >
      <div className="font-display text-xl font-semibold text-espresso-900 mb-1">{t('alerts_per_month')}</div>
      <div className="text-xs text-parchment-700 mb-[22px]">{t('last_6_months')}</div>
      <svg width="100%" height="170" viewBox="0 0 520 170" preserveAspectRatio="none" className="block overflow-visible">
        <defs>
          <linearGradient id="alertArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B45309" stopOpacity=".18"/>
            <stop offset="100%" stopColor="#B45309" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polygon points="0,120 104,90 208,100 312,60 416,72 520,40 520,170 0,170" fill="url(#alertArea)"/>
        <motion.polyline
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: 'easeInOut', delay: 0.3 }}
          points="0,120 104,90 208,100 312,60 416,72 520,40"
          fill="none" stroke="#B45309" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
        />
        {[
          [0, 120], [104, 90], [208, 100], [312, 60], [416, 72], [520, 40]
        ].map(([cx, cy], i) => (
          <motion.circle
            key={i}
            initial={{ r: 0 }}
            animate={{ r: 3.5 }}
            transition={{ duration: 0.2, delay: 0.5 + i * 0.08 }}
            cx={cx} cy={cy} fill="#B45309"
          />
        ))}
      </svg>
      <div className="flex justify-between mt-2">
        {[t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun')].map(m => (
          <span key={m} className="text-[11px] text-parchment-700">{m}</span>
        ))}
      </div>
    </motion.div>
  );
}
