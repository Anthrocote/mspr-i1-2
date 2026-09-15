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
  Lot,
  LotStatus,
  StatusDistribution,
  Warehouse,
} from '@/types';
import type {
  ApiAlert,
  ApiAlertType,
  ApiCountry,
  ApiLotStatus,
  ApiMeasurement,
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
export const TEMP_TOLERANCE = 3;
export const HUM_TOLERANCE = 3;

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
  const title =
    alert.type === 'expired_lot'
      ? `Lot périmé — ${subject}`
      : `Condition hors plage — ${subject}`;

  return {
    id: alert.uuid,
    severity,
    level: p.level,
    icon: p.icon,
    variant: p.variant,
    title,
    description: `Déclenchée le ${formatDateFr(alert.triggeredAt)}`,
    time: formatDateFr(alert.triggeredAt),
    bgColor: p.bgColor,
    borderColor: p.borderColor,
  };
}

// ── Lot (partial) ──
// A presentation Lot is far richer than the wire lot summary, which lacks
// country, warehouse, constitution date, duration and conditions. This adapter
// maps only the fields the siège actually provides; the rest are filled from an
// optional `context` (e.g. resolved from the lot detail's storage history and a
// warehouse→country lookup) or left as neutral defaults. Callers that need a
// faithful table must supply the context or accept the gaps.
export interface LotContext {
  countryCode?: CountryCode;
  country?: string;
  flag?: string;
  warehouse?: string;
  constitutedAt?: string; // ISO
  temperature?: number;
  humidity?: number;
}

export function adaptLotSummary(
  lot: { uuid: string; label: string; status: ApiLotStatus; syncedAt: string },
  context: LotContext = {},
): Lot {
  const statusLabel = lotStatusLabelFr(lot.status);
  const statusVariant = lotStatusToVariant(lot.status);
  const constitutedIso = context.constitutedAt ?? lot.syncedAt;

  return {
    id: lot.label,
    countryCode: context.countryCode ?? 'br',
    country: context.country ?? '',
    flag: context.flag ?? '',
    warehouse: context.warehouse ?? '',
    exploitationId: '',
    constitutedAt: formatDateFr(constitutedIso),
    storageDate: formatDateFr(constitutedIso),
    stays: [],
    duration: '',
    durationDays: 0,
    status: statusLabel,
    statusVariant,
    durationVariant: statusVariant === 'err' ? 'err' : statusVariant === 'warn' ? 'warn' : '',
    temp: context.temperature !== undefined ? formatTemperature(context.temperature) : '',
    hum: context.humidity !== undefined ? formatHumidity(context.humidity) : '',
    idealTemp: '',
    idealHum: '',
  };
}
