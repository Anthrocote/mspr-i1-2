// Composition layer: turns one-or-more raw API calls into ready-to-render
// presentation data. Kept separate from the client (transport) and adapters
// (pure mapping) so the fetch orchestration is testable in isolation.

import type { Alert, CountryCode, Farm, Lot, StatusDistribution, Warehouse, WarehouseStay } from '@/types';
import { LOT_STATUSES, type ApiLotStatus, type ApiMeasurement } from './types';
import { ApiClient, type Page, type QueryParams, type RequestOptions } from './client';
import {
  adaptAlert,
  adaptExploitation,
  adaptLotSummary,
  adaptStays,
  adaptWarehouse,
  countryFlag,
  distributionFromCounts,
  formatHumidity,
  formatTemperature,
  toCountryCode,
  HUM_TOLERANCE,
  TEMP_TOLERANCE,
} from './adapters';

// Consolidated headline the dashboard shows. `enTransit` is intentionally
// ABSENT: the siège has no "in transit" concept on lots and no aggregate
// endpoint, so it cannot be sourced without a backend change (out of scope).
export interface ConsolidatedSummaryData {
  totalLots: number;
  distribution: StatusDistribution;
}

// Count lots per status by reading the pagination total of a filtered,
// size-1 query — cheap (no rows transferred) and exact. Runs the three status
// queries in parallel.
export async function fetchConsolidatedSummary(
  client: ApiClient,
  options?: RequestOptions,
): Promise<ConsolidatedSummaryData> {
  const pages = await Promise.all(
    LOT_STATUSES.map((status) =>
      client.getLots({ status, limit: 1, page: 1 }, options),
    ),
  );

  const counts = LOT_STATUSES.reduce(
    (acc, status, i) => {
      acc[status] = pages[i].total;
      return acc;
    },
    {} as Record<ApiLotStatus, number>,
  );

  const totalLots = counts.compliant + counts.in_alert + counts.expired;
  return { totalLots, distribution: distributionFromCounts(counts) };
}

// The measurements list is newest-first, so the latest reading is the first item
// of page 1 — a single call.
export async function fetchLatestMeasurement(
  client: ApiClient,
  warehouseUuid: string,
  options?: RequestOptions,
): Promise<ApiMeasurement | null> {
  const page = await client.getWarehouseMeasurements(warehouseUuid, { limit: 1, page: 1 }, options);
  return page.items[0] ?? null;
}

// Compose the watchlist/IoT warehouse view: each warehouse joined with its
// country's ideal thresholds, its latest reading, and its lot count.
export async function fetchWarehouseConditions(
  client: ApiClient,
  options?: RequestOptions,
): Promise<Warehouse[]> {
  const [warehousesPage, countriesPage] = await Promise.all([
    client.getWarehouses({ limit: 200 }, options),
    client.getCountries({ limit: 200 }, options),
  ]);

  const countryByCode = new Map(countriesPage.items.map((c) => [c.code, c]));

  return Promise.all(
    warehousesPage.items.map(async (warehouse) => {
      const country = countryByCode.get(warehouse.country.code);
      if (!country) {
        throw new Error(`Country ${warehouse.country.code} missing for warehouse ${warehouse.uuid}`);
      }
      const [latest, lotsPage] = await Promise.all([
        fetchLatestMeasurement(client, warehouse.uuid, options),
        client.getLots({ warehouse_id: warehouse.uuid, limit: 1, page: 1 }, options),
      ]);
      return adaptWarehouse({ warehouse, country, latest, lots: lotsPage.total });
    }),
  );
}

// Measurements for one warehouse, used to build the IoT charts. The siège
// returns the FULL range in one response when a date filter (`from`/`to`) is
// present — the chart always passes `from`, so this is a single request, not a
// page walk. The API returns them newest-first; reverse to oldest-first so the
// chart plots left-to-right in time.
export async function fetchWarehouseMeasurements(
  client: ApiClient,
  warehouseUuid: string,
  params?: QueryParams,
  options?: RequestOptions,
): Promise<ApiMeasurement[]> {
  const page = await client.getWarehouseMeasurements(warehouseUuid, params, options);
  return page.items.slice().reverse();
}

