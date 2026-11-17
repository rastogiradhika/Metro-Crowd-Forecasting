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
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end transition-opacity duration-200">
      <div
        className="relative w-full max-w-xl bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-fadeIn"
        role="dialog"
        aria-label="Station Drilldown Drawer"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: lineCol }} />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {data?.line || 'Metro'} Line
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight truncate text-slate-900 dark:text-white">
              {data?.station_name || 'Loading Station...'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close station drawer"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="space-y-4">
              <LoadingSkeleton width="100%" height="80px" className="rounded-xl" />
              <LoadingSkeleton width="100%" height="180px" className="rounded-xl" />
              <LoadingSkeleton width="100%" height="120px" className="rounded-xl" />
            </div>
          ) : (
            <>
              {/* Primary Metric Banner */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Predicted Passenger Inflow
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-3xl font-extrabold tabular-nums tracking-tight"
                      style={{ color: risk.color }}
                    >
                      {formatNumber(currentForecast?.predicted_inflow)}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">passengers entering</span>
                  </div>
                </div>

                <div
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shrink-0"
                  style={{
                    backgroundColor: risk.bg,
                    borderColor: risk.border,
                    color: risk.color,
                  }}
                >
                  {risk.shortLabel} Risk
                </div>
              </div>

              {/* Forecast Line Chart */}
              <ForecastChart
                series={data?.forecast_series || []}
                hourlyCurve={data?.hourly_curve || []}
              />

              {/* Train Schedule Card */}
              {data?.train_status && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B]">
                  <div className="flex items-center gap-2 mb-2">
                    <Train size={15} strokeWidth={1.75} className="text-cyan-600" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Train Schedule & Frequency
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {data.train_status.trains_description}
                  </p>
                </div>
              )}

              {/* Operational Recommendation & Dispatch */}
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

              {/* Explainability / SHAP */}
              <ExplainabilityPanel explanation={explanation} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
