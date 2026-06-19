import type { Warehouse } from '@/types';
import { WAREHOUSES } from '@/data/mock';

const USE_MOCK = !process.env.NEXT_PUBLIC_API_URL;

export async function getWarehouses(): Promise<Warehouse[]> {
  if (USE_MOCK) return WAREHOUSES;
  const { apiClient } = await import('./api');
  return apiClient.get<Warehouse[]>('/warehouses');
}

export async function getWarehouseById(id: string): Promise<Warehouse | undefined> {
  if (USE_MOCK) return WAREHOUSES.find(w => w.id === id);
  const { apiClient } = await import('./api');
  return apiClient.get<Warehouse>(`/warehouses/${id}`);
}