// Per-country roll-up for the exploitations page. Every figure is sourced:
//   - ideal temp/humidity from /api/countries;
//   - lots / warehouses / alerts counts from the pagination total of a size-1
//     query filtered by `country` (the 2-letter code, a verified filter on all
//     three routes);
//   - farms counted client-side from the exploitations list (the exploitations
//     route exposes no verified country filter, so grouping the fetched farms is
//     the honest source).
export interface CountrySummary {
  countryCode: CountryCode;
  name: string;
  flag: string;
  ideal: string;
  farms: number;
  warehouses: number;
  lots: number;
  alerts: number;
}

export async function fetchCountrySummaries(
  client: ApiClient,
  options?: RequestOptions,
): Promise<CountrySummary[]> {
  const [countriesPage, farms] = await Promise.all([
    client.getCountries({ limit: 200 }, options),
    fetchExploitations(client, options),
  ]);

  const farmsByCode = farms.reduce((acc, farm) => {
    acc.set(farm.countryCode, (acc.get(farm.countryCode) ?? 0) + 1);
    return acc;
  }, new Map<CountryCode, number>());

  return Promise.all(
    countriesPage.items.map(async (country) => {
      const code = toCountryCode(country.code);
      const [lots, warehouses, alerts] = await Promise.all([
        client.getLots({ country: country.code, limit: 1, page: 1 }, options),
        client.getWarehouses({ country: country.code, limit: 1, page: 1 }, options),
        client.getAlerts({ country: country.code, limit: 1, page: 1 }, options),
      ]);
      return {
        countryCode: code,
        name: country.name,
        flag: countryFlag(code),
        ideal: `${formatTemperature(country.idealTemperature)} · ${formatHumidity(country.idealHumidity)}`,
        farms: farmsByCode.get(code) ?? 0,
        warehouses: warehouses.total,
        lots: lots.total,
        alerts: alerts.total,
      };
    }),
  );
}

// Active alerts (unresolved), most recent first, adapted to the presentation
// Alert shape. Resolved alerts are filtered out so the list reflects what still
// needs attention rather than a historical log.
export async function fetchRecentAlerts(
  client: ApiClient,
  limit = 50,
  options?: RequestOptions,
): Promise<Alert[]> {
  const page = await client.getAlerts({ limit, page: 1 }, options);
  return page.items
    .filter((a) => a.resolvedAt === null)
    .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())
    .map(adaptAlert);
}

// ── Alerts history (server-paginated) ──
// Filters (status/type/date range) AND pagination are applied by the siège, so
// nothing is capped or filtered client-side. The list arrives newest-first from
// the server; the adapter only maps each row.
export type AlertStatusFilter = 'active' | 'resolved' | 'all';

export interface AlertsQuery {
  status?: AlertStatusFilter;
  type?: string;
  from?: string; // ISO 8601 (inclusive lower bound on triggeredAt)
  to?: string; // ISO 8601 (inclusive upper bound on triggeredAt)
  page?: number;
  limit?: number;
}

export interface AlertsPageResult {
  alerts: Alert[];
  page: number;
  pages: number;
  total: number;
}

export async function fetchAlertsPage(
  client: ApiClient,
  query: AlertsQuery = {},
  options?: RequestOptions,
): Promise<AlertsPageResult> {
  const params: QueryParams = {
    status: query.status,
    type: query.type,
    from: query.from,
    to: query.to,
    page: query.page,
    limit: query.limit,
  };
  const page = await client.getAlerts(params, options);
  return {
    alerts: page.items.map(adaptAlert),
    page: page.page,
    pages: page.pages,
    total: page.total,
  };
}

// Raw lots page (transport-level), for callers that need pagination metadata.
export function fetchLotsPage(
  client: ApiClient,
  params?: QueryParams,
  options?: RequestOptions,
): Promise<Page<import('./types').ApiLotSummary>> {
  return client.getLots(params, options);
}

// The lots table renders a filtered/sorted/paged client-side view, so pull a
// wide page in one call and adapt it. `limit` defaults to 200 but stays
// overridable through `params`.
export async function fetchLots(
  client: ApiClient,
  params?: QueryParams,
  options?: RequestOptions,
): Promise<Lot[]> {
  const page = await client.getLots({ limit: 200, ...params }, options);
  return page.items.map(adaptLotSummary);
}

// ── Lots table (server-paginated) ──
// Filters (status/location/age/search), sorting and pagination are all applied
// by the siège, so the table is never capped or re-sorted client-side.
export type LotAgeFilter = 'lt90' | '90_180' | '180_365' | 'gt365';
export type LotSortField = 'id' | 'country' | 'warehouse' | 'duration' | 'status';
export type SortOrder = 'asc' | 'desc';

