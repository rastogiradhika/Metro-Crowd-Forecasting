import React, { useState, useEffect } from 'react';
import {
  fetchAdminForecast,
  fetchStationForecast,
  fetchStationExplanation,
} from '../services/api';
import NetworkSummary from '../components/admin/NetworkSummary';
import PriorityAlerts from '../components/admin/PriorityAlerts';
import StationTable from '../components/admin/StationTable';
import StationDrawer from '../components/admin/StationDrawer';
import NetworkPriorityView from '../components/admin/NetworkPriorityView';
import AlertHistoryTable from '../components/admin/AlertHistoryTable';
import { formatISODate } from '../utils/formatters';
import { Clock, Shield, AlertCircle, LayoutGrid, Table, BellRing, ArrowRight, History } from 'lucide-react';

export default function AdminDashboard() {
  const [horizon, setHorizon] = useState(20);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('table'); // 'table' | 'schematic' | 'history'

  // Station Drawer state
  const [selectedStationId, setSelectedStationId] = useState(null);
  const [drawerData, setDrawerData] = useState(null);
  const [drawerExplanation, setDrawerExplanation] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Load Admin Data on horizon change
  useEffect(() => {
    const controller = new AbortController();
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAdminForecast(horizon);
        if (!controller.signal.aborted) {
          setAdminData(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Failed to load operations forecast:', err);
          setError('Unable to retrieve network forecast. Please try again.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => controller.abort();
  }, [horizon]);

  // Load Station Drawer Data when station is selected (with AbortController to prevent race conditions)
  useEffect(() => {
    if (!selectedStationId) {
      setDrawerData(null);
      setDrawerExplanation(null);
      return;
    }

    const controller = new AbortController();

    async function loadDrawer() {
      setDrawerLoading(true);
      try {
        const [stForecast, stExplain] = await Promise.all([
          fetchStationForecast(selectedStationId, horizon),
          fetchStationExplanation(selectedStationId, horizon).catch(() => ({ available: false, message: 'Attribution analysis unavailable' })),
        ]);
        if (!controller.signal.aborted) {
          setDrawerData(stForecast);
          setDrawerExplanation(stExplain);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Failed to load station drilldown:', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setDrawerLoading(false);
        }
      }
    }
    loadDrawer();

    return () => controller.abort();
  }, [selectedStationId, horizon]);

  const activeAlert = adminData?.active_predictive_alert;

  return (
    <div className="w-full min-h-screen py-10 sm:py-14 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Header / Operations Bar (32px section gap) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-200/70 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                <Shield size={12} strokeWidth={1.75} />
                <span>DMRC Operations Center</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Network Inflow Operations
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              System-wide passenger inflow predictions across 262 Delhi Metro stations for preemptive dispatch and gate management.
            </p>
          </div>

          {/* Time & Horizon Controls */}
          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Horizon
              </span>
              <div className="flex items-center p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                {[10, 20, 30].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHorizon(h)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                      horizon === h
                        ? 'bg-[#0F172A] text-white dark:bg-cyan-600 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    +{h} min
                  </button>
                ))}
              </div>
            </div>

            {adminData?.updated_at && (
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                <Clock size={12} strokeWidth={1.75} />
                <span>Updated: {formatISODate(adminData.updated_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Proactive Predictive Alert Box */}
        {activeAlert && (
          <div
            onClick={() => setSelectedStationId(activeAlert.station_id)}
            className="w-full p-4 sm:p-5 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-red-100/60 dark:hover:bg-red-950/30 transition-colors shadow-xs"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 shrink-0">
                <BellRing size={20} strokeWidth={1.75} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                  Proactive Predictive Alert (+{activeAlert.horizon_minutes}m)
                </span>
                <p className="text-sm font-medium leading-relaxed">
                  {activeAlert.text}
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold shrink-0 hover:bg-red-700 transition-colors">
              <span>Inspect Station</span>
              <ArrowRight size={13} strokeWidth={1.75} />
            </div>
          </div>
        )}

        {/* Error Handling */}
        {error && (
          <div className="p-4 sm:p-6 rounded-2xl border border-red-200 bg-red-50 text-red-800 text-sm flex items-center gap-3">
            <AlertCircle size={18} strokeWidth={1.75} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Summary KPI Cards */}
        {adminData?.summary && (
          <NetworkSummary
            summary={adminData.summary}
            totalStations={adminData.forecasts?.length || 262}
            horizon={horizon}
          />
        )}

        {/* Priority 5 Alerts */}
        {adminData?.priority_alerts && (
          <PriorityAlerts
            alerts={adminData.priority_alerts}
            onSelectStation={(id) => setSelectedStationId(id)}
          />
        )}

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="flex items-center p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B]">
            <button
              type="button"
              onClick={() => setActiveView('table')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'table'
                  ? 'bg-[#0F172A] text-white dark:bg-cyan-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Table size={14} strokeWidth={1.75} />
              <span>Station Table (262)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('schematic')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'schematic'
                  ? 'bg-[#0F172A] text-white dark:bg-cyan-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid size={14} strokeWidth={1.75} />
              <span>Network Priority Schematic</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('history')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'history'
                  ? 'bg-[#0F172A] text-white dark:bg-cyan-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History size={14} strokeWidth={1.75} />
              <span>Alert History Logs</span>
            </button>
          </div>
        </div>

        {/* 262 Stations Table View */}
        {activeView === 'table' && adminData?.forecasts && (
          <StationTable
            forecasts={adminData.forecasts}
            selectedStationId={selectedStationId}
            onSelectStation={(id) => setSelectedStationId(id)}
          />
        )}

        {/* Network Priority Schematic View */}
        {activeView === 'schematic' && adminData?.forecasts && (
          <NetworkPriorityView
            forecasts={adminData.forecasts}
            selectedStationId={selectedStationId}
            onSelectStation={(id) => setSelectedStationId(id)}
          />
        )}

        {/* Historical Alert Logs View */}
        {activeView === 'history' && (
          <AlertHistoryTable
            onSelectStation={(id) => setSelectedStationId(id)}
          />
        )}

        {/* Station Drilldown Drawer */}
        {selectedStationId && (
          <StationDrawer
            stationId={selectedStationId}
            onClose={() => setSelectedStationId(null)}
            data={drawerData}
            loading={drawerLoading}
            explanation={drawerExplanation}
          />
        )}
      </div>
    </div>
  );
}
