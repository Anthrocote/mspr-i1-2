'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALERTS } from '@/data/mock';
import Badge from '@/components/ui/Badge';

type AlertFilter = 'all' | 'critique' | 'alerte';

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export default function AlertesPage() {
  const [filter, setFilter] = useState<AlertFilter>('all');

  const filtered = ALERTS.filter((a) => {
    if (filter === 'all') return true;
    return a.severity === filter;
  });

  const critiques = ALERTS.filter((a) => a.severity === 'critique').length;
  const avertissements = ALERTS.filter((a) => a.severity === 'alerte').length;

  return (
    <div className="max-w-[920px] flex flex-col gap-[14px]">
      {/* Filter chips */}
      <div className="flex gap-[10px] mb-1.5 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`inline-flex items-center gap-1.5 py-[7px] px-[14px] rounded-full text-xs font-semibold cursor-pointer transition-colors ${
            filter === 'all'
              ? 'bg-[#2C1A0A] text-[#FAF4EC]'
              : 'bg-[#FFFCF8] text-[#7A5235] border border-[#E8D9C4] hover:bg-[#F5EDE0]'
          }`}
        >
          Toutes · {ALERTS.length}
        </button>
        <button
          onClick={() => setFilter('critique')}
          className={`inline-flex items-center gap-1.5 py-[7px] px-[14px] rounded-full text-xs font-medium cursor-pointer transition-colors ${
            filter === 'critique'
              ? 'bg-[#FEF2F2] text-[#9B1C1C] border border-[#FCA5A5]'
              : 'bg-[#FFFCF8] text-[#9B1C1C] border border-[#FCA5A5] hover:bg-[#FEF2F2]'
          }`}
        >
          Critiques · {critiques}
        </button>
        <button
          onClick={() => setFilter('alerte')}
          className={`inline-flex items-center gap-1.5 py-[7px] px-[14px] rounded-full text-xs font-medium cursor-pointer transition-colors ${
            filter === 'alerte'
              ? 'bg-[#FEF3E2] text-[#B45309] border border-[#F6CC7A]'
              : 'bg-[#FFFCF8] text-[#B45309] border border-[#F6CC7A] hover:bg-[#FEF3E2]'
          }`}
        >
          Avertissements · {avertissements}
        </button>
      </div>

      {/* Alert list */}
      <AnimatePresence mode="popLayout">
        {filtered.map((a) => (
          <motion.div
            key={a.id}
            variants={item}
            initial="hidden"
            animate="show"
            exit="exit"
            layout
            className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-[13px] p-4 px-5 flex flex-col sm:flex-row items-start gap-[14px] shadow-[0_2px_8px_rgba(44,26,10,.06)]"
            style={{ borderLeft: `4px solid ${a.borderColor}` }}
          >
            <div className="flex items-start gap-[14px] flex-1 w-full">
              <div
                className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center shrink-0 text-[15px]"
                style={{ background: a.bgColor }}
              >
                {a.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-[10px]">
                  <div className="text-sm font-semibold text-[#1E0F06]">{a.title}</div>
                  <Badge variant={a.variant}>{a.level}</Badge>
                </div>
                <div className="text-[13px] text-[#6B5540] mt-[3px]">{a.description}</div>
              </div>
            </div>
            <div className="text-left sm:text-right shrink-0 w-full sm:w-auto flex sm:flex-col justify-between sm:justify-start items-center sm:items-end mt-2 sm:mt-0 border-t border-dashed border-[#E8D9C4] sm:border-none pt-2 sm:pt-0">
              <div className="text-[11px] text-[#A08060]">{a.time}</div>
              <span className="text-xs font-semibold text-[#1E5220] cursor-pointer sm:mt-1">Traiter →</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
