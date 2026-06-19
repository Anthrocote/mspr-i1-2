'use client';

import { motion } from 'framer-motion';

interface ToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export default function Toggle({ enabled, onToggle }: ToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`w-[46px] h-[26px] rounded-full relative shrink-0 transition-colors duration-200 ${
        enabled ? 'bg-espresso-600' : 'bg-[#D9C9B8]'
      }`}
    >
      <motion.div
        className="absolute w-5 h-5 bg-white rounded-full top-[3px]"
        animate={{ left: enabled ? 23 : 3 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{ boxShadow: '0 1px 2px rgba(44,26,10,.2)' }}
      />
    </button>
  );
}
