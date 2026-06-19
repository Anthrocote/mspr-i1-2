'use client';

import { motion } from 'framer-motion';
import { WAREHOUSES } from '@/data/mock';
import Badge from '@/components/ui/Badge';
import GaugeChart from '@/components/charts/GaugeChart';
import { useLanguage } from '@/contexts/LanguageContext';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const card = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

function cellStyle(isOk: boolean) {
  return isOk
    ? 'border border-[#A5D6A7] rounded-[11px] p-[14px] text-center bg-[#EDF7EE]'
    : 'border border-[#FCA5A5] rounded-[11px] p-[14px] text-center bg-[#FEF2F2]';
}

function valColor(isOk: boolean, isWarn: boolean) {
  if (!isOk) return '#9B1C1C';
  if (isWarn) return '#B45309';
  return '#2E7D32';
}

export default function IoTPage() {
  const { t } = useLanguage();

  return (
    <motion.div
      className="max-w-[1320px] mx-auto w-full flex flex-col gap-[22px]"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Warehouse cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[18px]">
        {WAREHOUSES.map((w) => {
          const tOk = w.tempNum >= w.tempRange[0] && w.tempNum <= w.tempRange[1];
          const hOk = w.humNum >= w.humRange[0] && w.humNum <= w.humRange[1];
          const hWarn = !hOk && w.humNum <= w.humRange[1] + 3;

          return (
            <motion.div
              key={w.id}
              variants={card}
              className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="bg-[#2C1A0A] py-[15px] px-5 flex items-center justify-between">
                <div className="font-display text-lg font-semibold text-[#FAF4EC]">
                  {w.flag} {w.name}
                </div>
                <Badge variant={w.statusVariant}>
                  {t(w.statusVariant === 'ok' ? 'status_ok' : w.statusVariant === 'warn' ? 'status_warn' : 'status_err')}
                </Badge>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className={cellStyle(tOk)}>
                    <div className="text-[11px] font-semibold text-[#A08060] uppercase tracking-wide mb-[3px]">
                      {t('temp_abbrev')}
                    </div>
                    <div
                      className="font-mono text-[22px] font-bold leading-none"
                      style={{ color: valColor(tOk, false) }}
                    >
                      {w.temp}
                    </div>
                  </div>
                  <div className={cellStyle(hOk)}>
                    <div className="text-[11px] font-semibold text-[#A08060] uppercase tracking-wide mb-[3px]">
                      {t('hum_abbrev')}
                    </div>
                    <div
                      className="font-mono text-[22px] font-bold leading-none"
                      style={{ color: valColor(hOk, hWarn) }}
                    >
                      {w.hum}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-[#A08060]">
                  <span>{t('ideal')} {w.idealTemp} · {w.idealHum}</span>
                  <span>{w.lots} {t('lots_count')}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[18px]">
        <motion.div variants={card}>
          <GaugeChart
            value={29}
            unit="°C"
            label={`${t('temperature')} · São Paulo A`}
            ideal={`${t('ideal')} 29°C ±3`}
            isOk={true}
            color="#2E7D32"
          />
        </motion.div>
        <motion.div variants={card}>
          <GaugeChart
            value={55}
            unit="%"
            label={`${t('humidity')} · São Paulo A`}
            ideal={`${t('ideal')} 55% ±2`}
            isOk={true}
            color="#A0714F"
          />
        </motion.div>
        <motion.div variants={card}>
          <GaugeChart
            value={34}
            unit="°C"
            label={`${t('temperature')} · Quito B`}
            ideal={`${t('ideal')} 31°C ±3`}
            isOk={false}
            color="#9B1C1C"
          />
        </motion.div>
      </div>

      {/* Live chart */}
      <motion.div
        variants={card}
        className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-[18px]">
          <h3 className="font-display text-xl font-semibold text-[#1E0F06]">
            {t('realtime_flux')}
          </h3>
          <span className="inline-flex items-center gap-1.5 text-xs text-[#9B1C1C] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#9B1C1C]" />
            {t('drift_detected')}
          </span>
        </div>
        <svg
          width="100%"
          height="180"
          viewBox="0 0 1100 180"
          preserveAspectRatio="none"
          className="block overflow-visible"
        >
          <rect x="0" y="40" width="1100" height="70" fill="#EDF7EE" />
          <line x1="0" y1="55" x2="1100" y2="55" stroke="#A5D6A7" strokeWidth="1.5" strokeDasharray="6 4" />
          <line x1="0" y1="105" x2="1100" y2="105" stroke="#A5D6A7" strokeWidth="1.5" strokeDasharray="6 4" />
          <polyline
            points="0,98 140,92 280,88 420,80 560,70 700,52 840,38 980,30 1100,34"
            fill="none"
            stroke="#2C1A0A"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <circle cx="980" cy="30" r="5" fill="#9B1C1C" stroke="#fff" strokeWidth="2" />
          <text x="980" y="22" textAnchor="middle" style={{ fontFamily: "'DM Sans'", fontSize: '11px', fill: '#9B1C1C', fontWeight: 700 }}>
            34°C
          </text>
          <text x="6" y="36" style={{ fontFamily: "'DM Sans'", fontSize: '10px', fill: '#A0714F' }}>
            34° ({t('threshold')})
          </text>
          <text x="6" y="124" style={{ fontFamily: "'DM Sans'", fontSize: '10px', fill: '#A0714F' }}>
            28°
          </text>
        </svg>
        <div className="flex justify-between mt-2">
          {['00 h', '04 h', '08 h', '12 h', '16 h', '20 h', '24 h'].map((t) => (
            <span key={t} className="text-[11px] text-[#A08060]">{t}</span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
