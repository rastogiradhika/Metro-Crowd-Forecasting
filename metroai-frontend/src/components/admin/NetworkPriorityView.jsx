import React, { useState } from 'react';
import { LINE_COLORS } from '../../data/stations';
import { getRiskConfig } from '../../utils/risk';
import { formatNumber } from '../../utils/formatters';

export default function NetworkPriorityView({
  forecasts = [],
  onSelectStation,
  selectedStationId = null,
}) {
  const [selectedLine, setSelectedLine] = useState('YELLOW');

  const lines = ['YELLOW', 'BLUE', 'RED', 'VIOLET', 'PINK', 'MAGENTA', 'GREEN', 'ORANGE', 'AQUA', 'RAPID', 'GRAY'];
  const lineStations = forecasts.filter((f) => f.line === selectedLine);
  const lineColor = LINE_COLORS[selectedLine] || '#EAB308';

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xs transition-colors duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Network Priority Schematic
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Color-coded stations along transit corridors. Select any node for predictive drilldown.
          </p>
        </div>

        {/* Line Selector Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {lines.map((line) => {
            const color = LINE_COLORS[line] || '#64748B';
            const count = forecasts.filter((f) => f.line === line).length;
            if (count === 0) return null;
            const isActive = selectedLine === line;

            return (
              <button
                key={line}
                type="button"
                onClick={() => setSelectedLine(line)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 border transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span>{line}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Corridor Grid of Station Nodes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {lineStations.map((station) => {
          const risk = getRiskConfig(station.risk_level);
          const isSelected = selectedStationId === station.station_id;

          return (
            <div
              key={station.station_id}
              onClick={() => onSelectStation(station.station_id)}
              className={`p-3 rounded-xl border cursor-pointer transition-all duration-150 flex flex-col justify-between gap-2 ${
                isSelected
                  ? 'border-[#059669] ring-2 ring-cyan-500/30 bg-cyan-50/40 dark:bg-cyan-950/20'
                  : 'border-[#1F2A25] dark:border-[#1F2A25] bg-slate-50/50 dark:bg-[#050807]/40 hover:border-slate-300 dark:hover:border-[#1F2A25]'
              }`}
            >
              <div className="flex items-start justify-between gap-1.5">
                <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {station.station_name}
                </span>
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5"
                  style={{ backgroundColor: risk.color }}
                  title={`${risk.label} risk`}
                />
              </div>

              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Expected Crowd</span>
                <span className="font-bold tabular-nums" style={{ color: risk.color }}>
                  {formatNumber(station.predicted_inflow)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
