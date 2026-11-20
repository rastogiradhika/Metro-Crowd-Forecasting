import React, { useEffect } from 'react';
import { X, Train } from 'lucide-react';
import { getRiskConfig } from '../../utils/risk';
import { formatNumber } from '../../utils/formatters';
import { LINE_COLORS } from '../../data/stations';
import ForecastChart from './ForecastChart';
import ExplainabilityPanel from './ExplainabilityPanel';
import StationInfrastructure from './StationInfrastructure';
import OperationalSuggestion from './OperationalSuggestion';
import LoadingSkeleton from '../common/LoadingSkeleton';

export default function StationDrawer({
  stationId,
  onClose,
  data,
  loading = false,
  explanation = null,
}) {
  // ESC key listener
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!stationId) return null;

  const currentForecast = data?.forecast_series?.[1] || data?.forecast_series?.[0];
  const risk = getRiskConfig(currentForecast?.risk_level || 'LOW');
  const lineCol = data?.line ? LINE_COLORS[data.line] : '#64748B';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end transition-opacity duration-200">
      <div
        className="relative w-full max-w-full md:max-w-xl bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-fadeIn"
        role="dialog"
        aria-label="Station Drilldown Drawer"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: lineCol }} />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {data?.line || 'Metro'} Line
              </span>
            </div>
            <h2 className="text-lg font-bold tracking-tight truncate text-slate-900 dark:text-white">
              {data?.station_name || 'Loading Station...'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close station drawer"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Scrollable Content (Flat Surfaces separated by 1px dividers) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {loading ? (
            <div className="space-y-4">
              <LoadingSkeleton width="100%" height="80px" className="rounded-xl" />
              <LoadingSkeleton width="100%" height="180px" className="rounded-xl" />
              <LoadingSkeleton width="100%" height="120px" className="rounded-xl" />
            </div>
          ) : (
            <>
              {/* Primary Metric Banner */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Expected Crowd (People Entering)
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-3xl font-extrabold tabular-nums tracking-tight"
                      style={{ color: risk.color }}
                    >
                      {formatNumber(currentForecast?.predicted_inflow)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">people entering</span>
                  </div>
                </div>

                <div
                  className="px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider border shrink-0"
                  style={{
                    backgroundColor: risk.bg,
                    borderColor: risk.border,
                    color: risk.color,
                  }}
                >
                  {risk.label || risk.shortLabel} Crowd
                </div>
              </div>

              {/* Forecast Line Chart */}
              <ForecastChart
                series={data?.forecast_series || []}
                hourlyCurve={data?.hourly_curve || []}
              />

              {/* Train Timings Card */}
              {data?.train_status && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Train size={15} strokeWidth={1.75} className="text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Train Timings & Frequency
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {data.train_status.trains_description}
                  </p>
                </div>
              )}

              {/* Action Required (Staff Alert) */}
              <OperationalSuggestion
                riskLevel={currentForecast?.risk_level}
                stationName={data?.station_name}
                recommendation={data?.recommendation}
              />

              {/* Station Infrastructure */}
              <StationInfrastructure
                gates={data?.gates}
                lifts={data?.lifts}
                platforms={data?.platforms}
                concourses={data?.concourses}
                interchange={data?.interchange}
              />

              {/* Reason for Prediction (AI) */}
              <ExplainabilityPanel explanation={explanation} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
