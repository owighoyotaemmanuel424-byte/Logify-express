import React, { useState, useEffect } from 'react';
import { 
  Search, Loader2, ArrowRight, ShieldCheck, MapPin, Truck, Calendar, 
  DollarSign, Package, Clock, Activity, Map, Compass, Scale, Share2, 
  Copy, Check, Play, Pause, RotateCcw, Terminal, Wifi, AlertTriangle, CheckCircle2,
  FileText, Bell, QrCode, Camera, Mail, Gauge, Zap, Wind, Thermometer, Satellite, Database, Cpu, Shield, Globe, RefreshCw, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Shipment, Coordinates, Settings } from '../types.js';
import LeafletMap from './LeafletMap.tsx';
import InteractiveMap from './InteractiveMap.tsx';
import QrScannerModal from './QrScannerModal.tsx';

const detectLogisticsPartner = (id: string) => {
  const trimmed = id.trim().toUpperCase();
  if (!trimmed) return null;

  if (/^LOG-/i.test(trimmed)) {
    return {
      name: "Logify Express",
      icon: <Zap size={14} className="text-amber-500 animate-pulse" />,
      badgeClass: "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-400 dark:border-amber-500/10",
      description: "Logify automated multi-modal smart logistics grid",
    };
  }
  if (/^DHL-/i.test(trimmed) || /^\d{10}$/.test(trimmed)) {
    return {
      name: "DHL Express",
      icon: <Globe size={14} className="text-yellow-600 dark:text-yellow-400" />,
      badgeClass: "bg-yellow-500/10 text-yellow-700 border border-yellow-500/20 dark:bg-yellow-500/5 dark:text-yellow-400 dark:border-yellow-500/10",
      description: "DHL Global Air Freight & Express carrier",
    };
  }
  if (/^FDX-/i.test(trimmed) || /^FX-/i.test(trimmed) || /^\d{12}$/.test(trimmed)) {
    return {
      name: "FedEx Express",
      icon: <Compass size={14} className="text-purple-600 dark:text-purple-400" />,
      badgeClass: "bg-purple-500/10 text-purple-700 border border-purple-500/20 dark:bg-purple-500/5 dark:text-purple-400 dark:border-purple-500/10",
      description: "FedEx high-priority overland & aero network",
    };
  }
  if (/^UPS-/i.test(trimmed) || /^1Z/i.test(trimmed)) {
    return {
      name: "UPS Logistics",
      icon: <ShieldCheck size={14} className="text-yellow-800 dark:text-yellow-500" />,
      badgeClass: "bg-amber-950/10 text-yellow-800 border border-yellow-800/20 dark:bg-amber-950/5 dark:text-yellow-500 dark:border-yellow-800/10",
      description: "UPS Shield-Guaranteed supply chain",
    };
  }
  if (/^USPS-/i.test(trimmed) || /^(9[0-9]{20,22})$/.test(trimmed)) {
    return {
      name: "USPS Postal",
      icon: <MapPin size={14} className="text-blue-600 dark:text-blue-400" />,
      badgeClass: "bg-blue-500/10 text-blue-700 border border-blue-500/20 dark:bg-blue-500/5 dark:text-blue-400 dark:border-blue-500/10",
      description: "United States Postal Service ground advantage",
    };
  }

  // Fallback / default
  return {
    name: "Standard Logistics Partner",
    icon: <Truck size={14} className="text-slate-500 dark:text-slate-400" />,
    badgeClass: "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700",
    description: "Multi-carrier routing auto-assigned",
  };
};

interface PublicTrackerProps {
  initialTrackId?: string;
  onClearTrackId?: () => void;
  theme?: 'light' | 'dark';
  settings?: Settings;
}

