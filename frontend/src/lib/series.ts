import type { ApiMeasurement } from './api/types';

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

const MONTHS_FR = [
  'jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sep.', 'oct.', 'nov.', 'déc.',
];

const round1 = (v: number) => Math.round(v * 10) / 10;

// Axis label for a measurement, chosen by the visible window: hour of day for a
// 24 h window, day + short month otherwise. Uses UTC parts so the rendered label
// is stable regardless of the runtime timezone.
function readingLabel(iso: string, range: TimeRange): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  if (range === '24h') {
    return `${String(d.getUTCHours()).padStart(2, '0')} h`;
  }
  return `${d.getUTCDate()} ${MONTHS_FR[d.getUTCMonth()]}`;
}

// Build a chart-ready condition series from real warehouse measurements. The
// measurements arrive oldest-first (backend contract), so the last one is the
// current reading. The acceptable band is [ideal - tolerance, ideal + tolerance];
// `breached` reflects the current reading only, matching the header verdict.
export function buildConditionSeries(
  measurements: ApiMeasurement[],
  metric: Metric,
  ideal: number,
  tolerance: number,
  range: TimeRange = '24h',
): ConditionSeries {
  const min = ideal - tolerance;
  const max = ideal + tolerance;

  const readings: Reading[] = measurements.map((m) => ({
    label: readingLabel(m.measuredAt, range),
    value: round1(metric === 'temp' ? m.temperature : m.humidity),
  }));

  // No reading yet: sit exactly at the ideal so the chart renders a neutral,
  // in-band state rather than a misleading spike.
  const current = readings.length > 0 ? readings[readings.length - 1].value : round1(ideal);
  const breached = current < min || current > max;

  return {
    metric,
    unit: metric === 'temp' ? '°C' : '%',
    ideal,
    tolerance,
    min,
    max,
    current,
    breached,
    readings,
  };
}
