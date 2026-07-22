import React, { useMemo, useState } from 'react';
import { Coordinates } from '../types.js';
import { MapPin, Truck, ShieldAlert, Compass, Navigation, ZoomIn, ZoomOut, RotateCcw, Layers, Info, CheckCircle2 } from 'lucide-react';

interface InteractiveMapProps {
  pickupCoords?: Coordinates;
  deliveryCoords?: Coordinates;
  currentCoords?: Coordinates;
  status?: string;
  driverName?: string;
  simProgress?: number;
  pickupAddress?: string;
  deliveryAddress?: string;
}

// Major logistics hubs to render as reference points on our map
const REFERENCE_HUBS = [
  { name: 'Seattle Hub', lat: 47.6062, lng: -122.3321, x: 12, y: 15 },
  { name: 'San Francisco Hub', lat: 37.7749, lng: -122.4194, x: 8, y: 38 },
  { name: 'Los Angeles Terminal', lat: 34.0522, lng: -118.2437, x: 12, y: 55 },
  { name: 'Denver Station', lat: 39.7392, lng: -104.9903, x: 35, y: 45 },
  { name: 'Dallas Logistics', lat: 32.7767, lng: -96.797, x: 50, y: 75 },
  { name: 'Chicago sorting', lat: 41.8781, lng: -87.6298, x: 68, y: 35 },
  { name: 'New York Depot', lat: 40.7128, lng: -74.006, x: 88, y: 30 },
  { name: 'Miami Gateway', lat: 25.7617, lng: -80.1918, x: 84, y: 88 },
];

