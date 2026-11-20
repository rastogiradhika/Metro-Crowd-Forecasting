import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Search } from 'lucide-react';

export default function JourneyForm({
  stations = [],
  onSubmit,
  loading = false,
  initialOrigin = 50,
  initialDestination = 59,
  initialTime = '08:15',
}) {
  const [originId, setOriginId] = useState(initialOrigin);
  const [destinationId, setDestinationId] = useState(initialDestination);
  const [travelTime, setTravelTime] = useState(initialTime);
  const [validationError, setValidationError] = useState('');

  // Sync travel time when shifted by the advisory button
  useEffect(() => {
    if (initialTime) {
      setTravelTime(initialTime);
    }
  }, [initialTime]);

  const handleSwap = () => {
    setOriginId(destinationId);
    setDestinationId(originId);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (originId === destinationId) {
      setValidationError('Boarding and destination stations cannot be the same.');
      return;
    }
    setValidationError('');
    onSubmit({
      origin_id: Number(originId),
      destination_id: Number(destinationId),
      travel_time: travelTime,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 sm:p-6 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-5 transition-colors"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Origin Station Dropdown */}
        <div className="md:col-span-4 space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Boarding Station
          </label>
          <select
            value={originId}
            onChange={(e) => setOriginId(Number(e.target.value))}
            className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors cursor-pointer"
          >
            {stations.map((st) => (
              <option key={st.station_id} value={st.station_id}>
                {st.name} ({st.line} Line)
              </option>
            ))}
          </select>
        </div>

        {/* Swap Button */}
        <div className="md:col-span-1 flex justify-center py-1 md:py-0 md:pb-0.5">
          <button
            type="button"
            onClick={handleSwap}
            aria-label="Swap boarding and destination stations"
            title="Swap stations"
            className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center cursor-pointer"
          >
            <ArrowRightLeft size={16} strokeWidth={1.75} />
          </button>
        </div>

        {/* Destination Station Dropdown */}
        <div className="md:col-span-4 space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Destination Station
          </label>
          <select
            value={destinationId}
            onChange={(e) => setDestinationId(Number(e.target.value))}
            className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors cursor-pointer"
          >
            {stations.map((st) => (
              <option key={st.station_id} value={st.station_id}>
                {st.name} ({st.line} Line)
              </option>
            ))}
          </select>
        </div>

        {/* Departure Time Input */}
        <div className="md:col-span-3 space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Departure Time
          </label>
          <input
            type="time"
            value={travelTime}
            onChange={(e) => setTravelTime(e.target.value)}
            required
            className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
          />
        </div>
      </div>

      {validationError && (
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">{validationError}</p>
      )}

      {/* Action Area with Primary CTA in Deep Emerald with Pure White text */}
      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto h-10 px-5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Predicting Inflow...</span>
            </>
          ) : (
            <>
              <Search size={15} strokeWidth={1.75} />
              <span>Get Crowd Forecast</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
