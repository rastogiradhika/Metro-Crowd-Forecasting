import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchStations, fetchForecast } from '../services/api';
import JourneyForm from '../components/passenger/JourneyForm';
import ForecastResult from '../components/passenger/ForecastResult';
import PassengerSkeleton from '../components/passenger/PassengerSkeleton';
import { addMinutes } from '../utils/formatters';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function PassengerDashboard() {
  const [searchParams] = useSearchParams();
  const initialStationParam = searchParams.get('station');

  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(true);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastResult, setForecastResult] = useState(null);
  const [error, setError] = useState(null);
  const [lastPayload, setLastPayload] = useState(null);

  // Load stations on mount
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await fetchStations();
        if (active) setStations(data);
      } catch (err) {
        console.error('Failed to load stations:', err);
        if (active) setError('Unable to load station database. Please refresh or check connection.');
      } finally {
        if (active) setLoadingStations(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const abortControllerRef = useRef(null);

  // Handle form submission with AbortController signal (Fix I3: cancel previous on rapid clicks)
  async function handleForecastSubmit(payload) {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setForecastLoading(true);
    setError(null);
    setLastPayload(payload);

    try {
      const data = await fetchForecast(payload, controller.signal);
      setForecastResult(data);
    } catch (err) {
      if (err.name === 'AbortError') return; // Cancelled silently
      console.error('Forecast request failed:', err);
      setError(err.message || 'Forecast service is currently unavailable.');
    } finally {
      if (!controller.signal.aborted) {
        setForecastLoading(false);
      }
    }
  }

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle smart advisory offset
  function handleApplyOffset(offsetMinutes = 15) {
    if (!lastPayload) return;
    const newTime = addMinutes(lastPayload.travel_time, offsetMinutes);
    const updated = {
      ...lastPayload,
      travel_time: newTime,
    };
    setLastPayload(updated);
    handleForecastSubmit(updated);
  }

  return (
    // Responsive background & text that properly responds to dark mode
    <div className="w-full min-h-screen py-10 sm:py-12 bg-slate-50 dark:bg-[#090D11] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sections 24px+ apart */}
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="space-y-1.5 pb-6 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Metro Crowd Forecast
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Check expected crowd volumes at your boarding and destination stations before traveling.
          </p>
        </div>

        {/* Section 1: Journey Planner Form */}
        <JourneyForm
          stations={stations}
          onSubmit={handleForecastSubmit}
          loading={forecastLoading || loadingStations}
          initialOrigin={initialStationParam ? Number(initialStationParam) : 50}
          initialDestination={59}
          initialTime={lastPayload?.travel_time || '08:15'}
        />

        {/* State A: Loading Skeleton */}
        {forecastLoading && <PassengerSkeleton />}

        {/* State B: Error Notice */}
        {error && !forecastLoading && (
          <div className="p-4 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} strokeWidth={1.75} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="font-semibold text-sm text-red-950 dark:text-white">Forecast Request Failed</h4>
                <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>

            {lastPayload && (
              <button
                type="button"
                onClick={() => handleForecastSubmit(lastPayload)}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:border dark:border-slate-700 dark:hover:bg-slate-700 transition-colors duration-200 ease-out flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw size={14} strokeWidth={1.75} />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        {/* State C: Forecast Results */}
        {forecastResult && !forecastLoading && (
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
