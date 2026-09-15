// Composition layer: turns one-or-more raw API calls into ready-to-render
// presentation data. Kept separate from the client (transport) and adapters
// (pure mapping) so the fetch orchestration is testable in isolation.

import type { Alert, StatusDistribution, Warehouse } from '@/types';
import { LOT_STATUSES, type ApiLotStatus, type ApiMeasurement } from './types';
import { ApiClient, type Page, type RequestOptions } from './client';
import {
  adaptAlert,
  adaptWarehouse,
  distributionFromCounts,
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

// Raw lots page (transport-level). Presentation Lot adaptation is partial while
// the siège lot payload stays thin — see `adaptLotSummary`.
export function fetchLotsPage(
  client: ApiClient,
  params?: Record<string, string | number>,
  options?: RequestOptions,
): Promise<Page<import('./types').ApiLotSummary>> {
  return client.getLots(params, options);
}
