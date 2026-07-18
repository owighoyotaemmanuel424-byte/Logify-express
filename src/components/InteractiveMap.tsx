import React, { useMemo } from 'react';
import { Coordinates } from '../types.js';
import { MapPin, Truck, ShieldAlert } from 'lucide-react';

interface InteractiveMapProps {
  pickupCoords?: Coordinates;
  deliveryCoords?: Coordinates;
  currentCoords?: Coordinates;
  status?: string;
  driverName?: string;
}

// Major logistics hubs to render as reference points on our map
const REFERENCE_HUBS = [
  { name: 'Seattle', lat: 47.6062, lng: -122.3321, x: 12, y: 15 },
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194, x: 8, y: 38 },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, x: 12, y: 55 },
  { name: 'Denver', lat: 39.7392, lng: -104.9903, x: 35, y: 45 },
  { name: 'Dallas', lat: 32.7767, lng: -96.797, x: 50, y: 75 },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298, x: 68, y: 35 },
  { name: 'New York', lat: 40.7128, lng: -74.006, x: 88, y: 30 },
  { name: 'Miami', lat: 25.7617, lng: -80.1918, x: 84, y: 88 },
];

export default function InteractiveMap({
  pickupCoords,
  deliveryCoords,
  currentCoords,
  status,
  driverName,
}: InteractiveMapProps) {
  
  // Project latitude/longitude coordinates to responsive SVG coordinates (0-100%)
  // US rough bounding box: Lat 24 to 50, Lng -125 to -66
  const projectCoords = (coords?: Coordinates) => {
    if (!coords) return { x: 50, y: 50 };
    const minLat = 24;
    const maxLat = 50;
    const minLng = -125;
    const maxLng = -66;

    // Linear mapping
    const x = ((coords.lng - minLng) / (maxLng - minLng)) * 100;
    const y = (1 - (coords.lat - minLat) / (maxLat - minLat)) * 100;

    // Constrain to map boundary
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
    };
  };

  const pickupPos = useMemo(() => projectCoords(pickupCoords), [pickupCoords]);
  const deliveryPos = useMemo(() => projectCoords(deliveryCoords), [deliveryCoords]);
  const currentPos = useMemo(() => projectCoords(currentCoords), [currentCoords]);

  return (
    <div className="relative w-full h-[320px] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-inner flex flex-col">
      {/* Map Header */}
      <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur border border-slate-700/50 rounded-lg px-3 py-1.5 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 shadow-md">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        LIVE LOGIFY SATELLITE DISPATCH
      </div>

      {status && (
        <div className="absolute top-3 right-3 z-10 bg-slate-900/90 backdrop-blur border border-slate-700/50 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white shadow-md">
          Status: <span className="text-amber-400 font-mono">{status}</span>
        </div>
      )}

      {/* SVG Map Canvas */}
      <div className="relative flex-1 w-full bg-slate-950/80">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Subtle Grid Lines */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(51, 65, 85, 0.15)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />

          {/* Connective Highway Routes (Topological background curves) */}
          <path
            d="M 12 15 Q 35 45 88 30 T 84 88 M 8 38 Q 35 45 50 75 T 84 88 M 12 55 Q 50 75 88 30"
            fill="none"
            stroke="rgba(71, 85, 105, 0.2)"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />

          {/* Reference Cities Hubs */}
          {REFERENCE_HUBS.map((hub) => (
            <g key={hub.name} transform={`translate(${hub.x}, ${hub.y})`}>
              <circle r="1" fill="#475569" opacity="0.6" />
              <text
                x="2"
                y="1"
                fill="#64748b"
                fontSize="1.8"
                fontFamily="monospace"
                className="select-none pointer-events-none font-medium"
              >
                {hub.name}
              </text>
            </g>
          ))}

          {/* Active shipment route */}
          {pickupCoords && deliveryCoords && (
            <>
              {/* Main Transit Line */}
              <line
                x1={pickupPos.x}
                y1={pickupPos.y}
                x2={deliveryPos.x}
                y2={deliveryPos.y}
                stroke="#38bdf8"
                strokeWidth="1.2"
                strokeDasharray="2,3"
                className="animate-[dash_10s_linear_infinite]"
              />
              <path
                d={`M ${pickupPos.x} ${pickupPos.y} L ${deliveryPos.x} ${deliveryPos.y}`}
                fill="none"
                stroke="rgba(56, 189, 248, 0.1)"
                strokeWidth="4"
              />

              {/* Pickup Pin */}
              <g transform={`translate(${pickupPos.x}, ${pickupPos.y})`}>
                <circle r="3" fill="rgba(16, 185, 129, 0.2)" className="animate-ping" />
                <circle r="1.5" fill="#10b981" />
              </g>

              {/* Delivery Pin */}
              <g transform={`translate(${deliveryPos.x}, ${deliveryPos.y})`}>
                <circle r="3.5" fill="rgba(244, 63, 94, 0.2)" className="animate-ping" />
                <circle r="1.8" fill="#f43f5e" />
              </g>
              
              {/* Current Transit Vehicle */}
              {currentCoords && status !== 'Delivered' && status !== 'Cancelled' && (
                <g transform={`translate(${currentPos.x}, ${currentPos.y})`}>
                  <circle r="4" fill="rgba(56, 189, 248, 0.3)" className="animate-pulse" />
                  <circle r="1.5" fill="#38bdf8" />
                </g>
              )}
            </>
          )}
        </svg>

        {/* Floating elements */}
        {pickupCoords && (
          <div
            className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center pointer-events-none"
            style={{ left: `${pickupPos.x}%`, top: `${pickupPos.y - 2}%` }}
          >
            <div className="bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.5 rounded text-[8px] leading-none uppercase shadow-md">
              Origin
            </div>
            <div className="w-1.5 h-1.5 bg-emerald-500 rotate-45 -mt-0.5" />
          </div>
        )}

        {deliveryCoords && (
          <div
            className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center pointer-events-none"
            style={{ left: `${deliveryPos.x}%`, top: `${deliveryPos.y - 2}%` }}
          >
            <div className="bg-rose-500 text-white font-bold px-1.5 py-0.5 rounded text-[8px] leading-none uppercase shadow-md flex items-center gap-0.5">
              <MapPin size={6} /> Dest
            </div>
            <div className="w-1.5 h-1.5 bg-rose-500 rotate-45 -mt-0.5" />
          </div>
        )}

        {currentCoords && status !== 'Delivered' && status !== 'Cancelled' && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-sky-500 text-slate-950 font-bold px-2 py-1 rounded-md text-[9px] shadow-lg border border-sky-400 z-10 transition-all duration-1000 ease-in-out"
            style={{ left: `${currentPos.x}%`, top: `${currentPos.y}%` }}
          >
            <Truck size={10} className="animate-bounce" />
            <span className="font-mono">EN ROUTE</span>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="bg-slate-950 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Origin
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Destination
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Active Cargo
          </span>
        </div>
        {driverName && (
          <div className="text-slate-500 italic">
            Assigned Courier: <span className="text-slate-300 font-medium font-mono">{driverName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
