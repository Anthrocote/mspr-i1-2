import { ApiClient } from '@/lib/api/client';
import {
  fetchConsolidatedSummary,
  fetchLatestMeasurement,
  fetchRecentAlerts,
  fetchWarehouseConditions,
} from '@/lib/api/queries';

// jsdom has no Fetch API globals; the client only reads .ok/.status/.text().
function json(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

function page<T>(data: T[], total = data.length, pageNo = 1, limit = 50) {
  return { data, pagination: { page: pageNo, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } };
}

// A fetch that routes by URL so a query function's whole orchestration can be
// exercised end to end against a canned siège.
function router(routes: Array<{ match: RegExp; body: unknown; status?: number }>) {
  return jest.fn((url: string) => {
    const route = routes.find((r) => r.match.test(url));
    if (!route) throw new Error(`Unrouted fetch: ${url}`);
    return Promise.resolve(json(route.body, route.status));
  });
}

describe('fetchConsolidatedSummary', () => {
  it('counts lots per status via the pagination total', async () => {
    const fetchMock = router([
      { match: /status=compliant/, body: page([], 174) },
      { match: /status=in_alert/, body: page([], 72) },
      { match: /status=expired/, body: page([], 2) },
    ]);
    const client = new ApiClient({ baseUrl: 'http://h', fetch: fetchMock as unknown as typeof fetch });

    const summary = await fetchConsolidatedSummary(client);

    expect(summary.totalLots).toBe(248);
    expect(summary.distribution).toEqual({ conforme: 174, alerte: 72, perime: 2 });
  });
});

describe('fetchLatestMeasurement', () => {
  it('returns null when a warehouse has no readings', async () => {
    const fetchMock = router([{ match: /measurements/, body: page([], 0) }]);
    const client = new ApiClient({ baseUrl: 'http://h', fetch: fetchMock as unknown as typeof fetch });

    expect(await fetchLatestMeasurement(client, 'wh-1')).toBeNull();
  });

  it('jumps to the last page (newest) since the list is ordered oldest-first', async () => {
    const newest = {
      uuid: 'm-9',
      warehouseUuid: 'wh-1',
      temperature: 33,
      humidity: 60,
      measuredAt: '2025-02-01T00:00:00Z',
      syncedAt: '2025-02-01T00:00:00Z',
    };
    const fetchMock = jest.fn((url: string) => {
      // Probe: page=1 -> total known, oldest row.
      if (/page=1/.test(url)) return Promise.resolve(json(page([{ uuid: 'm-1' }], 9, 1, 1)));
      // Last page (page=9 with limit=1) -> newest row.
      if (/page=9/.test(url)) return Promise.resolve(json(page([newest], 9, 9, 1)));
      throw new Error(`Unexpected ${url}`);
    });
    const client = new ApiClient({ baseUrl: 'http://h', fetch: fetchMock as unknown as typeof fetch });

    const latest = await fetchLatestMeasurement(client, 'wh-1');
    expect(latest?.uuid).toBe('m-9');
    expect(latest?.temperature).toBe(33);
  });
});

describe('fetchWarehouseConditions', () => {
  it('joins warehouses, countries, latest readings and lot counts', async () => {
    const fetchMock = jest.fn((url: string) => {
      if (/\/api\/warehouses\?/.test(url)) {
        return Promise.resolve(
          json(
            page([
              {
                uuid: 'wh-1',
                name: 'Entrepôt Manaus',
                streetNumber: 12,
                address: 'Rua',
                postalCode: 69000,
                city: 'Manaus',
                active: true,
                country: { id: 1, name: 'Brésil', isoCode: 'BRA' },
              },
            ]),
          ),
        );
      }
      if (/\/api\/countries/.test(url)) {
        return Promise.resolve(
          json(page([{ id: 1, name: 'Brésil', isoCode: 'BRA', idealTemperature: 29, idealHumidity: 55, lastSyncedAt: null }])),
        );
      }
      if (/measurements/.test(url)) {
        return Promise.resolve(
          json(page([{ uuid: 'm-1', warehouseUuid: 'wh-1', temperature: 31, humidity: 56, measuredAt: 'x', syncedAt: 'x' }], 1, 1, 1)),
        );
      }
      if (/\/api\/lots\?/.test(url)) {
        return Promise.resolve(json(page([], 48)));
      }
      throw new Error(`Unrouted ${url}`);
    });
    const client = new ApiClient({ baseUrl: 'http://h', fetch: fetchMock as unknown as typeof fetch });

    const warehouses = await fetchWarehouseConditions(client);

    expect(warehouses).toHaveLength(1);
    expect(warehouses[0]).toMatchObject({
      id: 'wh-1',
      name: 'Entrepôt Manaus',
      countryCode: 'br',
      tempNum: 31,
      humNum: 56,
      lots: 48,
    });
  });
});

describe('fetchRecentAlerts', () => {
  it('sorts newest-first and adapts to the presentation shape', async () => {
    const fetchMock = router([
      {
        match: /\/api\/alerts/,
        body: page([
          { uuid: 'a-old', type: 'out_of_range', triggeredAt: '2025-01-01T00:00:00Z', resolvedAt: null, lot: null, warehouse: { uuid: 'w', name: 'Quito' } },
          { uuid: 'a-new', type: 'expired_lot', triggeredAt: '2025-03-01T00:00:00Z', resolvedAt: null, lot: { uuid: 'l', label: 'LOT-X' }, warehouse: null },
        ]),
      },
    ]);
    const client = new ApiClient({ baseUrl: 'http://h', fetch: fetchMock as unknown as typeof fetch });

    const alerts = await fetchRecentAlerts(client);

    expect(alerts.map((a) => a.id)).toEqual(['a-new', 'a-old']);
    expect(alerts[0].severity).toBe('critique');
    expect(alerts[0].title).toBe('Lot périmé — LOT-X');
  });
});
