import React, { useState, useEffect } from 'react';
import { fetchStationForecast } from '../../services/api';
import { getRiskConfig } from '../../utils/risk';
import { Train, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LINE_COLORS } from '../../data/stations';

const SCHEMATIC_STATIONS = [
  { id: 8, name: 'Kashmere Gate', x: 300, y: 70, lines: ['RED', 'YELLOW', 'VIOLET'], interchange: true },
  { id: 47, name: 'Chandni Chowk', x: 300, y: 140, lines: ['YELLOW'], interchange: false },
  { id: 50, name: 'Rajiv Chowk', x: 300, y: 220, lines: ['YELLOW', 'BLUE'], interchange: true },
  { id: 52, name: 'Central Secretariat', x: 300, y: 290, lines: ['YELLOW', 'VIOLET'], interchange: true },
  { id: 56, name: 'INA / Dilli Haat', x: 300, y: 360, lines: ['YELLOW', 'PINK'], interchange: true },
  { id: 59, name: 'Hauz Khas', x: 300, y: 430, lines: ['YELLOW', 'MAGENTA'], interchange: true },

  // Red Line Horizontal
  { id: 13, name: 'Inderlok', x: 120, y: 70, lines: ['RED', 'GREEN'], interchange: true },
  { id: 1, name: 'Dilshad Garden', x: 500, y: 70, lines: ['RED'], interchange: false },

  // Blue Line Horizontal
  { id: 37, name: 'Kirti Nagar', x: 100, y: 220, lines: ['BLUE', 'GREEN'], interchange: true },
  { id: 100, name: 'Mandi House', x: 420, y: 220, lines: ['BLUE', 'VIOLET'], interchange: true },
  { id: 120, name: 'Botanical Garden', x: 520, y: 310, lines: ['BLUE', 'MAGENTA'], interchange: true },

  // Magenta Line Cross
  { id: 195, name: 'Janakpuri West', x: 120, y: 430, lines: ['BLUE', 'MAGENTA'], interchange: true },
  { id: 210, name: 'Kalkaji Mandir', x: 440, y: 430, lines: ['VIOLET', 'MAGENTA'], interchange: true },
];

