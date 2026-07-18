import React, { useState, useEffect } from 'react';
import { 
  Search, Loader2, ArrowRight, ShieldCheck, MapPin, Truck, Calendar, 
  DollarSign, Package, Clock, Activity, Map, Compass, Scale, Share2, 
  Copy, Check, Play, Pause, RotateCcw, Terminal, Wifi, AlertTriangle, CheckCircle2,
  FileText, Bell
} from 'lucide-react';
import { Shipment, Coordinates, Settings } from '../types.js';
import LeafletMap from './LeafletMap.tsx';

interface PublicTrackerProps {
  initialTrackId?: string;
  onClearTrackId?: () => void;
  theme?: 'light' | 'dark';
  settings?: Settings;
}

export default function PublicTracker({ initialTrackId, onClearTrackId, theme, settings }: PublicTrackerProps) {
  const [trackId, setTrackId] = useState(initialTrackId || '');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressWidth, setProgressWidth] = useState('0%');
  const [refreshing, setRefreshing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareNotification, setShareNotification] = useState<string | null>(null);
  
  // Custom tracking dashboard states
  const [activeTab, setActiveTab] = useState<'history' | 'facts'>('history');
  const [smsNumber, setSmsNumber] = useState('');
  const [smsSubscribed, setSmsSubscribed] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);

  // Real-time tracking simulation and polling states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0.05);
  const [simSpeed, setSimSpeed] = useState(65);
  const [simHeading, setSimHeading] = useState('N/A');
  const [simDistance, setSimDistance] = useState(0);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [isAutoPolling, setIsAutoPolling] = useState(false);
  const [simulatedCoords, setSimulatedCoords] = useState<Coordinates | null>(null);

  // Helper to calculate distance on Earth using Haversine
  const getDistanceKm = (from: Coordinates, to: Coordinates) => {
    const R = 6371; // Earth's radius in km
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLng = (to.lng - from.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Helper to calculate geographic heading
  const getHeading = (from: Coordinates, to: Coordinates) => {
    const dLat = to.lat - from.lat;
    const dLng = to.lng - from.lng;
    if (Math.abs(dLat) < 0.005 && Math.abs(dLng) < 0.005) return 'N/A';
    let angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    
    if (angle >= 337.5 || angle < 22.5) return 'North';
    if (angle >= 22.5 && angle < 67.5) return 'North-East';
    if (angle >= 67.5 && angle < 112.5) return 'East';
    if (angle >= 112.5 && angle < 157.5) return 'South-East';
    if (angle >= 157.5 && angle < 202.5) return 'South';
    if (angle >= 202.5 && angle < 247.5) return 'South-West';
    if (angle >= 247.5 && angle < 292.5) return 'West';
    if (angle >= 292.5 && angle < 337.5) return 'North-West';
    return 'North';
  };

  // Helper to interpolate coordinate
  const interpolateCoords = (from: Coordinates, to: Coordinates, fraction: number): Coordinates => {
    return {
      lat: from.lat + (to.lat - from.lat) * fraction,
      lng: from.lng + (to.lng - from.lng) * fraction
    };
  };

  // Sync state when shipment loads
  useEffect(() => {
    if (shipment) {
      let initialProgress = 0.05;
      if (shipment.status === 'Delivered') initialProgress = 1.0;
      else if (shipment.status === 'Out for Delivery') initialProgress = 0.85;
      else if (shipment.status === 'In Transit') initialProgress = 0.5;
      else if (shipment.status === 'Picked Up') initialProgress = 0.2;
      else if (shipment.status === 'Pending') initialProgress = 0.05;

      setSimProgress(initialProgress);

      const current = shipment.currentCoords || shipment.pickupCoords;
      setSimulatedCoords(current);

      const distance = getDistanceKm(current, shipment.deliveryCoords);
      setSimDistance(distance);

      const heading = getHeading(shipment.pickupCoords, shipment.deliveryCoords);
      setSimHeading(heading);

      setSimLogs([
        `[${new Date().toLocaleTimeString()}] 🛰️ GPS tracking system initialized.`,
        `[${new Date().toLocaleTimeString()}] 📦 Waybill ID ${shipment.id} active.`,
        `[${new Date().toLocaleTimeString()}] 📍 Status: ${shipment.status}. Position: Lat ${current.lat.toFixed(4)}, Lng ${current.lng.toFixed(4)}.`
      ]);

      setIsSimulating(false);
    } else {
      setSimulatedCoords(null);
      setIsSimulating(false);
    }
  }, [shipment]);

  // Simulation loop effect
  useEffect(() => {
    if (!isSimulating || !shipment) return;

    const interval = setInterval(() => {
      setSimProgress((prev) => {
        const next = Math.min(prev + 0.015, 1.0);

        const newCoords = interpolateCoords(shipment.pickupCoords, shipment.deliveryCoords, next);
        setSimulatedCoords(newCoords);

        const dist = getDistanceKm(newCoords, shipment.deliveryCoords);
        setSimDistance(dist);

        const speedNoise = Math.floor(Math.random() * 10) - 5; // -5 to +5 mph
        const baseSpeed = next >= 0.95 ? 15 : shipment.status === 'Out for Delivery' ? 35 : 65;
        const currentSpeed = Math.max(0, baseSpeed + speedNoise);
        setSimSpeed(currentSpeed);

        const logTime = new Date().toLocaleTimeString();
        const logs: string[] = [];

        if (next >= 1.0) {
          logs.push(`[${logTime}] 🏁 Carrier arrived at destination. Telemetry stream complete.`);
          setIsSimulating(false);
        } else {
          if (Math.abs(next - 0.25) < 0.015) {
            logs.push(`[${logTime}] 🛣️ Merged onto highway corridor.`);
          } else if (Math.abs(next - 0.5) < 0.015) {
            logs.push(`[${logTime}] ⚡ Mid-journey checkpoint cleared. Diagnostic: OK.`);
          } else if (Math.abs(next - 0.75) < 0.015) {
            logs.push(`[${logTime}] 🚦 Approaching local delivery limits.`);
          } else if (Math.abs(next - 0.9) < 0.015) {
            logs.push(`[${logTime}] 🏡 Preparing cargo handover manifest.`);
          } else if (Math.random() < 0.25) {
            const reports = [
              `[${logTime}] 📡 Satellite lock margin: +13.6dB (Excellent).`,
              `[${logTime}] 🚚 Courier heading: ${getHeading(shipment.pickupCoords, shipment.deliveryCoords)}. Speed: ${currentSpeed} mph.`,
              `[${logTime}] 🔋 Battery telemetry: 97% capacity, temp stable.`,
              `[${logTime}] 🗺️ Distance to target: ${dist.toFixed(1)} km.`
            ];
            logs.push(reports[Math.floor(Math.random() * reports.length)]);
          }
        }

        if (logs.length > 0) {
          setSimLogs((prevLogs) => [...prevLogs, ...logs]);
        }

        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isSimulating, shipment]);

  // Auto-polling database sync effect
  useEffect(() => {
    if (!isAutoPolling || !shipment) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/track/${shipment.id.trim().toUpperCase()}`);
        if (response.ok) {
          const data = await response.json();
          setShipment(data);
          
          setSimLogs((prev) => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] 🔄 Synced telemetry with live database.`
          ]);
        }
      } catch (err) {
        console.error('Error auto-polling shipment:', err);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [isAutoPolling, shipment]);

  const handleRefresh = async () => {
    if (!shipment) return;
    setRefreshing(true);
    try {
      const response = await fetch(`/api/track/${shipment.id.trim().toUpperCase()}`);
      if (response.ok) {
        const data = await response.json();
        setShipment(data);
      }
    } catch (err) {
      console.error('Error refreshing shipment data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const getShareUrl = () => {
    if (!shipment) return '';
    return `${window.location.origin}/?track=${shipment.id}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Could not copy link:', err);
    }
  };

  const handleMockShare = (platform: string) => {
    setShareNotification(`Successfully simulated share to ${platform}!`);
    setTimeout(() => setShareNotification(null), 3000);
  };

  const fetchTrackingData = async (queryId: string) => {
    if (!queryId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/track/${queryId.trim().toUpperCase()}`);
      if (!response.ok) {
        throw new Error('Tracking ID not recognized. Please check the reference and try again.');
      }
      const data = await response.json();
      setShipment(data);
    } catch (err: any) {
      setShipment(null);
      setError(err.message || 'Server error tracking shipment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTrackId) {
      setTrackId(initialTrackId);
      fetchTrackingData(initialTrackId);
    }
  }, [initialTrackId]);

  useEffect(() => {
    if (shipment && !loading) {
      setProgressWidth('0%');
      const targetWidth = 
        shipment.status === 'Delivered' ? '100%' :
        shipment.status === 'Out for Delivery' ? '85%' :
        shipment.status === 'In Transit' ? '60%' :
        shipment.status === 'Picked Up' ? '30%' :
        shipment.status === 'Pending' ? '10%' : '0%';
      
      const timer = setTimeout(() => {
        setProgressWidth(targetWidth);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setProgressWidth('0%');
    }
  }, [shipment, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrackingData(trackId);
  };

  const handleSmsSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsNumber.trim()) return;
    setSmsLoading(true);
    setTimeout(() => {
      setSmsSubscribed(true);
      setSmsLoading(false);
      setSimLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] 📱 Registered SMS transit exception notifications for ${smsNumber}.`
      ]);
    }, 1000);
  };

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-8 min-h-[70vh]">
      {/* FedEx Style Corporate Header Branding */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-1 font-sans">
          <span className="text-4xl font-black tracking-tighter text-dhl-red">Logify</span>
          <span className="bg-dhl-red text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">Express®</span>
        </div>
        <h1 className="text-xl md:text-2xl font-sans font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">
          Global Logistics Waybill Tracking
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Input your 12-digit tracking reference code below to view active status, scheduled milestones, and live driver telemetry feeds.
        </p>
      </div>

      {/* Track Search Form with DHL Red Focus & Yellow/Red Button */}
      <div className="max-w-xl mx-auto space-y-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              required
              placeholder="Enter Tracking Number (e.g. LOG-583019-US)"
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-dhl-red dark:focus:border-red-500 transition-colors shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3.5 bg-dhl-red hover:bg-dhl-red-hover disabled:bg-dhl-red/50 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all shadow-md shadow-red-500/10"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Track Status
          </button>
        </form>
        
        {/* Clickable Quick Sample Reference Tags for Premium Usability */}
        <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-slate-400">
          <span>Demo References:</span>
          <button 
            onClick={() => { setTrackId('LOG-583019-US'); fetchTrackingData('LOG-583019-US'); }}
            className="underline hover:text-dhl-red transition-colors"
          >
            LOG-583019-US
          </button>
          <span>•</span>
          <button 
            onClick={() => { setTrackId('LOG-194820-US'); fetchTrackingData('LOG-194820-US'); }}
            className="underline hover:text-dhl-red transition-colors"
          >
            LOG-194820-US
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="text-dhl-red animate-spin" size={32} />
          <p className="text-xs font-mono text-slate-400">Decrypting satellite transit logs...</p>
        </div>
      )}

      {/* Error Output */}
      {error && !loading && (
        <div className="bg-rose-50 border-l-4 border-rose-500 dark:bg-rose-950/20 rounded-xl p-5 text-left max-w-xl mx-auto space-y-1 shadow-sm">
          <div className="text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
            <AlertTriangle size={14} />
            Tracking Reference Exception
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{error}</p>
        </div>
      )}

      {/* Success Result Panel */}
      {shipment && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main info & Live Map (2/3 col) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Telemetry Actions Bar */}
            <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Live Connection Active</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-150/80 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all disabled:opacity-50"
                  title="Simulate fetching the latest tracking data from the server"
                >
                  <Activity size={13} className={`text-blue-500 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>

                {/* Share Shipment Button */}
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/15"
                >
                  <Share2 size={13} />
                  Share Shipment
                </button>
              </div>
            </div>

            {/* PROMINENT SHIPMENT OVERVIEW CARD - FEDEX HIGH DENSITY CORP LAYOUT */}
            <div className="bg-white dark:bg-slate-900 border-t-8 border-dhl-red dark:border-red-600 rounded-2xl p-6 sm:p-8 shadow-md space-y-6">
              
              {/* Main tracking banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-dhl-red uppercase font-black tracking-widest font-mono block">Logify Express Waybill ID</span>
                  <div className="flex items-center gap-3">
                    <h3 className="text-3xl font-sans font-black text-slate-900 dark:text-white tracking-tight">
                      {shipment.id}
                    </h3>
                    <span className="text-[10px] font-bold font-mono uppercase bg-dhl-yellow/15 text-dhl-red px-2 py-0.5 rounded border border-dhl-yellow/30">
                      {shipment.type}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 md:text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest font-mono block">Estimated Delivery Date</span>
                  <div className="text-xl sm:text-2xl font-sans font-black text-dhl-red dark:text-red-400 tracking-tight">
                    {formatDate(shipment.estimatedDelivery)}
                  </div>
                  <span className="text-[9px] text-dhl-red font-black uppercase tracking-wider font-mono bg-dhl-yellow/15 dark:bg-yellow-950/20 px-2 py-0.5 rounded border border-dhl-yellow/30">
                    On-Time Transit SLA Guarantee
                  </span>
                </div>
              </div>

              {/* ACTION-ORIENTED STATUS WITH HIGH DENSITY INFO */}
              <div className="bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3.5 rounded-full ${
                    shipment.status === 'Delivered'
                      ? 'bg-emerald-500 text-white'
                      : shipment.status === 'Cancelled'
                      ? 'bg-rose-500 text-white'
                      : 'bg-dhl-red text-white animate-pulse'
                  }`}>
                    {shipment.status === 'Delivered' ? <CheckCircle2 size={24} /> : <Truck size={24} />}
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold font-mono tracking-wider text-slate-400 block">Current Status</span>
                    <h2 className="text-2xl font-sans font-black text-slate-900 dark:text-white tracking-tight uppercase">
                      {shipment.status === 'Delivered' ? 'Delivered' : 
                       shipment.status === 'Out for Delivery' ? 'Out for Delivery' :
                       shipment.status === 'In Transit' ? 'In Transit / On its way' : 
                       shipment.status === 'Picked Up' ? 'Picked Up / Traveling' : 'Shipment Created'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Last scanned coordinate update received: {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Live SLA Active</span>
                </div>
              </div>

              {/* ADVANCED FEDEX-STYLE STEPPER TIMELINE GRAPH */}
              <div className="pt-4 pb-2">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest font-mono block mb-6 text-center">Transit Progress Pipeline</span>
                <div className="relative flex flex-col md:flex-row justify-between items-center md:items-start gap-8 md:gap-0">
                  
                  {/* Connecting bar */}
                  <div className="absolute top-5 left-[10%] right-[10%] h-[3px] bg-slate-100 dark:bg-slate-800 hidden md:block" />
                  <div 
                    className="absolute top-5 left-[10%] h-[3px] bg-gradient-to-r from-dhl-red to-dhl-yellow transition-all duration-[1200ms] ease-out hidden md:block"
                    style={{
                      width: 
                        shipment.status === 'Delivered' ? '80%' :
                        shipment.status === 'Out for Delivery' ? '60%' :
                        shipment.status === 'In Transit' ? '40%' :
                        shipment.status === 'Picked Up' ? '20%' : '0%'
                    }}
                  />

                  {/* Step 1: Created */}
                  <div className="flex flex-row md:flex-col items-center gap-3 md:gap-2 relative z-10 w-full md:w-1/5 text-left md:text-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-dhl-red bg-white dark:bg-slate-900 text-dhl-red font-mono font-bold text-xs shadow-sm">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Pending</h4>
                      <p className="text-[9px] font-mono text-slate-400">Order Placed</p>
                    </div>
                  </div>

                  {/* Step 2: Picked Up */}
                  <div className="flex flex-row md:flex-col items-center gap-3 md:gap-2 relative z-10 w-full md:w-1/5 text-left md:text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-mono font-bold text-xs shadow-sm transition-colors duration-500 ${
                      ['Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'].includes(shipment.status)
                        ? 'border-dhl-red bg-dhl-red text-white'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400'
                    }`}>
                      {['Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'].includes(shipment.status) ? '✓' : '02'}
                    </div>
                    <div>
                      <h4 className={`text-[11px] font-bold ${['Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'].includes(shipment.status) ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>Picked Up</h4>
                      <p className="text-[9px] font-mono text-slate-400">Manifest Verified</p>
                    </div>
                  </div>

                  {/* Step 3: In Transit */}
                  <div className="flex flex-row md:flex-col items-center gap-3 md:gap-2 relative z-10 w-full md:w-1/5 text-left md:text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-mono font-bold text-xs shadow-sm transition-colors duration-500 ${
                      ['In Transit', 'Out for Delivery', 'Delivered'].includes(shipment.status)
                        ? 'border-dhl-red bg-dhl-red text-white'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400'
                    }`}>
                      {['In Transit', 'Out for Delivery', 'Delivered'].includes(shipment.status) ? '✓' : '03'}
                    </div>
                    <div>
                      <h4 className={`text-[11px] font-bold ${['In Transit', 'Out for Delivery', 'Delivered'].includes(shipment.status) ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>In Transit</h4>
                      <p className="text-[9px] font-mono text-slate-400">En Route Corridor</p>
                    </div>
                  </div>

                  {/* Step 4: Out for Delivery */}
                  <div className="flex flex-row md:flex-col items-center gap-3 md:gap-2 relative z-10 w-full md:w-1/5 text-left md:text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-mono font-bold text-xs shadow-sm transition-colors duration-500 ${
                      ['Out for Delivery', 'Delivered'].includes(shipment.status)
                        ? 'border-dhl-red bg-dhl-red text-white animate-pulse'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400'
                    }`}>
                      {['Out for Delivery', 'Delivered'].includes(shipment.status) ? '✓' : '04'}
                    </div>
                    <div>
                      <h4 className={`text-[11px] font-bold ${['Out for Delivery', 'Delivered'].includes(shipment.status) ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>Out for Delivery</h4>
                      <p className="text-[9px] font-mono text-slate-400">Local Dispatch Courier</p>
                    </div>
                  </div>

                  {/* Step 5: Delivered */}
                  <div className="flex flex-row md:flex-col items-center gap-3 md:gap-2 relative z-10 w-full md:w-1/5 text-left md:text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-mono font-bold text-xs shadow-sm transition-colors duration-500 ${
                      shipment.status === 'Delivered'
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400'
                    }`}>
                      {shipment.status === 'Delivered' ? '✓' : '05'}
                    </div>
                    <div>
                      <h4 className={`text-[11px] font-bold ${shipment.status === 'Delivered' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-slate-400'}`}>Delivered</h4>
                      <p className="text-[9px] font-mono text-slate-400">Signature Captured</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Delivery Estimation Progress Bar & Route Vector Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Delivery Estimation Progress Bar */}
              <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-slate-400 uppercase font-bold tracking-wider">Delivery Transit Progress</span>
                  <span className="font-mono font-bold text-dhl-red dark:text-red-400">
                    {shipment.status === 'Delivered' ? '100% (Delivered)' :
                     shipment.status === 'Out for Delivery' ? '85% (Out for Delivery)' :
                     shipment.status === 'In Transit' ? '60% (In Transit)' :
                     shipment.status === 'Picked Up' ? '30% (Picked Up)' :
                     shipment.status === 'Pending' ? '10% (Pending)' : '0%'}
                  </span>
                </div>
                <div className="relative h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden my-1">
                  <div 
                    className={`h-full bg-gradient-to-r from-dhl-red to-dhl-yellow rounded-full transition-all duration-[1500ms] ease-out ${
                      shipment.status === 'In Transit' ? 'animate-pulse' : ''
                    }`}
                    style={{
                      width: progressWidth
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-slate-400 pt-1">
                  <span className={shipment.status === 'Pending' ? 'text-dhl-red font-bold' : ''}>Ordered</span>
                  <span className={shipment.status === 'Picked Up' ? 'text-dhl-red font-bold' : ''}>Picked Up</span>
                  <span className={shipment.status === 'In Transit' ? 'text-dhl-red font-bold animate-pulse' : ''}>In Transit</span>
                  <span className={shipment.status === 'Out for Delivery' ? 'text-dhl-red font-bold' : ''}>Out for Delivery</span>
                  <span className={shipment.status === 'Delivered' ? 'text-emerald-500 dark:text-emerald-400 font-bold' : ''}>Delivered</span>
                </div>
              </div>

              {/* Route Vector Panel */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-400 uppercase font-bold tracking-wider text-[10px] flex items-center gap-1">
                    <Map size={12} className="text-dhl-red" />
                    Transit Route Vector
                  </span>
                  <span className="font-mono text-[8px] bg-dhl-yellow/15 text-dhl-red font-extrabold px-1.5 py-0.5 rounded uppercase border border-dhl-yellow/25">
                    A ➔ B
                  </span>
                </div>

                {/* Styled route vector diagram with map overlay styling */}
                <div className="relative bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-xl p-3 h-24 overflow-hidden flex flex-col justify-between">
                  {/* Subtle map pattern lines background */}
                  <div className="absolute inset-0 opacity-15 pointer-events-none">
                    <svg width="100%" height="100%">
                      <defs>
                        <pattern id="grid" width="12" height="12" patternUnits="userSpaceOnUse">
                          <path d="M 12 0 L 0 0 0 12" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>

                  {/* Route connecting line */}
                  <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-[1.5px] border-t border-dashed border-slate-300 dark:border-slate-700 pointer-events-none flex justify-between items-center" />
                  
                  {/* Progress indicator along path */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 transition-all duration-[1500ms] ease-out flex flex-col items-center pointer-events-none"
                    style={{ 
                      left: `calc(12% + (${progressWidth === '0%' ? '0px' : progressWidth}) * 0.72)` 
                    }}
                  >
                    <div className="bg-dhl-red text-white rounded-full p-1 shadow-lg shadow-red-500/35 relative z-10 animate-bounce">
                      <Truck size={10} />
                    </div>
                  </div>

                  {/* Start Point (Pickup) */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white font-extrabold text-[9px] flex items-center justify-center shadow-md">
                      A
                    </div>
                  </div>

                  {/* End Point (Delivery) */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-5 h-5 rounded-full bg-rose-500 text-white font-extrabold text-[9px] flex items-center justify-center shadow-md">
                      B
                    </div>
                  </div>

                  {/* Text Details inside visual box */}
                  <div className="mt-auto w-full flex justify-between items-center text-[8px] font-mono text-slate-400 relative z-20">
                    <span className="truncate max-w-[80px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded" title={shipment.pickupAddress}>
                      {shipment.pickupAddress.split(',')[0]}
                    </span>
                    <span className="truncate max-w-[80px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-right" title={shipment.deliveryAddress}>
                      {shipment.deliveryAddress.split(',')[0]}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                  <span className="flex items-center gap-0.5">
                    <Compass size={10} className="text-slate-400 animate-spin" style={{ animationDuration: '6s' }} />
                    GPS Connection
                  </span>
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Active Stream</span>
                </div>
              </div>
            </div>

            {/* TABBED CARGO TRAVEL HISTORY & SHIPMENT FACTS */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              {/* Tab Header Selector */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'history'
                      ? 'bg-white dark:bg-slate-800 text-dhl-red shadow-sm border border-slate-200/50 dark:border-slate-700'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Activity size={14} className={activeTab === 'history' ? 'text-dhl-red' : ''} />
                  Travel History
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('facts')}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'facts'
                      ? 'bg-white dark:bg-slate-800 text-dhl-red shadow-sm border border-slate-200/50 dark:border-slate-700'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <FileText size={14} className={activeTab === 'facts' ? 'text-dhl-red' : ''} />
                  Shipment Facts
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'history' ? (
                  /* TRAVEL HISTORY TIMELINE TABLE */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Chronological Tracking Scan Log</span>
                      <span className="text-[10px] font-mono font-bold text-dhl-red bg-dhl-red/10 dark:bg-red-950/20 px-2 py-0.5 rounded">
                        {shipment.timeline.length} Recorded Checkpoints
                      </span>
                    </div>
                    
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {shipment.timeline && shipment.timeline.length > 0 ? (
                        [...shipment.timeline].reverse().map((event, index) => {
                          const isLatest = index === 0;
                          return (
                            <div 
                              key={index} 
                              className={`flex items-start justify-between text-xs p-4 rounded-xl border transition-all ${
                                isLatest 
                                  ? 'bg-red-500/[0.03] border-dhl-red/30 dark:bg-red-950/10 dark:border-red-800/40 shadow-sm' 
                                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/40'
                              }`}
                            >
                              <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <span className={`font-bold rounded px-1.5 py-0.5 text-[9px] uppercase font-mono tracking-wider ${
                                    event.status === 'Delivered' 
                                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' 
                                      : event.status === 'In Transit'
                                      ? 'bg-dhl-red/10 text-dhl-red dark:bg-red-900/20 dark:text-red-400'
                                      : event.status === 'Out for Delivery'
                                      ? 'bg-dhl-yellow/15 text-dhl-red dark:bg-yellow-950/20 dark:text-yellow-400'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                  }`}>
                                    {event.status}
                                  </span>
                                  {event.location && (
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-0.5">
                                      <MapPin size={10} className="text-slate-400" />
                                      {event.location}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                                  {event.description}
                                </p>
                              </div>
                              <div className="flex flex-col items-end text-right gap-1 ml-4 shrink-0 font-mono text-[10px] text-slate-400">
                                <span className="flex items-center gap-1 font-bold">
                                  <Clock size={10} />
                                  {formatDate(event.timestamp)}
                                </span>
                                {isLatest && (
                                  <span className="text-[8px] uppercase tracking-wider font-black text-dhl-red animate-pulse">
                                    LATEST SCAN
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-400 font-mono italic text-center py-8">No official checkpoints registered for this waybill.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  /* SHIPMENT FACTS GRID */
                  <div className="space-y-4">
                    <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Technical Cargo Manifest Facts</span>
                    </div>
 
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs">
                      <div className="space-y-3.5">
                        <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800/40">
                          <span className="text-slate-400 font-medium font-sans">Tracking Reference ID</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{shipment.id}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800/40">
                          <span className="text-slate-400 font-medium font-sans">Service Provider</span>
                          <span className="font-sans font-bold text-slate-800 dark:text-slate-200">Logify Express® Premium</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800/40">
                          <span className="text-slate-400 font-medium font-sans">Product Level / Cargo Type</span>
                          <span className="font-sans font-bold text-dhl-red uppercase">{shipment.type} Courier</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800/40">
                          <span className="text-slate-400 font-medium font-sans">Total Piece Weight</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {shipment.weight} kg / {(shipment.weight * 2.20462).toFixed(1)} lbs
                          </span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800/40">
                          <span className="text-slate-400 font-medium font-sans">Total Shipments In Parcel</span>
                          <span className="font-sans font-bold text-slate-800 dark:text-slate-200">1 Piece</span>
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800/40">
                          <span className="text-slate-400 font-medium font-sans">Package Dimensions</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {shipment.packageDimensions 
                              ? `${shipment.packageDimensions.length} x ${shipment.packageDimensions.width} x ${shipment.packageDimensions.height} cm`
                              : '40 x 30 x 15 cm (Medium Box)'}
                          </span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800/40">
                          <span className="text-slate-400 font-medium font-sans">Special Handling Flags</span>
                          <span className="font-sans font-bold text-dhl-red">
                            {shipment.type === 'Fragile' ? 'Fragile - High Care' : 'Standard Priority Cargo'}
                          </span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800/40">
                          <span className="text-slate-400 font-medium font-sans">Required Signature Option</span>
                          <span className="font-sans font-bold text-slate-800 dark:text-slate-200">Direct Signature Required</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800/40">
                          <span className="text-slate-400 font-medium font-sans">Estimated Insurance Cover</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {shipment.packageValue ? `$${shipment.packageValue.toFixed(2)}` : '$150.00 (Standard)'}
                          </span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800/40">
                          <span className="text-slate-400 font-medium font-sans">Dispatch Terms</span>
                          <span className="font-sans font-bold text-emerald-600 uppercase font-black tracking-wider">Paid / Prepaid</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* LIVE INTERACTIVE MAP & TELEMETRY TERMINAL */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-mono flex items-center gap-1.5">
                  <Map size={13} className="text-dhl-red animate-pulse" />
                  Live Fleet Interactive Telemetry
                </h3>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Auto-Poll Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAutoPolling(!isAutoPolling);
                      if (!isAutoPolling) {
                        setIsSimulating(false); // turn off simulation if we go live with DB
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase border transition-all cursor-pointer ${
                      isAutoPolling
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300'
                    }`}
                    title="Toggle auto-refreshing tracking status live from the database"
                  >
                    {isAutoPolling ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        Live Polling: ACTIVE
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                        Live Polling: OFF
                      </>
                    )}
                  </button>

                  {/* Simulated Play/Pause Toggle */}
                  {shipment.status !== 'Delivered' && shipment.status !== 'Cancelled' && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSimulating(!isSimulating);
                        if (!isSimulating) {
                          setIsAutoPolling(false); // turn off live polling if we simulate
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase border transition-all cursor-pointer ${
                        isSimulating
                          ? 'bg-dhl-yellow border-dhl-yellow/80 text-slate-950 shadow-md shadow-dhl-yellow/15 font-black'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                      title="Toggle simulated driver movement transit demo along the waybill route"
                    >
                      {isSimulating ? (
                        <>
                          <Pause size={10} className="fill-current animate-pulse" />
                          Simulating...
                        </>
                      ) : (
                        <>
                          <Play size={10} className="fill-current" />
                          Simulate Transit
                        </>
                      )}
                    </button>
                  )}

                  {/* Reset Simulation */}
                  {(isSimulating || simProgress > 0.05) && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSimulating(false);
                        let initialProgress = 0.05;
                        if (shipment.status === 'Delivered') initialProgress = 1.0;
                        else if (shipment.status === 'Out for Delivery') initialProgress = 0.85;
                        else if (shipment.status === 'In Transit') initialProgress = 0.5;
                        else if (shipment.status === 'Picked Up') initialProgress = 0.2;
                        
                        setSimProgress(initialProgress);
                        const initialCoords = interpolateCoords(shipment.pickupCoords, shipment.deliveryCoords, initialProgress);
                        setSimulatedCoords(initialCoords);
                        setSimDistance(getDistanceKm(initialCoords, shipment.deliveryCoords));
                        setSimLogs((prev) => [
                          ...prev,
                          `[${new Date().toLocaleTimeString()}] 🔄 GPS simulation progress reset to ${Math.round(initialProgress * 100)}%.`
                        ]);
                      }}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer transition-all"
                      title="Reset GPS simulation to shipment's starting progress"
                    >
                      <RotateCcw size={11} />
                    </button>
                  )}
                </div>
              </div>

              {/* Map Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Leaflet Interactive Map Column */}
                <div className="md:col-span-2">
                  <LeafletMap
                    pickupCoords={shipment.pickupCoords}
                    deliveryCoords={shipment.deliveryCoords}
                    currentCoords={simulatedCoords || shipment.currentCoords}
                    status={isSimulating ? `In Transit (Simulating)` : shipment.status}
                    driverName={shipment.assignedDriverId ? "Dedicated Courier" : "Logify Logistics Team"}
                    theme={theme}
                  />
                </div>

                {/* 2. Live Telemetry metrics & Dispatch terminal */}
                <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Compass size={12} className="text-blue-400 animate-spin" style={{ animationDuration: '8s' }} />
                        GPS Telemetry Status
                      </span>
                      <span className="text-[9px] font-mono bg-blue-950/40 text-blue-400 border border-blue-900/40 px-1.5 py-0.5 rounded font-extrabold">
                        {isSimulating ? "SIM FEED ACTIVE" : isAutoPolling ? "DB SYNCED" : "STATIC LINK"}
                      </span>
                    </div>

                    {/* Numeric Diagnostics */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-slate-950/50 border border-slate-850/50 rounded-xl p-2.5 text-center">
                        <span className="text-[8px] font-mono uppercase text-slate-500 tracking-wider block">Speed Velocity</span>
                        <span className="text-xs font-mono font-bold text-slate-200">
                          {isSimulating ? `${simSpeed} mph` : shipment.status === 'In Transit' ? '64 mph' : shipment.status === 'Out for Delivery' ? '32 mph' : '0 mph'}
                        </span>
                      </div>
                      <div className="bg-slate-950/50 border border-slate-850/50 rounded-xl p-2.5 text-center">
                        <span className="text-[8px] font-mono uppercase text-slate-500 tracking-wider block">GPS Signal Fix</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          3D LOCK (4 Sats)
                        </span>
                      </div>
                      <div className="bg-slate-950/50 border border-slate-850/50 rounded-xl p-2.5 text-center">
                        <span className="text-[8px] font-mono uppercase text-slate-500 tracking-wider block">Heading vector</span>
                        <span className="text-xs font-mono font-bold text-slate-300">
                          {simHeading}
                        </span>
                      </div>
                      <div className="bg-slate-950/50 border border-slate-850/50 rounded-xl p-2.5 text-center">
                        <span className="text-[8px] font-mono uppercase text-slate-500 tracking-wider block">Remaining Dist</span>
                        <span className="text-[11px] font-mono font-bold text-blue-400 truncate block">
                          {simDistance ? `${simDistance.toFixed(1)} km` : `${getDistanceKm(shipment.currentCoords || shipment.pickupCoords, shipment.deliveryCoords).toFixed(1)} km`}
                        </span>
                      </div>
                    </div>

                    {/* Telemetry Progress Bar inside Panel */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                        <span>Journey Progress</span>
                        <span>{Math.round(simProgress * 100)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-950 border border-slate-850 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${simProgress * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live Dispatch terminal output */}
                  <div className="space-y-1.5 flex-1 flex flex-col min-h-[110px] justify-end">
                    <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Terminal size={10} />
                      Logify telemetry stream logs
                    </span>
                    <div className="bg-slate-950 border border-slate-850/80 p-2.5 rounded-xl text-[9px] font-mono text-emerald-400/90 h-28 overflow-y-auto space-y-1 custom-scrollbar">
                      {simLogs.slice(-6).map((log, index) => (
                        <div key={index} className="leading-snug break-all">{log}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Address cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-1 bg-white dark:bg-slate-900 shadow-sm">
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wide">Pickup Point</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{shipment.senderName}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{shipment.pickupAddress}</p>
              </div>

              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-1 bg-white dark:bg-slate-900 shadow-sm">
                <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wide">Delivery Destination</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{shipment.receiverName}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{shipment.deliveryAddress}</p>
              </div>
            </div>
          </div>

          {/* Industrial Shipping Tag Mockup & SMS Subscription Sidebar (1/3 col) */}
          <div className="space-y-6">
            
            {/* 1. HIGH-FIDELITY THERMAL SHIPPING TAG MOCKUP */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono">Thermal Shipping Tag Mockup</h3>
              <div className="bg-[#FAF9F6] border-2 border-dashed border-slate-300 rounded-2xl p-5 text-slate-900 shadow-sm relative overflow-hidden font-mono text-[10px]">
                {/* Visual Label punch-hole */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-300 pointer-events-none" />
                
                <div className="pt-4 border-b border-slate-400 pb-2 flex justify-between items-end">
                  <span className="font-sans font-black text-dhl-red text-sm tracking-tighter">LOGIFY EXPRESS®</span>
                  <span className="text-[8px] text-right">PREPAID AIRBILL</span>
                </div>

                {/* Routing Addresses */}
                <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-400">
                  <div className="space-y-1">
                    <span className="text-[8px] text-slate-500 font-bold block">FROM (SENDER):</span>
                    <p className="font-bold truncate text-slate-900">{shipment.senderName}</p>
                    <p className="text-[8px] text-slate-500 leading-tight line-clamp-2">{shipment.pickupAddress}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] text-slate-500 font-bold block">TO (DELIVERY):</span>
                    <p className="font-bold truncate text-slate-900">{shipment.receiverName}</p>
                    <p className="text-[8px] text-slate-500 leading-tight line-clamp-2">{shipment.deliveryAddress}</p>
                  </div>
                </div>

                {/* Package weight, level and billing terms */}
                <div className="grid grid-cols-3 gap-2 py-3 border-b border-slate-400 text-center">
                  <div className="border-r border-slate-300">
                    <span className="text-[7px] text-slate-500 block">CARGO WEIGHT</span>
                    <span className="font-bold text-xs">{shipment.weight} KG</span>
                  </div>
                  <div className="border-r border-slate-300">
                    <span className="text-[7px] text-slate-500 block">SERVICE TYPE</span>
                    <span className="font-bold text-xs uppercase text-dhl-red truncate block px-0.5">{shipment.type}</span>
                  </div>
                  <div>
                    <span className="text-[7px] text-slate-500 block">DELIVERY ZONE</span>
                    <span className="font-bold text-xs">ZONE 9-EXP</span>
                  </div>
                </div>

                {/* Barcode Mockup */}
                <div className="py-4 flex flex-col items-center justify-center space-y-2">
                  {/* Styled Barcode Lines */}
                  <div className="w-full h-12 flex items-center justify-center gap-[2px] bg-white px-2 rounded border border-slate-200">
                    <div className="w-[3px] h-9 bg-slate-900 shrink-0" />
                    <div className="w-[1px] h-9 bg-slate-900 shrink-0" />
                    <div className="w-[4px] h-9 bg-slate-900 shrink-0" />
                    <div className="w-[2px] h-9 bg-slate-900 shrink-0" />
                    <div className="w-[1px] h-9 bg-slate-900 shrink-0" />
                    <div className="w-[3px] h-9 bg-slate-900 shrink-0" />
                    <div className="w-[5px] h-9 bg-slate-900 shrink-0" />
                    <div className="w-[1px] h-9 bg-slate-900 shrink-0" />
                    <div className="w-[3px] h-9 bg-slate-900 shrink-0" />
                    <div className="w-[2px] h-9 bg-slate-900 shrink-0" />
                    <div className="w-[1px] h-9 bg-slate-900 shrink-0" />
                    <div className="w-[4px] h-9 bg-slate-900 shrink-0" />
                    <div className="w-[2px] h-9 bg-slate-900 shrink-0" />
                    <div className="w-[1px] h-9 bg-slate-900 shrink-0" />
                    <div className="w-[5px] h-9 bg-slate-900 shrink-0" />
                    <div className="w-[3px] h-9 bg-slate-900 shrink-0" />
                    <div className="w-[1px] h-9 bg-slate-900 shrink-0" />
                    <div className="w-[4px] h-9 bg-slate-900 shrink-0" />
                    <div className="w-[2px] h-9 bg-slate-900 shrink-0" />
                  </div>
                  {/* Barcode Number label */}
                  <span className="text-xs font-black tracking-widest text-slate-800">{shipment.id}</span>
                </div>

                <div className="text-[7px] text-slate-400 text-center leading-normal">
                  OFFICIAL WAYBILL SECURITY CERTIFICATE • SUBJECT TO TERMS AND SLA DISPATCH POLICES
                </div>
              </div>
            </div>

            {/* 2. SLA DYNAMIC SMS NOTIFICATIONS SIGNUP CARD */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono">Real-Time Alerts Dispatch</h3>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-dhl-yellow/15 text-dhl-red rounded-xl">
                    <Bell size={18} className="animate-swing" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white font-sans">SLA SMS Notifications</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-0.5">
                      Get instantaneous updates on transit exceptions, route diversions, or ETA delays sent to your mobile.
                    </p>
                  </div>
                </div>

                {smsSubscribed ? (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl p-3 text-center space-y-1">
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold text-xs block">✓ Alerts Activated</span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Real-time SMS stream registered for <span className="font-bold text-slate-800 dark:text-slate-200">{smsNumber}</span>
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSmsSubscribe} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        required
                        placeholder="+1 (555) 019-2834"
                        value={smsNumber}
                        onChange={(e) => setSmsNumber(e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-3 py-2 text-xs outline-none focus:border-dhl-red dark:focus:border-red-500 transition-all text-slate-800 dark:text-slate-100 font-mono"
                      />
                      <button
                        type="submit"
                        disabled={smsLoading}
                        className="bg-dhl-red hover:bg-dhl-red-hover text-white font-black text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer"
                      >
                        {smsLoading ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <>Subscribe</>
                        )}
                      </button>
                    </div>
                    <span className="text-[8px] text-slate-400 font-mono block">Standard text carrier messaging rates may apply.</span>
                  </form>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Share Modal */}
      {showShareModal && shipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Share2 size={16} className="text-blue-500" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-white font-sans uppercase tracking-wide">Share Tracking Portal</h3>
              </div>
              <button 
                onClick={() => {
                  setShowShareModal(false);
                  setShareNotification(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-lg font-mono font-bold px-1.5"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Provide external team members or customers with this unique secure waybill tracking portal link.
              </p>

              {/* Copy URL Input Group */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Secure Share Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getShareUrl()}
                    className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-300 outline-none select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                      copied 
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10' 
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Mock Social Media Integrations */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Mock Dispatch Platforms</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleMockShare('Slack')}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs text-slate-600 dark:text-slate-300 font-medium"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    Share to Slack
                  </button>
                  <button
                    onClick={() => handleMockShare('Teams')}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs text-slate-600 dark:text-slate-300 font-medium"
                  >
                    <span className="w-2 h-2 rounded-full bg-violet-500" />
                    Share to MS Teams
                  </button>
                  <button
                    onClick={() => handleMockShare('X / Twitter')}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs text-slate-600 dark:text-slate-300 font-medium"
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    Share on X
                  </button>
                  <button
                    onClick={() => handleMockShare('Corporate Email')}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs text-slate-600 dark:text-slate-300 font-medium"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Send via Email
                  </button>
                </div>
              </div>

              {/* Dynamic Notification Message inside Modal */}
              {shareNotification && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-xs font-medium text-center animate-in fade-in slide-in-from-bottom-2 duration-200">
                  {shareNotification}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShareNotification(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
