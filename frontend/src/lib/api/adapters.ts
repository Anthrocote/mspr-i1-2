// API (wire) → presentation adapters. This is where contract bugs live, so
// every branch here is unit-tested. Pure functions only: no i18n context, no
// framework. The French labels produced here mirror the `fr` locale defaults;
// the pages still translate the enum-derived fields (via countryCode / status
// variant) at render time.

import type {
  Alert,
  AlertSeverity,
  BadgeVariant,
  CountryCode,
  Farm,
  Lot,
  LotStatus,
  StatusDistribution,
  Warehouse,
  WarehouseStay,
} from '@/types';
import type {
  ApiAlert,
  ApiAlertType,
  ApiCountry,
  ApiExploitation,
  ApiLotStatus,
  ApiLotSummary,
  ApiMeasurement,
  ApiStorageHistoryEntry,
  ApiWarehouse,
} from './types';

// ── Country iso3 → presentation ──
// The siège exposes 3-letter iso codes; the UI keys everything on 2-letter
// codes plus a flag emoji.
const ISO3_TO_CODE: Record<string, CountryCode> = {
  BRA: 'br',
  ECU: 'ec',
  COL: 'co',
};

const CODE_TO_FLAG: Record<CountryCode, string> = {
  br: '🇧🇷',
  ec: '🇪🇨',
  co: '🇨🇴',
};

const CODE_TO_LABEL_FR: Record<CountryCode, string> = {
  br: 'Brésil',
  ec: 'Équateur',
  co: 'Colombie',
};

export function isoToCountryCode(iso: string): CountryCode {
  const code = ISO3_TO_CODE[iso?.toUpperCase?.()];
  if (!code) {
    throw new Error(`Unknown iso country code from siège: ${iso}`);
  }
  return code;
}

// A lot's country can be null (relation not resolved at the source). The
// presentation CountryCode is a closed union with no empty member, so a lot with
// no country falls back to this placeholder code; callers keep the label/flag
// blank so nothing misleading is rendered.
export const DEFAULT_COUNTRY_CODE: CountryCode = 'br';

export function countryFlag(code: CountryCode): string {
  return CODE_TO_FLAG[code];
}

export function countryLabelFr(code: CountryCode): string {
  return CODE_TO_LABEL_FR[code];
}

// ── Lot status enum mapping ──
const STATUS_TO_VARIANT: Record<ApiLotStatus, BadgeVariant> = {
  compliant: 'ok',
  in_alert: 'warn',
  expired: 'err',
};

const STATUS_TO_LOT_STATUS: Record<ApiLotStatus, LotStatus> = {
  compliant: 'conforme',
  in_alert: 'alerte',
  expired: 'perime',
};

const STATUS_TO_LABEL_FR: Record<ApiLotStatus, string> = {
  compliant: 'Conforme',
  in_alert: 'En Alerte',
  expired: 'Périmé',
};

export function lotStatusToVariant(status: ApiLotStatus): BadgeVariant {
  return STATUS_TO_VARIANT[status];
}

export function lotStatusToPresentation(status: ApiLotStatus): LotStatus {
  return STATUS_TO_LOT_STATUS[status];
}

export function lotStatusLabelFr(status: ApiLotStatus): string {
  return STATUS_TO_LABEL_FR[status];
}

// ── Numeric readings → display strings ──
// The presentation layer shows whole degrees / percent, so round here.
export function formatTemperature(celsius: number): string {
  return `${Math.round(celsius)}°C`;
}

export function formatHumidity(percent: number): string {
  return `${Math.round(percent)}%`;
}

// ── ISO 8601 → French short date (e.g. "5 jan. 2023") ──
// Uses UTC calendar parts so the rendered day is stable regardless of the
// runtime timezone.
const MONTHS_FR = [
  'jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sep.', 'oct.', 'nov.', 'déc.',
];

export function formatDateFr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid ISO date: ${iso}`);
  }
  return `${d.getUTCDate()} ${MONTHS_FR[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// Whole-day span between two instants (UTC), used for lot storage duration.
export function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) {
    throw new Error(`Invalid ISO date in range: ${fromIso}..${toIso}`);
  }
  return Math.abs(Math.round((to - from) / 86_400_000));
}

