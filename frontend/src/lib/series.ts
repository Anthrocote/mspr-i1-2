import type { Warehouse } from '@/types';

export type TimeRange = '24h' | '7j' | '30j';
export type Metric = 'temp' | 'hum';

export const RANGE_POINTS: Record<TimeRange, number> = { '24h': 24, '7j': 7, '30j': 30 };

export interface Reading {
  label: string;
  value: number;
}

export interface ConditionSeries {
  metric: Metric;
  unit: string;
  ideal: number;
  tolerance: number;
  min: number;
  max: number;
  current: number;
  breached: boolean;
  readings: Reading[];
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Deterministic pseudo-noise in [-1, 1] from a seed and index.
function noise(seed: number, i: number): number {
  const x = Math.sin(seed * 0.0001 + i * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

function labelsFor(range: TimeRange, n: number): string[] {
  if (range === '7j') return ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].slice(0, n);
  if (range === '24h') return Array.from({ length: n }, (_, i) => `${String(i).padStart(2, '0')} h`);
  return Array.from({ length: n }, (_, i) => `J-${n - 1 - i}`);
}

const round1 = (v: number) => Math.round(v * 10) / 10;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// A per-warehouse condition series lives in the data layer, derived deterministically
// from the warehouse's own baseline and threshold band — so the chart is fully
// data-driven rather than a fixed illustrative curve. Conforme warehouses stay inside
// their band; at-risk warehouses drift out of it over the window.
export function warehouseSeries(w: Warehouse, metric: Metric, range: TimeRange): ConditionSeries {
  const n = RANGE_POINTS[range];
  const [lo, hi] = metric === 'temp' ? w.tempRange : w.humRange;
  const ideal = (lo + hi) / 2;
  const tolerance = (hi - lo) / 2;
  const baseline = metric === 'temp' ? w.tempNum : w.humNum;
  const atRisk = w.statusVariant !== 'ok';
  const seed = hash(`${w.id}-${metric}-${range}`);
  const amp = tolerance * 0.4;

  const readings: Reading[] = Array.from({ length: n }, (_, i) => {
    const wave = Math.sin((i / n) * Math.PI * 4 + (seed % 100) / 16) * amp;
    const jitter = noise(seed, i) * tolerance * 0.15;
    // At-risk warehouses ramp toward (and past) their limit over the window.
    const drift = atRisk ? (i / (n - 1)) * tolerance * 1.4 : 0;
    let value = baseline - (atRisk ? tolerance * 0.9 : 0) + wave + jitter + drift;
    if (!atRisk) value = clamp(value, lo, hi);
    return { label: '', value: round1(value) };
  });

  // The last reading matches the warehouse's currently reported value.
  readings[n - 1] = { label: '', value: baseline };

  const labels = labelsFor(range, n);
  for (let i = 0; i < n; i++) readings[i].label = labels[i] ?? '';

  const breached = readings.some((r) => r.value < lo || r.value > hi);

  return {
    metric,
    unit: metric === 'temp' ? '°C' : '%',
    ideal,
    tolerance,
    min: lo,
    max: hi,
    current: baseline,
    breached,
    readings,
  };
}
