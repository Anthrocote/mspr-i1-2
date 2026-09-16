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

// ── Country code → presentation ──
// The siège now exposes the 2-letter lowercase code (br/ec/co) as the country
// identity, exactly the presentation CountryCode. No translation is needed; the
// UI just pairs each code with a flag emoji.
const CODE_TO_FLAG: Record<CountryCode, string> = {
  br: '🇧🇷',
  ec: '🇪🇨',
  co: '🇨🇴',
};

// The presentation CountryCode is a closed union. A code coming off the wire is
// validated against it here so an unknown/out-of-contract value fails loudly
// instead of leaking into the UI (the same safety net the iso3 map used to give).
export function toCountryCode(code: string): CountryCode {
  if (code in CODE_TO_FLAG) {
    return code as CountryCode;
  }
  throw new Error(`Unknown country code from siège: ${code}`);
}

// A lot's country can be null (relation not resolved at the source). The
// presentation CountryCode is a closed union with no empty member, so a lot with
// no country falls back to this placeholder code; callers keep the label/flag
// blank so nothing misleading is rendered.
export const DEFAULT_COUNTRY_CODE: CountryCode = 'br';

export function countryFlag(code: CountryCode): string {
  return CODE_TO_FLAG[code];
}

// ── Lot status enum mapping ──
// The lot status is rendered via the badge variant + t('status_' + variant);
// only the variant mapping is needed here.
const STATUS_TO_VARIANT: Record<ApiLotStatus, BadgeVariant> = {
  compliant: 'ok',
  in_alert: 'warn',
  expired: 'err',
};

export function lotStatusToVariant(status: ApiLotStatus): BadgeVariant {
  return STATUS_TO_VARIANT[status];
}

// ── Numeric readings → display strings ──
// The presentation layer shows whole degrees / percent, so round here.
export function formatTemperature(celsius: number): string {
  return `${Math.round(celsius)}°C`;
}

export function formatHumidity(percent: number): string {
  return `${Math.round(percent)}%`;
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
  const code = toCountryCode(country.code);
  const tempNum = latest ? latest.temperature : country.idealTemperature;
  const humNum = latest ? latest.humidity : country.idealHumidity;
  const tempRange = toleranceBand(country.idealTemperature, TEMP_TOLERANCE);
  const humRange = toleranceBand(country.idealHumidity, HUM_TOLERANCE);

  return {
    id: warehouse.uuid,
    name: warehouse.name,
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
// The wire alert carries only { type, triggeredAt, resolvedAt, lot, warehouse }.
// Severity, icon and colours are DERIVED from the (closed) set of alert types;
// the type label and dates are translated/formatted by the views at render time
// from the raw `type` and ISO instants exposed here.
const ALERT_TYPE_TO_SEVERITY: Record<ApiAlertType, AlertSeverity> = {
  expired_lot: 'critique',
  out_of_range: 'alerte',
  sensor_offline: 'alerte',
};

// Optional per-type icon; falls back to the severity's icon.
const ALERT_ICON: Partial<Record<ApiAlertType, string>> = {
  sensor_offline: '📡',
};

const SEVERITY_PRESENTATION: Record<AlertSeverity, {
  icon: string;
  bgColor: string;
  borderColor: string;
}> = {
  critique: { icon: '⛔', bgColor: '#FEF2F2', borderColor: '#9B1C1C' },
  alerte: { icon: '🌡️', bgColor: '#FEF3E2', borderColor: '#B45309' },
};

export function adaptAlert(alert: ApiAlert): Alert {
  const severity = ALERT_TYPE_TO_SEVERITY[alert.type];
  const p = SEVERITY_PRESENTATION[severity];

  return {
    id: alert.uuid,
    severity,
    icon: ALERT_ICON[alert.type] ?? p.icon,
    bgColor: p.bgColor,
    borderColor: p.borderColor,
    type: alert.type,
    triggeredAt: alert.triggeredAt,
    resolvedAt: alert.resolvedAt,
    subject: alert.lot?.label ?? alert.warehouse?.name ?? '—',
    status: alert.resolvedAt !== null ? 'resolved' : 'active',
  };
}

// ── Lot ──
// Maps the enriched wire lot summary to the presentation Lot. Every relation and
// date on the wire can be null, so each one degrades to a blank/neutral value
// rather than throwing. List-level conditions (temp/hum/ideal) and the stay
// history are NOT on the summary — they are filled only in the detail path (see
// `adaptStays` + `fetchLotDetail`), so they stay empty here.
export function adaptLotSummary(api: ApiLotSummary): Lot {
  const statusVariant = lotStatusToVariant(api.status);
  const countryCode = api.country ? toCountryCode(api.country.code) : DEFAULT_COUNTRY_CODE;

  return {
    id: api.label,
    uuid: api.uuid,
    countryCode,
    warehouseId: api.currentWarehouse?.uuid ?? null,
    // Never invent a flag for a country-less lot.
    flag: api.country ? countryFlag(countryCode) : '',
    warehouse: api.currentWarehouse?.name ?? '',
    exploitationId: api.exploitation?.uuid ?? '',
    constitutedAtIso: api.constitutedAt,
    stays: [],
    durationDays: api.durationDays ?? 0,
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
  const code = toCountryCode(api.country.code);
  return {
    id: api.uuid,
    name: api.name,
    countryCode: code,
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
    entreeIso: entry.arrivedAt,
    sortieIso: entry.departedAt,
  }));
}
