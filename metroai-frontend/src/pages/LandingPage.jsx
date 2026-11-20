import React, { useState, useEffect } from 'react';

import { Link, useNavigate, useLocation } from 'react-router-dom';

import {

  ArrowDown,

  BarChart2,

  Clock,

  Sparkles,

  ArrowRight,

  ChevronDown,

  AlertTriangle,

  RotateCcw

} from 'lucide-react';

import { MODEL_METRICS, STATIONS } from '../data/stations';

import { useAuth } from '../context/AuthContext';

import { fetchPublicStationForecast, fetchStations } from '../services/api';

import { getRiskConfig } from '../utils/risk';

import MetroSchematicMap from '../components/common/MetroSchematicMap';

export default function LandingPage() {

  const { isOperatorLoggedIn, openLoginModal } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to section when navigated with hash
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [location.hash]);

  // Dynamic quick-check station selector state

  const [stationList, setStationList] = useState([]);

  const [selectedStationId, setSelectedStationId] = useState(50); // Rajiv Chowk (ID: 50)

  const [selectedPeriod, setSelectedPeriod] = useState('20');

  const [quickForecast, setQuickForecast] = useState(null);

  const [loadingForecast, setLoadingForecast] = useState(false);

  const [forecastError, setForecastError] = useState(null);

  const [hasQueried, setHasQueried] = useState(false);

  // Load real stations for dropdown on mount

  useEffect(() => {

    let active = true;

    async function initStations() {

      try {

        const data = await fetchStations();

        if (active && Array.isArray(data) && data.length > 0) {

          setStationList(data);

        } else {

          setStationList(STATIONS);

        }

      } catch {

        if (active) setStationList(STATIONS);

      }

    }

    initStations();

    return () => { active = false; };

  }, []);

  // Fetch real model prediction on user action

  async function handleGetForecast() {

    setLoadingForecast(true);

    setForecastError(null);

    setHasQueried(true);

    try {

      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hh}:${mm}`;

      const data = await fetchPublicStationForecast(selectedStationId, currentTime);

      setQuickForecast(data);

    } catch (err) {

      console.error('Failed to retrieve forecast:', err);

      setForecastError('Could not connect to the prediction service. Please ensure the backend is running.');

      setQuickForecast(null);

    } finally {

      setLoadingForecast(false);

    }

  }

  const selectedStationObj =

    stationList.find((s) => s.station_id === selectedStationId) ||

    STATIONS[43];

  function handleCheckCrowdClick(e) {

    e.preventDefault();

    const el = document.getElementById('station-forecast');

    if (el) {

      el.scrollIntoView({ behavior: 'smooth' });

    }

  }

  // Multi-step series values from real ML response (supports both horizon_series and forecast_series)
  const series = quickForecast?.horizon_series || quickForecast?.forecast_series || [];
  const s10 = series.find((s) => s.horizon === 10);
  const s20 = series.find((s) => s.horizon === 20);
  const s30 = series.find((s) => s.horizon === 30);

  const inflow10 = s10?.inflow ?? s10?.predicted_inflow;
  const inflow20 = s20?.inflow ?? s20?.predicted_inflow;
  const inflow30 = s30?.inflow ?? s30?.predicted_inflow;

  const risk10 = s10?.risk ?? s10?.risk_level ?? 'LOW';
  const risk20 = s20?.risk ?? s20?.risk_level ?? 'LOW';
  const risk30 = s30?.risk ?? s30?.risk_level ?? 'LOW';

  const risk20Cfg = getRiskConfig(risk20);

  return (

    <div className="w-full flex flex-col bg-white dark:bg-[#050807] text-[#101513] dark:text-[#F5F7F6] font-sans transition-colors">

      {/* ------ SECTION 1: HERO --------------------------------------------------------------------------------------------------------------------------------------------------------- */}

      <section className="relative w-full py-12 lg:py-20 px-4 sm:px-8 lg:px-12 overflow-hidden border-b border-[#D9E1DD] dark:border-[#26332E]">

        <div className="max-w-[1536px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* Left Column */}

          <div className="lg:col-span-6 flex flex-col items-start gap-6 z-10">

            {/* Tag Pill */}

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 text-xs font-mono tracking-wider">
              <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>Delhi Metro • Crowd Prediction</span>
            </div>

            {/* Headline */}

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display text-slate-900 dark:text-white tracking-tight leading-[1.1]">

              Predict Crowd.

              <br />

              <span className="text-[#059669]">Plan Better.</span>

            </h1>

            {/* Description */}

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed font-normal">

              Check how crowded your metro station is expected to be before you travel. AI predicts how crowded your station will be in the next 10, 20, or 30 minutes.

            </p>

            {/* CTA Buttons */}

            <div className="flex flex-wrap items-center gap-4 pt-2 w-full sm:w-auto">

              <button

                type="button"

                onClick={handleCheckCrowdClick}

                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs transition-all shadow-none flex items-center justify-center gap-2 cursor-pointer"

              >

                <span>Check Crowd Forecast</span>

                <ArrowDown size={15} strokeWidth={2.5} />

              </button>

              <Link

                to="/admin"

                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#EEF2F0] dark:bg-[#111815] hover:bg-[#E3E9E6] dark:hover:bg-[#17211C] border border-[#D9E1DD] dark:border-[#26332E] text-[#101513] dark:text-white font-semibold text-xs transition-all flex items-center justify-center gap-2"

              >

                <BarChart2 size={15} className="text-[#059669]" />

                <span>Open Operations Dashboard</span>

              </Link>

            </div>

            {/* Verified Metrics Strip from evaluation.csv */}

            <div className="grid grid-cols-3 gap-6 pt-4 w-full border-t border-[#D9E1DD] dark:border-[#26332E]">

              <div>

                <div className="text-2xl sm:text-3xl font-bold font-display text-[#101513] dark:text-white tabular-nums">

                  {MODEL_METRICS.stations}

                </div>

                <div className="text-xs text-[#5E6963] dark:text-[#9AA8A1] mt-0.5">Stations Monitored</div>

              </div>

              <div>

                <div className="text-2xl sm:text-3xl font-bold font-display text-[#059669] tabular-nums">

                  3 Horizons

                </div>

                <div className="text-xs text-[#5E6963] dark:text-[#9AA8A1] mt-0.5">10, 20 &amp; 30 Mins</div>

              </div>

              <div>

                <div className="text-2xl sm:text-3xl font-bold font-display text-[#101513] dark:text-white tabular-nums">

                  99.8%

                </div>

                <div className="text-xs text-[#5E6963] dark:text-[#9AA8A1] mt-0.5">AI Accuracy (99.8%)</div>

              </div>

            </div>

          </div>

          {/* Right Column: Delhi Metro Train Photo Container */}

          <div className="lg:col-span-6 relative">

            <div className="relative rounded-lg overflow-hidden border border-[#D9E1DD] dark:border-[#26332E] bg-[#F7F9F8] dark:bg-[#0B100E] shadow-2xl group">

              <img

                src="/metro-hero.jpg"

                alt="Delhi Metro train arriving at platform"

                className="w-full h-[320px] sm:h-[400px] object-cover transition-transform duration-700 group-hover:scale-105"

              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none"></div>

              <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-mono tracking-wider">
                <Sparkles size={13} className="text-emerald-400" />
                <span>Delhi Metro • Crowd Prediction</span>
              </div>

              <div className="absolute bottom-4 right-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white text-[11px] font-mono">

                <Clock size={12} className="text-[#059669]" />

                <span>Schedule-Aware Inflow Ingestion</span>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ------ SECTION 2: TRANSIT FORECASTING (Check Your Station) --------------------------------------------- */}

      <section id="station-forecast" className="w-full bg-[#F7F9F8] dark:bg-[#0B100E] py-16 px-4 sm:px-8 lg:px-12 border-b border-[#D9E1DD] dark:border-[#26332E]">

        <div className="max-w-[1536px] mx-auto flex flex-col gap-10">

          {/* Header */}

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">

            <div>

              <div className="text-xs font-mono uppercase tracking-wider text-[#059669] mb-1 font-bold">

                TRANSIT FORECASTING

              </div>

              <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#101513] dark:text-white">

                Check Your Station

              </h2>

              <p className="text-xs sm:text-sm text-[#5E6963] dark:text-[#9AA8A1] mt-1">

                Select your station to see expected passenger entrance rate per 10-minute slot.

              </p>

            </div>

            <Link

              to="/passenger"

              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#059669] text-white font-bold text-xs hover:bg-[#047857] transition-all shadow-sm w-fit"

            >

              <span>Full Journey Planner</span>

              <ArrowRight size={13} strokeWidth={2.5} />

            </Link>

          </div>

          {/* Form Controls */}

          <div className="w-full bg-white dark:bg-[#111815] p-6 rounded-lg border border-[#D9E1DD] dark:border-[#26332E] shadow-sm">

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">

              <div className="md:col-span-6 flex flex-col gap-2">

                <label className="text-xs font-semibold text-[#5E6963] dark:text-[#9AA8A1] flex items-center gap-1.5">

                  <span className="text-[#059669] font-bold">•</span>

                  <span>Select Metro Station</span>

                </label>

                <div className="relative">

                  <select

                    value={selectedStationId}

                    onChange={(e) => setSelectedStationId(Number(e.target.value))}

                    className="w-full bg-[#F7F9F8] dark:bg-[#050807] text-[#101513] dark:text-white px-4 py-3 rounded-xl border border-[#D9E1DD] dark:border-[#26332E] focus:border-[#059669] focus:outline-none appearance-none text-xs sm:text-sm cursor-pointer"

                  >

                    {stationList.map((st) => (

                      <option key={st.station_id} value={st.station_id}>

                        {st.name} ({st.line} Line)

                      </option>

                    ))}

                  </select>

                  <ChevronDown

                    size={16}

                    className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#5E6963] dark:text-[#9AA8A1]"

                  />

                </div>

              </div>

              <div className="md:col-span-3 flex flex-col gap-2">

                <label className="text-xs font-semibold text-[#5E6963] dark:text-[#9AA8A1] flex items-center gap-1.5">

                  <Clock size={13} className="text-[#059669]" />

                  <span>Forecast Period</span>

                </label>

                <div className="relative">

                  <select

                    value={selectedPeriod}

                    onChange={(e) => setSelectedPeriod(e.target.value)}

                    className="w-full bg-[#F7F9F8] dark:bg-[#050807] text-[#101513] dark:text-white px-4 py-3 rounded-xl border border-[#D9E1DD] dark:border-[#26332E] focus:border-[#059669] focus:outline-none appearance-none text-xs sm:text-sm cursor-pointer"

                  >

                    <option value="20">Next 10, 20 &amp; 30 Minutes</option>

                    <option value="10">Next 10 Minutes Only</option>

                    <option value="30">Next 30 Minutes Only</option>

                  </select>

                  <ChevronDown

                    size={16}

                    className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#5E6963] dark:text-[#9AA8A1]"

                  />

                </div>

              </div>

              <div className="md:col-span-3">

                <button

                  type="button"

                  onClick={handleGetForecast}

                  disabled={loadingForecast}

                  className="w-full py-3 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs sm:text-sm transition-all shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"

                >

                  {loadingForecast ? (

                    <>

                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>

                      <span>Loading Forecast...</span>

                    </>

                  ) : (

                    <>

                      <span>Get Forecast</span>

                      <Sparkles size={14} strokeWidth={2.5} />

                    </>

                  )}

                </button>

              </div>

            </div>

          </div>

          {/* Forecast Result Container */}

          <div className="w-full bg-white dark:bg-[#111815] border border-[#D9E1DD] dark:border-[#26332E] rounded-lg p-6 sm:p-8 space-y-6">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D9E1DD] dark:border-[#26332E]">

              <div className="flex items-center gap-3">

                <h3 className="text-2xl font-bold font-display text-[#101513] dark:text-white">

                  {selectedStationObj.name}

                </h3>

                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase bg-[#EEF2F0] dark:bg-[#17211C] border border-[#D9E1DD] dark:border-[#26332E] text-[#5E6963] dark:text-[#9AA8A1]">

                  {selectedStationObj.interchange ? 'Major Interchange' : 'Standard Transit Stop'}

                </span>

              </div>

              {hasQueried && quickForecast && (

                <div

                  className="px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase border w-fit"

                  style={{

                    color: risk20Cfg.color,

                    backgroundColor: risk20Cfg.bg,

                    borderColor: risk20Cfg.border,

                  }}

                >

                  • STATUS: {risk20} FLOW

                </div>

              )}

            </div>

            {/* Error State */}

            {forecastError && (

              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 text-xs flex items-center justify-between gap-4">

                <div className="flex items-center gap-2">

                  <AlertTriangle size={16} className="text-red-600 dark:text-red-400 shrink-0" />

                  <span>{forecastError}</span>

                </div>

                <button

                  type="button"

                  onClick={handleGetForecast}

                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"

                >

                  <RotateCcw size={12} />

                  <span>Retry</span>

                </button>

              </div>

            )}

            {/* Honest Empty State: Before user clicks Get Forecast */}

            {!hasQueried && !loadingForecast && (

              <div className="py-12 px-6 rounded-xl bg-[#F7F9F8] dark:bg-[#050807] border border-[#D9E1DD] dark:border-[#26332E] text-center space-y-3">

                <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#111815] border border-[#D9E1DD] dark:border-[#26332E] text-[#059669] mx-auto flex items-center justify-center">

                  <Clock size={20} strokeWidth={2} />

                </div>

                <h4 className="font-display font-bold text-base text-[#101513] dark:text-white">

                  No Forecast Yet

                </h4>

                <p className="text-base text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed font-normal">

                  Select a station above and click "Get Forecast" to query the XGBoost residual inference engine for live multi-step inflow predictions.

                </p>

              </div>

            )}

            {/* Real Prediction Display (When Received from Backend) */}

            {hasQueried && quickForecast && !loadingForecast && (

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

                <div className="p-6 rounded-xl bg-[#F7F9F8] dark:bg-[#050807] border border-[#D9E1DD] dark:border-[#26332E] space-y-3">

                  <div className="flex items-center justify-between text-xs font-mono text-[#5E6963] dark:text-[#9AA8A1]">

                    <span>Next 10 min</span>

                    <span

                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border"

                      style={{

                        color: getRiskConfig(risk10).color,

                        backgroundColor: getRiskConfig(risk10).bg,

                        borderColor: getRiskConfig(risk10).border,

                      }}

                    >

                      {risk10 === 'LOW' ? 'Comfortable' : risk10 === 'MODERATE' ? 'Moderate Rush' : 'Heavy Rush'}

                    </span>

                  </div>

                  <div className="text-xs text-[#5E6963] dark:text-[#9AA8A1]">Expected Crowd (People)</div>

                  <div className="text-3xl sm:text-4xl font-bold font-display text-[#101513] dark:text-white tabular-nums">

                    {inflow10 != null ? `${inflow10} Passengers` : '—'}

                  </div>

                  <div className="space-y-1">

                    <div className="flex justify-between text-[10px] font-medium text-slate-400">

                      <span>Comfortable</span>

                      <span>Moderate Rush</span>

                      <span>Heavy Rush</span>

                    </div>

                    <div className="w-full bg-[#D9E1DD] dark:bg-[#111815] h-2 rounded-full overflow-hidden">

                      <div

                        className="h-full rounded-full transition-all duration-300"

                        style={{

                          width: `${Math.min(100, ((inflow10 || 0) / 1000) * 100)}%`,

                          backgroundColor: getRiskConfig(risk10).color,

                        }}

                      ></div>

                    </div>

                  </div>

                </div>

                <div className="p-6 rounded-xl bg-[#F7F9F8] dark:bg-[#050807] border border-[#D9E1DD] dark:border-[#26332E] space-y-3">

                  <div className="flex items-center justify-between text-xs font-mono text-[#5E6963] dark:text-[#9AA8A1]">

                    <span>Next 20 min</span>

                    <span

                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border"

                      style={{

                        color: getRiskConfig(risk20).color,

                        backgroundColor: getRiskConfig(risk20).bg,

                        borderColor: getRiskConfig(risk20).border,

                      }}

                    >

                      {risk20 === 'LOW' ? 'Comfortable' : risk20 === 'MODERATE' ? 'Moderate Rush' : 'Heavy Rush'}

                    </span>

                  </div>

                  <div className="text-xs text-[#5E6963] dark:text-[#9AA8A1]">Expected Crowd (People)</div>

                  <div className="text-3xl sm:text-4xl font-bold font-display text-[#101513] dark:text-white tabular-nums">

                    {inflow20 != null ? `${inflow20} Passengers` : '—'}

                  </div>

                  <div className="space-y-1">

                    <div className="flex justify-between text-[10px] font-medium text-slate-400">

                      <span>Comfortable</span>

                      <span>Moderate Rush</span>

                      <span>Heavy Rush</span>

                    </div>

                    <div className="w-full bg-[#D9E1DD] dark:bg-[#111815] h-2 rounded-full overflow-hidden">

                      <div

                        className="h-full rounded-full transition-all duration-300"

                        style={{

                          width: `${Math.min(100, ((inflow20 || 0) / 1000) * 100)}%`,

                          backgroundColor: getRiskConfig(risk20).color,

                        }}

                      ></div>

                    </div>

                  </div>

                </div>

                <div className="p-6 rounded-xl bg-[#F7F9F8] dark:bg-[#050807] border border-[#D9E1DD] dark:border-[#26332E] space-y-3">

                  <div className="flex items-center justify-between text-xs font-mono text-[#5E6963] dark:text-[#9AA8A1]">

                    <span>Next 30 min</span>

                    <span

                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border"

                      style={{

                        color: getRiskConfig(risk30).color,

                        backgroundColor: getRiskConfig(risk30).bg,

                        borderColor: getRiskConfig(risk30).border,

                      }}

                    >

                      {risk30 === 'LOW' ? 'Comfortable' : risk30 === 'MODERATE' ? 'Moderate Rush' : 'Heavy Rush'}

                    </span>

                  </div>

                  <div className="text-xs text-[#5E6963] dark:text-[#9AA8A1]">Expected Crowd (People)</div>

                  <div className="text-3xl sm:text-4xl font-bold font-display text-[#101513] dark:text-white tabular-nums">

                    {inflow30 != null ? `${inflow30} Passengers` : '—'}

                  </div>

                  <div className="space-y-1">

                    <div className="flex justify-between text-[10px] font-medium text-slate-400">

                      <span>Comfortable</span>

                      <span>Moderate Rush</span>

                      <span>Heavy Rush</span>

                    </div>

                    <div className="w-full bg-[#D9E1DD] dark:bg-[#111815] h-2 rounded-full overflow-hidden">

                      <div

                        className="h-full rounded-full transition-all duration-300"

                        style={{

                          width: `${Math.min(100, ((inflow30 || 0) / 1000) * 100)}%`,

                          backgroundColor: getRiskConfig(risk30).color,

                        }}

                      ></div>

                    </div>

                  </div>

                </div>

              </div>

            )}

          </div>

        </div>

      </section>

      {/* ------ SECTION 3: MODEL ACCURACY & PERFORMANCE ------------------------------------------------------------------------------ */}

      <section id="prediction-accuracy" className="w-full py-16 px-4 sm:px-8 lg:px-12 border-b border-[#D9E1DD] dark:border-[#26332E]">

        <div className="max-w-[1536px] mx-auto flex flex-col gap-10">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">

            <div>

              <div className="text-xs font-mono uppercase tracking-wider text-[#059669] mb-1 font-bold">

                MODEL VERIFICATION

              </div>

              <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#101513] dark:text-white">

                Prediction Accuracy &amp; Performance

              </h2>

              <p className="text-xs sm:text-sm text-[#5E6963] dark:text-[#9AA8A1] mt-1">

                Validated on 1,841,548 commuter time slots from synthetic arrival distributions and official GTFS timetables.

              </p>

            </div>

            <Link

              to="/accuracy"

              className="text-xs font-bold text-[#059669] hover:underline flex items-center gap-1"

            >

              <span>View Full Evaluation Report</span>

              <ArrowRight size={13} strokeWidth={2} />

            </Link>

          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="p-6 rounded-lg bg-[#F7F9F8] dark:bg-[#0B100E] border border-[#D9E1DD] dark:border-[#26332E]">

              <div className="text-xs text-[#5E6963] dark:text-[#9AA8A1] uppercase font-mono">Coverage</div>

              <div className="text-3xl font-bold font-display text-[#101513] dark:text-white my-2">{MODEL_METRICS.stations}</div>

              <div className="text-xs text-[#059669] font-semibold">Stations Monitored</div>

              <p className="text-xs text-[#707A75] dark:text-[#66736D] mt-1">Delhi Metro network topology.</p>

            </div>

            <div className="p-6 rounded-lg bg-[#F7F9F8] dark:bg-[#0B100E] border border-[#D9E1DD] dark:border-[#26332E]">

              <div className="text-xs text-[#5E6963] dark:text-[#9AA8A1] uppercase font-mono">Intervals</div>

              <div className="text-3xl font-bold font-display text-[#101513] dark:text-white my-2">10 / 20 / 30</div>

              <div className="text-xs text-[#059669] font-semibold">Prediction Periods</div>

              <p className="text-xs text-[#707A75] dark:text-[#66736D] mt-1">Multi-step rolling horizons.</p>

            </div>

            <div className="p-6 rounded-lg bg-[#F7F9F8] dark:bg-[#0B100E] border border-[#D9E1DD] dark:border-[#26332E]">

              <div className="text-xs text-[#5E6963] dark:text-[#9AA8A1] uppercase font-mono">Mean Absolute Error</div>

              <div className="text-3xl font-bold font-display text-[#059669] my-2">{MODEL_METRICS.mae_10m} pax</div>

              <div className="text-xs text-[#059669] font-semibold">Model MAE (Residual)</div>

              <p className="text-xs text-[#707A75] dark:text-[#66736D] mt-1">Variance per 10-minute slot.</p>

            </div>

            <div className="p-6 rounded-lg bg-[#F7F9F8] dark:bg-[#0B100E] border border-[#D9E1DD] dark:border-[#26332E]">

              <div className="text-xs text-[#5E6963] dark:text-[#9AA8A1] uppercase font-mono">R² Score</div>

              <div className="text-3xl font-bold font-display text-[#101513] dark:text-white my-2">0.9983</div>

              <div className="text-xs text-[#059669] font-semibold">Coefficient of Determination</div>

              <p className="text-xs text-[#707A75] dark:text-[#66736D] mt-1">Schedule profile + residual fit.</p>

            </div>

          </div>

        </div>

      </section>

      {/* ------ SECTION 4: HOW IT WORKS --------------------------------------------------------------------------------------------------------------------------------- */}

      <section id="how-it-works" className="w-full bg-[#F7F9F8] dark:bg-[#0B100E] py-16 px-4 sm:px-8 lg:px-12 border-b border-[#D9E1DD] dark:border-[#26332E]">

        <div className="max-w-[1536px] mx-auto flex flex-col gap-10">

          <div>

            <div className="text-xs font-mono uppercase tracking-wider text-[#059669] mb-1 font-bold">

              PROCESS OVERVIEW

            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#101513] dark:text-white">

              How MetroAI Forecasts Flow

            </h2>

            <p className="text-xs sm:text-sm text-[#5E6963] dark:text-[#9AA8A1] mt-1">

              How our AI predicts crowd levels in three simple steps.

            </p>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="p-7 rounded-lg bg-white dark:bg-[#111815] border border-[#D9E1DD] dark:border-[#26332E] space-y-4 shadow-sm">

              <div className="text-xl font-bold font-display text-[#059669]">01</div>

              <h3 className="text-lg font-bold text-[#101513] dark:text-white">Collect Metro Data</h3>

              <p className="text-xs text-[#5E6963] dark:text-[#9AA8A1] leading-relaxed">

                We analyze official Delhi Metro train schedules and station layouts to understand how trains move.

              </p>

              <div className="text-[10px] font-mono text-[#059669] uppercase tracking-wider pt-2 border-t border-[#D9E1DD] dark:border-[#26332E]">

                METRO SCHEDULE DATA

              </div>

            </div>

            <div className="p-7 rounded-lg bg-white dark:bg-[#111815] border border-[#D9E1DD] dark:border-[#26332E] space-y-4 shadow-sm">

              <div className="text-xl font-bold font-display text-[#059669]">02</div>

              <h3 className="text-lg font-bold text-[#101513] dark:text-white">Predict Crowd</h3>

              <p className="text-xs text-[#5E6963] dark:text-[#9AA8A1] leading-relaxed">

                Our AI looks at time of day and past patterns to predict how many people will enter the station in the next 10-30 mins.

              </p>

              <div className="text-[10px] font-mono text-[#059669] uppercase tracking-wider pt-2 border-t border-[#D9E1DD] dark:border-[#26332E]">

                AI CROWD PREDICTION

              </div>

            </div>

            <div className="p-7 rounded-lg bg-white dark:bg-[#111815] border border-[#D9E1DD] dark:border-[#26332E] space-y-4 shadow-sm">

              <div className="text-xl font-bold font-display text-[#059669]">03</div>

              <h3 className="text-lg font-bold text-[#101513] dark:text-white">Help You Plan</h3>

              <p className="text-xs text-[#5E6963] dark:text-[#9AA8A1] leading-relaxed">

                You get clear advice on the best time to travel and which gates to use to avoid the rush.

              </p>

              <div className="text-[10px] font-mono text-[#059669] uppercase tracking-wider pt-2 border-t border-[#D9E1DD] dark:border-[#26332E]">

                COMMUTER GUIDANCE

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ------ SECTION 5: METRO CROWD MAP (Interactive Schematic) --------------------------------------------- */}

      <section id="metro-crowd-map" className="w-full py-16 px-4 sm:px-8 lg:px-12 border-b border-[#D9E1DD] dark:border-[#26332E]">

        <div className="max-w-[1536px] mx-auto flex flex-col gap-10">

          <div>

            <div className="text-xs font-mono uppercase tracking-wider text-[#059669] mb-1 font-bold">

              DELHI METRO CROWD MAP

            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#101513] dark:text-white">

              Delhi Metro Crowd Map

            </h2>

            <p className="text-xs sm:text-sm text-[#5E6963] dark:text-[#9AA8A1] mt-1">

              Select any junction node to inspect live multi-step entrance inflow forecasts.

            </p>

          </div>

          <MetroSchematicMap />

        </div>

      </section>

      {/* ------ SECTION 6: FOOTER CALLOUT --------------------------------------------------------------------------------------------------------------------------- */}

      <section className="w-full bg-[#F7F9F8] dark:bg-[#0B100E] py-20 px-4 sm:px-8 text-center border-t border-[#D9E1DD] dark:border-[#26332E]">

        <div className="max-w-3xl mx-auto space-y-6">

          <div className="w-12 h-12 rounded-lg bg-[#EEF2F0] dark:bg-[#111815] border border-[#D9E1DD] dark:border-[#26332E] text-[#059669] mx-auto flex items-center justify-center shadow-sm">

            <BarChart2 size={22} className="text-[#059669]" strokeWidth={1.75} />

          </div>

          <h2 className="text-3xl sm:text-4xl font-bold font-display text-[#101513] dark:text-white">

            Plan your Metro trip with crowd predictions.

          </h2>

          <p className="text-xs sm:text-sm text-[#5E6963] dark:text-[#9AA8A1] max-w-xl mx-auto leading-relaxed">

            Check how crowded your station is expected to be before you travel. Make informed daily commute decisions across all 262 Delhi Metro stations.

          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">

            <Link

              to="/passenger"

              className="px-6 py-3 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs sm:text-sm transition-all shadow-md"

            >

              Plan Journey

            </Link>

            <Link

              to="/admin"

              className="px-6 py-3 rounded-xl bg-white dark:bg-[#111815] hover:bg-[#EEF2F0] dark:hover:bg-[#17211C] border border-[#D9E1DD] dark:border-[#26332E] text-[#101513] dark:text-white font-semibold text-xs sm:text-sm transition-all"

            >

              View Operations Dashboard

            </Link>

          </div>

        </div>

      </section>

    </div>

  );

}

