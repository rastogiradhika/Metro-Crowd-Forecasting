import React, { useState, useEffect } from 'react';
import { ArrowRight, Clock, AlertCircle, Loader2 } from 'lucide-react';
import StationSelector from './StationSelector';

export default function JourneyForm({
  stations = [],
  onSubmit,
  loading = false,
  initialOrigin = 50,      // Rajiv Chowk (GTFS master stop_id 50)
  initialDestination = 59, // Hauz Khas (GTFS master stop_id 59)
  initialTime = '08:15',
}) {
  const [originId, setOriginId] = useState(initialOrigin);
  const [destinationId, setDestinationId] = useState(initialDestination);
  const [travelTime, setTravelTime] = useState(initialTime);
  const [error, setError] = useState(null);

  // Synchronize with loaded stations dynamically
  useEffect(() => {
    if (stations && stations.length > 0) {
      const rajiv = stations.find((s) => s.name && s.name.toLowerCase().includes('rajiv chowk'));
      const hauz = stations.find((s) => s.name && s.name.toLowerCase().includes('hauz khas'));
      if (rajiv) {
        setOriginId(rajiv.station_id || rajiv.id);
      }
      if (hauz) {
        setDestinationId(hauz.station_id || hauz.id);
      }
    }
  }, [stations]);

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!originId) {
      setError('Please select an origin station.');
      return;
    }
    if (!destinationId) {
      setError('Please select a destination station.');
      return;
    }
    if (Number(originId) === Number(destinationId)) {
      setError('Origin and destination cannot be the same station.');
      return;
    }
    if (!travelTime) {
      setError('Please choose your expected travel time.');
      return;
    }

    onSubmit({
      origin_id: Number(originId),
      destination_id: Number(destinationId),
      travel_time: travelTime,
    });
  }

  return (
    <div className="w-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-sm transition-colors duration-200">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Plan your journey smarter.
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Predict station inflow levels and crowd bottlenecks before you head out.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={16} strokeWidth={1.75} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Form Inputs Grid: 12px gap between group items */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Origin Station - 5 cols */}
          <div className="md:col-span-5">
            <StationSelector
              label="Origin Station"
              placeholder="Select origin..."
              stations={stations}
              selectedStationId={originId}
              onSelectStation={(id) => {
                setOriginId(id);
                if (error) setError(null);
              }}
              excludeStationId={destinationId}
              badgeType="origin"
            />
          </div>

          {/* Destination Station - 4 cols */}
          <div className="md:col-span-4">
            <StationSelector
              label="Destination Station"
              placeholder="Select destination..."
              stations={stations}
              selectedStationId={destinationId}
              onSelectStation={(id) => {
                setDestinationId(id);
                if (error) setError(null);
              }}
              excludeStationId={originId}
              badgeType="dest"
            />
          </div>

          {/* Travel Time - 3 cols */}
          <div className="md:col-span-3 flex flex-col gap-1 w-full">
            <label
              htmlFor="travel-time-input"
              className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-700 dark:text-slate-300 uppercase"
            >
              <Clock size={13} strokeWidth={1.75} />
              <span>Travel Time</span>
            </label>
            <div className="relative">
              <input
                id="travel-time-input"
                type="time"
                value={travelTime}
                onChange={(e) => setTravelTime(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors duration-150 tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* Submit Button Row - Solid Navy CTA */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white dark:bg-cyan-600 dark:hover:bg-cyan-500 text-sm font-semibold transition-all duration-150 shadow-sm disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} strokeWidth={1.75} className="animate-spin" />
                <span>Forecasting Passenger Inflow...</span>
              </>
            ) : (
              <>
                <span>Check Crowd Forecast</span>
                <ArrowRight size={16} strokeWidth={1.75} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
