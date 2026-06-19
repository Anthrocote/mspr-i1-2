'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import BarChart from '@/components/charts/BarChart';
import AlertsAreaChart from '@/components/charts/AlertsAreaChart';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let frame: number;
    const duration = 800;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return <>{val}{suffix}</>;
}

const METRICS = [
  { label: 'Taux de conformité', value: 70, suffix: '%', color: '#2E7D32', trend: '↑ +4 pts vs mois dernier', trendColor: '#2E7D32' },
  { label: 'Durée moy. stockage', value: 142, suffix: ' j', color: '#1E0F06', trend: 'cible FIFO < 180 j', trendColor: '#A08060' },
  { label: 'Capteurs en ligne', value: 18, suffix: '/20', color: '#1E0F06', trend: '2 dégradés', trendColor: '#B45309' },
  { label: 'Pertes évitées', value: 96, suffix: '%', color: '#1E0F06', trend: 'grâce aux alertes IoT', trendColor: '#2E7D32' },
];

export default function AnalytiquePage() {
  return (
    <motion.div
      className="max-w-[1320px] mx-auto w-full flex flex-col gap-[18px]"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px]">
        {METRICS.map((m) => (
          <motion.div
            key={m.label}
            variants={item}
            className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl py-5 px-[22px] shadow-sm"
          >
            <div className="text-[11px] font-semibold text-[#A08060] uppercase tracking-wide mb-2">
              {m.label}
            </div>
            <div
              className="font-display text-[38px] font-bold leading-none"
              style={{ color: m.color }}
            >
              <AnimatedNumber target={m.value} suffix={m.suffix} />
            </div>
            <div className="text-xs mt-1.5" style={{ color: m.trendColor }}>
              {m.trend}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[18px]">
        <motion.div variants={item}>
          <BarChart />
        </motion.div>
        <motion.div variants={item}>
          <AlertsAreaChart />
        </motion.div>
      </div>
    </motion.div>
  );
}