export default function PublicTracker({ initialTrackId, onClearTrackId, theme, settings }: PublicTrackerProps) {
  const [trackId, setTrackId] = useState(initialTrackId || '');
  const partner = detectLogisticsPartner(trackId);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressWidth, setProgressWidth] = useState('0%');
  const [refreshing, setRefreshing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareNotification, setShareNotification] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  // Custom tracking dashboard states
  const [activeTab, setActiveTab] = useState<'history' | 'facts'>('history');
  const [smsNumber, setSmsNumber] = useState('');
  const [smsSubscribed, setSmsSubscribed] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);

  // Email Subscription States
  const [emailValue, setEmailValue] = useState('');
  const [isEmailSubscribed, setIsEmailSubscribed] = useState(false);
  const [isEmailToggled, setIsEmailToggled] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailStatusType, setEmailStatusType] = useState<'success' | 'info' | 'error' | null>(null);

  // Real-time tracking simulation and polling states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0.05);
  const [simSpeed, setSimSpeed] = useState(65);
  const [simHeading, setSimHeading] = useState('N/A');
  const [simDistance, setSimDistance] = useState(0);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [isAutoPolling, setIsAutoPolling] = useState(false);
  const [simulatedCoords, setSimulatedCoords] = useState<Coordinates | null>(null);
  const [mapMode, setMapMode] = useState<'vector' | 'satellite'>('vector');

  // Pro features for realistic interactive telemetry
  const [terminalMode, setTerminalMode] = useState<'human' | 'nmea'>('human');
  const [telemetryTab, setTelemetryTab] = useState<'hardware' | 'sensors' | 'weather'>('hardware');
  const [networkPing, setNetworkPing] = useState(28);
  const [starlinkStatus, setStarlinkStatus] = useState('LOCKED');
  const [cargoTemp, setCargoTemp] = useState(4.2);
  const [gForceX, setGForceX] = useState(0.02);
  const [gForceY, setGForceY] = useState(0.04);
  const [altitude, setAltitude] = useState(142);
  const [nmeaLogs, setNmeaLogs] = useState<string[]>([]);

  // Generator for highly realistic raw NMEA lines from dynamic coordinates
  const generateNmeaSentences = (coords: Coordinates, speed: number) => {
    const latDeg = Math.floor(Math.abs(coords.lat));
    const latMin = ((Math.abs(coords.lat) - latDeg) * 60).toFixed(4);
    const latHem = coords.lat >= 0 ? 'N' : 'S';
    const latStr = `${latDeg.toString().padStart(2, '0')}${latMin}`;

    const lngDeg = Math.floor(Math.abs(coords.lng));
    const lngMin = ((Math.abs(coords.lng) - lngDeg) * 60).toFixed(4);
    const lngHem = coords.lng >= 0 ? 'E' : 'W';
    const lngStr = `${lngDeg.toString().padStart(3, '0')}${lngMin}`;

    const dateObj = new Date();
    const timeStr = dateObj.toISOString().slice(11, 19).replace(/:/g, '');
    const dateStr = dateObj.toISOString().slice(8, 10) + dateObj.toISOString().slice(5, 7) + dateObj.toISOString().slice(2, 4);

    const speedKnots = (speed * 0.868976).toFixed(1);
    
    // GPRMC sentence
    const gprmcRaw = `GPRMC,${timeStr}.00,A,${latStr},${latHem},${lngStr},${lngHem},${speedKnots},0.0,${dateStr},,`;
    let checksumRmc = 0;
    for (let i = 0; i < gprmcRaw.length; i++) {
      checksumRmc ^= gprmcRaw.charCodeAt(i);
    }
    const gprmc = `$${gprmcRaw}*${checksumRmc.toString(16).toUpperCase().padStart(2, '0')}`;

    // GPGGA sentence
    const gpggaRaw = `GPGGA,${timeStr}.00,${latStr},${latHem},${lngStr},${lngHem},1,08,0.9,45.2,M,-22.1,M,,`;
    let checksumGga = 0;
    for (let i = 0; i < gpggaRaw.length; i++) {
      checksumGga ^= gpggaRaw.charCodeAt(i);
    }
    const gpgga = `$${gpggaRaw}*${checksumGga.toString(16).toUpperCase().padStart(2, '0')}`;

    return [gprmc, gpgga];
  };

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

      const initialNmea = generateNmeaSentences(current, 0);
      setNmeaLogs([
        `$GPGSA,A,3,01,02,03,04,05,06,07,08,,,1.8,0.9,1.5*3F`,
        `$GPGSV,3,1,11,01,40,090,40,02,19,045,35,03,27,225,41,04,12,315,38*72`,
        ...initialNmea
      ]);

      setIsSimulating(false);

      // Reset email states for new tracked shipment
      setIsEmailSubscribed(false);
      setIsEmailToggled(false);
      setEmailValue('');
      setEmailMessage(null);
      setEmailStatusType(null);
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

        const newNmea = generateNmeaSentences(newCoords, currentSpeed);
        setNmeaLogs((prev) => [...prev, ...newNmea].slice(-50));

        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isSimulating, shipment]);

  // Real-time fluctuation for telemetry instruments to simulate active live sensors
  useEffect(() => {
    if (!shipment) return;
    const interval = setInterval(() => {
      setNetworkPing((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
        return Math.max(15, Math.min(65, prev + delta));
      });
      setCargoTemp((prev) => {
        const delta = (Math.random() * 0.1) - 0.05; // -0.05 to +0.05
        return parseFloat(Math.max(2.8, Math.min(5.5, prev + delta)).toFixed(2));
      });
      setGForceX((prev) => {
        const isMoving = isSimulating || shipment.status === 'In Transit' || shipment.status === 'Out for Delivery';
        const range = isMoving ? 0.15 : 0.01;
        return parseFloat(((Math.random() * range * 2) - range).toFixed(3));
      });
      setGForceY((prev) => {
        const isMoving = isSimulating || shipment.status === 'In Transit' || shipment.status === 'Out for Delivery';
        const range = isMoving ? 0.15 : 0.01;
        return parseFloat(((Math.random() * range * 2) - range).toFixed(3));
      });
      setAltitude((prev) => {
        const delta = Math.floor(Math.random() * 3) - 1; // -1 to +1
        return Math.max(80, Math.min(480, prev + delta));
      });

      // Stream continuous NMEA GPS lines when in raw terminal mode
      const activeCoords = simulatedCoords || shipment.currentCoords || shipment.pickupCoords;
      const speed = isSimulating ? simSpeed : shipment.status === 'In Transit' ? 64 : shipment.status === 'Out for Delivery' ? 32 : 0;
      const newNmea = generateNmeaSentences(activeCoords, speed);
      setNmeaLogs((prev) => [...prev, ...newNmea].slice(-50));
    }, 2000);

    return () => clearInterval(interval);
  }, [shipment, isSimulating, simulatedCoords, simSpeed]);

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
    if (settings?.trackerShowChronologyLog === false && activeTab === 'history') {
      setActiveTab('facts');
    }
  }, [settings?.trackerShowChronologyLog, activeTab]);

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

  const handleEmailSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValue.trim() || !emailValue.includes('@')) {
      setEmailMessage('Please enter a valid email address.');
      setEmailStatusType('error');
      return;
    }
    setEmailLoading(true);
    setEmailMessage(null);
    try {
      const response = await fetch(`/api/track/${shipment?.id}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailValue.trim() }),
      });
      const data = await response.json();
      if (response.ok) {
        setIsEmailSubscribed(true);
        setEmailMessage(data.message);
        setEmailStatusType(data.status === 'existing' ? 'info' : 'success');
        setSimLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] 📬 Email updates registered for ${emailValue.trim().toLowerCase()}.`
        ]);
      } else {
        setEmailMessage(data.error || 'Failed to subscribe to email updates.');
        setEmailStatusType('error');
      }
    } catch (err) {
      console.error('Error subscribing to updates:', err);
      setEmailMessage('An error occurred. Please try again.');
      setEmailStatusType('error');
    } finally {
      setEmailLoading(false);
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const getBackgroundPresetStyles = () => {
    const preset = settings?.trackerCustomBackgroundPreset || 'dark-ash';
    switch (preset) {
      case 'emerald':
        return {
          wrapper: 'bg-[#0f1d19] border border-emerald-900/60 p-6 md:p-10 rounded-3xl shadow-2xl transition-all duration-300 text-slate-100',
          cardBorder: 'border-emerald-500',
          accentText: 'text-emerald-400',
          accentBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          btn: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 focus:border-emerald-400',
          logoColor: 'text-emerald-400',
          logoTag: 'bg-emerald-500 text-slate-950 font-black',
        };
      case 'cosmic':
        return {
          wrapper: 'bg-[#0d0e19] border border-indigo-900/60 p-6 md:p-10 rounded-3xl shadow-2xl transition-all duration-300 text-slate-100',
          cardBorder: 'border-indigo-500',
          accentText: 'text-indigo-400',
          accentBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          btn: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 focus:border-indigo-400',
          logoColor: 'text-indigo-400',
          logoTag: 'bg-indigo-600 text-white',
        };
      case 'dark-ash':
      default:
        return {
          wrapper: 'bg-[#121418] border border-[#282d3b] p-6 md:p-10 rounded-3xl shadow-2xl transition-all duration-300 text-slate-100',
          cardBorder: 'border-amber-500',
          accentText: 'text-amber-400',
          accentBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          btn: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-amber-500/20 focus:border-amber-400',
          logoColor: 'text-amber-400',
          logoTag: 'bg-amber-500 text-slate-950 font-black',
        };
    }
  };

  const presetStyle = getBackgroundPresetStyles();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-8 min-h-[70vh] bg-[#121418] text-slate-100 rounded-3xl">
      <div className={presetStyle.wrapper}>
        {/* FedEx Style Corporate Header Branding */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-1 font-sans">
            <span className={`text-4xl font-black tracking-tighter ${presetStyle.logoColor}`}>Logify</span>
            <span className={`${presetStyle.logoTag} text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider`}>Express®</span>
          </div>
          <h1 className="text-xl md:text-2xl font-sans font-bold text-slate-100 uppercase tracking-tight">
            Global Logistics Waybill Tracking
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Input your 12-digit tracking reference code below to view active status, scheduled milestones, and live driver telemetry feeds.
          </p>
        </div>

        {/* Track Search Form with Custom Focus & Style Button */}
        <div className="max-w-xl mx-auto space-y-3 mt-8">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                required
                placeholder="Enter Tracking Number (e.g. LOG-583019-US)"
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
                className="w-full bg-[#1a1d25] border-2 border-[#2b303d] rounded-xl pl-4 pr-12 py-3.5 text-sm font-mono text-white placeholder-slate-400 outline-none transition-colors shadow-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[#242936] hover:bg-[#2e3444] text-slate-200 transition-colors cursor-pointer flex items-center justify-center border border-[#2b303d]"
                title="Scan QR Code / Barcode with Camera"
              >
                <QrCode size={18} className="text-amber-400" />
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3.5 disabled:opacity-50 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all cursor-pointer ${presetStyle.btn}`}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Track Status
            </button>
          </form>

        {trackId.trim() && partner && (
          <div className="flex items-center gap-2 bg-[#1a1d25] border border-[#2b303d] px-4 py-2.5 rounded-xl text-left animate-in fade-in slide-in-from-top-1 duration-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono shrink-0">Auto-Detected Carrier:</span>
            <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider font-mono shrink-0 ${partner.badgeClass}`}>
              {partner.icon}
              {partner.name}
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline truncate">— {partner.description}</span>
          </div>
        )}
        
        {/* Clickable Quick Sample Reference Tags for Premium Usability */}
        <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-slate-400">
          <span>Demo References:</span>
          <button 
            onClick={() => { setTrackId('LOG-583019-US'); fetchTrackingData('LOG-583019-US'); }}
            className="underline hover:text-amber-400 transition-colors"
          >
            LOG-583019-US
          </button>
          <span>•</span>
          <button 
            onClick={() => { setTrackId('LOG-194820-US'); fetchTrackingData('LOG-194820-US'); }}
            className="underline hover:text-amber-400 transition-colors"
          >
            LOG-194820-US
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="text-amber-400 animate-spin" size={32} />
          <p className="text-xs font-mono text-slate-400">Decrypting satellite transit logs...</p>
        </div>
      )}

      {/* Error Output */}
      {error && !loading && (
        <div className="bg-rose-950/40 border-l-4 border-rose-500 rounded-xl p-5 text-left max-w-xl mx-auto space-y-1 shadow-sm">
          <div className="text-rose-400 font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
            <AlertTriangle size={14} />
            Tracking Reference Exception
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">{error}</p>
        </div>
      )}

      {/* Custom Broadcast Notes */}
      {shipment && !loading && settings?.trackerCustomNotes && (
        <div className="max-w-7xl mx-auto bg-amber-500/10 border-l-4 border-amber-500 text-amber-800 dark:text-amber-400 p-4 rounded-xl flex items-start gap-3 shadow-sm font-sans my-4">
          <Shield size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1 text-left text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px] block">Global Logistics Broadcast Advisory</span>
            <p className="leading-relaxed font-medium">{settings.trackerCustomNotes}</p>
          </div>
        </div>
      )}

      {/* Success Result Panel */}
      {shipment && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main info & Live Map (2/3 col) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Telemetry Actions Bar */}
            <div className="flex items-center justify-between gap-3 bg-[#181a22] border border-[#2b303e] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">Live Connection Active</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#20232e] hover:bg-[#282d3b] border border-[#2b303e] rounded-xl text-xs font-semibold text-slate-200 transition-all disabled:opacity-50 cursor-pointer"
                  title="Simulate fetching the latest tracking data from the server"
                >
                  <Activity size={13} className={`text-amber-400 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                
                {/* Share Shipment Button */}
                {settings?.trackerShowShareButton !== false && (
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
                  >
                    <Share2 size={13} />
                    Share Shipment
                  </button>
                )}
              </div>
            </div>

            {/* PROMINENT SHIPMENT OVERVIEW CARD - DARK ASH LAYOUT */}
            <div className={`bg-[#181a22] border-t-8 ${presetStyle.cardBorder} border-x border-b border-[#2b303e] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 text-slate-100`}>
              
              {/* Main tracking banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#2b303e]">
                <div className="space-y-1.5">
                  <span className={`text-[10px] ${presetStyle.accentText} uppercase font-black tracking-widest font-mono block`}>Logify Express Waybill ID</span>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-3xl font-sans font-black text-white tracking-tight">
                      {shipment.id}
                    </h3>
                    <span className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded border ${presetStyle.accentBg}`}>
                      {shipment.type}
                    </span>
                    {(() => {
                      const activePartner = detectLogisticsPartner(shipment.id);
                      return activePartner && (
                        <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider font-mono ${activePartner.badgeClass}`}>
                          {activePartner.icon}
                          {activePartner.name}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {settings?.trackerShowEstimatedDelivery !== false && (
                  <div className="space-y-1 md:text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest font-mono block">Estimated Delivery Date</span>
                    <div className={`text-xl sm:text-2xl font-sans font-black ${presetStyle.accentText} tracking-tight`}>
                      {formatDate(shipment.estimatedDelivery)}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider font-mono px-2 py-0.5 rounded border ${presetStyle.accentBg}`}>
                      On-Time Transit SLA Guarantee
                    </span>
                  </div>
                )}
              </div>

              {/* ACTION-ORIENTED STATUS WITH HIGH DENSITY INFO */}
              <div className="bg-[#20232e] border border-[#2c3242] rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3.5 rounded-full ${
                    shipment.status === 'Delivered'
                      ? 'bg-emerald-500 text-white'
                      : shipment.status === 'Cancelled'
                      ? 'bg-rose-500 text-white'
                      : 'bg-amber-500 text-slate-950 font-black animate-pulse'
                  }`}>
                    {shipment.status === 'Delivered' ? <CheckCircle2 size={24} /> : <Truck size={24} />}
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold font-mono tracking-wider text-slate-400 block">Current Status</span>
                    <h2 className="text-2xl font-sans font-black text-white tracking-tight uppercase">
                      {shipment.status === 'Delivered' ? 'Delivered' : 
                       shipment.status === 'Out for Delivery' ? 'Out for Delivery' :
                       shipment.status === 'In Transit' ? 'In Transit / On its way' : 
                       shipment.status === 'Picked Up' ? 'Picked Up / Traveling' : 'Shipment Created'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Last scanned coordinate update received: {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">Live SLA Active</span>
                </div>
              </div>

              {/* ADVANCED FEDEX-STYLE STEPPER TIMELINE GRAPH */}
              <div className="pt-4 pb-2">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest font-mono block mb-6 text-center">Transit Progress Pipeline</span>
                <div className="relative flex flex-col md:flex-row justify-between items-center md:items-start gap-8 md:gap-0">
                  
                  {/* Connecting bar */}
                  <div className="absolute top-5 left-[10%] right-[10%] h-[3px] bg-[#292e3d] hidden md:block" />
                  <div 
                    className="absolute top-5 left-[10%] h-[3px] bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-[1200ms] ease-out hidden md:block"
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
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-amber-500 bg-amber-500 text-slate-950 font-mono font-bold text-xs shadow-sm">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-100">Pending</h4>
                      <p className="text-[9px] font-mono text-slate-400">Order Placed</p>
                    </div>
                  </div>

                  {/* Step 2: Picked Up */}
                  <div className="flex flex-row md:flex-col items-center gap-3 md:gap-2 relative z-10 w-full md:w-1/5 text-left md:text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-mono font-bold text-xs shadow-sm transition-colors duration-500 ${
                      ['Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'].includes(shipment.status)
                        ? 'border-amber-500 bg-amber-500 text-slate-950'
                        : 'border-[#2e3444] bg-[#20232e] text-slate-400'
                    }`}>
                      {['Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'].includes(shipment.status) ? '✓' : '02'}
                    </div>
                    <div>
                      <h4 className={`text-[11px] font-bold ${['Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'].includes(shipment.status) ? 'text-slate-100' : 'text-slate-400'}`}>Picked Up</h4>
                      <p className="text-[9px] font-mono text-slate-400">Manifest Verified</p>
                    </div>
                  </div>

                  {/* Step 3: In Transit */}
                  <div className="flex flex-row md:flex-col items-center gap-3 md:gap-2 relative z-10 w-full md:w-1/5 text-left md:text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-mono font-bold text-xs shadow-sm transition-colors duration-500 ${
                      ['In Transit', 'Out for Delivery', 'Delivered'].includes(shipment.status)
                        ? 'border-amber-500 bg-amber-500 text-slate-950'
                        : 'border-[#2e3444] bg-[#20232e] text-slate-400'
                    }`}>
                      {['In Transit', 'Out for Delivery', 'Delivered'].includes(shipment.status) ? '✓' : '03'}
                    </div>
                    <div>
                      <h4 className={`text-[11px] font-bold ${['In Transit', 'Out for Delivery', 'Delivered'].includes(shipment.status) ? 'text-slate-100' : 'text-slate-400'}`}>In Transit</h4>
                      <p className="text-[9px] font-mono text-slate-400">En Route Corridor</p>
                    </div>
                  </div>

                  {/* Step 4: Out for Delivery */}
                  <div className="flex flex-row md:flex-col items-center gap-3 md:gap-2 relative z-10 w-full md:w-1/5 text-left md:text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-mono font-bold text-xs shadow-sm transition-colors duration-500 ${
                      ['Out for Delivery', 'Delivered'].includes(shipment.status)
                        ? 'border-amber-500 bg-amber-500 text-slate-950 animate-pulse'
                        : 'border-[#2e3444] bg-[#20232e] text-slate-400'
                    }`}>
                      {['Out for Delivery', 'Delivered'].includes(shipment.status) ? '✓' : '04'}
                    </div>
                    <div>
                      <h4 className={`text-[11px] font-bold ${['Out for Delivery', 'Delivered'].includes(shipment.status) ? 'text-slate-100' : 'text-slate-400'}`}>Out for Delivery</h4>
                      <p className="text-[9px] font-mono text-slate-400">Local Dispatch Courier</p>
                    </div>
                  </div>

                  {/* Step 5: Delivered */}
                  <div className="flex flex-row md:flex-col items-center gap-3 md:gap-2 relative z-10 w-full md:w-1/5 text-left md:text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-mono font-bold text-xs shadow-sm transition-colors duration-500 ${
                      shipment.status === 'Delivered'
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-[#2e3444] bg-[#20232e] text-slate-400'
                    }`}>
                      {shipment.status === 'Delivered' ? '✓' : '05'}
                    </div>
                    <div>
                      <h4 className={`text-[11px] font-bold ${shipment.status === 'Delivered' ? 'text-emerald-400 font-extrabold' : 'text-slate-400'}`}>Delivered</h4>
                      <p className="text-[9px] font-mono text-slate-400">Signature Captured</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Delivery Estimation Progress Bar & Route Vector Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Delivery Estimation Progress Bar */}
              <div className={`${settings?.trackerShowRouteVector !== false ? 'md:col-span-2' : 'md:col-span-3'} bg-[#181a22] border border-[#2b303e] rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between`}>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-slate-400 uppercase font-bold tracking-wider">Delivery Transit Progress</span>
                  <span className={`font-mono font-bold ${presetStyle.accentText}`}>
                    {shipment.status === 'Delivered' ? '100% (Delivered)' :
                     shipment.status === 'Out for Delivery' ? '85% (Out for Delivery)' :
                     shipment.status === 'In Transit' ? '60% (In Transit)' :
                     shipment.status === 'Picked Up' ? '30% (Picked Up)' :
                     shipment.status === 'Pending' ? '10% (Pending)' : '0%'}
                  </span>
                </div>
                <div className="relative h-2 w-full bg-[#20232e] rounded-full overflow-hidden my-1">
                  <div 
                    className={`h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-[1500ms] ease-out ${
                      shipment.status === 'In Transit' ? 'animate-pulse' : ''
                    }`}
                    style={{
                      width: progressWidth
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-slate-400 pt-1">
                  <span className={shipment.status === 'Pending' ? `${presetStyle.accentText} font-bold` : ''}>Ordered</span>
                  <span className={shipment.status === 'Picked Up' ? `${presetStyle.accentText} font-bold` : ''}>Picked Up</span>
                  <span className={shipment.status === 'In Transit' ? `${presetStyle.accentText} font-bold animate-pulse` : ''}>In Transit</span>
                  <span className={shipment.status === 'Out for Delivery' ? `${presetStyle.accentText} font-bold` : ''}>Out for Delivery</span>
                  <span className={shipment.status === 'Delivered' ? 'text-emerald-400 font-bold' : ''}>Delivered</span>
                </div>
              </div>

              {/* Route Vector Panel */}
              {settings?.trackerShowRouteVector !== false && (
                <div className="bg-[#181a22] border border-[#2b303e] rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-slate-400 uppercase font-bold tracking-wider text-[10px] flex items-center gap-1">
                      <Map size={12} className={presetStyle.accentText} />
                      Transit Route Vector
                    </span>
                    <span className={`font-mono text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase border ${presetStyle.accentBg}`}>
                      A ➔ B
                    </span>
                  </div>

                  {/* Styled route vector diagram with map overlay styling */}
                  <div className="relative bg-[#12141a] border border-[#282d3b] rounded-xl p-3 h-24 overflow-hidden flex flex-col justify-between">
                    {/* Subtle map pattern lines background */}
                    <div className="absolute inset-0 opacity-15 pointer-events-none">
                      <svg width="100%" height="100%">
                        <defs>
                          <pattern id="grid" width="12" height="12" patternUnits="userSpaceOnUse">
                            <path d="M 12 0 L 0 0 0 12" fill="none" stroke="currentColor" strokeWidth="0.5" />
                          </pattern>
                        </defs>
                        <svg width="100%" height="100%" fill="url(#grid)" />
                      </svg>
                    </div>

                    {/* Route connecting line */}
                    <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-[1.5px] border-t border-dashed border-slate-700 pointer-events-none flex justify-between items-center" />
                    
                    {/* Progress indicator along path */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 transition-all duration-[1500ms] ease-out flex flex-col items-center pointer-events-none"
                      style={{ 
                        left: `calc(12% + (${progressWidth === '0%' ? '0px' : progressWidth}) * 0.72)` 
                      }}
                    >
                      <div className="bg-amber-500 text-slate-950 rounded-full p-1 shadow-lg relative z-10 animate-bounce">
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
                      <span className="truncate max-w-[80px] bg-[#1a1d25] px-1 py-0.5 rounded text-slate-300" title={shipment.pickupAddress}>
                        {shipment.pickupAddress.split(',')[0]}
                      </span>
                      <span className="truncate max-w-[80px] bg-[#1a1d25] px-1 py-0.5 rounded text-right text-slate-300" title={shipment.deliveryAddress}>
                        {shipment.deliveryAddress.split(',')[0]}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                    <span className="flex items-center gap-0.5">
                      <Compass size={10} className="text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                      GPS Connection
                    </span>
                    <span className="text-amber-400 font-bold uppercase tracking-wider">Active Stream</span>
                  </div>
                </div>
              )}
            </div>

            {/* TABBED CARGO TRAVEL HISTORY & SHIPMENT FACTS */}
            <div className="bg-[#181a22] border border-[#2b303e] rounded-2xl shadow-sm overflow-hidden">
              {/* Tab Header Selector */}
              {settings?.trackerShowChronologyLog !== false && (
                <div className="flex border-b border-[#2b303e] bg-[#12141a] p-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'history'
                        ? 'bg-[#20232e] text-amber-400 shadow-sm border border-[#2c3242]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1d25]'
                    }`}
                  >
                    <Activity size={14} className={activeTab === 'history' ? 'text-amber-400' : ''} />
                    Travel History
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('facts')}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'facts'
                        ? 'bg-[#20232e] text-amber-400 shadow-sm border border-[#2c3242]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1d25]'
                    }`}
                  >
                    <FileText size={14} className={activeTab === 'facts' ? 'text-amber-400' : ''} />
                    Shipment Facts
                  </button>
                </div>
              )}

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'history' ? (
                  /* TRAVEL HISTORY TIMELINE TABLE */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#2b303e]">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Chronological Tracking Scan Log</span>
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
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
                                  ? 'bg-[#20232e] border-amber-500/50 shadow-sm' 
                                  : 'bg-[#181a22] border-[#2b303e]'
                              }`}
                            >
                              <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <span className={`font-bold rounded px-1.5 py-0.5 text-[9px] uppercase font-mono tracking-wider ${
                                    event.status === 'Delivered' 
                                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30' 
                                      : event.status === 'In Transit'
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                      : event.status === 'Out for Delivery'
                                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                                      : 'bg-[#20232e] text-slate-300'
                                  }`}>
                                    {event.status}
                                  </span>
                                  {event.location && (
                                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5">
                                      <MapPin size={10} className="text-slate-400" />
                                      {event.location}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-200 font-medium">
                                  {event.description}
                                </p>
                              </div>
                              <div className="flex flex-col items-end text-right gap-1 ml-4 shrink-0 font-mono text-[10px] text-slate-400">
                                <span className="flex items-center gap-1 font-bold">
                                  <Clock size={10} />
                                  {formatDate(event.timestamp)}
                                </span>
                                {isLatest && (
                                  <span className="text-[8px] uppercase tracking-wider font-black text-amber-400 animate-pulse">
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
                    <div className="pb-3 border-b border-[#2b303e]">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Technical Cargo Manifest Facts</span>
                    </div>
 
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs">
                      <div className="space-y-3.5">
                        <div className="flex justify-between pb-2 border-b border-[#2b303e]">
                          <span className="text-slate-400 font-medium font-sans">Tracking Reference ID</span>
                          <span className="font-mono font-bold text-slate-100">{shipment.id}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-[#2b303e]">
                          <span className="text-slate-400 font-medium font-sans">Service Provider</span>
                          <span className="font-sans font-bold text-slate-100">Logify Express® Premium</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-[#2b303e]">
                          <span className="text-slate-400 font-medium font-sans">Product Level / Cargo Type</span>
                          <span className="font-sans font-bold text-amber-400 uppercase">{shipment.type} Courier</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-[#2b303e]">
                          <span className="text-slate-400 font-medium font-sans">Total Piece Weight</span>
                          <span className="font-mono font-bold text-slate-100">
                            {shipment.weight} kg / {(shipment.weight * 2.20462).toFixed(1)} lbs
                          </span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-[#2b303e]">
                          <span className="text-slate-400 font-medium font-sans">Total Shipments In Parcel</span>
                          <span className="font-sans font-bold text-slate-100">1 Piece</span>
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        <div className="flex justify-between pb-2 border-b border-[#2b303e]">
                          <span className="text-slate-400 font-medium font-sans">Package Dimensions</span>
                          <span className="font-mono font-bold text-slate-100">
                            {shipment.packageDimensions 
                              ? `${shipment.packageDimensions.length} x ${shipment.packageDimensions.width} x ${shipment.packageDimensions.height} cm`
                              : '40 x 30 x 15 cm (Medium Box)'}
                          </span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-[#2b303e]">
                          <span className="text-slate-400 font-medium font-sans">Special Handling Flags</span>
                          <span className="font-sans font-bold text-amber-400">
                            {shipment.type === 'Fragile' ? 'Fragile - High Care' : 'Standard Priority Cargo'}
                          </span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-[#2b303e]">
                          <span className="text-slate-400 font-medium font-sans">Required Signature Option</span>
                          <span className="font-sans font-bold text-slate-100">Direct Signature Required</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-[#2b303e]">
                          <span className="text-slate-400 font-medium font-sans">Estimated Insurance Cover</span>
                          <span className="font-mono font-bold text-slate-100">
                            {shipment.packageValue ? `$${shipment.packageValue.toFixed(2)}` : '$150.00 (Standard)'}
                          </span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-[#2b303e]">
                          <span className="text-slate-400 font-medium font-sans">Dispatch Terms</span>
                          <span className="font-sans font-bold text-emerald-400 uppercase font-black tracking-wider">Paid / Prepaid</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* LIVE INTERACTIVE MAP & TELEMETRY TERMINAL */}
            {(settings?.trackerShowMap !== false || settings?.trackerShowTelemetryDeck !== false) && (
              <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-mono flex items-center gap-1.5">
                  <Map size={13} className="text-amber-400 animate-pulse" />
                  Live Fleet Interactive Telemetry
                </h3>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Auto-Poll Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAutoPolling(!isAutoPolling);
                      if (!isAutoPolling) {
                        setIsSimulating(false);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase border transition-all cursor-pointer ${
                      isAutoPolling
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-[#20232e] hover:bg-[#282d3b] border-[#2b303e] text-slate-300'
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
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        Live Polling: OFF
                      </>
                    )}
                  </button>
 
                  {/* Simulated Play/Pause Toggle */}
                  {settings?.trackerShowSimulation !== false && (
                    <>
                      {shipment.status !== 'Delivered' && shipment.status !== 'Cancelled' && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsSimulating(!isSimulating);
                            if (!isSimulating) {
                              setIsAutoPolling(false);
                            }
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase border transition-all cursor-pointer ${
                            isSimulating
                              ? 'bg-amber-500 border-amber-400 text-slate-950 font-black'
                              : 'bg-[#20232e] hover:bg-[#282d3b] border-[#2b303e] text-slate-300'
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
                          className="p-1.5 rounded-xl bg-[#20232e] hover:bg-[#282d3b] border border-[#2b303e] text-slate-300 hover:text-white cursor-pointer transition-all"
                          title="Reset GPS simulation to shipment's starting progress"
                        >
                          <RotateCcw size={11} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Map Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Interactive Map Column */}
                {settings?.trackerShowMap !== false && (
                  <div className={settings?.trackerShowTelemetryDeck !== false ? "md:col-span-2 space-y-3" : "md:col-span-3 space-y-3"}>
                    {/* View Mode Toggle Bar */}
                    <div className="flex items-center justify-between bg-[#12141a] border border-[#282d3b] p-1.5 rounded-xl shadow-md">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setMapMode('vector')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                            mapMode === 'vector'
                              ? 'bg-amber-500 text-slate-950 shadow'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-[#20232e]'
                          }`}
                        >
                          <Activity size={12} />
                          SVG Route Vector
                        </button>
                        <button
                          type="button"
                          onClick={() => setMapMode('satellite')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                            mapMode === 'satellite'
                              ? 'bg-amber-500 text-slate-950 shadow'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-[#20232e]'
                          }`}
                        >
                          <Globe size={12} />
                          Satellite Tiles
                        </button>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400 hidden sm:inline-block pr-2">
                        {mapMode === 'vector' ? '⚡ Animated SVG Vector Line' : '🗺️ OpenStreetMap / Carto'}
                      </span>
                    </div>

                    {mapMode === 'vector' ? (
                      <InteractiveMap
                        pickupCoords={shipment.pickupCoords}
                        deliveryCoords={shipment.deliveryCoords}
                        currentCoords={simulatedCoords || shipment.currentCoords}
                        status={isSimulating ? `In Transit (Simulating)` : shipment.status}
                        driverName={shipment.assignedDriverId ? "Dedicated Courier" : "Logify Logistics Team"}
                        simProgress={simProgress}
                        pickupAddress={shipment.pickupAddress}
                        deliveryAddress={shipment.deliveryAddress}
                      />
                    ) : (
                      <LeafletMap
                        pickupCoords={shipment.pickupCoords}
                        deliveryCoords={shipment.deliveryCoords}
                        currentCoords={simulatedCoords || shipment.currentCoords}
                        status={isSimulating ? `In Transit (Simulating)` : shipment.status}
                        driverName={shipment.assignedDriverId ? "Dedicated Courier" : "Logify Logistics Team"}
                        theme="dark"
                      />
                    )}
                  </div>
                )}

                {/* 2. Live Telemetry metrics & Dispatch terminal */}
                {settings?.trackerShowTelemetryDeck !== false && (
                  <div className={`bg-[#12141a] border border-[#282d3b] rounded-2xl p-4 flex flex-col justify-between space-y-4 shadow-xl ${settings?.trackerShowMap !== false ? 'md:col-span-1' : 'md:col-span-3'}`}>
                  {/* Dashboard Header */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#282d3b] pb-2.5">
                      <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Compass size={12} className="text-amber-400 animate-spin" style={{ animationDuration: '10s' }} />
                        Fleet Telemetry Deck
                      </span>
                      <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-extrabold">
                        {isSimulating ? "SIMULATOR ONLINE" : isAutoPolling ? "DB SYNC ACTIVE" : "STABLE LINK"}
                      </span>
                    </div>

                    {/* Sub-tabs for telemetry view */}
                    <div className="grid grid-cols-3 gap-1 bg-[#181a22] p-1 rounded-xl border border-[#282d3b]">
                      {(['hardware', 'sensors', 'weather'] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setTelemetryTab(tab)}
                          className={`text-[9px] font-mono uppercase font-bold py-1 px-1 rounded-lg transition-all cursor-pointer text-center ${
                            telemetryTab === tab
                              ? 'bg-[#20232e] text-amber-400 font-bold'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* Telemetry Tab Content */}
                    <AnimatePresence mode="wait">
                      {telemetryTab === 'hardware' && (
                        <motion.div
                          key="hardware"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="space-y-3"
                        >
                          {/* Speed Gauge & Diagnostics row */}
                          <div className="grid grid-cols-2 gap-2.5">
                            {/* SVG Speedometer Gauge */}
                            <div className="bg-[#181a22] border border-[#282d3b] rounded-xl p-2.5 flex flex-col items-center justify-center relative overflow-hidden">
                              <span className="text-[7.5px] font-mono uppercase text-slate-400 tracking-wider mb-1 block">Speed Velocity</span>
                              <div className="relative w-16 h-16 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                  {/* Base Circle */}
                                  <circle
                                    cx="32"
                                    cy="32"
                                    r="26"
                                    className="stroke-[#282d3b] fill-none"
                                    strokeWidth="4.5"
                                  />
                                  {/* Active Speed Arc */}
                                  <circle
                                    cx="32"
                                    cy="32"
                                    r="26"
                                    className="stroke-amber-400 fill-none transition-all duration-500 ease-out"
                                    strokeWidth="4.5"
                                    strokeDasharray="163"
                                    strokeDashoffset={163 - (163 * Math.min(simSpeed, 120)) / 120}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-xs font-mono font-black text-slate-100">{simSpeed}</span>
                                  <span className="text-[6.5px] font-mono uppercase text-slate-400 leading-none">mph</span>
                                </div>
                              </div>
                            </div>

                            {/* Network Ping Sparks widget */}
                            <div className="bg-[#181a22] border border-[#282d3b] rounded-xl p-2.5 flex flex-col justify-between">
                              <div className="flex justify-between items-start">
                                <span className="text-[7.5px] font-mono uppercase text-slate-400 tracking-wider block">Starlink Ping</span>
                                <span className="text-[8px] font-mono text-emerald-400 font-bold flex items-center gap-0.5">
                                  <Wifi size={9} />
                                  100%
                                </span>
                              </div>
                              <div className="flex items-end justify-between mt-1">
                                <span className="text-xs font-mono font-black text-slate-200">
                                  {networkPing}ms
                                </span>
                                {/* Animated SVG Sparkline */}
                                <svg className="h-5 w-12 text-amber-400/80" viewBox="0 0 50 20">
                                  <polyline
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    points={`0,${14 - (networkPing % 4)} 10,${12 - ((networkPing + 2) % 6)} 20,${16 - ((networkPing - 1) % 5)} 30,${9 - ((networkPing + 3) % 7)} 40,${14 - (networkPing % 4)} 50,${11 - ((networkPing + 1) % 5)}`}
                                  />
                                </svg>
                              </div>
                              <span className="text-[7px] font-mono text-slate-500 leading-none block pt-1 border-t border-[#282d3b]">
                                SAT ID: SL-7389-X
                              </span>
                            </div>
                          </div>

                          {/* Grid status details */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-[#181a22] border border-[#282d3b] rounded-xl p-2">
                              <span className="text-[7.5px] font-mono uppercase text-slate-400 tracking-wider block">GPS Constellation</span>
                              <span className="text-[10px] font-mono font-bold text-slate-300 flex items-center gap-1 pt-0.5">
                                <Satellite size={10} className="text-emerald-400" />
                                3D-Fix (11 Active)
                              </span>
                            </div>
                            <div className="bg-[#181a22] border border-[#282d3b] rounded-xl p-2">
                              <span className="text-[7.5px] font-mono uppercase text-slate-400 tracking-wider block">Heading vector</span>
                              <span className="text-[10px] font-mono font-bold text-slate-300 flex items-center gap-1 pt-0.5">
                                <Shield size={10} className="text-amber-400" />
                                {simHeading}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {telemetryTab === 'sensors' && (
                        <motion.div
                          key="sensors"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="space-y-3"
                        >
                          {/* Cold Chain Monitor & Accel Grid */}
                          <div className="grid grid-cols-2 gap-2.5">
                            {/* Cold Chain Temp progress circle */}
                            <div className="bg-[#181a22] border border-[#282d3b] rounded-xl p-2.5 flex flex-col items-center justify-center">
                              <span className="text-[7.5px] font-mono uppercase text-slate-400 tracking-wider mb-1 block">Cold Chain Temp</span>
                              <div className="relative w-16 h-16 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                  <circle
                                    cx="32"
                                    cy="32"
                                    r="26"
                                    className="stroke-[#282d3b] fill-none"
                                    strokeWidth="4.5"
                                  />
                                  <circle
                                    cx="32"
                                    cy="32"
                                    r="26"
                                    className="stroke-emerald-400 fill-none transition-all duration-300"
                                    strokeWidth="4.5"
                                    strokeDasharray="163"
                                    strokeDashoffset={163 - (163 * Math.max(0, 10 - cargoTemp)) / 10}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-xs font-mono font-black text-slate-100">{cargoTemp}°C</span>
                                  <span className="text-[6px] font-mono uppercase text-emerald-400 leading-none">STABLE</span>
                                </div>
                              </div>
                            </div>

                            {/* G-Force X-Y Coordinate Radar Target Grid */}
                            <div className="bg-[#181a22] border border-[#282d3b] rounded-xl p-2 flex flex-col items-center justify-between">
                              <span className="text-[7.5px] font-mono uppercase text-slate-400 tracking-wider block">G-Force Vector</span>
                              
                              <div className="relative w-12 h-12 border border-[#282d3b] rounded-full flex items-center justify-center mt-1">
                                {/* Crosshairs */}
                                <div className="absolute inset-x-0 h-[0.5px] bg-[#282d3b]"></div>
                                <div className="absolute inset-y-0 w-[0.5px] bg-[#282d3b]"></div>
                                <div className="absolute w-6 h-6 border border-[#282d3b] rounded-full"></div>
                                
                                {/* Dynamic Amber Dot indicating current G-Forces */}
                                <div 
                                  className="absolute w-2 h-2 rounded-full bg-amber-400 shadow-md shadow-amber-400/50 transition-all duration-300"
                                  style={{
                                    left: `calc(50% - 4px + ${gForceX * 25}px)`,
                                    top: `calc(50% - 4px - ${gForceY * 25}px)`
                                  }}
                                />
                              </div>
                              
                              <div className="flex gap-2 text-[7px] font-mono text-slate-400 mt-1">
                                <span>X: {gForceX >= 0 ? '+' : ''}{gForceX.toFixed(2)}G</span>
                                <span>Y: {gForceY >= 0 ? '+' : ''}{gForceY.toFixed(2)}G</span>
                              </div>
                            </div>
                          </div>

                          {/* Sensors Details summary */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-[#181a22] border border-[#282d3b] rounded-xl p-2">
                              <span className="text-[7.5px] font-mono uppercase text-slate-400 tracking-wider block">Altitude SLA</span>
                              <span className="text-[10px] font-mono font-bold text-slate-300 flex items-center gap-1 pt-0.5">
                                <Cpu size={10} className="text-amber-400" />
                                {altitude} meters ASL
                              </span>
                            </div>
                            <div className="bg-[#181a22] border border-[#282d3b] rounded-xl p-2">
                              <span className="text-[7.5px] font-mono uppercase text-slate-400 tracking-wider block">Diagnostics Link</span>
                              <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1 pt-0.5">
                                <ShieldCheck size={10} />
                                OBD-II: NOMINAL
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {telemetryTab === 'weather' && (
                        <motion.div
                          key="weather"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="space-y-2"
                        >
                          <div className="bg-[#181a22] border border-[#282d3b] rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between border-b border-[#282d3b] pb-1.5">
                              <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Wind size={10} className="text-amber-400" />
                                Location Meteorology
                              </span>
                              <span className="text-[8.5px] font-mono text-slate-200">
                                Lat: {(simulatedCoords || shipment.currentCoords || shipment.pickupCoords).lat.toFixed(3)}°
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-0.5">
                              <div className="space-y-0.5">
                                <span className="text-[7.5px] font-mono uppercase text-slate-400 block">Ambient Air Temp</span>
                                <span className="text-xs font-mono font-bold text-slate-200 block flex items-center gap-1">
                                  <Thermometer size={11} className="text-rose-400" />
                                  {(cargoTemp * 4 + 4.5).toFixed(1)}°C / 62.4°F
                                </span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[7.5px] font-mono uppercase text-slate-400 block">Wind Vector</span>
                                <span className="text-xs font-mono font-bold text-slate-200 block flex items-center gap-1">
                                  <Wind size={11} className="text-amber-400" />
                                  NNE 14 km/h
                                </span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[7.5px] font-mono uppercase text-slate-400 block">Relative Humidity</span>
                                <span className="text-xs font-mono font-bold text-slate-200 block">
                                  58% (Relative)
                                </span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[7.5px] font-mono uppercase text-slate-400 block">Visibility Margin</span>
                                <span className="text-xs font-mono font-bold text-emerald-400 block">
                                  10.0 mi (Clear)
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Telemetry Progress Bar inside Panel */}
                    <div className="space-y-1 pt-1.5 border-t border-[#282d3b]">
                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                        <span>Route Journey Completion</span>
                        <span className="font-bold text-amber-400">{Math.round(simProgress * 100)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#181a22] border border-[#282d3b] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${simProgress * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[7px] font-mono text-slate-400 pt-0.5">
                        <span>PICKUP: {simProgress > 0.05 ? "DEPARTED" : "INIT"}</span>
                        <span>DIST: {simDistance ? `${simDistance.toFixed(1)} km` : "N/A"} REMAINING</span>
                      </div>
                    </div>
                  </div>

                  {/* Live Dispatch terminal output */}
                  <div className="space-y-1.5 flex-1 flex flex-col min-h-[140px] justify-end pt-2 border-t border-[#282d3b]">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Terminal size={10} className="text-emerald-400" />
                        Logify receiver stream
                      </span>
                      {/* Terminal mode toggle switches */}
                      <div className="flex bg-[#181a22] border border-[#282d3b] rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => setTerminalMode('human')}
                          className={`text-[7.5px] font-mono uppercase px-1 py-0.5 rounded transition-all cursor-pointer ${
                            terminalMode === 'human' ? 'bg-[#282d3b] text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Human
                        </button>
                        <button
                          type="button"
                          onClick={() => setTerminalMode('nmea')}
                          className={`text-[7.5px] font-mono uppercase px-1 py-0.5 rounded transition-all cursor-pointer ${
                            terminalMode === 'nmea' ? 'bg-[#282d3b] text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          NMEA
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#12141a] border border-[#282d3b] p-2.5 rounded-xl text-[9px] font-mono text-emerald-400/90 h-32 overflow-y-auto space-y-1 custom-scrollbar scroll-smooth">
                      {terminalMode === 'human' ? (
                        simLogs.slice(-7).map((log, index) => (
                          <div key={index} className="leading-snug break-all">{log}</div>
                        ))
                      ) : (
                        nmeaLogs.slice(-7).map((log, index) => (
                          <div key={index} className="leading-snug break-all text-cyan-400/90">{log}</div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

            {/* Address cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-[#2b303e] rounded-2xl p-4 space-y-1 bg-[#181a22] shadow-sm">
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wide">Pickup Point</span>
                <p className="text-xs font-bold text-slate-100">{shipment.senderName}</p>
                <p className="text-[11px] text-slate-400">{shipment.pickupAddress}</p>
              </div>

              <div className="border border-[#2b303e] rounded-2xl p-4 space-y-1 bg-[#181a22] shadow-sm">
                <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wide">Delivery Destination</span>
                <p className="text-xs font-bold text-slate-100">{shipment.receiverName}</p>
                <p className="text-[11px] text-slate-400">{shipment.deliveryAddress}</p>
              </div>
            </div>
          </div>

          {/* Industrial Shipping Tag Mockup & SMS Subscription Sidebar (1/3 col) */}
          <div className="space-y-6">
            
            {/* 1. HIGH-FIDELITY THERMAL SHIPPING TAG MOCKUP */}
            {settings?.trackerShowThermalTag !== false && (
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono">Thermal Shipping Tag Mockup</h3>
                <div className="bg-[#FAF9F6] border-2 border-dashed border-slate-300 rounded-2xl p-5 text-slate-900 shadow-sm relative overflow-hidden font-mono text-[10px]">
                  {/* Visual Label punch-hole */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#121418] border border-slate-300 pointer-events-none" />
                  
                  <div className="pt-4 border-b border-slate-400 pb-2 flex justify-between items-end">
                    <span className="font-sans font-black text-amber-600 text-sm tracking-tighter">LOGIFY EXPRESS®</span>
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
                      <span className="font-bold text-xs uppercase text-amber-600 truncate block px-0.5">{shipment.type}</span>
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
            )}

            {/* 2. SLA DYNAMIC SMS NOTIFICATIONS SIGNUP CARD */}
            {settings?.trackerShowSmsAlerts !== false && (
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono">Real-Time Alerts Dispatch</h3>
                <div className="bg-[#181a22] border border-[#2b303e] rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                      <Bell size={18} className="animate-swing" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white font-sans">SLA SMS Notifications</h4>
                      <p className="text-xs text-slate-400 leading-relaxed pt-0.5">
                        Get instantaneous updates on transit exceptions, route diversions, or ETA delays sent to your mobile.
                      </p>
                    </div>
                  </div>

                  {smsSubscribed ? (
                    <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-3 text-center space-y-1">
                      <span className="text-emerald-400 font-bold text-xs block">✓ Alerts Activated</span>
                      <p className="text-[10px] text-slate-400">
                        Real-time SMS stream registered for <span className="font-bold text-slate-200">{smsNumber}</span>
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
                          className="flex-1 bg-[#12141a] border border-[#282d3b] rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500 transition-all text-slate-100 font-mono placeholder-slate-500"
                        />
                        <button
                          type="submit"
                          disabled={smsLoading}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer"
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
            )}

            {/* 3. EMAIL STATUS UPDATES SIGNUP CARD WITH TOGGLE */}
            {settings?.trackerShowEmailAlerts !== false && (
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono">Automated Email Registry</h3>
                <div className="bg-[#181a22] border border-[#2b303e] rounded-2xl p-5 shadow-sm space-y-4">
                  
                  {/* Header and Toggle Switch Row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                        <Mail size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white font-sans">Subscribe to Updates</h4>
                        <p className="text-[11px] text-slate-400 leading-normal pt-0.5">
                          Register for automated email notifications on status changes.
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch Button */}
                    <button
                      type="button"
                      onClick={() => setIsEmailToggled(!isEmailToggled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEmailToggled ? 'bg-amber-500' : 'bg-[#282d3b]'
                      }`}
                      aria-pressed={isEmailToggled}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                          isEmailToggled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Expanded/Toggled Form Panel */}
                  <AnimatePresence initial={false}>
                    {isEmailToggled && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 border-t border-[#2b303e] space-y-3">
                          {isEmailSubscribed ? (
                            <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-3 text-center space-y-1">
                              <span className="text-emerald-400 font-bold text-xs block">✓ Subscribed to Updates</span>
                              <p className="text-[10px] text-slate-400">
                                Registered: <span className="font-bold text-slate-200">{emailValue}</span>
                              </p>
                              {emailMessage && (
                                <p className="text-[9px] text-emerald-400 italic pt-1">{emailMessage}</p>
                              )}
                            </div>
                          ) : (
                            <form onSubmit={handleEmailSubscribe} className="space-y-2">
                              <div className="flex gap-2">
                                <input
                                  type="email"
                                  required
                                  placeholder="your.email@example.com"
                                  value={emailValue}
                                  onChange={(e) => setEmailValue(e.target.value)}
                                  className="flex-1 bg-[#12141a] border border-[#282d3b] rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500 transition-all text-slate-100 font-sans placeholder-slate-500"
                                />
                                <button
                                  type="submit"
                                  disabled={emailLoading}
                                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer"
                                >
                                  {emailLoading ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <>Register</>
                                  )}
                                </button>
                              </div>
                              
                              {emailMessage && (
                                <div className={`p-2 rounded-lg text-[10px] font-medium ${
                                  emailStatusType === 'success' ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/40' :
                                  emailStatusType === 'info' ? 'bg-amber-950/20 text-amber-400 border border-amber-900/40' :
                                  'bg-rose-950/20 text-rose-400 border border-rose-900/40'
                                }`}>
                                  {emailMessage}
                                </div>
                              )}

                              <span className="text-[8px] text-slate-400 font-mono block">
                                By registering, you agree to receive automated notifications triggered upon state change API calls.
                              </span>
                            </form>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* Share Modal */}
      {showShareModal && shipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-[#181a22] border border-[#2b303e] w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#2b303e]">
              <div className="flex items-center gap-2">
                <Share2 size={16} className="text-amber-400" />
                <h3 className="text-sm font-bold text-white font-sans uppercase tracking-wide">Share Tracking Portal</h3>
              </div>
              <button 
                onClick={() => {
                  setShowShareModal(false);
                  setShareNotification(null);
                }}
                className="text-slate-400 hover:text-slate-200 transition-colors text-lg font-mono font-bold px-1.5"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
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
                    className="flex-1 bg-[#12141a] border border-[#282d3b] rounded-xl px-3 py-2 text-xs font-mono text-slate-300 outline-none select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                      copied 
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10' 
                        : 'bg-[#20232e] hover:bg-[#282d3b] text-slate-200'
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
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-[#2b303e] bg-[#12141a] hover:bg-[#20232e] transition-all text-xs text-slate-300 font-medium"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    Share to Slack
                  </button>
                  <button
                    onClick={() => handleMockShare('Teams')}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-[#2b303e] bg-[#12141a] hover:bg-[#20232e] transition-all text-xs text-slate-300 font-medium"
                  >
                    <span className="w-2 h-2 rounded-full bg-violet-500" />
                    Share to MS Teams
                  </button>
                  <button
                    onClick={() => handleMockShare('X / Twitter')}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-[#2b303e] bg-[#12141a] hover:bg-[#20232e] transition-all text-xs text-slate-300 font-medium"
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    Share on X
                  </button>
                  <button
                    onClick={() => handleMockShare('Corporate Email')}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-[#2b303e] bg-[#12141a] hover:bg-[#20232e] transition-all text-xs text-slate-300 font-medium"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Send via Email
                  </button>
                </div>
              </div>

              {/* Dynamic Notification Message inside Modal */}
              {shareNotification && (
                <div className="bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 p-3 rounded-xl text-xs font-medium text-center animate-in fade-in slide-in-from-bottom-2 duration-200">
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
                className="px-4 py-2 bg-[#20232e] hover:bg-[#282d3b] text-slate-200 text-xs font-semibold rounded-xl transition-all"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera QR Scanner Overlay */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(decodedText) => {
          setIsScannerOpen(false);
          const sanitizedText = decodedText.trim();
          setTrackId(sanitizedText);
          fetchTrackingData(sanitizedText);
        }}
      />
    </div>
  </div>
  );
}