export default function MetroSchematicMap({ onSelectStation = null, initialStationId = 50 }) {
  const [selectedId, setSelectedId] = useState(initialStationId);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const selectedStation = SCHEMATIC_STATIONS.find((s) => s.id === selectedId) || SCHEMATIC_STATIONS[2];

  useEffect(() => {
    let isMounted = true;
    async function loadForecast() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchStationForecast(selectedId, 20);
        if (isMounted) setForecast(data);
      } catch (err) {
        if (isMounted) {
          setError('Could not connect to prediction service.');
          setForecast(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadForecast();
    return () => { isMounted = false; };
  }, [selectedId]);

  const handleStationClick = (st) => {
    setSelectedId(st.id);
    if (onSelectStation) {
      onSelectStation(st);
    }
  };

  const riskCfg = getRiskConfig(forecast?.forecast_series?.[1]?.risk_level || 'LOW');

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs flex flex-col lg:flex-row transition-colors">
      {/* Left: Interactive Topological SVG Schematic */}
      <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between relative bg-slate-50 dark:bg-[#090D11] overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-mono tracking-wider uppercase text-[#5E6963] dark:text-[#9AA8A1]">
            METRO MAP • CLICK ANY STATION
          </span>
          <span className="flex items-center gap-1.5 text-[#059669] text-[11px] font-mono font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse"></span>
            <span>ACTIVE SERVICE</span>
          </span>
        </div>

        {/* SVG Schematic Canvas */}
        <div className="relative w-full aspect-[16/10] min-w-[500px] max-h-[460px] flex items-center justify-center">
          <svg viewBox="0 0 600 480" className="w-full h-full select-none">
            {/* Red Line */}
            <line x1="80" y1="70" x2="540" y2="70" stroke="#DC2626" strokeWidth="6" strokeLinecap="round" opacity="0.9" />

            {/* Yellow Line (Central Spine) */}
            <line x1="300" y1="30" x2="300" y2="460" stroke="#EAB308" strokeWidth="7" strokeLinecap="round" opacity="0.95" />

            {/* Blue Line (Horizontal Cross) */}
            <line x1="60" y1="220" x2="550" y2="220" stroke="#2563EB" strokeWidth="6" strokeLinecap="round" opacity="0.9" />

            {/* Violet Line */}
            <path d="M 300 70 L 420 220 L 300 290 L 440 430" fill="none" stroke="#7C3AED" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />

            {/* Magenta Line */}
            <path d="M 80 430 L 300 430 L 520 310" fill="none" stroke="#DB2777" strokeWidth="5" strokeLinecap="round" opacity="0.85" />

            {/* Station Nodes */}
            {SCHEMATIC_STATIONS.map((st) => {
              const isSelected = st.id === selectedId;
              return (
                <g key={st.id} onClick={() => handleStationClick(st)} className="cursor-pointer group">
                  {isSelected && (
                    <circle
                      cx={st.x}
                      cy={st.y}
                      r={st.interchange ? '18' : '14'}
                      fill="none"
                      stroke="#059669"
                      strokeWidth="2.5"
                      className="animate-pulse"
                    />
                  )}

                  <circle
                    cx={st.x}
                    cy={st.y}
                    r={st.interchange ? '11' : '8'}
                    fill={isSelected ? '#059669' : '#FFFFFF'}
                    stroke={isSelected ? '#35D9A5' : '#101513'}
                    strokeWidth={st.interchange ? '3.5' : '2.5'}
                    className="transition-all duration-150 group-hover:scale-125 dark:fill-[#0B100E] dark:stroke-[#F5F7F6]"
                  />

                  <text
                    x={st.x + 16}
                    y={st.y + 4}
                    fill={isSelected ? '#059669' : '#101513'}
                    fontSize={st.interchange ? '12' : '10'}
                    fontWeight={st.interchange ? '700' : '500'}
                    fontFamily="Space Grotesk, sans-serif"
                    className="select-none pointer-events-none group-hover:fill-[#059669] transition-colors dark:fill-[#F5F7F6]"
                  >
                    {st.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#D9E1DD] dark:border-[#26332E] text-xs text-[#5E6963] dark:text-[#9AA8A1]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span> Low Crowd (&lt;300)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span> Moderate Crowd (300-600)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#F97316]"></span> High Crowd (600-800)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span> Extreme Rush (&gt;800)</span>
          </div>
          <span className="font-mono text-[11px] text-[#707A75] dark:text-[#66736D]">Click any station to view crowd prediction</span>
        </div>
      </div>

      {/* Right: Station Details Sidebar */}
      <div className="w-full lg:w-[380px] p-6 sm:p-7 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Station Details
            </span>
            <span
              className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border"
              style={{
                color: riskCfg.color,
                backgroundColor: riskCfg.bg,
                borderColor: riskCfg.border,
              }}
            >
              {forecast?.forecast_series?.[1]?.risk_level || (loading ? 'FETCHING...' : 'LIVE')}
            </span>
          </div>

          <h3 className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-2">
            {selectedStation.name}
          </h3>

          {/* Dynamic Lines Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {selectedStation.lines?.map((line) => {
              const col = LINE_COLORS[line] || '#F5B400';
              return (
                <span
                  key={line}
                  className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded border"
                  style={{
                    backgroundColor: `${col}20`,
                    borderColor: `${col}50`,
                    color: col,
                  }}
                >
                  {line} Line
                </span>
              );
            })}
            {selectedStation.interchange && (
              <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/40">
                Interchange Station
              </span>
            )}
          </div>

          {/* Crowd Prediction (Next 30 Mins) */}
          <div className="space-y-3 mb-6">
            <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 tracking-wider block">
              Crowd Prediction (Next 30 Mins)
            </span>

            {loading ? (
              <div className="space-y-2 py-4">
                <div className="h-9 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg"></div>
                <div className="h-9 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg"></div>
                <div className="h-9 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg"></div>
              </div>
            ) : error ? (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 rounded-lg text-xs text-red-700 dark:text-red-300">
                {error}
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  { horizon: 10, label: 'In Next 10 Min' },
                  { horizon: 20, label: 'In Next 20 Min' },
                  { horizon: 30, label: 'In Next 30 Min' },
                ].map(({ horizon, label }) => {
                  const s = forecast?.forecast_series?.find((item) => item.horizon === horizon);
                  const pax = s?.predicted_inflow;
                  const itemRisk = getRiskConfig(s?.risk_level || 'LOW');
                  return (
                    <div
                      key={horizon}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-emerald-600/40 transition-colors"
                    >
                      <span className="text-xs text-slate-600 dark:text-slate-300">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                          {pax != null ? `${pax} people` : '—'}
                        </span>
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: itemRisk.color }}
                        ></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Clean Static Station Info */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg mb-4 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
            <div className="flex justify-between font-mono text-[11px]">
              <span>Station ID:</span>
              <span className="text-slate-900 dark:text-white font-bold">{selectedStation.id}</span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span>Station Type:</span>
              <span className="text-emerald-600 font-bold">
                {selectedStation.interchange ? 'Interchange Hub' : 'Standard Station'}
              </span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span>Train Frequency:</span>
              <span className="text-slate-900 dark:text-white font-bold">Every 2 - 4 mins</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Link
          to={`/passenger?station=${selectedStation.id}`}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-xs"
        >
          <Train size={14} />
          <span>Plan Journey From Here</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
