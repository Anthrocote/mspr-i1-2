'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, ReferenceArea, ReferenceLine, Tooltip } from 'recharts';
import type { ConditionSeries } from '@/lib/series';
import { readingParts } from '@/lib/series';
import { useLanguage } from '@/contexts/LanguageContext';

interface ConditionChartProps {
  title: string;
  series: ConditionSeries;
}

// Two-line x-axis tick: date on top, time below. `payload.value` is the epoch ms
// of the reading (numeric time axis).
function TwoLineTick({ x = 0, y = 0, payload }: { x?: number; y?: number; payload?: { value: number } }) {
  const { date, time } = readingParts(payload?.value ?? 0);
  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" fill="#A08060" fontSize={11}>
        <tspan x={0} dy={12}>{date}</tspan>
        <tspan x={0} dy={13}>{time}</tspan>
      </text>
    </g>
  );
}

export default function ConditionChart({ title, series }: ConditionChartProps) {
  const { t } = useLanguage();
  const { readings, min, max, ideal, unit, current, breached } = series;
  const metricLabel = series.metric === 'temp' ? t('temperature') : t('humidity');
  const values = readings.map((r) => r.value);
  const domainMin = Math.floor(Math.min(...values, min)) - 1;
  const domainMax = Math.ceil(Math.max(...values, max)) + 1;
  // Display label for each reading's timestamp (the x is numeric epoch ms).
  const labelByTs = new Map(readings.map((r) => [r.ts, r.label]));

  const tsValues = readings.map((r) => r.ts);
  const tMin = tsValues.length ? Math.min(...tsValues) : 0;
  const tMax = tsValues.length ? Math.max(...tsValues) : 0;

  // Expected cadence from the median interval; a gap well beyond it means the
  // sensor went silent. Break the line across such gaps and extend the axis to
  // "now", so an outage reads as an actual hole rather than a straight bridge.
  const sortedGaps = readings.slice(1).map((r, i) => r.ts - readings[i].ts).sort((a, b) => a - b);
  const median = sortedGaps.length ? sortedGaps[Math.floor(sortedGaps.length / 2)] : 0;
  const gapThreshold = median > 0 ? Math.max(median * 2.5, 15_000) : Infinity;

  const now = Date.now();
  const domainMaxTs = Math.max(tMax, now);

  type Point = { ts: number; value: number | null };
  const chartData: Point[] = [];
  readings.forEach((r, i) => {
    if (i > 0 && r.ts - readings[i - 1].ts > gapThreshold) {
      chartData.push({ ts: readings[i - 1].ts + 1, value: null });
    }
    chartData.push({ ts: r.ts, value: r.value });
  });
  // Ongoing silence: mark a break after the last reading so the line stops and
  // the empty space up to "now" shows how long the sensor has been quiet.
  if (readings.length > 0 && now - tMax > gapThreshold) {
    chartData.push({ ts: tMax + 1, value: null });
  }

  // Evenly spaced ticks across the (possibly extended) time span.
  const TICK_COUNT = 6;
  const ticks =
    readings.length > 1
      ? Array.from({ length: TICK_COUNT }, (_, i) => Math.round(tMin + ((domainMaxTs - tMin) * i) / (TICK_COUNT - 1)))
      : tsValues;

  return (
    <div className="bg-[#FFFCF8] border border-[#E8D9C4] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold text-espresso-900">{title}</div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-bold" style={{ color: breached ? '#9B1C1C' : '#2E7D32' }}>{current}{unit}</span>
          <span className="text-[11px] font-semibold" style={{ color: breached ? '#9B1C1C' : '#2E7D32' }}>
            {breached ? `⚠ ${t('out_of_range')}` : `✓ ${t('status_ok')}`}
          </span>
        </div>
      </div>

      <div className="w-full h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <ReferenceArea y1={min} y2={max} fill="#EDF7EE" fillOpacity={1} ifOverflow="extendDomain" />
            <ReferenceLine y={ideal} stroke="#C1E0C3" strokeWidth={1} />
            <ReferenceLine y={max} stroke="#A5D6A7" strokeDasharray="6 4" />
            <ReferenceLine y={min} stroke="#A5D6A7" strokeDasharray="6 4" />
            <XAxis
              dataKey="ts"
              type="number"
              scale="time"
              domain={[tMin, domainMaxTs]}
              ticks={ticks}
              interval={0}
              tick={<TwoLineTick />}
              height={38}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[domainMin, domainMax]}
              allowDecimals={false}
              tick={{ fontSize: 10, fill: '#A0714F' }}
              width={44}
              tickFormatter={(v: number) => `${v}${unit}`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v) => [`${v}${unit}`, metricLabel]}
              labelFormatter={(v) => labelByTs.get(Number(v)) ?? ''}
              contentStyle={{ borderRadius: 12, border: '1px solid #E8D9C4', background: '#FFFCF8', fontSize: 12 }}
              labelStyle={{ color: '#A08060' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2C1A0A"
              strokeWidth={2.5}
              dot={false}
              connectNulls={false}
              activeDot={{ r: 4, fill: '#2C1A0A' }}
              // The page polls every 5 s; without this, recharts replays its
              // left-to-right draw animation on every refresh, so the line
              // "jumps" and the silence gap re-animates. Update in place instead.
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
