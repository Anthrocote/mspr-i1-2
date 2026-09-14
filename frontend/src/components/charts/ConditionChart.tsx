'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, ReferenceArea, ReferenceLine, Tooltip } from 'recharts';
import type { ConditionSeries } from '@/lib/series';
import { useLanguage } from '@/contexts/LanguageContext';

interface ConditionChartProps {
  title: string;
  series: ConditionSeries;
}

export default function ConditionChart({ title, series }: ConditionChartProps) {
  const { t } = useLanguage();
  const { readings, min, max, ideal, unit, current, breached } = series;
  const metricLabel = series.metric === 'temp' ? t('temperature') : t('humidity');
  const values = readings.map((r) => r.value);
  const domainMin = Math.floor(Math.min(...values, min)) - 1;
  const domainMax = Math.ceil(Math.max(...values, max)) + 1;

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
          <LineChart data={readings} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <ReferenceArea y1={min} y2={max} fill="#EDF7EE" fillOpacity={1} ifOverflow="extendDomain" />
            <ReferenceLine y={ideal} stroke="#C1E0C3" strokeWidth={1} />
            <ReferenceLine y={max} stroke="#A5D6A7" strokeDasharray="6 4" />
            <ReferenceLine y={min} stroke="#A5D6A7" strokeDasharray="6 4" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#A08060' }} interval="preserveStartEnd" minTickGap={28} axisLine={false} tickLine={false} />
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
              contentStyle={{ borderRadius: 12, border: '1px solid #E8D9C4', background: '#FFFCF8', fontSize: 12 }}
              labelStyle={{ color: '#A08060' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2C1A0A"
              strokeWidth={2.5}
              dot={(props) => {
                const { cx, cy, payload, index } = props as { cx: number; cy: number; index: number; payload: { value: number } };
                const out = payload.value < min || payload.value > max;
                return <circle key={index} cx={cx} cy={cy} r={out ? 4 : 0} fill="#9B1C1C" stroke="#fff" strokeWidth={out ? 1.5 : 0} />;
              }}
              activeDot={{ r: 4, fill: '#2C1A0A' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
