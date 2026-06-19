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
  const [alertsList, setAlertsList] = useState(ALERTS);
  const [filter, setFilter] = useState<AlertFilter>('all');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  const selectedAlert = alertsList.find((a) => a.id === selectedAlertId) ?? null;

  const filtered = alertsList.filter((a) => {
    if (filter === 'all') return true;
    return a.severity === filter;
  });

  const critiques = alertsList.filter((a) => a.severity === 'critique').length;
  const avertissements = alertsList.filter((a) => a.severity === 'alerte').length;

  if (selectedAlert) {
    return (
      <AlertTreatment
        alert={selectedAlert}
        onBack={() => setSelectedAlertId(null)}
        onResolve={(alertId) => {
          setAlertsList((prev) => prev.filter((a) => a.id !== alertId));
          setSelectedAlertId(null);
        }}
      />
    );
  }

  return (
    <div className="max-w-[920px] mx-auto w-full flex flex-col gap-[14px]">
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
          Toutes · {alertsList.length}
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
              <span
                onClick={() => setSelectedAlertId(a.id)}
                className="text-xs font-semibold text-[#1E5220] cursor-pointer sm:mt-1 hover:underline"
              >
                Traiter →
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ── Incident Treatment view ── */
interface AlertTreatmentProps {
  alert: (typeof ALERTS)[0];
  onBack: () => void;
  onResolve: (alertId: string) => void;
}

function AlertTreatment({ alert, onBack, onResolve }: AlertTreatmentProps) {
  const [action, setAction] = useState('ajustement');
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onResolve(alert.id);
  };

  return (
    <motion.div
      className="max-w-[920px] mx-auto w-full text-left"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 py-2 px-4 rounded-full text-[13px] font-semibold bg-[#F5EDE0] text-[#5C3A1E] border border-[#E8D9C4] cursor-pointer hover:bg-[#EDE0D0] mb-5"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Retour aux alertes
      </button>

      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-[18px] items-start">
        {/* Left column - Incident Context */}
        <div className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl shadow-sm overflow-hidden">
          {/* Header styled dynamically based on severity */}
          <div className="p-6 text-left flex items-start gap-4 border-b border-[#F0E6D8]" style={{ borderTop: `4px solid ${alert.borderColor}` }}>
            <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center shrink-0 text-xl" style={{ background: alert.bgColor }}>
              {alert.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#A08060]">{alert.id}</span>
                <Badge variant={alert.variant}>{alert.level}</Badge>
              </div>
              <h3 className="font-display text-xl font-bold text-[#1E0F06] mt-1">{alert.title}</h3>
              <p className="text-[11px] text-[#A08060] mt-1">Déclenché {alert.time}</p>
            </div>
          </div>

          <div className="p-6 text-left flex flex-col gap-5">
            <div>
              <h4 className="text-[11px] font-semibold text-[#A08060] uppercase tracking-wider mb-1.5">Description de l'anomalie</h4>
              <p className="text-sm text-[#443524] bg-[#FAF4EC] p-3.5 rounded-xl border border-[#E8D9C4] font-medium leading-relaxed">
                {alert.description}
              </p>
            </div>

            <div className="h-px bg-[#F0E6D8]" />

            <div>
              <h4 className="text-[11px] font-semibold text-[#A08060] uppercase tracking-wider mb-2">Seuils et diagnostic IoT</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-[#E8D9C4] rounded-xl p-3 bg-[#FDF9F4]">
                  <div className="text-[10px] text-[#A08060] uppercase tracking-wide">Valeur lue</div>
                  <div className="text-lg font-bold text-[#9B1C1C] mt-0.5">
                    {alert.title.includes('Température') ? '34°C' : alert.title.includes('Humidité') ? '83%' : 'Hors seuils'}
                  </div>
                </div>
                <div className="border border-[#E8D9C4] rounded-xl p-3 bg-[#FDF9F4]">
                  <div className="text-[10px] text-[#A08060] uppercase tracking-wide">Seuil idéal</div>
                  <div className="text-lg font-bold text-[#2E7D32] mt-0.5">
                    {alert.title.includes('Température') ? '31°C ±3' : alert.title.includes('Humidité') ? '80% ±3' : 'Conforme'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Actions and notes Form */}
        <div className="flex flex-col gap-[18px]">
          <div className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl p-6 shadow-sm">
            <h3 className="font-display text-[19px] font-semibold text-[#1E0F06] mb-[18px] text-left">Traiter l'incident</h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
              <div>
                <label className="block text-[11px] font-semibold text-[#A08060] uppercase tracking-wider mb-1.5">Action corrective prise</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full border-[1.5px] border-[#E8D9C4] rounded-[10px] py-2 px-3 text-[13px] text-[#1E0F06] bg-[#FDF9F4] outline-none focus:border-[#A0714F]"
                >
                  <option value="ajustement">Ajustement des conditions de stockage</option>
                  <option value="ventilation">Activation de la ventilation</option>
                  <option value="deplacement">Déplacement physique du lot</option>
                  <option value="recalibrage">Remplacement / Recalibrage du capteur</option>
                  <option value="fausse_alerte">Fausse alerte / Erreur de mesure</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#A08060] uppercase tracking-wider mb-1.5">Commentaire de résolution</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Expliquez brièvement l'action effectuée pour résoudre l'incident..."
                  required
                  rows={4}
                  className="w-full border-[1.5px] border-[#E8D9C4] rounded-[10px] py-2.5 px-3 text-[13px] text-[#1E0F06] bg-[#FDF9F4] outline-none focus:border-[#A0714F] resize-none"
                />
              </div>

              <div className="flex flex-col gap-2.5 mt-2">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 py-[11px] rounded-full text-[13px] font-semibold bg-[#1E5220] text-white border-none cursor-pointer shadow-[0_4px_16px_rgba(46,125,50,.22)] hover:bg-[#153a17]"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Résoudre et fermer
                </button>
              </div>
            </form>
          </div>

          {/* Snooze Options */}
          <div className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl p-6 shadow-sm text-left">
            <h4 className="font-display text-[17px] font-semibold text-[#1E0F06] mb-3">Mettre en sourdine (Snooze)</h4>
            <p className="text-xs text-[#A08060] mb-4">Masquer temporairement cette alerte de l'écran principal.</p>
            <div className="flex gap-[10px] flex-wrap">
              {['1 h', '4 h', '24 h'].map((time) => (
                <button
                  key={time}
                  onClick={() => onResolve(alert.id)}
                  className="inline-flex items-center gap-1.5 py-[7px] px-[14px] rounded-full text-xs font-semibold bg-[#F5EDE0] text-[#5C3A1E] border border-[#E8D9C4] cursor-pointer hover:bg-[#EDE0D0] transition-colors"
                >
                  ⏳ {time}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