// ── Tolerance policy ──
// The siège gives each country an ideal temp/humidity but NO tolerance band.
// The acceptable band is a front-side policy decision, centralised here so it
// is explicit and testable rather than scattered as magic numbers.
// Tolerance bands from the MSPR spec: ±3 °C on temperature, ±2 % on humidity.
export const TEMP_TOLERANCE = 3;
export const HUM_TOLERANCE = 2;

export function toleranceBand(ideal: number, tolerance: number): [number, number] {
  return [ideal - tolerance, ideal + tolerance];
}

// ── Distribution ──
// Build the dashboard conformity split from raw lot-status counts.
export function distributionFromCounts(counts: Record<ApiLotStatus, number>): StatusDistribution {
  return {
    conforme: counts.compliant,
    alerte: counts.in_alert,
    perime: counts.expired,
  };
}

// ── Warehouse conditions ──
// A presentation Warehouse is composed from three sources: the warehouse
// record, its country's ideal thresholds, and its latest measurement. The
// latest reading is optional — a warehouse with no measurement yet still
// renders, sitting exactly at its ideal (deviation zero).
export interface WarehouseCompositionInput {
  warehouse: ApiWarehouse;
  country: ApiCountry;
  latest?: ApiMeasurement | null;
  lots?: number;
}

export function adaptWarehouse(input: WarehouseCompositionInput): Warehouse {
  const { warehouse, country, latest, lots = 0 } = input;
  const code = isoToCountryCode(country.isoCode);
  const tempNum = latest ? latest.temperature : country.idealTemperature;
  const humNum = latest ? latest.humidity : country.idealHumidity;
  const tempRange = toleranceBand(country.idealTemperature, TEMP_TOLERANCE);
  const humRange = toleranceBand(country.idealHumidity, HUM_TOLERANCE);

  return {
    id: warehouse.uuid,
    name: warehouse.name,
    country: country.name,
    countryCode: code,
    flag: countryFlag(code),
    temp: formatTemperature(tempNum),
    hum: formatHumidity(humNum),
    tempNum,
    humNum,
    tempRange,
    humRange,
    idealTemp: `${formatTemperature(country.idealTemperature)} ±${TEMP_TOLERANCE}`,
    idealHum: `${formatHumidity(country.idealHumidity)} ±${HUM_TOLERANCE}`,
    lots,
    sensorStatus: warehouse.status ?? null,
  };
}

// ── Alerts ──
// The wire alert carries only { type, triggeredAt, lot, warehouse }. Severity,
// title and colours are DERIVED from the (closed) set of alert types. The
// description is a minimal factual line built from the relation — the siège has
// no free-text description field, so nothing is invented beyond formatting.
const ALERT_TYPE_TO_SEVERITY: Record<ApiAlertType, AlertSeverity> = {
  expired_lot: 'critique',
  out_of_range: 'alerte',
  sensor_offline: 'alerte',
};

// Title and (optional) icon per alert type; the icon falls back to the severity's.
const ALERT_TITLE: Record<ApiAlertType, string> = {
  expired_lot: 'Lot périmé',
  out_of_range: 'Condition hors plage',
  sensor_offline: 'Capteur hors ligne',
};

const ALERT_ICON: Partial<Record<ApiAlertType, string>> = {
  sensor_offline: '📡',
};

const SEVERITY_PRESENTATION: Record<AlertSeverity, {
  level: string;
  icon: string;
  variant: BadgeVariant;
  bgColor: string;
  borderColor: string;
}> = {
  critique: { level: 'Critique', icon: '⛔', variant: 'err', bgColor: '#FEF2F2', borderColor: '#9B1C1C' },
  alerte: { level: 'Alerte', icon: '🌡️', variant: 'warn', bgColor: '#FEF3E2', borderColor: '#B45309' },
};

