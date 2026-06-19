'use client';

import type { BadgeVariant } from '@/types';

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  ok:      'bg-[#EDF7EE] text-[#2E7D32] border-[#A5D6A7]',
  warn:    'bg-[#FEF3E2] text-[#B45309] border-[#F6CC7A]',
  err:     'bg-[#FEF2F2] text-[#9B1C1C] border-[#FCA5A5]',
  info:    'bg-[#EFF6FF] text-[#1E4D8C] border-[#93C5FD]',
  neutral: 'bg-parchment-200 text-[#7A5C40] border-parchment-400',
};

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-[5px] px-[11px] py-[3px] rounded-full text-[11px] font-semibold whitespace-nowrap border ${VARIANT_STYLES[variant]} ${className}`}>
      {children}
    </span>
  );
}
