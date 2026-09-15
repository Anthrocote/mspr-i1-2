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
  isoToCountryCode,
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

// The measurements list is ordered oldest-first and there is no dedicated
// "latest" route, so the newest reading sits on the last page. Read the total
// with a size-1 probe, then jump straight to the last element.
export async function fetchLatestMeasurement(
  client: ApiClient,
  warehouseUuid: string,
  options?: RequestOptions,
): Promise<ApiMeasurement | null> {
  const probe = await client.getWarehouseMeasurements(warehouseUuid, { limit: 1, page: 1 }, options);
  if (probe.total === 0) return null;
  if (probe.total === 1) return probe.items[0] ?? null;

  const last = await client.getWarehouseMeasurements(
    warehouseUuid,
    { limit: 1, page: probe.total },
    options,
  );
  return last.items[0] ?? null;
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

  const countryById = new Map(countriesPage.items.map((c) => [c.id, c]));

  return Promise.all(
    warehousesPage.items.map(async (warehouse) => {
      const country = countryById.get(warehouse.country.id);
      if (!country) {
        throw new Error(`Country ${warehouse.country.id} missing for warehouse ${warehouse.uuid}`);
      }
      const [latest, lotsPage] = await Promise.all([
        fetchLatestMeasurement(client, warehouse.uuid, options),
        client.getLots({ warehouse_id: warehouse.uuid, limit: 1, page: 1 }, options),
      ]);
      return adaptWarehouse({ warehouse, country, latest, lots: lotsPage.total });
    }),
  );
}

// Time-ordered (oldest-first) measurements for one warehouse, used to build the
// IoT charts. `params` carries the window bound (`from`) and paging; the wide
// default limit keeps a single call enough for the visible ranges.
export async function fetchWarehouseMeasurements(
  client: ApiClient,
  warehouseUuid: string,
  params?: QueryParams,
  options?: RequestOptions,
): Promise<ApiMeasurement[]> {
  const page = await client.getWarehouseMeasurements(
    warehouseUuid,
    { limit: 500, ...params },
    options,
  );
  return page.items;
}

// Per-country roll-up for the exploitations page. Every figure is sourced:
//   - ideal temp/humidity from /api/countries;
//   - lots / warehouses / alerts counts from the pagination total of a size-1
//     query filtered by `country_id` (a verified filter on all three routes);
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
      const code = isoToCountryCode(country.isoCode);
      const [lots, warehouses, alerts] = await Promise.all([
        client.getLots({ country_id: country.id, limit: 1, page: 1 }, options),
        client.getWarehouses({ country_id: country.id, limit: 1, page: 1 }, options),
        client.getAlerts({ country_id: country.id, limit: 1, page: 1 }, options),
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

// Active alerts, most recent first, adapted to the presentation Alert shape.
export async function fetchRecentAlerts(
  client: ApiClient,
  limit = 50,
  options?: RequestOptions,
): Promise<Alert[]> {
  const page = await client.getAlerts({ limit, page: 1 }, options);
  return page.items
    .slice()
    .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())
    .map(adaptAlert);
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

  if (!detail.currentWarehouse) {
    return { lot, stays };
  }

  const latest = await fetchLatestMeasurement(client, detail.currentWarehouse.uuid, options);
  if (!latest) {
    return { lot, stays };
  }

  return { lot, stays, temp: latest.temperature, hum: latest.humidity };
}
