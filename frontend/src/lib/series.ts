import type { ApiMeasurement } from './api/types';

export type TimeRange = '24h' | '7j' | '30j';
export type Metric = 'temp' | 'hum';

export const RANGE_POINTS: Record<TimeRange, number> = { '24h': 24, '7j': 7, '30j': 30 };

export interface Reading {
  // Epoch ms of the reading: a unique, monotonic x used for a proper time axis
  // (a shared hour/day label would collapse points and misplace the hover dot).
  ts: number;
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

// Local date and time parts of a reading, for a two-line axis tick (date over
// time). Uses LOCAL parts so the label matches the wall-clock time on site (the
// wire timestamp is UTC).
export function readingParts(ts: number): { date: string; time: string } {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return { date: '', time: '' };
  return {
    date: `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`,
    time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
  };
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
): ConditionSeries {
  const min = ideal - tolerance;
  const max = ideal + tolerance;

  const readings: Reading[] = measurements.map((m) => {
    const ts = new Date(m.measuredAt).getTime();
    const { date, time } = readingParts(ts);
    return {
      ts,
      label: `${date} ${time}`,
      value: round1(metric === 'temp' ? m.temperature : m.humidity),
    };
  });

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
