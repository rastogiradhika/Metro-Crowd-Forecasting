import React, { useState, useEffect } from 'react';
import { fetchStations, fetchForecast } from '../services/api';
import JourneyForm from '../components/passenger/JourneyForm';
import ForecastResult from '../components/passenger/ForecastResult';
import PassengerSkeleton from '../components/passenger/PassengerSkeleton';
import { addMinutes } from '../utils/formatters';
import { AlertCircle, RefreshCw, Train } from 'lucide-react';

export default function PassengerDashboard() {
  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(true);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastResult, setForecastResult] = useState(null);
  const [error, setError] = useState(null);
  const [lastPayload, setLastPayload] = useState(null);

  // Load stations on mount
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchStations();
        setStations(data);
      } catch (err) {
        console.error('Failed to load stations:', err);
        setError('Unable to load station database. Please refresh or check connection.');
      } finally {
        setLoadingStations(false);
      }
    }
    load();
  }, []);

  // Handle form submission
  async function handleForecastSubmit(payload) {
    setForecastLoading(true);
    setError(null);
    setLastPayload(payload);

    try {
      const data = await fetchForecast(payload);
      setForecastResult(data);
    } catch (err) {
      console.error('Forecast request failed:', err);
      setError(err.message || 'Forecast service is currently unavailable.');
    } finally {
      setForecastLoading(false);
    }
  }

  // Handle smart advisory "+15m" suggestion
  function handleApplyOffset(offsetMinutes) {
    if (!lastPayload) return;
    const newTime = addMinutes(lastPayload.travel_time, offsetMinutes);
    handleForecastSubmit({
      ...lastPayload,
      travel_time: newTime,
    });
  }

  return (
    <div className="w-full min-h-screen py-10 sm:py-14 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Page Header (32px from next section) */}
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 w-fit">
            <Train size={13} strokeWidth={1.75} />
            <span>Passenger Travel Forecast</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Delhi Metro Passenger Inflow
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Anticipate station crowd density and inflow bottlenecks for your departure window before reaching turnstiles.
          </p>
        </div>

        {/* Journey Planner Form */}
        <JourneyForm
          stations={stations}
          onSubmit={handleForecastSubmit}
          loading={forecastLoading || loadingStations}
          initialOrigin={50}      // Rajiv Chowk (GTFS stop_id 50)
          initialDestination={59} // Hauz Khas (GTFS stop_id 59)
          initialTime="08:15"
        />

        {/* Form State 1: Loading Skeleton */}
        {forecastLoading && <PassengerSkeleton />}

        {/* Form State 2: Error Card (Red Accent) */}
        {error && !forecastLoading && (
          <div className="w-full p-6 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} strokeWidth={1.75} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Forecast Retrieval Error</h4>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{error}</p>
              </div>
            </div>

            {lastPayload && (
              <button
                type="button"
                onClick={() => handleForecastSubmit(lastPayload)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-xs font-semibold transition-colors duration-150 cursor-pointer shrink-0"
              >
                <RefreshCw size={13} strokeWidth={1.75} />
                <span>Retry Forecast</span>
              </button>
            )}
          </div>
        )}

        {/* Form State 3: Success Result Card */}
        {!forecastLoading && forecastResult && (
          <ForecastResult
            result={forecastResult}
            onApplyOffset={handleApplyOffset}
            travelTime={lastPayload?.travel_time || '08:15'}
          />
        )}
      </div>
    </div>
  );
}
