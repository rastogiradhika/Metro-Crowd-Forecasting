import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { getRiskConfig } from '../../utils/risk';
import { formatNumber } from '../../utils/formatters';
import { LINE_COLORS } from '../../data/stations';

export default function StationTable({
  forecasts = [],
  onSelectStation,
  selectedStationId = null,
}) {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [lineFilter, setLineFilter] = useState('ALL');
  const [sortField, setSortField] = useState('predicted_inflow');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Extract unique lines for filter
  const lines = useMemo(() => {
    const set = new Set();
    forecasts.forEach((f) => {
      if (f.line) set.add(f.line);
    });
    return Array.from(set).sort();
  }, [forecasts]);

  // Filter & Sort
  const filtered = useMemo(() => {
    return forecasts
      .filter((item) => {
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchesName = item.station_name.toLowerCase().includes(q);
          const matchesLine = item.line?.toLowerCase().includes(q);
          if (!matchesName && !matchesLine) return false;
        }
        if (riskFilter !== 'ALL' && item.risk_level !== riskFilter) {
          return false;
        }
        if (lineFilter !== 'ALL' && item.line !== lineFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortOrder === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
      });
  }, [forecasts, search, riskFilter, lineFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  function handleSort(field) {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setPage(1);
  }

  return (
    <div className="w-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors duration-200">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <label htmlFor="station-search" className="sr-only">
            Search stations or metro line
          </label>
          <Search size={15} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="station-search"
            type="text"
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            placeholder="Search stations or metro line..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Risk Filter */}
          <select
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none focus:border-cyan-500 cursor-pointer"
            value={riskFilter}
            aria-label="Filter by risk level"
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MODERATE">Moderate Only</option>
            <option value="LOW">Low Only</option>
          </select>

          {/* Line Filter */}
          <select
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none focus:border-cyan-500 cursor-pointer"
            value={lineFilter}
            aria-label="Filter by metro line"
            onChange={(e) => {
              setLineFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Lines</option>
            {lines.map((ln) => (
              <option key={ln} value={ln}>{ln} Line</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <th
                onClick={() => handleSort('station_name')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>Station</span>
                  <ArrowUpDown size={12} strokeWidth={1.75} />
                </div>
              </th>
              <th className="py-3 px-4">Line</th>
              <th
                onClick={() => handleSort('predicted_inflow')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>Predicted Inflow</span>
                  <ArrowUpDown size={12} strokeWidth={1.75} />
                </div>
              </th>
              <th
                onClick={() => handleSort('risk_level')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>Risk Level</span>
                  <ArrowUpDown size={12} strokeWidth={1.75} />
                </div>
              </th>
              <th className="py-3 px-4">Horizon</th>
              <th className="py-3 px-4">Trend</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                  No stations match your active search or filters.
                </td>
              </tr>
            ) : (
              paginated.map((row) => {
                const risk = getRiskConfig(row.risk_level);
                const lineCol = LINE_COLORS[row.line] || '#64748B';
                const isSelected = selectedStationId === row.station_id;

                return (
                  <tr
                    key={row.station_id}
                    tabIndex={0}
                    onClick={() => onSelectStation(row.station_id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectStation(row.station_id);
                      }
                    }}
                    className={`cursor-pointer transition-colors duration-100 focus:outline-none focus:bg-cyan-50/50 dark:focus:bg-cyan-950/20 ${
                      isSelected
                        ? 'bg-cyan-50/60 dark:bg-cyan-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Station Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: lineCol }} />
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {row.station_name}
                        </span>
                      </div>
                    </td>

                    {/* Line */}
                    <td className="py-3 px-4">
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${lineCol}15`,
                          color: lineCol,
                        }}
                      >
                        {row.line}
                      </span>
                    </td>

                    {/* Predicted Inflow */}
                    <td className="py-3 px-4">
                      <div className="flex items-baseline gap-1">
                        <span
                          className="font-bold tabular-nums text-base"
                          style={{ color: risk.color }}
                        >
                          {formatNumber(row.predicted_inflow)}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">pax</span>
                      </div>
                    </td>

                    {/* Risk Level */}
                    <td className="py-3 px-4">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border"
                        style={{
                          backgroundColor: risk.bg,
                          borderColor: risk.border,
                          color: risk.color,
                        }}
                      >
                        {risk.shortLabel}
                      </span>
                    </td>

                    {/* Horizon */}
                    <td className="py-3 px-4">
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                        +{row.horizon_minutes}m
                      </span>
                    </td>

                    {/* Trend */}
                    <td className="py-3 px-4">
                      {row.trend === 'UP' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                          <TrendingUp size={13} strokeWidth={1.75} /> Rising
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <TrendingDown size={13} strokeWidth={1.75} /> Easing
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        aria-label={`Inspect ${row.station_name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStation(row.station_id);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Eye size={13} strokeWidth={1.75} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
        <span className="tabular-nums">
          Showing <strong>{(page - 1) * pageSize + 1}</strong> to <strong>{Math.min(page * pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong> stations
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft size={14} strokeWidth={1.75} />
          </button>
          <span className="tabular-nums px-2">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Next page"
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}