export function adaptAlert(alert: ApiAlert): Alert {
  const severity = ALERT_TYPE_TO_SEVERITY[alert.type];
  const p = SEVERITY_PRESENTATION[severity];
  const subject = alert.lot?.label ?? alert.warehouse?.name ?? '—';
  const typeLabel = ALERT_TITLE[alert.type];
  const title = `${typeLabel} — ${subject}`;
  const resolved = alert.resolvedAt !== null;

  return {
    id: alert.uuid,
    severity,
    level: p.level,
    icon: ALERT_ICON[alert.type] ?? p.icon,
    variant: p.variant,
    title,
    description: `Déclenchée le ${formatDateFr(alert.triggeredAt)}`,
    time: formatDateFr(alert.triggeredAt),
    bgColor: p.bgColor,
    borderColor: p.borderColor,
    // Raw enum + raw ISO instants kept so views translate the type label AND
    // format the dates in the active language at render time (the French strings
    // above are the `fr` canonical fallback).
    type: alert.type,
    triggeredAt: alert.triggeredAt,
    resolvedAt: alert.resolvedAt,
    // History-table fields.
    typeLabel,
    subject,
    status: resolved ? 'resolved' : 'active',
  };
}

// ── Lot ──
// Maps the enriched wire lot summary to the presentation Lot. Every relation and
// date on the wire can be null, so each one degrades to a blank/neutral value
// rather than throwing. List-level conditions (temp/hum/ideal) and the stay
// history are NOT on the summary — they are filled only in the detail path (see
// `adaptStays` + `fetchLotDetail`), so they stay empty here.
export function adaptLotSummary(api: ApiLotSummary): Lot {
  const statusLabel = lotStatusLabelFr(api.status);
  const statusVariant = lotStatusToVariant(api.status);
  const countryCode = api.country ? isoToCountryCode(api.country.isoCode) : DEFAULT_COUNTRY_CODE;

  const constitutedAt = api.constitutedAt ? formatDateFr(api.constitutedAt) : '';
  const storageDate = api.arrivedAt
    ? formatDateFr(api.arrivedAt)
    : constitutedAt;

  return {
    id: api.label,
    uuid: api.uuid,
    countryCode,
    country: api.country?.name ?? '',
    countryId: api.country?.id ?? null,
    warehouseId: api.currentWarehouse?.uuid ?? null,
    // Never invent a flag for a country-less lot.
    flag: api.country ? countryFlag(countryCode) : '',
    warehouse: api.currentWarehouse?.name ?? '',
    exploitationId: api.exploitation?.uuid ?? '',
    constitutedAt,
    constitutedAtIso: api.constitutedAt,
    storageDate,
    stays: [],
    duration: api.durationDays != null ? `${api.durationDays} j` : '',
    durationDays: api.durationDays ?? 0,
    status: statusLabel,
    statusVariant,
    durationVariant: statusVariant === 'err' ? 'err' : statusVariant === 'warn' ? 'warn' : '',
    temp: '',
    hum: '',
    idealTemp: '',
    idealHum: '',
  };
}

// ── Exploitation ──
// The siège exposes exploitations with a resolved country and a precomputed lot
// count. There is no certification (or other audited attribute) on the model, so
// only the sourced fields are mapped.
export function adaptExploitation(api: ApiExploitation): Farm {
  const code = isoToCountryCode(api.country.isoCode);
  return {
    id: api.uuid,
    name: api.name,
    countryCode: code,
    country: api.country.name,
    flag: countryFlag(code),
    lots: api.lotsCount,
  };
}

// ── Storage history → warehouse stays ──
// The detail endpoint carries the lot's warehouse history; a null `departedAt`
// means the lot is still in that warehouse.
export function adaptStays(history: ApiStorageHistoryEntry[]): WarehouseStay[] {
  return history.map((entry) => ({
    warehouse: entry.warehouse.name,
    entree: formatDateFr(entry.arrivedAt),
    sortie: entry.departedAt ? formatDateFr(entry.departedAt) : null,
    entreeIso: entry.arrivedAt,
    sortieIso: entry.departedAt,
  }));
}
