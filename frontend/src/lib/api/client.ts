import type {
  ApiAlert,
  ApiCountry,
  ApiEnvelope,
  ApiExploitation,
  ApiHealth,
  ApiLotDetail,
  ApiLotSummary,
  ApiMeasurement,
  ApiPaginationMeta,
  ApiProduct,
  ApiWarehouse,
} from './types';

// Default base URL for local development. Override with NEXT_PUBLIC_API_URL.
// It is a build-time-inlined public variable (NEXT_PUBLIC_ prefix) because the
// current pages fetch from the browser (Client Components); a non-public var
// would be undefined there.
export const DEFAULT_BASE_URL = 'http://localhost:8000';

// A single page of results, flattened from the wire envelope so callers never
// touch the nested `pagination` object.
export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Thrown for any non-2xx response. Carries enough context to log or branch on
// (e.g. 404 vs 409 on alert resolve) without re-parsing the response.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
    readonly body: unknown,
    message?: string,
  ) {
    super(message ?? `API request failed: ${status} ${url}`);
    this.name = 'ApiError';
  }
}

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

export interface ApiClientOptions {
  baseUrl?: string;
  // Extra headers merged into every request. The seat for auth once the siège
  // introduces it (e.g. { Authorization: `Bearer ${token}` }); no auth today.
  headers?: Record<string, string>;
  // Injectable for tests; defaults to the global fetch.
  fetch?: typeof fetch;
}

function buildQuery(params?: QueryParams): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    search.append(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

function toPage<T>(envelope: ApiEnvelope<T>): Page<T> {
  const meta: ApiPaginationMeta = envelope.pagination;
  return {
    items: envelope.data,
    page: meta.page,
    limit: meta.limit,
    total: meta.total,
    pages: meta.pages,
  };
}

export interface RequestOptions {
  signal?: AbortSignal;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly injectedFetch?: typeof fetch;

  constructor(options: ApiClientOptions = {}) {
    const base =
      options.baseUrl ??
      process.env.NEXT_PUBLIC_API_URL ??
      DEFAULT_BASE_URL;
    this.baseUrl = base.replace(/\/+$/, '');
    this.headers = options.headers ?? {};
    // Keep the injected fetch (if any). Resolution of the global fetch is
    // deferred to request time: constructing the shared client must not touch
    // `fetch`, which is absent in some environments (e.g. jsdom at import).
    this.injectedFetch = options.fetch;
  }

  // Bind to globalThis so the native fetch keeps a valid `this` when called.
  private resolveFetch(): typeof fetch {
    if (this.injectedFetch) return this.injectedFetch;
    if (typeof globalThis.fetch === 'function') return globalThis.fetch.bind(globalThis);
    throw new Error('No fetch implementation available; pass options.fetch to ApiClient');
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    options: RequestOptions = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await this.resolveFetch()(url, {
      ...init,
      signal: options.signal,
      headers: {
        Accept: 'application/json',
        ...this.headers,
        ...init.headers,
      },
    });

    const raw = await response.text();
    const body = raw ? safeJsonParse(raw) : null;

    if (!response.ok) {
      throw new ApiError(response.status, url, body);
    }

    return body as T;
  }

  private async getPage<T>(
    path: string,
    params?: QueryParams,
    options?: RequestOptions,
  ): Promise<Page<T>> {
    const envelope = await this.request<ApiEnvelope<T>>(
      `${path}${buildQuery(params)}`,
      {},
      options,
    );
    return toPage(envelope);
  }

  // ── Lots ──
  getLots(params?: QueryParams, options?: RequestOptions): Promise<Page<ApiLotSummary>> {
    return this.getPage<ApiLotSummary>('/api/lots', params, options);
  }

  getLot(uuid: string, options?: RequestOptions): Promise<ApiLotDetail> {
    return this.request<ApiLotDetail>(`/api/lots/${encodeURIComponent(uuid)}`, {}, options);
  }

  // ── Exploitations ──
  getExploitations(params?: QueryParams, options?: RequestOptions): Promise<Page<ApiExploitation>> {
    return this.getPage<ApiExploitation>('/api/exploitations', params, options);
  }

  getExploitation(uuid: string, options?: RequestOptions): Promise<ApiExploitation> {
    return this.request<ApiExploitation>(`/api/exploitations/${encodeURIComponent(uuid)}`, {}, options);
  }

  // ── Measurements ──
  getMeasurements(params?: QueryParams, options?: RequestOptions): Promise<Page<ApiMeasurement>> {
    return this.getPage<ApiMeasurement>('/api/measurements', params, options);
  }

  getWarehouseMeasurements(
    uuid: string,
    params?: QueryParams,
    options?: RequestOptions,
  ): Promise<Page<ApiMeasurement>> {
    return this.getPage<ApiMeasurement>(
      `/api/warehouses/${encodeURIComponent(uuid)}/measurements`,
      params,
      options,
    );
  }

  // ── Warehouses ──
  getWarehouses(params?: QueryParams, options?: RequestOptions): Promise<Page<ApiWarehouse>> {
    return this.getPage<ApiWarehouse>('/api/warehouses', params, options);
  }

  getWarehouse(uuid: string, options?: RequestOptions): Promise<ApiWarehouse> {
    return this.request<ApiWarehouse>(`/api/warehouses/${encodeURIComponent(uuid)}`, {}, options);
  }

  // ── Alerts ──
  getAlerts(params?: QueryParams, options?: RequestOptions): Promise<Page<ApiAlert>> {
    return this.getPage<ApiAlert>('/api/alerts', params, options);
  }

  resolveAlert(uuid: string, options?: RequestOptions): Promise<ApiAlert> {
    return this.request<ApiAlert>(
      `/api/alerts/${encodeURIComponent(uuid)}/resolve`,
      { method: 'PATCH' },
      options,
    );
  }

  // ── Countries ──
  getCountries(params?: QueryParams, options?: RequestOptions): Promise<Page<ApiCountry>> {
    return this.getPage<ApiCountry>('/api/countries', params, options);
  }

  getCountry(code: string, options?: RequestOptions): Promise<ApiCountry> {
    return this.request<ApiCountry>(`/api/countries/${encodeURIComponent(code)}`, {}, options);
  }

  // ── Products ──
  getProducts(params?: QueryParams, options?: RequestOptions): Promise<Page<ApiProduct>> {
    return this.getPage<ApiProduct>('/api/products', params, options);
  }

  getProduct(uuid: string, options?: RequestOptions): Promise<ApiProduct> {
    return this.request<ApiProduct>(`/api/products/${encodeURIComponent(uuid)}`, {}, options);
  }

  // ── System ──
  getHealth(options?: RequestOptions): Promise<ApiHealth> {
    return this.request<ApiHealth>('/api/health', {}, options);
  }
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

// Shared default instance for app code. Tests build their own with an injected
// fetch and base URL.
export const apiClient = new ApiClient();