export default function InteractiveMap({
  pickupCoords,
  deliveryCoords,
  currentCoords,
  status = 'In Transit',
  driverName,
  simProgress,
  pickupAddress = 'Origin Dispatch Terminal',
  deliveryAddress = 'Destination Facility',
}: InteractiveMapProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedWaypoint, setSelectedWaypoint] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showHubs, setShowHubs] = useState<boolean>(true);
  const [animSpeed, setAnimSpeed] = useState<number>(5); // duration in seconds for moving marker loop
  const [showMovingMarker, setShowMovingMarker] = useState<boolean>(true);
  const [showLegend, setShowLegend] = useState<boolean>(true);

  // Project latitude/longitude coordinates to responsive SVG coordinates (0-100%)
  const projectCoords = (coords?: Coordinates) => {
    if (!coords) return { x: 50, y: 50 };
    const minLat = 24;
    const maxLat = 50;
    const minLng = -125;
    const maxLng = -66;

    const x = ((coords.lng - minLng) / (maxLng - minLng)) * 100;
    const y = (1 - (coords.lat - minLat) / (maxLat - minLat)) * 100;

    return {
      x: Math.max(8, Math.min(92, x)),
      y: Math.max(8, Math.min(92, y)),
    };
  };

  const pickupPos = useMemo(() => projectCoords(pickupCoords), [pickupCoords]);
  const deliveryPos = useMemo(() => projectCoords(deliveryCoords), [deliveryCoords]);

  // Compute quadratic bezier control point for elegant curved delivery arc
  const controlPos = useMemo(() => {
    const midX = (pickupPos.x + deliveryPos.x) / 2;
    const midY = (pickupPos.y + deliveryPos.y) / 2;
    const dx = deliveryPos.x - pickupPos.x;
    const dy = deliveryPos.y - pickupPos.y;
    const dist = Math.hypot(dx, dy) || 1;
    const arcHeight = Math.min(22, Math.max(10, dist * 0.22));
    
    // Curved upwards or to side
    return {
      x: midX - (dy / dist) * arcHeight,
      y: midY + (dx / dist) * arcHeight,
    };
  }, [pickupPos, deliveryPos]);

  // Calculate position along Bezier curve given t (0..1)
  const getBezierPoint = (t: number) => {
    const oneMinusT = 1 - t;
    const x = oneMinusT * oneMinusT * pickupPos.x + 2 * oneMinusT * t * controlPos.x + t * t * deliveryPos.x;
    const y = oneMinusT * oneMinusT * pickupPos.y + 2 * oneMinusT * t * controlPos.y + t * t * deliveryPos.y;
    return { x, y };
  };

  // Determine current progress percentage along path (0 to 1)
  const currentProgress = useMemo(() => {
    if (simProgress !== undefined) return Math.min(1, Math.max(0, simProgress));
    if (status === 'Delivered') return 1;
    if (status === 'Pending' || status === 'Processing') return 0;
    if (!currentCoords || !pickupCoords || !deliveryCoords) return 0.5;

    const totalDist = Math.hypot(deliveryCoords.lat - pickupCoords.lat, deliveryCoords.lng - pickupCoords.lng);
    if (totalDist === 0) return 0.5;
    const coveredDist = Math.hypot(currentCoords.lat - pickupCoords.lat, currentCoords.lng - pickupCoords.lng);
    return Math.min(0.98, Math.max(0.02, coveredDist / totalDist));
  }, [simProgress, status, currentCoords, pickupCoords, deliveryCoords]);

  // Point on curve representing vehicle location
  const currentPos = useMemo(() => {
    return getBezierPoint(currentProgress);
  }, [currentProgress, pickupPos, controlPos, deliveryPos]);

  // Tangent heading angle (in degrees) along the Bezier curve at current vehicle location
  const currentHeading = useMemo(() => {
    const t = currentProgress;
    const oneMinusT = 1 - t;
    const dx = 2 * oneMinusT * (controlPos.x - pickupPos.x) + 2 * t * (deliveryPos.x - controlPos.x);
    const dy = 2 * oneMinusT * (controlPos.y - pickupPos.y) + 2 * t * (deliveryPos.y - controlPos.y);
    const angleRad = Math.atan2(dy, dx);
    return (angleRad * 180) / Math.PI;
  }, [currentProgress, pickupPos, controlPos, deliveryPos]);

  // Intermediate Waypoint Nodes along Bezier Curve
  const waypoints = useMemo(() => {
    const w1 = getBezierPoint(0.33);
    const w2 = getBezierPoint(0.66);
    return [
      { id: 'origin', name: 'Origin Dispatch', pos: pickupPos, detail: pickupAddress, status: currentProgress >= 0 ? 'Passed' : 'Pending' },
      { id: 'hub1', name: 'Central Transit Hub', pos: w1, detail: 'Sorting & Scanning Facility Alpha', status: currentProgress >= 0.33 ? 'Passed' : 'Upcoming' },
      { id: 'hub2', name: 'Regional Security Center', pos: w2, detail: 'Customs Clearance & Quality Scan', status: currentProgress >= 0.66 ? 'Passed' : 'Upcoming' },
      { id: 'dest', name: 'Final Destination', pos: deliveryPos, detail: deliveryAddress, status: currentProgress >= 1 ? 'Delivered' : 'En Route' },
    ];
  }, [pickupPos, deliveryPos, controlPos, currentProgress, pickupAddress, deliveryAddress]);

  // Sample points along Bezier curve to generate exact SVG sub-path strings
  const generateBezierSubPath = (startT: number, endT: number) => {
    const steps = 24;
    let pathStr = '';
    for (let i = 0; i <= steps; i++) {
      const t = startT + (endT - startT) * (i / steps);
      const pt = getBezierPoint(t);
      if (i === 0) pathStr += `M ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
      else pathStr += ` L ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
    }
    return pathStr;
  };

  const fullBezierPath = `M ${pickupPos.x.toFixed(2)} ${pickupPos.y.toFixed(2)} Q ${controlPos.x.toFixed(2)} ${controlPos.y.toFixed(2)} ${deliveryPos.x.toFixed(2)} ${deliveryPos.y.toFixed(2)}`;
  const completedSegmentPath = generateBezierSubPath(0, currentProgress);
  const remainingSegmentPath = generateBezierSubPath(currentProgress, 1);

  return (
    <div className="relative w-full h-[380px] bg-[#12141a] border border-[#282d3b] rounded-2xl overflow-hidden shadow-2xl flex flex-col font-sans select-none">
      {/* Top Controls & Status Bar */}
      <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
        {/* Left: Satellite Live Link Indicator */}
        <div className="pointer-events-auto bg-[#181a22]/90 backdrop-blur-md border border-[#282d3b] rounded-xl px-3 py-1.5 text-[10px] font-mono font-bold text-slate-200 flex items-center gap-2 shadow-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="uppercase tracking-wider text-amber-400 font-extrabold">SVG VECTOR ROUTE MATRIX</span>
        </div>

        {/* Right: Map View Controls (Zoom, Reset, Layers) */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-[#181a22]/90 backdrop-blur-md border border-[#282d3b] p-1 rounded-xl shadow-lg">
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 1.75))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-[#20232e] transition-all cursor-pointer"
            title="Zoom In Route View"
          >
            <ZoomIn size={13} />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.85))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-[#20232e] transition-all cursor-pointer"
            title="Zoom Out Route View"
          >
            <ZoomOut size={13} />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-[#20232e] transition-all cursor-pointer"
            title="Reset Map View"
          >
            <RotateCcw size={13} />
          </button>
          <div className="w-[1px] h-3 bg-[#282d3b] mx-0.5" />
          <button
            onClick={() => setShowMovingMarker(!showMovingMarker)}
            className={`p-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
              showMovingMarker ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Moving Route Marker Icon"
          >
            <Truck size={12} />
            ANIM
          </button>
          <button
            onClick={() => setAnimSpeed((s) => (s === 5 ? 2.5 : s === 2.5 ? 8 : 5))}
            className="p-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer text-amber-400 hover:bg-amber-500/10"
            title="Cycle Marker Animation Speed"
          >
            {animSpeed === 2.5 ? '2.5s (FAST)' : animSpeed === 5 ? '5s (NORM)' : '8s (SMOOTH)'}
          </button>
          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`p-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
              showLegend ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Descriptive Route Legend Panel"
          >
            <Info size={12} />
            LEGEND
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              showGrid ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Grid Overlay"
          >
            GRID
          </button>
          <button
            onClick={() => setShowHubs(!showHubs)}
            className={`p-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              showHubs ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Logistics Hub Markers"
          >
            HUBS
          </button>
        </div>
      </div>

      {/* Main Interactive Map Canvas */}
      <div className="relative flex-1 w-full bg-[#0d0e12] overflow-hidden flex items-center justify-center">
        <div 
          className="w-full h-full transition-transform duration-300 ease-out origin-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              {/* Background Grid Pattern */}
              <pattern id="vector-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(43, 48, 62, 0.4)" strokeWidth="0.3" />
                <circle cx="0" cy="0" r="0.4" fill="rgba(245, 158, 11, 0.15)" />
              </pattern>

              {/* Glowing gradients for vector route line */}
              <linearGradient id="routeGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.6" />
              </linearGradient>

              <linearGradient id="activePathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>

              {/* Pulsing ring filter */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Grid Pattern Background */}
            {showGrid && <rect width="100" height="100" fill="url(#vector-grid)" />}

            {/* National Topological Logistics Arcs */}
            <path
              d="M 12 15 Q 35 45 88 30 T 84 88 M 8 38 Q 35 45 50 75 T 84 88 M 12 55 Q 50 75 88 30"
              fill="none"
              stroke="rgba(40, 45, 59, 0.35)"
              strokeWidth="0.4"
              strokeDasharray="1.5,2.5"
            />

            {/* Major Logistics Reference Hubs */}
            {showHubs && REFERENCE_HUBS.map((hub) => (
              <g key={hub.name} transform={`translate(${hub.x}, ${hub.y})`}>
                <circle r="0.8" fill="#475569" opacity="0.6" />
                <text
                  x="1.8"
                  y="0.8"
                  fill="#64748b"
                  fontSize="1.6"
                  fontFamily="monospace"
                  className="select-none pointer-events-none font-medium"
                >
                  {hub.name}
                </text>
              </g>
            ))}

            {/* Active Delivery Route SVG Line Animations */}
            {pickupCoords && deliveryCoords && (
              <>
                {/* 1. Underlying Route Glow Halo */}
                <path
                  d={fullBezierPath}
                  fill="none"
                  stroke="url(#routeGlowGradient)"
                  strokeWidth="2.5"
                  opacity="0.2"
                  filter="url(#glow)"
                />

                {/* 2. Full Planned Route Dashed Line */}
                <path
                  d={fullBezierPath}
                  fill="none"
                  stroke="#282d3b"
                  strokeWidth="1.2"
                  strokeDasharray="2,2"
                />

                {/* 3. Remaining Uncompleted Route Segment (Animated Dash Motion) */}
                <path
                  d={remainingSegmentPath}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  strokeDasharray="2,3"
                  strokeOpacity="0.7"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    values="10;0"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </path>

                {/* 4. Completed Route Path Segment (Vibrant Solid Flow) */}
                <path
                  d={completedSegmentPath}
                  fill="none"
                  stroke="url(#activePathGradient)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />

                {/* 5. Continuous Moving Marker Icons along SVG Path */}
                {showMovingMarker && (
                  <>
                    {/* Primary Glowing Delivery Vehicle Marker continuously traversing the path */}
                    <g>
                      <animateMotion
                        path={fullBezierPath}
                        dur={`${animSpeed}s`}
                        repeatCount="indefinite"
                        rotate="auto"
                      />
                      {/* Outer Pulse Halo */}
                      <circle r="3.2" fill="rgba(245, 158, 11, 0.35)" filter="url(#glow)" />
                      {/* Core Marker Circle */}
                      <circle r="1.8" fill="#f59e0b" />
                      {/* Directional Delivery Marker Arrow */}
                      <path d="M -1.6 -1.2 L 2.2 0 L -1.6 1.2 L -0.8 0 Z" fill="#0d0e12" />
                    </g>

                    {/* Secondary Staggered Telemetry Pulse Marker */}
                    <g>
                      <animateMotion
                        path={fullBezierPath}
                        dur={`${animSpeed}s`}
                        begin={`-${animSpeed / 2}s`}
                        repeatCount="indefinite"
                        rotate="auto"
                      />
                      <circle r="2.5" fill="rgba(56, 189, 248, 0.4)" filter="url(#glow)" />
                      <circle r="1.3" fill="#38bdf8" />
                      <path d="M -1.2 -0.9 L 1.6 0 L -1.2 0.9 L -0.6 0 Z" fill="#ffffff" />
                    </g>
                  </>
                )}

                {/* 6. Intermediate Waypoint Nodes along the Path */}
                {waypoints.map((wp) => (
                  <g 
                    key={wp.id} 
                    transform={`translate(${wp.pos.x}, ${wp.pos.y})`}
                    onClick={() => setSelectedWaypoint(selectedWaypoint === wp.id ? null : wp.id)}
                    className="cursor-pointer group"
                  >
                    {wp.status === 'Passed' ? (
                      <>
                        <circle r="2.2" fill="rgba(16, 185, 129, 0.25)" />
                        <circle r="1.1" fill="#10b981" className="group-hover:scale-125 transition-transform" />
                      </>
                    ) : (
                      <>
                        <circle r="2" fill="rgba(245, 158, 11, 0.2)" />
                        <circle r="1" fill="#f59e0b" className="group-hover:scale-125 transition-transform" />
                      </>
                    )}
                  </g>
                ))}

                {/* 7. Pickup Origin Pulse Ring */}
                <g transform={`translate(${pickupPos.x}, ${pickupPos.y})`}>
                  <circle r="4" fill="rgba(16, 185, 129, 0.2)" className="animate-ping" />
                  <circle r="2" fill="#10b981" />
                  <circle r="0.8" fill="#ffffff" />
                </g>

                {/* 8. Destination Pulse Ring */}
                <g transform={`translate(${deliveryPos.x}, ${deliveryPos.y})`}>
                  <circle r="4.5" fill="rgba(244, 63, 94, 0.2)" className="animate-ping" />
                  <circle r="2.2" fill="#f43f5e" />
                  <circle r="0.9" fill="#ffffff" />
                </g>

                {/* 9. Live Courier Vehicle Marker (Rotated according to tangent heading) */}
                {status !== 'Delivered' && status !== 'Cancelled' && (
                  <g transform={`translate(${currentPos.x}, ${currentPos.y})`}>
                    <circle r="5" fill="rgba(245, 158, 11, 0.3)" className="animate-pulse" />
                    <circle r="2.5" fill="#f59e0b" />
                    <circle r="1" fill="#ffffff" />
                    {/* Rotated Heading Arrow */}
                    <g transform={`rotate(${currentHeading})`}>
                      <path d="M -2.2 -1.5 L 2.8 0 L -2.2 1.5 L -1.2 0 Z" fill="#ffffff" />
                    </g>
                  </g>
                )}
              </>
            )}
          </svg>

          {/* Floating UI Overlay Markers */}
          {pickupCoords && (
            <div
              className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center pointer-events-none transition-all duration-300"
              style={{ left: `${pickupPos.x}%`, top: `${pickupPos.y - 3}%` }}
            >
              <div className="bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-md text-[9px] tracking-wider uppercase shadow-lg font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" />
                ORIGIN
              </div>
              <div className="w-1.5 h-1.5 bg-emerald-500 rotate-45 -mt-0.5" />
            </div>
          )}

          {deliveryCoords && (
            <div
              className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center pointer-events-none transition-all duration-300"
              style={{ left: `${deliveryPos.x}%`, top: `${deliveryPos.y - 3}%` }}
            >
              <div className="bg-rose-500 text-white font-black px-2 py-0.5 rounded-md text-[9px] tracking-wider uppercase shadow-lg font-mono flex items-center gap-1">
                <MapPin size={8} /> DESTINATION
              </div>
              <div className="w-1.5 h-1.5 bg-rose-500 rotate-45 -mt-0.5" />
            </div>
          )}

          {/* Active Courier Vehicle Card Floating along SVG Bezier Path */}
          {status !== 'Delivered' && status !== 'Cancelled' && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 bg-[#181a22] border border-amber-500/60 text-slate-100 font-bold px-2.5 py-1.5 rounded-xl text-[10px] shadow-2xl z-20 transition-all duration-700 ease-out"
              style={{ left: `${currentPos.x}%`, top: `${currentPos.y}%` }}
            >
              <div className="p-1 rounded-lg bg-amber-500 text-slate-950 animate-bounce">
                <Truck size={12} />
              </div>
              <div className="flex flex-col font-mono text-[9px] leading-tight">
                <span className="text-amber-400 font-extrabold flex items-center gap-1">
                  EN ROUTE ({Math.round(currentProgress * 100)}%)
                </span>
                <span className="text-slate-400 text-[8px]">
                  {driverName || 'Logify Fleet Courier'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Descriptive Route Legend Overlay */}
      {showLegend && (
        <div className="absolute top-14 left-3 z-30 max-w-[280px] sm:max-w-xs bg-[#181a22]/95 backdrop-blur-md border border-[#282d3b] rounded-xl p-3 shadow-2xl space-y-2 animate-in fade-in slide-in-from-left-2 transition-all">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#282d3b]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 font-mono uppercase tracking-wider">
              <Info size={13} />
              Route Key & Legend
            </div>
            <button
              onClick={() => setShowLegend(false)}
              className="text-slate-400 hover:text-slate-200 transition-colors text-xs font-mono font-bold px-1 cursor-pointer"
            >
              &times;
            </button>
          </div>

          <div className="grid grid-cols-1 gap-1.5 text-[10px] font-sans text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-5 h-1 rounded bg-gradient-to-r from-emerald-500 to-amber-500 shrink-0" />
              <span><strong className="text-emerald-400 font-mono">Solid Line:</strong> Completed path traveled</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-5 h-0.5 border-b-2 border-dashed border-sky-400 shrink-0" />
              <span><strong className="text-sky-400 font-mono">Dashed Line:</strong> Upcoming path remaining</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500/50 text-amber-400 flex items-center justify-center text-[9px] shrink-0 font-mono">
                <Truck size={10} />
              </div>
              <span><strong className="text-amber-400 font-mono">Moving Courier:</strong> Continuous path animation</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30 shrink-0" />
              <span><strong className="text-emerald-400 font-mono">Origin Pin:</strong> Pickup dispatch location</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/30 shrink-0" />
              <span><strong className="text-rose-400 font-mono">Destination:</strong> Package drop-off target</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-400/20 shrink-0" />
              <span><strong className="text-amber-300 font-mono">Waypoints:</strong> Sorting hubs & inspection nodes</span>
            </div>
          </div>
        </div>
      )}

      {/* Waypoint Click Inspector Modal Banner */}
      {selectedWaypoint && (
        <div className="absolute bottom-12 inset-x-4 z-30 bg-[#181a22]/95 backdrop-blur-md border border-amber-500/40 rounded-xl p-3 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Navigation size={14} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white font-mono uppercase flex items-center gap-1.5">
                {waypoints.find((w) => w.id === selectedWaypoint)?.name}
                <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-bold ${
                  waypoints.find((w) => w.id === selectedWaypoint)?.status === 'Passed'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {waypoints.find((w) => w.id === selectedWaypoint)?.status}
                </span>
              </h4>
              <p className="text-[10px] text-slate-400 font-sans pt-0.5">
                {waypoints.find((w) => w.id === selectedWaypoint)?.detail}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedWaypoint(null)}
            className="text-slate-400 hover:text-white font-mono text-xs px-2 py-1 rounded bg-[#20232e]"
          >
            &times; Close
          </button>
        </div>
      )}

      {/* Bottom Telemetry HUD */}
      <div className="bg-[#181a22] border-t border-[#282d3b] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-200 font-bold">Origin Pickup</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-200 font-bold">SVG Vector Line</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-slate-200 font-bold">Destination Drop-off</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400">
            Path Progress: <strong className="text-amber-400">{Math.round(currentProgress * 100)}%</strong>
          </span>
          {driverName && (
            <span className="text-slate-400">
              Courier: <strong className="text-slate-200">{driverName}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

