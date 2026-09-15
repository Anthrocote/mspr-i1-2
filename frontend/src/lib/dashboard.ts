import type { Warehouse, Alert, StatusDistribution, BadgeVariant } from '@/types';

// One reading (temperature or humidity) scored against the warehouse's own
// acceptable band. The band is [min, max] = ideal ± tolerance, so the midpoint
// is the ideal and half the span is the tolerance. `ratio` is unit-agnostic
// (1.0 == exactly at the tolerance edge), which lets temperature and humidity
// be compared and ranked on the same scale.
export interface Deviation {
  value: number;
  ideal: number;
  tolerance: number;
  ratio: number;
  over: boolean;
  atRisk: boolean;
}

export interface WarehouseException {
  warehouse: Warehouse;
  temp: Deviation;
  hum: Deviation;
  score: number;
}

function deviation(value: number, [min, max]: [number, number]): Deviation {
  const ideal = (min + max) / 2;
  const tolerance = (max - min) / 2;
  const ratio = tolerance > 0 ? Math.abs(value - ideal) / tolerance : 0;
  return { value, ideal, tolerance, ratio, over: value > ideal, atRisk: ratio >= 1 };
}

// Warehouses at or beyond their temperature/humidity tolerance, ranked by how
// far they have drifted. Ranking by ratio (not raw delta) keeps it correct
// across any number of countries with different thresholds — the overview
// grows by rows, not by chart panels.
export function warehouseExceptions(warehouses: Warehouse[]): WarehouseException[] {
  return warehouses
    .map((warehouse) => {
      const temp = deviation(warehouse.tempNum, warehouse.tempRange);
      const hum = deviation(warehouse.humNum, warehouse.humRange);
      return { warehouse, temp, hum, score: Math.max(temp.ratio, hum.ratio) };
    })
    .filter((e) => e.temp.atRisk || e.hum.atRisk)
    .sort((a, b) => b.score - a.score);
}

// Single source of truth for a warehouse's status, derived from how far its
// readings sit from their own bands. Replaces the hardcoded status/statusVariant
// that could contradict the ranges (a warehouse marked "Conforme" with an
// out-of-band reading).
export function warehouseStatus(w: Warehouse): BadgeVariant {
  const temp = deviation(w.tempNum, w.tempRange);
  const hum = deviation(w.humNum, w.humRange);
  const score = Math.max(temp.ratio, hum.ratio);
  if (score >= 1.5) return 'err';
  if (score >= 1) return 'warn';
  return 'ok';
}

const SEVERITY_RANK: Record<Alert['severity'], number> = { critique: 0, alerte: 1 };

// Most severe first, stable within a severity level.
export function sortAlertsBySeverity(alerts: Alert[]): Alert[] {
  return [...alerts].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}

export function conformityRate({ conforme, alerte, perime }: StatusDistribution): number {
  const total = conforme + alerte + perime;
  return total === 0 ? 0 : Math.round((conforme / total) * 100);
}
