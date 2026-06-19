import type { Alert, DashboardAlert } from '@/types';
import { ALERTS, DASHBOARD_ALERTS } from '@/data/mock';

const USE_MOCK = !process.env.NEXT_PUBLIC_API_URL;

export async function getAlerts(): Promise<Alert[]> {
  if (USE_MOCK) return ALERTS;
  const { apiClient } = await import('./api');
  return apiClient.get<Alert[]>('/alerts');
}

export async function getDashboardAlerts(): Promise<DashboardAlert[]> {
  if (USE_MOCK) return DASHBOARD_ALERTS;
  const { apiClient } = await import('./api');
  return apiClient.get<DashboardAlert[]>('/alerts/dashboard');
}
