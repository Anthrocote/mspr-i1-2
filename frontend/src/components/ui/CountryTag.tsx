'use client';

import type { CountryCode } from '@/types';

const TAG_STYLES: Record<CountryCode, string> = {
  br: 'bg-[#EFF7EF] text-[#1A4D1C] border-[#A5D6A7]',
  ec: 'bg-[#FEF9E7] text-[#7A4B00] border-[#F6D860]',
  co: 'bg-[#FEF0F0] text-[#7A1E1E] border-[#FCA5A5]',
};

interface CountryTagProps {
  countryCode: CountryCode;
  children: React.ReactNode;
}

export default function CountryTag({ countryCode, children }: CountryTagProps) {
  return (
    <span className={`inline-flex items-center gap-[5px] px-[10px] py-[3px] rounded-lg text-[11px] font-medium border ${TAG_STYLES[countryCode]}`}>
      {children}
    </span>
  );
}
