import { ApiClient } from '@/lib/api/client';
import {
  fetchConsolidatedSummary,
  fetchExploitations,
  fetchLatestMeasurement,
  fetchLotDetail,
  fetchLots,
  fetchRecentAlerts,
  fetchWarehouseConditions,
  fetchWarehouseMeasurements,
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

  it('returns the first item of page 1 (measurements are newest-first)', async () => {
    const newest = {
      uuid: 'm-9',
      warehouseUuid: 'wh-1',
      temperature: 33,
      humidity: 60,
      measuredAt: '2025-02-01T00:00:00Z',
      syncedAt: '2025-02-01T00:00:00Z',
    };
    const fetchMock = router([{ match: /measurements/, body: page([newest, { uuid: 'm-8' }], 9, 1, 1) }]);
    const client = new ApiClient({ baseUrl: 'http://h', fetch: fetchMock as unknown as typeof fetch });

    const latest = await fetchLatestMeasurement(client, 'wh-1');
    expect(latest?.uuid).toBe('m-9');
    expect(latest?.temperature).toBe(33);
  });
});

describe('fetchWarehouseMeasurements', () => {
  it('reverses the newest-first page to oldest-first for the chart', async () => {
    const rows = [
      { uuid: 'm-3', warehouseUuid: 'wh-1', temperature: 27, humidity: 55, measuredAt: '2025-02-01T03:00:00Z', syncedAt: 'x' },
      { uuid: 'm-2', warehouseUuid: 'wh-1', temperature: 26, humidity: 55, measuredAt: '2025-02-01T02:00:00Z', syncedAt: 'x' },
      { uuid: 'm-1', warehouseUuid: 'wh-1', temperature: 25, humidity: 55, measuredAt: '2025-02-01T01:00:00Z', syncedAt: 'x' },
    ];
    const fetchMock = router([{ match: /measurements/, body: page(rows, 3, 1, 200) }]);
    const client = new ApiClient({ baseUrl: 'http://h', fetch: fetchMock as unknown as typeof fetch });

    const out = await fetchWarehouseMeasurements(client, 'wh-1');
    expect(out.map((m) => m.uuid)).toEqual(['m-1', 'm-2', 'm-3']);
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
                country: { code: 'br', name: 'Brésil' },
              },
            ]),
          ),
        );
      }
      if (/\/api\/countries/.test(url)) {
        return Promise.resolve(
          json(page([{ code: 'br', name: 'Brésil', idealTemperature: 29, idealHumidity: 55, lastSyncedAt: null }])),
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

const ENRICHED_LOT = {
  uuid: 'lot-1',
  label: 'LOT-BRA-2025-001',
  quantity: 500,
  status: 'compliant',
  syncedAt: '2026-09-15T10:00:00+00:00',
  product: { uuid: 'p-1', name: 'Arabica' },
  currentWarehouse: { uuid: 'wh-1', name: 'Entrepôt Manaus' },
  country: { code: 'br', name: 'Brésil' },
  exploitation: { uuid: 'exp-1', name: 'Fazenda Serra Verde' },
  constitutedAt: '2026-07-17T00:00:00+00:00',
  arrivedAt: '2026-07-17T00:00:00+00:00',
  durationDays: 60,
};

describe('fetchLots', () => {
  it('pulls a wide page and adapts each summary', async () => {
    const fetchMock = router([{ match: /\/api\/lots/, body: page([ENRICHED_LOT]) }]);
    const client = new ApiClient({ baseUrl: 'http://h', fetch: fetchMock as unknown as typeof fetch });

    const lots = await fetchLots(client);

    expect(fetchMock.mock.calls[0][0]).toContain('limit=200');
    expect(lots).toHaveLength(1);
    expect(lots[0]).toMatchObject({
      id: 'LOT-BRA-2025-001',
      uuid: 'lot-1',
      countryCode: 'br',
      warehouse: 'Entrepôt Manaus',
      exploitationId: 'exp-1',
      durationDays: 60,
      statusVariant: 'ok',
    });
  });
});

describe('fetchExploitations', () => {
  it('adapts the exploitations with their API lot count', async () => {
    const fetchMock = router([
      {
        match: /\/api\/exploitations/,
        body: page([
          { uuid: 'exp-1', name: 'Fazenda Serra Verde', country: { code: 'br', name: 'Brésil' }, lotsCount: 7 },
        ]),
      },
    ]);
    const client = new ApiClient({ baseUrl: 'http://h', fetch: fetchMock as unknown as typeof fetch });

    const farms = await fetchExploitations(client);

    expect(farms).toHaveLength(1);
    expect(farms[0]).toMatchObject({
      id: 'exp-1',
      name: 'Fazenda Serra Verde',
      countryCode: 'br',
      lots: 7,
    });
  });
});

describe('fetchLotDetail', () => {
  it('composes the lot, its stays and the latest warehouse reading', async () => {
    const detail = {
      ...ENRICHED_LOT,
      storageHistory: [
        { warehouse: { uuid: 'wh-1', name: 'Entrepôt Manaus' }, arrivedAt: '2026-07-17T00:00:00Z', departedAt: null },
      ],
    };
    const fetchMock = jest.fn((url: string) => {
      if (/\/api\/lots\/lot-1/.test(url)) return Promise.resolve(json(detail));
      // getCountry('br') -> ideal band source.
      if (/\/api\/countries\/br/.test(url)) {
        return Promise.resolve(json({ code: 'br', name: 'Brésil', idealTemperature: 29, idealHumidity: 55, lastSyncedAt: null }));
      }
      // Single measurement -> probe returns it directly.
      if (/measurements/.test(url)) {
        return Promise.resolve(json(page([{ uuid: 'm-1', warehouseUuid: 'wh-1', temperature: 31.4, humidity: 56.8, measuredAt: 'x', syncedAt: 'x' }], 1, 1, 1)));
      }
      throw new Error(`Unrouted ${url}`);
    });
    const client = new ApiClient({ baseUrl: 'http://h', fetch: fetchMock as unknown as typeof fetch });

    const result = await fetchLotDetail(client, 'lot-1');

    expect(result.lot.id).toBe('LOT-BRA-2025-001');
    expect(result.stays).toEqual([
      { warehouse: 'Entrepôt Manaus', entreeIso: '2026-07-17T00:00:00Z', sortieIso: null },
    ]);
    expect(result.temp).toBe(31.4);
    expect(result.hum).toBe(56.8);
    // Ideal band derived from the country + front tolerance policy.
    expect(result.idealTemp).toBe('29°C ±3');
    expect(result.idealHum).toBe('55% ±2');
  });

  it('omits temp/hum when the lot has no current warehouse', async () => {
    const detail = { ...ENRICHED_LOT, currentWarehouse: null, storageHistory: [] };
    const fetchMock = router([
      { match: /\/api\/lots\/lot-1/, body: detail },
      { match: /\/api\/countries\/br/, body: { code: 'br', name: 'Brésil', idealTemperature: 29, idealHumidity: 55, lastSyncedAt: null } },
    ]);
    const client = new ApiClient({ baseUrl: 'http://h', fetch: fetchMock as unknown as typeof fetch });

    const result = await fetchLotDetail(client, 'lot-1');

    expect(result.temp).toBeUndefined();
    expect(result.hum).toBeUndefined();
    expect(result.stays).toEqual([]);
    // Ideal is still resolved from the country even without a current reading.
    expect(result.idealTemp).toBe('29°C ±3');
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
    expect(alerts[0].type).toBe('expired_lot');
    expect(alerts[0].subject).toBe('LOT-X');
  });
});
