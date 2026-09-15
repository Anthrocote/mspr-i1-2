// Locale-aware date formatting for the view layer. The adapters stay pure and
// i18n-free: they expose the raw ISO instant, and the components format it in
// the active language at render time (same principle as enum-derived labels).

import type { Language } from '@/translations';

const LOCALE: Record<Language, string> = {
  fr: 'fr-FR',
  en: 'en-GB',
  es: 'es-ES',
};

// Date only, e.g. "15 sept. 2026" / "15 Sept 2026" / "15 sept 2026".
export function formatDate(iso: string, lang: Language): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(LOCALE[lang], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

// Compact day + month for a chart axis tick, e.g. "15 sept." / "15 Sept".
export function formatAxisDate(ts: number, lang: Language): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(LOCALE[lang], { day: 'numeric', month: 'short' }).format(d);
}

// Date + wall-clock time (24h), e.g. "15 sept. 2026, 22:57". Uses the runtime's
// local timezone so the hour matches the on-site clock (the wire instant is UTC).
export function formatDateTime(iso: string, lang: Language): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(LOCALE[lang], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(d);
}
