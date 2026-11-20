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
import DataNotice from '../components/common/DataNotice';
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
        const data = await fetchAdminForecast(horizon, controller.signal);
        if (!controller.signal.aborted) {
          setAdminData(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Failed to load operations forecast:', err);
          setError('Unable to retrieve network forecast. Please verify backend connection.');
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

  // Load Station Drawer Data when selectedStationId or horizon changes
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
          fetchStationForecast(selectedStationId, horizon, controller.signal),
          fetchStationExplanation(selectedStationId, horizon, controller.signal).catch(() => ({ available: false, message: 'Reason for prediction (AI) currently unavailable' })),
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
    <div className="w-full min-h-screen py-8 sm:py-12 bg-slate-50 dark:bg-[#090D11] text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header / Operations Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <Shield size={12} strokeWidth={1.75} />
                <span>DMRC Operations Center</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
              Crowd Management Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              System-wide expected crowd predictions across 262 Delhi Metro stations for preemptive dispatch and gate management.
            </p>
          </div>

          {/* Time & Forecast Horizon Controls */}
          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                Forecast Time
              </span>
              <div className="flex items-center p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {[10, 20, 30].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHorizon(h)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      horizon === h
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Next {h} mins
                  </button>
                ))}
              </div>
            </div>

            {adminData?.updated_at && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                <Clock size={12} strokeWidth={1.75} />
                <span>UPDATED: {formatISODate(adminData.updated_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* AI Disclaimer / Model Mode Notice */}
        <DataNotice meta={adminData?.meta} />

        {/* 🚨 HIGH CROWD ALERT BANNER */}
        {activeAlert && (
          <div
            onClick={() => setSelectedStationId(activeAlert.station_id)}
            className="w-full p-4 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-red-100/70 dark:hover:bg-red-950/30 transition-colors shadow-xs"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 shrink-0">
                <BellRing size={18} strokeWidth={1.75} />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                  HIGH CROWD ALERT (Next {activeAlert.horizon_minutes || horizon} Mins)
                </span>
                <p className="text-xs leading-relaxed text-red-900 dark:text-red-100 font-medium">
                  Around <strong>{activeAlert.predicted_inflow} people</strong> are expected entering at <strong>{activeAlert.station_name}</strong>. Open extra gates to manage rush.
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shrink-0">
              <span>Inspect Station</span>
              <ArrowRight size={13} strokeWidth={1.75} />
            </div>
          </div>
        )}

        {/* Error Handling */}
        {error && (
          <div className="p-4 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 text-xs flex items-center gap-2.5">
            <AlertCircle size={16} strokeWidth={1.75} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State for initial batch prediction */}
        {loading && !adminData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse h-24" />
              ))}
            </div>
            <div className="p-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse h-64 flex flex-col items-center justify-center gap-3 text-slate-500">
              <div className="w-7 h-7 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
              <span className="text-xs font-mono">Forecasting crowd levels across all 262 DMRC stations (Next {horizon} mins)...</span>
            </div>
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

        {/* Top 5 Busiest Stations */}
        {adminData?.priority_alerts && (
          <PriorityAlerts
            alerts={adminData.priority_alerts}
            onSelectStation={(id) => setSelectedStationId(id)}
          />
        )}

        {/* View Switcher Tabs (Flat Segmented Control) */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="flex items-center p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setActiveView('table')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeView === 'table'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Table size={14} strokeWidth={1.75} />
              <span>Station Table (262)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('schematic')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeView === 'schematic'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid size={14} strokeWidth={1.75} />
              <span>Network Priority Schematic</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('history')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeView === 'history'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History size={14} strokeWidth={1.75} />
              <span>Past Staff Alerts</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        {activeView === 'table' && (
          <StationTable
            forecasts={adminData?.forecasts || []}
            onSelectStation={(id) => setSelectedStationId(id)}
            selectedStationId={selectedStationId}
          />
        )}

        {activeView === 'schematic' && (
          <NetworkPriorityView
            forecasts={adminData?.forecasts || []}
            onSelectStation={(id) => setSelectedStationId(id)}
            selectedStationId={selectedStationId}
          />
        )}

        {activeView === 'history' && (
          <AlertHistoryTable onSelectStation={(id) => setSelectedStationId(id)} />
        )}
      </div>

      {/* Station Drilldown Drawer */}
      <StationDrawer
        stationId={selectedStationId}
        onClose={() => setSelectedStationId(null)}
        data={drawerData}
        loading={drawerLoading}
        explanation={drawerExplanation}
      />
    </div>
  );
}
