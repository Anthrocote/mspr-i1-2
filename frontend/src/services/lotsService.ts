import type { Lot } from '@/types';
import { LOTS } from '@/data/mock';

const USE_MOCK = !process.env.NEXT_PUBLIC_API_URL;

export async function getLots(): Promise<Lot[]> {
  if (USE_MOCK) return LOTS;
  const { apiClient } = await import('./api');
  return apiClient.get<Lot[]>('/lots');
}

export async function getLotById(id: string): Promise<Lot | undefined> {
  if (USE_MOCK) return LOTS.find(l => l.id === id);
  const { apiClient } = await import('./api');
  return apiClient.get<Lot>(`/lots/${id}`);
}