export interface LotsQuery {
  status?: ApiLotStatus;
  country?: string;
  warehouseId?: string;
  search?: string;
  age?: LotAgeFilter;
  sort?: LotSortField;
  order?: SortOrder;
  page?: number;
  limit?: number;
}

export interface LotsPageResult {
  lots: Lot[];
  page: number;
  pages: number;
  total: number;
}

export async function fetchLotsServer(
  client: ApiClient,
  query: LotsQuery = {},
  options?: RequestOptions,
): Promise<LotsPageResult> {
  const params: QueryParams = {
    status: query.status,
    country: query.country,
    warehouse_id: query.warehouseId,
    search: query.search,
    age: query.age,
    sort: query.sort,
    order: query.order,
    page: query.page,
    limit: query.limit,
  };
  const page = await client.getLots(params, options);
  return {
    lots: page.items.map(adaptLotSummary),
    page: page.page,
    pages: page.pages,
    total: page.total,
  };
}

// Location filter options for the lots table. With server-side pagination the
// current page no longer contains every country/warehouse, so the filter is
// sourced from the dedicated list endpoints instead of the page on screen.
export interface LotFilterCountry {
  code: CountryCode;
  name: string;
  flag: string;
}
export interface LotFilterWarehouse {
  id: string; // uuid
  name: string;
  countryCode: CountryCode;
}
export interface LotFilterOptions {
  countries: LotFilterCountry[];
  warehouses: LotFilterWarehouse[];
}

export async function fetchLotFilterOptions(
  client: ApiClient,
  options?: RequestOptions,
): Promise<LotFilterOptions> {
  const [countries, warehouses] = await Promise.all([
    client.getCountries({ limit: 200 }, options),
    client.getWarehouses({ limit: 200 }, options),
  ]);
  return {
    countries: countries.items.map((c) => {
      const code = toCountryCode(c.code);
      return { code, name: c.name, flag: countryFlag(code) };
    }),
    warehouses: warehouses.items.map((w) => ({
      id: w.uuid,
      name: w.name,
      countryCode: toCountryCode(w.country.code),
    })),
  };
}

// Partner exploitations with their resolved country and API lot count.
export async function fetchExploitations(
  client: ApiClient,
  options?: RequestOptions,
): Promise<Farm[]> {
  const page = await client.getExploitations({ limit: 200 }, options);
  return page.items.map(adaptExploitation);
}

export interface LotDetailData {
  lot: Lot;
  stays: WarehouseStay[];
  temp?: number;
  hum?: number;
  // Ideal temp/humidity band of the lot's (current) country, preformatted like
  // the warehouse ideal (e.g. "29°C ±3"). Absent when the lot has no country.
  idealTemp?: string;
  idealHum?: string;
}

// Compose the lot detail view: the lot itself (enriched summary), its warehouse
// stay history, and the current warehouse's latest reading. Temperature and
// humidity live on measurements at the warehouse level, so they are resolved
// from `currentWarehouse`; a lot with no current warehouse or no reading yet
// simply comes back without temp/hum.
export async function fetchLotDetail(
  client: ApiClient,
  uuid: string,
  options?: RequestOptions,
): Promise<LotDetailData> {
  const detail = await client.getLot(uuid, options);
  const lot = adaptLotSummary(detail);
  const stays = adaptStays(detail.storageHistory);

  // Ideal band comes from the lot's (current-warehouse) country; the tolerance
  // policy is the same front-side one the warehouse conditions use.
  let idealTemp: string | undefined;
  let idealHum: string | undefined;
  if (detail.country) {
    const country = await client.getCountry(detail.country.code, options);
    idealTemp = `${formatTemperature(country.idealTemperature)} ±${TEMP_TOLERANCE}`;
    idealHum = `${formatHumidity(country.idealHumidity)} ±${HUM_TOLERANCE}`;
  }

  if (!detail.currentWarehouse) {
    return { lot, stays, idealTemp, idealHum };
  }

  const latest = await fetchLatestMeasurement(client, detail.currentWarehouse.uuid, options);
  if (!latest) {
    return { lot, stays, idealTemp, idealHum };
  }

  return { lot, stays, temp: latest.temperature, hum: latest.humidity, idealTemp, idealHum };
}
