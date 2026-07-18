import React, { useState, useEffect } from 'react';
import { 
  Search, Calculator, PackagePlus, ShieldCheck, Route, Clock, Shield, 
  Activity, MapPin, Truck, Warehouse, Sliders, Bell, Sparkles, 
  Smartphone, Check, RotateCw, Map, Navigation, Compass, FileText, 
  Layers, Wifi, AlertTriangle, ArrowRight, ArrowUpRight, TrendingUp, CheckCircle, HelpCircle, X, Globe, Gauge, HardDrive, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeroProps {
  onNavigate: (view: string) => void;
  onSetTrackId: (id: string) => void;
}

export default function Hero({ onNavigate, onSetTrackId }: HeroProps) {
  const [trackInput, setTrackInput] = useState('');
  const [activeTab, setActiveTab] = useState<'tracking' | 'routing' | 'quote'>('tracking');
  const [activeRole, setActiveRole] = useState<'dispatch' | 'warehouse' | 'public'>('dispatch');
  
  // Quick Calculator State
  const [calcWeight, setCalcWeight] = useState(15);
  const [calcDistance, setCalcDistance] = useState(450);
  const [calcTier, setCalcTier] = useState<'ground' | 'air' | 'sea'>('ground');

  // Interactive Route Optimizer State
  const [routeFrom, setRouteFrom] = useState('New York (JFK Depot)');
  const [routeTo, setRouteTo] = useState('Los Angeles (LAX Hub)');
  const [routeOptimizing, setRouteOptimizing] = useState(false);
  const [routeMetrics, setRouteMetrics] = useState({
    miles: 2790,
    fuelSavings: '18%',
    carbonReduction: '240 kg',
    drivingHours: '41 hrs',
    safetyRating: '99.8%'
  });

  // Simulated Warehouse Inventory levels
  const [inventory, setInventory] = useState([
    { id: 'STK-902', name: 'Critical Medical Supplies', stock: 88, minLevel: 30, unit: 'cases', temp: '4°C' },
    { id: 'STK-441', name: 'High-Density Semiconductor chips', stock: 12, minLevel: 25, unit: 'crates', temp: '21°C' },
    { id: 'STK-129', name: 'Cold-Chain Biological Vaccines', stock: 45, minLevel: 20, unit: 'vials', temp: '-18°C' },
    { id: 'STK-708', name: 'Precision Industrial Gearboxes', stock: 65, minLevel: 15, unit: 'units', temp: '24°C' }
  ]);

  // Toast message notification state
  const [toast, setToast] = useState<string | null>(null);
  
  // App Download Dialog Modal
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [downloadStep, setDownloadStep] = useState(1);
  const [appPhone, setAppPhone] = useState('');

  // Quick Shipment Booking Modal
  const [isQuickShipOpen, setIsQuickShipOpen] = useState(false);
  const [quickShipSuccess, setQuickShipSuccess] = useState<string | null>(null);
  const [shipWeight, setShipWeight] = useState('12');
  const [shipType, setShipType] = useState('Critical Medical Supplies');

  // Notification settings subscription states
  const [notifySLA, setNotifySLA] = useState(true);
  const [notifyGeofence, setNotifyGeofence] = useState(false);
  const [notifyDelay, setNotifyDelay] = useState(true);

  // Trigger floating notifications
  const triggerToast = (msg: string) => {
    setToast(null);
    setTimeout(() => {
      setToast(msg);
    }, 50);
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackInput.trim()) {
      onSetTrackId(trackInput.trim().toUpperCase());
      onNavigate('track');
    } else {
      triggerToast('Please enter a valid Waybill ID to initiate tracking search.');
    }
  };

  const handleQuickOptimize = () => {
    if (routeFrom === routeTo) {
      triggerToast('Origin and Destination must be different for path planning.');
      return;
    }
    setRouteOptimizing(true);
    triggerToast(`Optimizing neural route from ${routeFrom.split(' ')[0]} to ${routeTo.split(' ')[0]}...`);
    
    setTimeout(() => {
      const randomMiles = Math.floor(Math.random() * 1500) + 500;
      const randomFuel = (Math.floor(Math.random() * 15) + 10) + '%';
      const randomCarbon = (Math.floor(Math.random() * 300) + 100) + ' kg';
      const randomHours = Math.floor(randomMiles / 62) + ' hrs';
      const randomSafety = (99.5 + Math.random() * 0.4).toFixed(2) + '%';
      
      setRouteMetrics({
        miles: randomMiles,
        fuelSavings: randomFuel,
        carbonReduction: randomCarbon,
        drivingHours: randomHours,
        safetyRating: randomSafety
      });
      setRouteOptimizing(false);
      triggerToast(`Route optimized successfully! Avoided 3 congestion corridors.`);
    }, 1200);
  };

  const handleRestock = (id: string, name: string) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        const newStock = Math.min(100, item.stock + 20);
        return { ...item, stock: newStock };
      }
      return item;
    }));
    triggerToast(`Dispatched restock replenishment order for ${name}. +20 units queued.`);
  };

  const handleSaveNotifications = () => {
    triggerToast('Notification preferences successfully synced to primary satellite terminal.');
  };

  const handleSendAppSMS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appPhone.trim()) return;
    setDownloadStep(2);
    setTimeout(() => {
      setDownloadStep(3);
      triggerToast(`Frictionless terminal pairing packet dispatched to ${appPhone}.`);
    }, 1500);
  };

  const handleCreateQuickShipment = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast('Processing express waybill manifest...');
    setTimeout(() => {
      const mockId = `LOG-${Math.floor(100000 + Math.random() * 900000)}-US`;
      setQuickShipSuccess(mockId);
      triggerToast(`Successfully generated waybill ${mockId}!`);
    }, 1000);
  };

  // Precalculated pricing helper
  const getPrecalculatedPrice = () => {
    const base = 15;
    const ratePerKg = calcTier === 'air' ? 5.5 : calcTier === 'sea' ? 1.8 : 2.5;
    const ratePerKm = calcTier === 'air' ? 0.35 : calcTier === 'sea' ? 0.08 : 0.15;
    return (base + (calcWeight * ratePerKg) + (calcDistance * ratePerKm)).toFixed(2);
  };

  return (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 relative min-h-screen">
      
      {/* 1. TOAST NOTIFICATION CONTAINER */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 bg-slate-900/95 border border-dhl-red/30 text-dhl-yellow font-sans text-xs font-bold rounded-2xl shadow-2xl shadow-dhl-red/10 backdrop-blur-md"
          >
            <Sparkles size={14} className="animate-pulse text-dhl-yellow" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. ENTERPRISE LANDING HERO SECTION (CENTRAL HIGH-CONTRAST TRACKING SpotLIGHT) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-dhl-red via-[#9b000b] to-slate-950 text-white py-20 sm:py-28 border-b border-red-950">
        
        {/* Absolute Decorative SVG Vector Grids */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-dhl-yellow/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          
          {/* Dynamic Operations Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 dark:bg-slate-850/80 border border-white/10 text-white text-[11px] font-mono uppercase tracking-wider font-extrabold shadow-sm mx-auto">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            Global Network Live: <span className="text-dhl-yellow font-black">99.98% On-Time SLA</span>
          </div>

          {/* Centered Heading Layout */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-sans font-black tracking-tight leading-none text-white">
              The World On-Time. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-dhl-yellow via-[#ffe680] to-yellow-300 font-extrabold">
                Logistics Simplified.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-200 max-w-2xl mx-auto leading-relaxed">
              Express cargo shipping, real-time waybill tracking, and smart inventory management on a secure, high-performance global network.
            </p>
          </div>

          {/* CENTRAL COMMAND WIDGET */}
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-150 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-left max-w-2xl mx-auto">
            
            {/* Elegant Selector Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800/85 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 max-w-md mx-auto">
              <button
                onClick={() => setActiveTab('tracking')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'tracking'
                    ? 'bg-dhl-red text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Search size={14} />
                Track Shipment
              </button>
              <button
                onClick={() => setActiveTab('routing')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'routing'
                    ? 'bg-dhl-red text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Route size={14} />
                Route AI
              </button>
              <button
                onClick={() => setActiveTab('quote')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'quote'
                    ? 'bg-dhl-red text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Calculator size={14} />
                Rates Calculator
              </button>
            </div>

            {/* Content Panel */}
            <div className="min-h-[110px] flex flex-col justify-center">
              {activeTab === 'tracking' && (
                <form onSubmit={handleTrackSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase font-mono block">Waybill / Tracking Identifier</label>
                    <div className="flex flex-col sm:flex-row items-stretch bg-slate-50 dark:bg-slate-950 border-2 border-slate-250 dark:border-slate-800 rounded-2xl p-1.5 shadow-sm focus-within:border-dhl-red dark:focus-within:border-red-500 transition-all gap-2">
                      <div className="flex items-center flex-1 px-3 py-1.5">
                        <Search size={18} className="text-slate-400 mr-2 shrink-0" />
                        <input
                          type="text"
                          placeholder="Enter Code (e.g. LOG-502931-US, LOG-883011-US)..."
                          value={trackInput}
                          onChange={(e) => setTrackInput(e.target.value)}
                          className="w-full bg-transparent border-0 ring-0 outline-none text-base font-mono text-slate-950 dark:text-white placeholder-slate-400"
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-dhl-red hover:bg-dhl-red-hover text-white font-black uppercase text-xs tracking-wider px-6 py-4 rounded-xl shadow-lg shadow-red-500/10 hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
                      >
                        <span>Track Shipment</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Suggestion tags to simplify live sandbox testing */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-medium">Try tracking demo airbills:</span>
                    {['LOG-502931-US', 'LOG-883011-US', 'LOG-773129-US'].map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setTrackInput(id);
                          onSetTrackId(id);
                          onNavigate('track');
                          triggerToast(`Tracking waybill ${id}`);
                        }}
                        className="font-mono font-bold text-dhl-red dark:text-red-400 hover:underline bg-red-50 dark:bg-red-950/40 px-2.5 py-0.5 rounded transition-all border border-red-100 dark:border-red-900/30 cursor-pointer"
                      >
                        {id}
                      </button>
                    ))}
                  </div>
                </form>
              )}

              {activeTab === 'routing' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase font-mono">Hub Origin</label>
                      <select
                        value={routeFrom}
                        onChange={(e) => setRouteFrom(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-200 font-sans text-xs font-bold p-3 rounded-xl border-2 border-slate-250 dark:border-slate-800 outline-none w-full"
                      >
                        <option value="New York (JFK Depot)">New York (JFK)</option>
                        <option value="Los Angeles (LAX Hub)">Los Angeles (LAX)</option>
                        <option value="Chicago (ORD Logistics Terminal)">Chicago (ORD)</option>
                        <option value="Houston (IAH distribution center)">Houston (IAH)</option>
                        <option value="Seattle (SEA Port)">Seattle (SEA)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase font-mono">Hub Target</label>
                      <select
                        value={routeTo}
                        onChange={(e) => setRouteTo(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-200 font-sans text-xs font-bold p-3 rounded-xl border-2 border-slate-250 dark:border-slate-800 outline-none w-full"
                      >
                        <option value="Los Angeles (LAX Hub)">Los Angeles (LAX)</option>
                        <option value="New York (JFK Depot)">New York (JFK)</option>
                        <option value="Chicago (ORD Logistics Terminal)">Chicago (ORD)</option>
                        <option value="Houston (IAH distribution center)">Houston (IAH)</option>
                        <option value="Seattle (SEA Port)">Seattle (SEA)</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickOptimize}
                    disabled={routeOptimizing}
                    className="w-full py-4 bg-dhl-red hover:bg-dhl-red-hover text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {routeOptimizing ? <RotateCw className="animate-spin" size={14} /> : <Route size={14} />}
                    Run Route Optimization AI
                  </button>
                </div>
              )}

              {activeTab === 'quote' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase font-mono">Weight (kg)</label>
                      <input
                        type="number"
                        value={calcWeight}
                        onChange={(e) => setCalcWeight(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-bold p-2.5 rounded-xl border-2 border-slate-250 dark:border-slate-800 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase font-mono">Distance (km)</label>
                      <input
                        type="number"
                        value={calcDistance}
                        onChange={(e) => setCalcDistance(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-bold p-2.5 rounded-xl border-2 border-slate-250 dark:border-slate-800 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase font-mono">Carrier</label>
                      <select
                        value={calcTier}
                        onChange={(e: any) => setCalcTier(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans font-bold p-2.5 rounded-xl border-2 border-slate-250 dark:border-slate-800 outline-none"
                      >
                        <option value="ground">🚛 Ground</option>
                        <option value="air">✈️ Air Express</option>
                        <option value="sea">🚢 Ocean Sea</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="bg-slate-950 text-dhl-yellow px-4 py-3 rounded-xl flex items-center justify-between border border-slate-850 font-mono">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Estimated Rate Charge</span>
                    <span className="text-xl font-bold">${getPrecalculatedPrice()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick CTAs for Booking & Detailed Queries */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsQuickShipOpen(true)}
                className="flex-1 py-3.5 bg-dhl-red hover:bg-dhl-red-hover text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <PackagePlus size={13} />
                Book Cargo Space
              </button>
              <button
                type="button"
                onClick={() => onNavigate('quote')}
                className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-200 dark:border-slate-700 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Calculator size={13} className="text-dhl-red" />
                Detailed Quote Calculator
              </button>
            </div>
          </div>

          {/* Trust Indicators footer */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 max-w-2xl mx-auto border-t border-white/15">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-dhl-yellow">
                <Globe size={16} />
                <span className="text-xs font-bold text-white uppercase font-sans tracking-wide">Global Reach</span>
              </div>
              <p className="text-[11px] text-slate-300">220+ Countries & Territories Served</p>
            </div>
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-dhl-yellow">
                <ShieldCheck size={16} />
                <span className="text-xs font-bold text-white uppercase font-sans tracking-wide">Cargo Guard</span>
              </div>
              <p className="text-[11px] text-slate-300">Immutable GPS & Temp Logs</p>
            </div>
            <div className="text-center space-y-1 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-center gap-1.5 text-dhl-yellow">
                <Clock size={16} />
                <span className="text-xs font-bold text-white uppercase font-sans tracking-wide">Late Refund</span>
              </div>
              <p className="text-[11px] text-slate-300">SLA Violation Cash-back Guarantee</p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. MULTI-ROLE COMMAND COCKPIT (THE BENTO PERSPECTIVES GRID) */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 space-y-8">
        
        {/* DHL-inspired Sector Selector Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="space-y-1.5 text-left">
            <h2 className="text-xs font-black uppercase text-dhl-red tracking-widest font-mono">Active Command Perspectives</h2>
            <p className="text-2xl font-sans font-black text-slate-900 dark:text-white">Logistics Node Operations Monitor</p>
          </div>

          <div className="flex items-center bg-slate-200/60 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-300/40 dark:border-slate-800 w-full md:w-auto shrink-0">
            <button
              onClick={() => {
                setActiveRole('dispatch');
                triggerToast('Loaded Dispatch & Fleet telemetry system.');
              }}
              className={`flex-1 md:flex-none px-4.5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeRole === 'dispatch'
                  ? 'bg-dhl-red text-white shadow-lg shadow-dhl-red/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Truck size={14} />
              Dispatch & Fleet
            </button>
            <button
              onClick={() => {
                setActiveRole('warehouse');
                triggerToast('Loaded Warehouse Stock indices.');
              }}
              className={`flex-1 md:flex-none px-4.5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeRole === 'warehouse'
                  ? 'bg-dhl-red text-white shadow-lg shadow-dhl-red/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Warehouse size={14} />
              Depots & Inventory
            </button>
            <button
              onClick={() => {
                setActiveRole('public');
                triggerToast('Loaded Public Client operations module.');
              }}
              className={`flex-1 md:flex-none px-4.5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeRole === 'public'
                  ? 'bg-dhl-red text-white shadow-lg shadow-dhl-red/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <FileText size={14} />
              Cargo Rate Calc
            </button>
          </div>
        </div>

        {/* 3A. FIRST PILLAR ROLE: DISPATCH & FLEET PANEL */}
        {activeRole === 'dispatch' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Live Waybill Ledger */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-md space-y-5 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
                <div className="flex items-center gap-2.5">
                  <Activity size={18} className="text-dhl-red animate-pulse" />
                  <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-wide font-sans">Active Fleet Delivery Log</h3>
                </div>
                <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-dhl-red/10 text-dhl-red dark:bg-dhl-red/20 dark:text-red-400 px-2.5 py-1 rounded">
                  7 Active Air/Ground Waybills
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {/* Shipment 1 */}
                <div className="py-4 flex flex-wrap items-center justify-between gap-4 group">
                  <div className="space-y-1">
                    <span 
                      onClick={() => {
                        onSetTrackId('LOG-502931-US');
                        onNavigate('track');
                        triggerToast('Tracking waybill LOG-502931-US');
                      }}
                      className="text-xs font-mono font-extrabold text-dhl-red dark:text-red-400 cursor-pointer hover:underline flex items-center gap-1.5"
                    >
                      LOG-502931-US
                      <ArrowUpRight size={11} className="text-dhl-red" />
                    </span>
                    <p className="font-sans font-black text-slate-800 dark:text-slate-200 text-sm">New York (JFK) ➔ Los Angeles (LAX)</p>
                    <p className="text-[11px] text-slate-400 font-mono">Class: Air Priority Courier • Temp: -18°C Vaccines</p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-dhl-red/10 text-dhl-red dark:bg-dhl-red/20 dark:text-red-400 font-mono text-[9px] font-extrabold">IN TRANSIT</span>
                    <p className="text-[10px] text-dhl-red font-black font-mono">ETA: 09:40 AM (±15m SLA)</p>
                  </div>
                </div>

                {/* Shipment 2 */}
                <div className="py-4 flex flex-wrap items-center justify-between gap-4 group">
                  <div className="space-y-1">
                    <span 
                      onClick={() => {
                        onSetTrackId('LOG-883011-US');
                        onNavigate('track');
                        triggerToast('Tracking waybill LOG-883011-US');
                      }}
                      className="text-xs font-mono font-extrabold text-dhl-red dark:text-red-400 cursor-pointer hover:underline flex items-center gap-1.5"
                    >
                      LOG-883011-US
                      <ArrowUpRight size={11} className="text-dhl-red" />
                    </span>
                    <p className="font-sans font-black text-slate-800 dark:text-slate-200 text-sm">Houston (IAH) ➔ Seattle (SEA Port)</p>
                    <p className="text-[11px] text-slate-400 font-mono">Class: LTL Freight Heavy Cargo • Standard Temp</p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 font-mono text-[9px] font-extrabold">PICKED UP</span>
                    <p className="text-[10px] text-slate-400 font-bold font-mono">EST DELIVERY: 18 HOURS</p>
                  </div>
                </div>

                {/* Shipment 3 */}
                <div className="py-4 flex flex-wrap items-center justify-between gap-4 group">
                  <div className="space-y-1">
                    <span 
                      onClick={() => {
                        onSetTrackId('LOG-773129-US');
                        onNavigate('track');
                        triggerToast('Tracking waybill LOG-773129-US');
                      }}
                      className="text-xs font-mono font-extrabold text-dhl-red dark:text-red-400 cursor-pointer hover:underline flex items-center gap-1.5"
                    >
                      LOG-773129-US
                      <ArrowUpRight size={11} className="text-dhl-red" />
                    </span>
                    <p className="font-sans font-black text-slate-800 dark:text-slate-200 text-sm">Chicago (ORD) ➔ Boston (BOS Terminal)</p>
                    <p className="text-[11px] text-slate-400 font-mono">Class: Ground Express • High-Value Tech parts</p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 font-mono text-[9px] font-extrabold">DELIVERED</span>
                    <p className="text-[10px] text-slate-400 font-mono">DELIVERED 12 MIN AGO</p>
                  </div>
                </div>
              </div>

              {/* Bottom CTA for shipments page */}
              <div className="pt-4 border-t border-slate-150 dark:border-slate-800 flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-mono">Telemetry feeds refresh automatically.</span>
                <button
                  onClick={() => onNavigate('track')}
                  className="text-dhl-red hover:text-dhl-red-hover font-black uppercase flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Manage All Active Shipments ➔
                </button>
              </div>
            </div>

            {/* Neural Route Optimization Analytics Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-md space-y-5 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
                <div className="flex items-center gap-2.5">
                  <Route size={18} className="text-dhl-red dark:text-red-400" />
                  <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-wide font-sans">Route Analytics</h3>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">OPTIMIZED</span>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-950 text-slate-200 p-4 rounded-2xl border border-slate-850 space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-b border-slate-900 pb-2">
                     <span>PATH CALCULATION</span>
                     <span className="text-emerald-400 flex items-center gap-1"><Wifi size={10} className="animate-pulse" /> SATELLITE_LINK</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Route Miles:</span>
                      <span className="text-white font-black">{routeMetrics.miles} KM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Fuel Savings:</span>
                      <span className="text-emerald-400 font-black">{routeMetrics.fuelSavings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Carbon Avoided:</span>
                      <span className="text-emerald-400 font-black">{routeMetrics.carbonReduction}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Driving Hours:</span>
                      <span className="text-white font-black">{routeMetrics.drivingHours}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Safety Margin:</span>
                      <span className="text-emerald-400 font-black">{routeMetrics.safetyRating}</span>
                    </div>
                  </div>
                </div>

                {/* Micro Input trigger */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 font-sans">
                      <span className="text-[9px] text-slate-400 uppercase font-black block">Origin Depot</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{routeFrom.split(' ')[0]}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-2.5 font-sans">
                      <span className="text-[9px] text-slate-400 uppercase font-black block">Target Hub</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{routeTo.split(' ')[0]}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleQuickOptimize}
                    disabled={routeOptimizing}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 font-sans font-bold text-xs text-slate-700 dark:text-slate-300 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                  >
                    {routeOptimizing ? (
                      <>
                        <RotateCw className="animate-spin text-dhl-red" size={14} />
                        Calculating optimum coordinates...
                      </>
                    ) : (
                      <>
                        <Sliders size={14} className="text-dhl-red" />
                        Tune Neural Route weights
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3B. SECOND PILLAR ROLE: WAREHOUSE & STOCK INDEX PANEL */}
        {activeRole === 'warehouse' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Warehouse stock grid */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-md space-y-5 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
                <div className="flex items-center gap-2.5">
                  <Warehouse size={18} className="text-dhl-red" />
                  <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-wide font-sans">Depot Inventory Levels</h3>
                </div>
                <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-dhl-red/10 text-dhl-red dark:bg-dhl-red/20 dark:text-red-400 px-2.5 py-1 rounded">
                  DEPOT-ID: JFK-W4
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {inventory.map((item) => {
                  const isLow = item.stock <= item.minLevel;
                  return (
                    <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                      <div className="space-y-1.5 flex-1 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] font-black text-slate-400">{item.id}</span>
                          <span className="font-sans font-black text-slate-800 dark:text-slate-100 text-sm">{item.name}</span>
                          {isLow && (
                            <span className="px-2 py-0.5 rounded text-[8px] font-sans font-black uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse border border-rose-500/20">
                              ⚠️ Low Stock SLA Alert
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono">
                          <span>SLA Temp: <strong className="text-slate-600 dark:text-slate-300">{item.temp}</strong></span>
                          <span>Stock: <strong className="text-slate-600 dark:text-slate-300">{item.stock} / 100 {item.unit}</strong></span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full max-w-md h-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isLow ? 'bg-rose-500 shadow-sm shadow-rose-500/25' : 'bg-emerald-500 shadow-sm shadow-emerald-500/25'
                            }`}
                            style={{ width: `${item.stock}%` }}
                          />
                        </div>
                      </div>

                      {/* Interactive Restock Action Trigger */}
                      <button
                        onClick={() => handleRestock(item.id, item.name)}
                        className={`px-4 py-2.5 border font-sans font-black text-[10px] rounded-xl cursor-pointer transition-all uppercase shrink-0 flex items-center justify-center gap-1.5 ${
                          isLow 
                            ? 'bg-rose-500 text-white hover:bg-rose-600 border-rose-400 shadow-md shadow-rose-500/10'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        <RotateCw size={12} className="group-hover:rotate-180 transition-transform" />
                        {isLow ? 'Emergency Restock' : 'Restock'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Warehouse Environmental Monitor Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-md space-y-5 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
                <div className="flex items-center gap-2.5">
                  <Sliders size={18} className="text-dhl-red dark:text-red-400" />
                  <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-wide font-sans">Climate Sensors</h3>
                </div>
                <span className="text-[10px] text-emerald-500 font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  LIVE FEED
                </span>
              </div>

              <div className="space-y-4 text-xs font-mono">
                {/* Cold Chain Chamber */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-250/20 dark:border-slate-850 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700 dark:text-slate-300">🧊 Cryo Chambers</span>
                    <span className="text-emerald-500 dark:text-emerald-400 font-extrabold">-18.4 °C</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400">
                    <span>Humidity: 12%</span>
                    <span>Pressure: 1.02 atm</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-[94%] bg-emerald-500 rounded-full" />
                  </div>
                </div>

                {/* Electronics Bay */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-250/20 dark:border-slate-850 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700 dark:text-slate-300">⚡ Silicon Storage</span>
                    <span className="text-emerald-500 dark:text-emerald-400 font-extrabold">21.1 °C</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400">
                    <span>Humidity: 5% (ESD Safe)</span>
                    <span>Dust index: PM 0.1</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-[98%] bg-emerald-500 rounded-full" />
                  </div>
                </div>

                <div className="p-3.5 bg-amber-500/5 rounded-2xl border border-amber-500/20 text-slate-600 dark:text-amber-400 text-[10px] leading-relaxed">
                  📢 <strong>Environmental Log Note:</strong> Temperature fluctuations inside semiconductor storage bay trigger automatic geo-fenced ventilation loops to preserve critical silicon integrity.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3C. THIRD PILLAR ROLE: PUBLIC CLIENT & CARGO SPACE PANEL */}
        {activeRole === 'public' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Rates calculation desk */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-md space-y-5 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
                <div className="flex items-center gap-2.5">
                  <Calculator size={18} className="text-dhl-red" />
                  <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-wide font-sans">Shipping Cost Desk</h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400">BASE CHARGE: $15.00</span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-black">Cargo Weight (kg)</label>
                    <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
                      <input
                        type="number"
                        value={calcWeight}
                        onChange={(e) => setCalcWeight(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full bg-transparent border-none outline-none font-mono text-xs text-slate-950 dark:text-white"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">KG</span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-mono">Cost rate: $2.50 / kg</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-black">Transit distance (km)</label>
                    <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
                      <input
                        type="number"
                        value={calcDistance}
                        onChange={(e) => setCalcDistance(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full bg-transparent border-none outline-none font-mono text-xs text-slate-950 dark:text-white"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">KM</span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-mono">Cost rate: $0.15 / km</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-black">Carrier Class Segment</label>
                    <select
                      value={calcTier}
                      onChange={(e: any) => setCalcTier(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-sans text-xs text-slate-950 dark:text-white outline-none font-bold"
                    >
                      <option value="ground">🚛 Express Ground Carrier</option>
                      <option value="air">✈️ Expedited Air Freight</option>
                      <option value="sea">🚢 Ocean Sea Container</option>
                    </select>
                    <p className="text-[9px] text-slate-400 font-mono">SLA handling modifier applied</p>
                  </div>
                </div>

                {/* Estimate Result Block */}
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="text-dhl-yellow font-mono font-black uppercase text-xs flex items-center gap-1 justify-center sm:justify-start">
                      <CheckCircle size={12} />
                      SLA Transit Pricing Estimate
                    </h4>
                    <p className="text-[10px] text-slate-500">Includes secure cargo protection and live GPS tracking.</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Estimated Price</span>
                      <span className="text-2xl font-mono font-bold text-dhl-yellow">${getPrecalculatedPrice()}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigate('quote')}
                      className="px-4.5 py-2.5 bg-dhl-red hover:bg-dhl-red-hover text-white font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      Process Waybill
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SLA Cargo Insurance Guarantee panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-md space-y-5 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={18} className="text-emerald-500" />
                  <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-wide font-sans">Cargo Protection</h3>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">SECURED</span>
              </div>

              <div className="space-y-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-left">
                <p>
                  Every consignment processed on the Logify logistics terminal qualifies for comprehensive waybill insurance against physical delays, temp spikes, or transit failures.
                </p>

                <div className="space-y-2.5 font-mono text-[10px] text-slate-700 dark:text-slate-300">
                  <div className="flex items-start gap-2">
                    <Check size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>15-Min Delivery Windows:</strong> Automatic dispatch alerts prevent dock congestion delays.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Temp-Log Waybill Audit:</strong> Immutable sensor proof for cold-chain parcels.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>SLA Late Guarantee:</strong> Full delivery refund if shipping window slips past 25 mins.</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-850">
                  <button
                    onClick={() => triggerToast('Logify cargo secure policies synced.')}
                    className="text-dhl-red hover:text-dhl-red-hover font-black font-sans text-xs uppercase flex items-center gap-1 cursor-pointer"
                  >
                    View legal cargo terms ➔
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. TRUST SIGNALS & LIVE NOTIFICATION SETTINGS STRIP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Trust pillar 1: Real-time updates panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-md md:col-span-2 flex flex-col justify-between text-left space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-black text-dhl-red uppercase tracking-widest flex items-center gap-1.5">
                <Bell size={13} className="animate-bounce" /> Enterprise Operations Alert Stream
              </span>
              <h3 className="text-xl font-sans font-black text-slate-900 dark:text-white">Continuous Cargo Alerts</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Logify utilizes secure satellite relays to push live operations signals. Configure your direct waybill streams below to keep cargo dispatch units on high alert.
              </p>
            </div>

            {/* Interactive settings check boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setNotifySLA(!notifySLA);
                  triggerToast(`Precise 15-Min SLA alert: ${!notifySLA ? 'SUBSCRIBED' : 'UNSUBSCRIBED'}`);
                }}
                className={`p-3.5 border rounded-2xl text-left transition-all cursor-pointer flex items-start gap-3 ${
                  notifySLA
                    ? 'bg-dhl-red/5 border-dhl-red text-dhl-red dark:bg-red-500/5 dark:border-red-500 dark:text-red-400 font-bold'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-500 dark:text-slate-400'
                }`}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border mt-0.5 ${
                  notifySLA ? 'bg-dhl-red dark:bg-red-600 border-transparent text-white' : 'border-slate-300 dark:border-slate-700'
                }`}>
                  {notifySLA && <Check size={11} />}
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-mono tracking-wide block">15-Min Limit</span>
                  <span className="text-[9px] text-slate-400 block leading-tight">ETA changes shift.</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNotifyGeofence(!notifyGeofence);
                  triggerToast(`Geofence Depot Entry alert: ${!notifyGeofence ? 'SUBSCRIBED' : 'UNSUBSCRIBED'}`);
                }}
                className={`p-3.5 border rounded-2xl text-left transition-all cursor-pointer flex items-start gap-3 ${
                  notifyGeofence
                    ? 'bg-dhl-red/5 border-dhl-red text-dhl-red dark:bg-red-500/5 dark:border-red-500 dark:text-red-400 font-bold'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-500 dark:text-slate-400'
                }`}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border mt-0.5 ${
                  notifyGeofence ? 'bg-dhl-red dark:bg-red-600 border-transparent text-white' : 'border-slate-300 dark:border-slate-700'
                }`}>
                  {notifyGeofence && <Check size={11} />}
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-mono tracking-wide block">Geofencing</span>
                  <span className="text-[9px] text-slate-400 block leading-tight">Depot clearance.</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNotifyDelay(!notifyDelay);
                  triggerToast(`Exceptional delay warning: ${!notifyDelay ? 'SUBSCRIBED' : 'UNSUBSCRIBED'}`);
                }}
                className={`p-3.5 border rounded-2xl text-left transition-all cursor-pointer flex items-start gap-3 ${
                  notifyDelay
                    ? 'bg-dhl-red/5 border-dhl-red text-dhl-red dark:bg-red-500/5 dark:border-red-500 dark:text-red-400 font-bold'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-500 dark:text-slate-400'
                }`}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border mt-0.5 ${
                  notifyDelay ? 'bg-dhl-red dark:bg-red-600 border-transparent text-white' : 'border-slate-300 dark:border-slate-700'
                }`}>
                  {notifyDelay && <Check size={11} />}
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-mono tracking-wide block">Exception Warnings</span>
                  <span className="text-[9px] text-slate-400 block leading-tight">Instant delays.</span>
                </div>
              </button>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={handleSaveNotifications}
                className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white dark:bg-slate-800 dark:hover:bg-slate-750 text-xs font-sans font-bold uppercase rounded-xl transition-all cursor-pointer"
              >
                Sync Operations Feed
              </button>
            </div>
          </div>

          {/* Trust pillar 2: SLA Statistics Circle */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col justify-between space-y-4 text-left">
            <div className="space-y-1">
              <span className="text-[9px] font-mono font-black text-emerald-500 uppercase tracking-wider block">Logify SLA Score</span>
              <h3 className="text-xs font-bold font-sans uppercase text-slate-800 dark:text-slate-200 tracking-wider">Enterprise Performance</h3>
            </div>

            <div className="text-center space-y-2 py-4">
              <span className="text-5xl font-sans font-black tracking-tight text-slate-900 dark:text-white block">99.85%</span>
              <span className="text-[10px] font-sans font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full">
                Compliance Standard
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed text-center">
              We compile driver run times. If any dispatch slips past the 15-minute grace barrier, cargo guards issue refunds directly.
            </p>
          </div>

        </div>

      </section>

      {/* 5. MODAL DIALOGS AND SIMULATIONS */}
      {/* 5A. APPS DOWNLOAD SIMULATED MODAL */}
      {isDownloadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4"
          >
            <button
              onClick={() => {
                setIsDownloadOpen(false);
                setDownloadStep(1);
                setAppPhone('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-dhl-red/10 text-dhl-red dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto">
                <Smartphone size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">Download Driver Terminal</h3>
              <p className="text-xs text-slate-500">Instant geofenced waybill dispatch, route telemetry tracking, and paperless signature logs.</p>
            </div>

            {downloadStep === 1 && (
              <form onSubmit={handleSendAppSMS} className="space-y-4 text-xs">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-slate-450 uppercase font-black font-sans text-left block">Mobile Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={appPhone}
                    onChange={(e) => setAppPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 outline-none font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-dhl-red hover:bg-dhl-red-hover text-white font-black rounded-xl shadow-lg transition-all uppercase text-xs tracking-wider"
                >
                  Request Pairing Packet Link
                </button>
              </form>
            )}

            {downloadStep === 2 && (
              <div className="text-center py-6 space-y-3">
                <RotateCw className="animate-spin text-dhl-red mx-auto" size={32} />
                <p className="text-xs font-mono text-slate-450">Pairing carrier frequency and dispatching SMS gateway request...</p>
              </div>
            )}

            {downloadStep === 3 && (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <Check size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-sans font-black">Transmission Dispatched</h4>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                    We've pushed the secure terminal binary download link to <strong className="text-slate-800 dark:text-slate-200">{appPhone}</strong>. Follow the instructions to sync with depot.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsDownloadOpen(false);
                    setDownloadStep(1);
                    setAppPhone('');
                  }}
                  className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-750 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Close Console
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* 5B. QUICK SHIP MANIFEST MODAL */}
      {isQuickShipOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4"
          >
            <button
              onClick={() => {
                setIsQuickShipOpen(false);
                setQuickShipSuccess(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-dhl-red/10 text-dhl-red dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto">
                <PackagePlus size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">Express Cargo Booking</h3>
              <p className="text-xs text-slate-500">Initiate a live Waybill with instant tracking, custom route optimization and secure logistics protection.</p>
            </div>

            {quickShipSuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-sans uppercase font-black">Cargo Dispatch Registered</h4>
                  <p className="text-xs text-slate-500">Your shipment manifest is created on the logistics node.</p>
                  <div className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3 rounded-xl font-mono text-sm text-dhl-red font-black select-all cursor-pointer">
                    {quickShipSuccess}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onSetTrackId(quickShipSuccess);
                      onNavigate('track');
                    }}
                    className="flex-1 py-3 bg-dhl-red hover:bg-dhl-red-hover text-white font-black text-xs rounded-xl"
                  >
                    Track Live Shipment
                  </button>
                  <button
                    onClick={() => {
                      setIsQuickShipOpen(false);
                      setQuickShipSuccess(null);
                    }}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateQuickShipment} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-left">
                    <label className="text-[10px] text-slate-450 uppercase font-black font-sans text-left block">Origin</label>
                    <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none font-sans font-bold">
                      <option>New York JFK Depot</option>
                      <option>Los Angeles LAX Hub</option>
                      <option>Chicago ORD Terminal</option>
                    </select>
                  </div>
                  <div className="text-left">
                    <label className="text-[10px] text-slate-450 uppercase font-black font-sans text-left block">Destination</label>
                    <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none font-sans font-bold">
                      <option>Los Angeles LAX Hub</option>
                      <option>New York JFK Depot</option>
                      <option>Chicago ORD Terminal</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-left">
                    <label className="text-[10px] text-slate-450 uppercase font-black font-sans text-left block">Cargo Weight (kg)</label>
                    <input
                      type="number"
                      required
                      value={shipWeight}
                      onChange={(e) => setShipWeight(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 outline-none font-mono"
                    />
                  </div>
                  <div className="text-left">
                    <label className="text-[10px] text-slate-450 uppercase font-black font-sans text-left block">Item Description</label>
                    <select
                      value={shipType}
                      onChange={(e) => setShipType(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none font-sans font-bold"
                    >
                      <option value="Critical Medical Supplies">Critical Medical Supplies</option>
                      <option value="High-Density Semiconductor chips">Semiconductor chips</option>
                      <option value="Cold-Chain Biological Vaccines">Biological Vaccines</option>
                      <option value="Precision Industrial Gearboxes">Industrial Gearboxes</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-dhl-red hover:bg-dhl-red-hover text-white font-black rounded-xl shadow-lg transition-all uppercase text-xs tracking-wider"
                >
                  Create Waybill Manifest
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}

    </div>
  );
}
