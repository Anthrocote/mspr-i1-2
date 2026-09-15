// Exact mirror of the siège (Symfony) REST JSON. These are transport types:
// they carry the wire shape verbatim and are intentionally DISTINCT from the
// presentation types in `@/types`. Never render these directly — pass them
// through `adapters.ts` first.
//
// Contract verified against backend-siege/src/Controller/*.php on 2025-09-15.
// Notable facts (they contradict some early assumptions):
//   - The pagination envelope nests page/limit/total/pages under `pagination`.
//   - Country iso field is `isoCode` (not `codeIso`) and is 3 letters (BRA/ECU/COL).
//   - Warehouses carry NO temperature/humidity readings; those live on measurements.
//   - Lot summaries are thin: no country, warehouse, dates, or conditions.
//   - Alerts carry no severity/title/description; only `type` + relations.

export const LOT_STATUSES = ['compliant', 'in_alert', 'expired'] as const;
export type ApiLotStatus = (typeof LOT_STATUSES)[number];

export const ALERT_TYPES = ['out_of_range', 'expired_lot'] as const;
export type ApiAlertType = (typeof ALERT_TYPES)[number];

// Wire envelope: `{ data, pagination: { page, limit, total, pages } }`.
export interface ApiPaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiEnvelope<T> {
  data: T[];
  pagination: ApiPaginationMeta;
}

export interface ApiProductRef {
  uuid: string;
  name: string;
}

export interface ApiLotSummary {
  uuid: string;
  label: string;
  quantity: number;
  status: ApiLotStatus;
  syncedAt: string; // ISO 8601 (ATOM)
  product: ApiProductRef;
}

export interface ApiStorageHistoryEntry {
  warehouse: { uuid: string; name: string };
  arrivedAt: string; // ISO 8601
  departedAt: string | null; // null while the lot is still there
}

export interface ApiLotDetail extends ApiLotSummary {
  storageHistory: ApiStorageHistoryEntry[];
}

export interface ApiMeasurement {
  uuid: string;
  warehouseUuid: string;
  temperature: number; // float, °C
  humidity: number; // float, %
  measuredAt: string; // ISO 8601
  syncedAt: string; // ISO 8601
}

export interface ApiCountryRef {
  id: number;
  name: string;
  isoCode: string; // 3 letters, e.g. BRA/ECU/COL
}

export interface ApiWarehouse {
  uuid: string;
  name: string;
  streetNumber: number | null;
  address: string | null;
  postalCode: number | null;
  city: string | null;
  active: boolean;
  country: ApiCountryRef;
}

export interface ApiCountry {
  id: number;
  name: string;
  isoCode: string;
  idealTemperature: number; // float, °C
  idealHumidity: number; // float, %
  lastSyncedAt: string | null;
}

export interface ApiAlertLotRef {
  uuid: string;
  label: string;
}

export interface ApiAlertWarehouseRef {
  uuid: string;
  name: string;
}

export interface ApiAlert {
  uuid: string;
  type: ApiAlertType;
  triggeredAt: string; // ISO 8601
  resolvedAt: string | null;
  lot: ApiAlertLotRef | null;
  warehouse: ApiAlertWarehouseRef | null;
}

export interface ApiProduct {
  uuid: string;
  name: string;
  description: string | null;
  variety: string | null;
  intensity: number | null;
  bitterness: number | null;
  acidity: number | null;
  body: number | null;
}

export interface ApiHealth {
  status: string;
}
