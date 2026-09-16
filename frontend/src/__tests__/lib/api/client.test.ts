import { ApiClient, ApiError, DEFAULT_BASE_URL } from '@/lib/api/client';

// jsdom has no Fetch API globals (Response/Request/Headers). The client only
// reads .ok/.status/.text(), so a minimal stand-in is enough.
function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

function envelope<T>(data: T[], total = data.length) {
  return { data, pagination: { page: 1, limit: 50, total, pages: Math.ceil(total / 50) } };
}

describe('ApiClient', () => {
  it('defaults the base URL and prefixes /api paths', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ status: 'ok' }));
    const client = new ApiClient({ fetch: fetchMock });

    await client.getHealth();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(`${DEFAULT_BASE_URL}/api/health`);
  });

  it('honours a custom base URL and strips a trailing slash', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ status: 'ok' }));
    const client = new ApiClient({ baseUrl: 'https://siege.example/', fetch: fetchMock });

    await client.getHealth();

    expect(fetchMock.mock.calls[0][0]).toBe('https://siege.example/api/health');
  });

  it('flattens the nested pagination envelope into a Page', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      jsonResponse({
        data: [{ uuid: 'l-1' }],
        pagination: { page: 2, limit: 10, total: 42, pages: 5 },
      }),
    );
    const client = new ApiClient({ fetch: fetchMock });

    const page = await client.getLots();

    expect(page.items).toEqual([{ uuid: 'l-1' }]);
    expect(page).toMatchObject({ page: 2, limit: 10, total: 42, pages: 5 });
  });

  it('serialises query params and drops null/undefined', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(envelope([])));
    const client = new ApiClient({ baseUrl: 'http://h', fetch: fetchMock });

    await client.getLots({ status: 'expired', country: 'co', warehouse_id: undefined, page: 1 });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('status=expired');
    expect(url).toContain('country=co');
    expect(url).toContain('page=1');
    expect(url).not.toContain('warehouse_id');
  });

  it('sends configurable headers on every request (auth seat)', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(envelope([])));
    const client = new ApiClient({
      baseUrl: 'http://h',
      headers: { Authorization: 'Bearer t0ken' },
      fetch: fetchMock,
    });

    await client.getWarehouses();

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer t0ken');
    expect((init.headers as Record<string, string>).Accept).toBe('application/json');
  });

  it('throws a typed ApiError with status and body on non-2xx', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      jsonResponse({ error: 'Lot not found' }, 404),
    );
    const client = new ApiClient({ baseUrl: 'http://h', fetch: fetchMock });

    await expect(client.getLot('missing')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      body: { error: 'Lot not found' },
    });
    await expect(client.getLot('missing')).rejects.toBeInstanceOf(ApiError);
  });

  it('issues PATCH for alert resolution', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      jsonResponse({ uuid: 'a-1', type: 'expired_lot', triggeredAt: 'x', resolvedAt: 'y', lot: null, warehouse: null }),
    );
    const client = new ApiClient({ baseUrl: 'http://h', fetch: fetchMock });

    await client.resolveAlert('a-1');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://h/api/alerts/a-1/resolve');
    expect((init as RequestInit).method).toBe('PATCH');
  });

  it('builds the warehouse-scoped measurements path', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(envelope([])));
    const client = new ApiClient({ baseUrl: 'http://h', fetch: fetchMock });

    await client.getWarehouseMeasurements('wh-1', { limit: 1 });

    expect(fetchMock.mock.calls[0][0]).toBe('http://h/api/warehouses/wh-1/measurements?limit=1');
  });
});
