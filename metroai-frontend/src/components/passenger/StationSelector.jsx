import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, MapPin, X, Check, ChevronDown } from 'lucide-react';
import { LINE_COLORS } from '../../data/stations';

export default function StationSelector({
  label = 'Station',
  placeholder = 'Select station...',
  stations = [],
  selectedStationId = null,
  onSelectStation,
  excludeStationId = null,
  badgeType = null, // 'origin' | 'dest'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);

  // Use station_id (DMRC station code) consistently, fallback to id
  const getStationCode = (s) => (s ? (s.station_id ?? s.id) : null);

  const selectedStation = stations.find((s) => getStationCode(s) === Number(selectedStationId));

  // Filter stations based on search query and exclude opposite selection (Memoized)
  const filtered = useMemo(() => {
    return stations.filter((s) => {
      if (excludeStationId && getStationCode(s) === Number(excludeStationId)) return false;
      if (!query.trim()) return true;
      return (
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        (s.line && s.line.toLowerCase().includes(query.toLowerCase()))
      );
    });
  }, [stations, excludeStationId, query]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(station) {
    onSelectStation(getStationCode(station));
    setIsOpen(false);
    setQuery('');
  }

  return (
    <div className="relative flex flex-col gap-1 w-full" ref={wrapperRef}>
      {/* Label and 4px spacing rule */}
      <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-slate-700 dark:text-slate-300 uppercase">
        <div className="flex items-center gap-2">
          {badgeType === 'origin' && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-[#1F2A25] dark:border-[#1F2A25]">
              ORIGIN
            </span>
          )}
          {badgeType === 'dest' && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-[#1F2A25] dark:border-[#1F2A25]">
              DESTINATION
            </span>
          )}
          <span>{label}</span>
        </div>
        {selectedStation && (
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">ID: {getStationCode(selectedStation)}</span>
        )}
      </div>

      {/* Trigger Box - 1px border, 8px radius */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={`${label}: ${selectedStation ? selectedStation.name : placeholder}`}
        className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border text-left transition-colors duration-150 ${
          isOpen
            ? 'border-[#059669] ring-1 ring-cyan-500 bg-white dark:bg-slate-800'
            : 'border-[#1F2A25] dark:border-[#1F2A25] bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <MapPin
            size={18}
            strokeWidth={1.75}
            className="shrink-0 text-slate-400 dark:text-slate-500"
            style={{
              color: selectedStation?.line ? LINE_COLORS[selectedStation.line] : undefined,
            }}
          />
          {selectedStation ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium text-slate-900 dark:text-white truncate text-sm">
                {selectedStation.name}
              </span>
              {selectedStation.line && (
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 border"
                  style={{
                    backgroundColor: `${LINE_COLORS[selectedStation.line] || '#64748B'}15`,
                    borderColor: `${LINE_COLORS[selectedStation.line] || '#64748B'}40`,
                    color: LINE_COLORS[selectedStation.line] || '#64748B',
                  }}
                >
                  {selectedStation.line}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-500 dark:text-slate-400 text-sm">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          size={16}
          strokeWidth={1.75}
          className={`shrink-0 text-slate-400 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-[#059669]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu - 1px border, 8px radius */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-800 border border-[#1F2A25] dark:border-[#1F2A25] rounded-lg shadow-lg overflow-hidden flex flex-col max-h-72">
          {/* Search Input Bar */}
          <div className="p-2 border-b border-[#1F2A25] dark:border-[#1F2A25] bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
            <Search size={15} strokeWidth={1.75} className="text-slate-400 shrink-0 ml-1" />
            <input
              id="station-search-input"
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type station name or line..."
              aria-label="Filter stations"
              className="w-full bg-transparent border-0 p-1 text-sm text-slate-900 dark:text-white focus:outline-none placeholder-slate-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={14} strokeWidth={1.75} />
              </button>
            )}
          </div>

          {/* Station List */}
          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-xs">
                No stations match "{query}"
              </div>
            ) : (
              filtered.map((station) => {
                const code = getStationCode(station);
                const isSelected = code === Number(selectedStationId);
                const lineColor = LINE_COLORS[station.line] || '#64748B';

                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleSelect(station)}
                    className={`w-full px-4 py-2 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-100 cursor-pointer ${
                      isSelected ? 'bg-cyan-50/50 dark:bg-cyan-950/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: lineColor }}
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {station.name}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                        ({station.line})
                      </span>
                    </div>

                    {isSelected && (
                      <Check size={16} strokeWidth={1.75} className="text-[#059669] dark:text-[#059669] shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
