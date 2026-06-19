'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { COUNTRIES } from '@/data/mock';
import Toggle from '@/components/ui/Toggle';
import { useLanguage } from '@/contexts/LanguageContext';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const section = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export default function ParametresPage() {
  const { language, setLanguage, t } = useLanguage();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [fifoStrict, setFifoStrict] = useState(false);
  const [iotRealtime, setIotRealtime] = useState(true);

  return (
    <motion.div
      className="max-w-[900px] mx-auto w-full flex flex-col gap-[18px]"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* IoT thresholds */}
      <motion.div variants={section} className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl p-[26px] shadow-sm">
        <h2 className="font-display text-[21px] font-semibold text-[#1E0F06] mb-1">
          {t('iot_thresholds_title')}
        </h2>
        <p className="text-[13px] text-[#A08060] mb-[22px]">
          {t('iot_thresholds_desc')}
        </p>
        {COUNTRIES.map((c) => (
          <div
            key={c.countryCode}
            className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr_1fr] gap-3 sm:gap-4 items-start sm:items-center py-[14px] border-b border-[#F0E6D8]"
          >
            <div className="text-sm font-semibold text-[#1E0F06]">
              {c.flag} {c.name}
            </div>
            <div>
              <div className="text-[11px] text-[#A08060] mb-[5px]">{t('temperature')}</div>
              <div className="inline-flex items-center border-[1.5px] border-[#E8D9C4] rounded-[10px] py-[7px] px-3 text-[13px] text-[#1E0F06] bg-[#FDF9F4]">
                {c.tempThreshold}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#A08060] mb-[5px]">{t('humidity')}</div>
              <div className="inline-flex items-center border-[1.5px] border-[#E8D9C4] rounded-[10px] py-[7px] px-3 text-[13px] text-[#1E0F06] bg-[#FDF9F4]">
                {c.humThreshold}
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Notifications */}
      <motion.div variants={section} className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl p-[26px] shadow-sm">
        <h2 className="font-display text-[21px] font-semibold text-[#1E0F06] mb-[22px]">
          {t('notifications_rules')}
        </h2>
        <div className="flex flex-col gap-[18px]">
          <ToggleRow
            title={t('email_alerts_label')}
            description={t('email_alerts_desc')}
            enabled={emailAlerts}
            onToggle={() => setEmailAlerts(!emailAlerts)}
          />
          <div className="h-px bg-[#F0E6D8]" />
          <ToggleRow
            title={t('strict_fifo_label')}
            description={t('strict_fifo_desc')}
            enabled={fifoStrict}
            onToggle={() => setFifoStrict(!fifoStrict)}
          />
          <div className="h-px bg-[#F0E6D8]" />
          <ToggleRow
            title={t('realtime_iot_label')}
            description={t('realtime_iot_desc')}
            enabled={iotRealtime}
            onToggle={() => setIotRealtime(!iotRealtime)}
          />
        </div>
      </motion.div>

      {/* Account */}
      <motion.div variants={section} className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl p-[26px] shadow-sm">
        <h2 className="font-display text-[21px] font-semibold text-[#1E0F06] mb-[22px]">{t('account')}</h2>
        <div className="flex items-center gap-4 mb-[22px]">
          <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#3D2610] to-[#A0714F] flex items-center justify-center text-[#FAF4EC] font-bold text-xl">
            MJ
          </div>
          <div>
            <div className="text-base font-semibold text-[#1E0F06]">Marina Joaquim</div>
            <div className="text-[13px] text-[#A08060]">
              {t('user_role')} · marina.j@futurekawa.co
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-[13px] font-medium text-[#5C3A1E] mb-1.5">{t('full_name')}</div>
            <input
              type="text"
              defaultValue="Marina Joaquim"
              className="w-full border-[1.5px] border-[#E8D9C4] rounded-[10px] py-[10px] px-[14px] text-[13px] text-[#1E0F06] bg-[#FDF9F4] outline-none focus:border-[#A0714F] transition-colors"
            />
          </div>
          <div>
            <div className="text-[13px] font-medium text-[#5C3A1E] mb-1.5">{t('language')}</div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="w-full border-[1.5px] border-[#E8D9C4] rounded-[10px] py-[10px] px-[14px] text-[13px] text-[#1E0F06] bg-[#FDF9F4] outline-none focus:border-[#A0714F] transition-colors"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>
        <div className="flex gap-[10px] mt-[22px]">
          <button
            className="inline-flex items-center gap-[7px] py-[10px] px-5 rounded-full text-[13px] font-semibold bg-[#2C1A0A] text-[#FAF4EC] border-none cursor-pointer shadow-[0_4px_20px_rgba(44,26,10,.20)] hover:bg-[#1E0F06]"
          >
            {t('save')}
          </button>
          <button
            className="inline-flex items-center gap-[7px] py-[10px] px-5 rounded-full text-[13px] font-semibold bg-[#F5EDE0] text-[#5C3A1E] border border-[#E8D9C4] cursor-pointer hover:bg-[#EDE0D0]"
          >
            {t('cancel_btn')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ToggleRow({
  title,
  description,
  enabled,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-semibold text-[#1E0F06]">{title}</div>
        <div className="text-xs text-[#A08060]">{description}</div>
      </div>
      <Toggle enabled={enabled} onToggle={onToggle} />
    </div>
  );
}
