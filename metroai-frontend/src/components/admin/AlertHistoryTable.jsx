import React, { useState, useEffect, useMemo } from 'react';
import { fetchAlertHistory } from '../../services/api';
import { getRiskConfig } from '../../utils/risk';
import { formatNumber, formatISODate } from '../../utils/formatters';
import { Search, RefreshCw, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import LoadingSkeleton from '../common/LoadingSkeleton';

export default function AlertHistoryTable({ onSelectStation }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  async function loadHistory() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAlertHistory(100);
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load alert history:', err);
      setError('Unable to fetch alert logs from database.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const filtered = useMemo(() => {
    return alerts.filter((log) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = (log.station_name || '').toLowerCase().includes(q);
        const matchesId = String(log.station_id).includes(q);
        if (!matchesName && !matchesId) return false;
      }
      if (riskFilter !== 'ALL' && log.risk_level !== riskFilter) {
        return false;
      }
      return true;
    });
  }, [alerts, search, riskFilter]);

  return (
    <div className="flex flex-col gap-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search
              size={15}
              strokeWidth={1.75}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter logged alerts by station or ID..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#1F2A25] dark:border-[#1F2A25] bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-[#1F2A25] dark:border-[#1F2A25] bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MODERATE">Moderate</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <button
          type="button"
          onClick={loadHistory}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-[#1F2A25] dark:border-[#1F2A25] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <RefreshCw size={13} strokeWidth={1.75} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Database Logs</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-6 space-y-3">
            <LoadingSkeleton width="100%" height="45px" className="rounded-lg" />
            <LoadingSkeleton width="100%" height="45px" className="rounded-lg" />
            <LoadingSkeleton width="100%" height="45px" className="rounded-lg" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
            <ShieldCheck size={32} strokeWidth={1.5} className="text-emerald-500 mb-1" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No Persistent Alerts Recorded
            </p>
            <p className="text-xs max-w-sm">
              All 262 stations are operating within standard passenger flow capacity thresholds.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Log ID</th>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Station</th>
                  <th className="py-3 px-4">Risk Severity</th>
                  <th className="py-3 px-4 text-right">Predicted Inflow</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filtered.map((log) => {
                  const risk = getRiskConfig(log.risk_level || 'LOW');
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        #{log.id}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 tabular-nums">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} strokeWidth={1.75} className="text-slate-400" />
                          <span>{formatISODate(log.timestamp)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {log.station_name || `Station #${log.station_id}`}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          GTFS Stop ID: {log.station_id}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                          style={{
                            backgroundColor: risk.bg,
                            borderColor: risk.border,
                            color: risk.color,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: risk.color }}
                          />
                          {risk.shortLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold tabular-nums text-slate-900 dark:text-white">
                        {formatNumber(log.predicted_inflow)} <span className="text-[10px] font-normal text-slate-400">pax/10m</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {onSelectStation && (
                          <button
                            type="button"
                            onClick={() => onSelectStation(log.station_id)}
                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-[#059669] dark:text-[#059669] hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition-colors cursor-pointer"
                          >
                            Inspect Station
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
