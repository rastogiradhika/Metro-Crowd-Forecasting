import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function ForecastChart({ series = [], hourlyCurve = [] }) {
  const [chartMode, setChartMode] = useState('hourly'); // 'hourly' | 'horizon'

  const hasHourly = hourlyCurve && hourlyCurve.length > 0;

  const data = (chartMode === 'hourly' && hasHourly)
    ? hourlyCurve.map((item) => ({
        name: item.time ?? item.hour,
        inflow: item.inflow,
      }))
    : series.map((item) => ({
        name: `Next ${item.horizon_minutes ?? item.horizon}m`,
        inflow: item.predicted_inflow ?? item.inflow,
        risk: item.risk_level ?? item.risk,
      }));

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        No forecast series available.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md text-xs">
          <div className="font-semibold text-slate-900 dark:text-white mb-1">
            {label} Window
          </div>
          <div className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
            {p.inflow} people entering
          </div>
          {p.risk && (
            <div className="text-[10px] text-slate-400 mt-0.5">
              Crowd Level: {p.risk}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Crowd Flow Trend
          </h4>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {chartMode === 'hourly' ? 'Morning peak time-series trend' : 'Next 10m / 20m / 30m crowd timeline'}
          </span>
        </div>

        {hasHourly && (
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                chartMode === 'hourly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => setChartMode('hourly')}
            >
              Peak Timeline
            </button>
            <button
              type="button"
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                chartMode === 'horizon'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => setChartMode('horizon')}
            >
              Next 10/20/30 min
            </button>
          </div>
        )}
      </div>

      <div className="w-full h-44">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#94A3B825" />
            <XAxis
              dataKey="name"
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="inflow"
              stroke="#06B6D4"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: '#0B100E', stroke: '#06B6D4', strokeWidth: 2 }}
              activeDot={{ r: 5, fill: '#06B6D4' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
