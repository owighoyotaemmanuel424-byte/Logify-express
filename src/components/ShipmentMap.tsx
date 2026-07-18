import React, { useState, useMemo } from 'react';
import { Shipment, Driver } from '../types.js';
import { MapPin, Truck, Navigation, Activity, Eye, Filter, Clock, Info, Shield, Compass } from 'lucide-react';

interface ShipmentMapProps {
  shipments: Shipment[];
  drivers: Driver[];
}

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

export default function ShipmentMap({ shipments, drivers }: ShipmentMapProps) {
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All Active');

  // Filter only active shipments (not Delivered, not Cancelled by default)
  const activeShipments = useMemo(() => {
    return shipments.filter((s) => {
      const isActive = s.status !== 'Delivered' && s.status !== 'Cancelled';
      if (statusFilter === 'All Active') return isActive;
      if (statusFilter === 'All') return true;
      return s.status === statusFilter;
    });
  }, [shipments, statusFilter]);

  // Find the selected shipment details
  const selectedShipment = useMemo(() => {
    if (!selectedShipmentId) return null;
    return shipments.find((s) => s.id === selectedShipmentId) || null;
  }, [shipments, selectedShipmentId]);

  // Find assigned driver for selected shipment
  const selectedDriver = useMemo(() => {
    if (!selectedShipment || !selectedShipment.assignedDriverId) return null;
    return drivers.find((d) => d.id === selectedShipment.assignedDriverId) || null;
  }, [drivers, selectedShipment]);

  // Project lat/lng coordinate onto SVG 0-100% boundary
  const projectCoords = (coords?: { lat: number; lng: number }) => {
    if (!coords) return { x: 50, y: 50 };
    const minLat = 24;
    const maxLat = 50;
    const minLng = -125;
    const maxLng = -66;

    const x = ((coords.lng - minLng) / (maxLng - minLng)) * 100;
    const y = (1 - (coords.lat - minLat) / (maxLat - minLat)) * 100;

    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
    };
  };

  // Helper to calculate progress percentage along the line
  const calculateProgress = (s: Shipment) => {
    if (s.status === 'Delivered') return 100;
    if (s.status === 'Pending') return 0;
    
    // Estimate based on current vs pickup vs delivery distances
    const totalDist = Math.hypot(s.deliveryCoords.lat - s.pickupCoords.lat, s.deliveryCoords.lng - s.pickupCoords.lng);
    if (totalDist === 0) return 50;
    const coveredDist = Math.hypot(s.currentCoords.lat - s.pickupCoords.lat, s.currentCoords.lng - s.pickupCoords.lng);
    const percentage = Math.min(95, Math.round((coveredDist / totalDist) * 100));
    return percentage;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* Shipment sidebar control panel */}
      <div className="xl:col-span-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden h-[580px]">
        {/* Header and Filter */}
        <div className="p-4 border-b border-slate-50 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
              <Activity size={14} className="text-blue-600 animate-pulse" /> Active Telemetry
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-bold">
              {activeShipments.length} found
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <Filter size={11} className="text-slate-400 ml-1" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none w-full cursor-pointer"
            >
              <option value="All Active">Active Shipments</option>
              <option value="In Transit">In Transit Only</option>
              <option value="Picked Up">Picked Up Only</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Pending">Pending Only</option>
              <option value="All">All Waybills</option>
            </select>
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50">
          {activeShipments.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Clock size={20} className="text-slate-300 mx-auto" />
              <p className="text-[11px] text-slate-400 font-medium">No shipments match filters</p>
            </div>
          ) : (
            activeShipments.map((s) => {
              const isSelected = s.id === selectedShipmentId;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedShipmentId(isSelected ? null : s.id)}
                  className={`w-full text-left p-3.5 transition-all flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/20 border-l-4 border-blue-600'
                      : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono font-bold text-[11px] text-slate-900 dark:text-white">
                      {s.id}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
                        s.status === 'In Transit'
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                          : s.status === 'Pending'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                          : s.status === 'Delivered'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 space-y-0.5">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="truncate">{s.pickupAddress.split(',')[0]}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span className="truncate">{s.deliveryAddress.split(',')[0]}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mt-1 border-t border-slate-100 dark:border-slate-800/30 pt-1.5">
                    <span>{s.type}</span>
                    <span>{s.weight} kg</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main interactive map canvas */}
      <div className="xl:col-span-3 flex flex-col gap-6">
        <div className="relative w-full h-[380px] bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden shadow-lg flex flex-col">
          {/* Live Overlay Header */}
          <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2.5 text-[11px] font-mono text-slate-200 flex items-center gap-2.5 shadow-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>WAYBILL ROUTE TELEMETRY GRID</span>
            {selectedShipment && (
              <span className="text-blue-400 font-bold border-l border-slate-800 pl-2.5 ml-1">
                FOCUSED: {selectedShipment.id}
              </span>
            )}
          </div>

          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
              onClick={() => setSelectedShipmentId(null)}
              className="bg-slate-900/95 hover:bg-slate-800 backdrop-blur-sm text-white border border-slate-800 text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-md transition-all"
            >
              Reset Focus
            </button>
          </div>

          {/* Map canvas */}
          <div className="flex-1 relative bg-slate-950 select-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Topological Coordinate Grid */}
              <defs>
                <pattern id="mapGrid" width="8" height="8" patternUnits="userSpaceOnUse">
                  <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(51, 65, 85, 0.15)" strokeWidth="0.3" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#mapGrid)" />

              {/* Inactive shipment pathways background */}
              {shipments
                .filter((s) => s.id !== selectedShipmentId && s.status !== 'Delivered' && s.status !== 'Cancelled')
                .map((s) => {
                  const pick = projectCoords(s.pickupCoords);
                  const dest = projectCoords(s.deliveryCoords);
                  return (
                    <g key={`path-${s.id}`} opacity="0.25">
                      <line
                        x1={pick.x}
                        y1={pick.y}
                        x2={dest.x}
                        y2={dest.y}
                        stroke="#64748b"
                        strokeWidth="0.5"
                        strokeDasharray="1,2"
                      />
                      <circle cx={pick.x} cy={pick.y} r="0.8" fill="#10b981" />
                      <circle cx={dest.x} cy={dest.y} r="0.8" fill="#f43f5e" />
                    </g>
                  );
                })}

              {/* Connective US Interstate Reference Paths */}
              <path
                d="M 12 15 Q 35 45 88 30 T 84 88 M 8 38 Q 35 45 50 75 T 84 88 M 12 55 Q 50 75 88 30"
                fill="none"
                stroke="rgba(148, 163, 184, 0.04)"
                strokeWidth="0.8"
              />

              {/* Reference City Points */}
              {REFERENCE_HUBS.map((hub) => (
                <g key={hub.name} transform={`translate(${hub.x}, ${hub.y})`}>
                  <circle r="0.7" fill="#475569" />
                  <text
                    x="2"
                    y="1"
                    fill="#334155"
                    fontSize="1.6"
                    fontFamily="monospace"
                    className="font-semibold select-none pointer-events-none"
                  >
                    {hub.name}
                  </text>
                </g>
              ))}

              {/* Focused Shipment Pathway */}
              {selectedShipment && (
                (() => {
                  const pick = projectCoords(selectedShipment.pickupCoords);
                  const dest = projectCoords(selectedShipment.deliveryCoords);
                  const curr = projectCoords(selectedShipment.currentCoords);
                  return (
                    <g className="transition-all duration-300">
                      {/* Outer pulse line */}
                      <line
                        x1={pick.x}
                        y1={pick.y}
                        x2={dest.x}
                        y2={dest.y}
                        stroke="rgba(37, 99, 235, 0.1)"
                        strokeWidth="4"
                      />
                      {/* Active Route Line */}
                      <line
                        x1={pick.x}
                        y1={pick.y}
                        x2={dest.x}
                        y2={dest.y}
                        stroke="#2563eb"
                        strokeWidth="1.2"
                        strokeDasharray="2,3"
                      />

                      {/* Origin Node */}
                      <g transform={`translate(${pick.x}, ${pick.y})`}>
                        <circle r="4.5" fill="rgba(16, 185, 129, 0.2)" className="animate-ping" />
                        <circle r="1.8" fill="#10b981" />
                      </g>

                      {/* Destination Node */}
                      <g transform={`translate(${dest.x}, ${dest.y})`}>
                        <circle r="4.5" fill="rgba(244, 63, 94, 0.2)" className="animate-ping" />
                        <circle r="1.8" fill="#f43f5e" />
                      </g>

                      {/* Current Cargo Node */}
                      {selectedShipment.status !== 'Delivered' && selectedShipment.status !== 'Cancelled' && (
                        <g transform={`translate(${curr.x}, ${curr.y})`}>
                          <circle r="5" fill="rgba(37, 99, 235, 0.3)" className="animate-pulse" />
                          <circle r="2.2" fill="#2563eb" />
                        </g>
                      )}
                    </g>
                  );
                })()
              )}

              {/* All Active Vehicles on the Map */}
              {activeShipments
                .filter((s) => s.id !== selectedShipmentId && s.status !== 'Delivered' && s.status !== 'Cancelled')
                .map((s) => {
                  const curr = projectCoords(s.currentCoords);
                  return (
                    <g
                      key={`vehicle-${s.id}`}
                      transform={`translate(${curr.x}, ${curr.y})`}
                      className="cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedShipmentId(s.id);
                      }}
                    >
                      <circle r="2.5" fill="rgba(56, 189, 248, 0.4)" className="hover:scale-150 transition-all" />
                      <circle r="1.2" fill="#38bdf8" />
                    </g>
                  );
                })}
            </svg>

            {/* Float Label Alerts on Map */}
            {selectedShipment && (
              (() => {
                const pick = projectCoords(selectedShipment.pickupCoords);
                const dest = projectCoords(selectedShipment.deliveryCoords);
                const curr = projectCoords(selectedShipment.currentCoords);
                return (
                  <>
                    <div
                      className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center pointer-events-none"
                      style={{ left: `${pick.x}%`, top: `${pick.y - 1.5}%` }}
                    >
                      <span className="bg-emerald-600 text-white font-mono font-bold text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider shadow-md">
                        ORIGIN
                      </span>
                    </div>

                    <div
                      className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center pointer-events-none"
                      style={{ left: `${dest.x}%`, top: `${dest.y - 1.5}%` }}
                    >
                      <span className="bg-rose-600 text-white font-mono font-bold text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider shadow-md">
                        DEST
                      </span>
                    </div>

                    {selectedShipment.status !== 'Delivered' && selectedShipment.status !== 'Cancelled' && (
                      <div
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 bg-blue-600 text-white font-mono font-bold text-[8px] px-2 py-1 rounded-md shadow-lg border border-blue-400 z-10"
                        style={{ left: `${curr.x}%`, top: `${curr.y}%` }}
                      >
                        <Truck size={10} className="animate-bounce" />
                        <span>CARGO ACTIVE</span>
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>

          {/* Map Footer Legend */}
          <div className="bg-slate-900 border-t border-slate-800 px-6 py-2.5 flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Origin
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Destination
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Selected Route
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" /> Cargo Satellite
              </span>
            </div>
            <div className="text-slate-500 font-mono">
              Projection: Lambert-Conformal CONUS
            </div>
          </div>
        </div>

        {/* Selected Shipment Detail Card */}
        {selectedShipment ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 transition-all">
            {/* Column 1: Core Shipment Details */}
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Waybill Telemetry</span>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Navigation size={14} className="text-blue-600" /> {selectedShipment.id}
                </h4>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                  <span className="text-slate-400 font-medium">Shipment Mode</span>
                  <span className="font-bold text-slate-800 dark:text-white">{selectedShipment.type}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                  <span className="text-slate-400 font-medium">Cargo Mass</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">{selectedShipment.weight} kg</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                  <span className="text-slate-400 font-medium">Waybill Valuation</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">${selectedShipment.price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Column 2: Origin & Destination addresses */}
            <div className="space-y-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Logistics Network Nodes</span>
              
              <div className="space-y-3">
                <div className="flex gap-2.5">
                  <div className="flex flex-col items-center">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" />
                    <span className="w-0.5 h-6 bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Pickup Hub</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-1">{selectedShipment.pickupAddress}</p>
                    <span className="text-[9px] text-slate-400 font-mono">Lat: {selectedShipment.pickupCoords.lat.toFixed(4)}, Lng: {selectedShipment.pickupCoords.lng.toFixed(4)}</span>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Delivery Destination</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-1">{selectedShipment.deliveryAddress}</p>
                    <span className="text-[9px] text-slate-400 font-mono">Lat: {selectedShipment.deliveryCoords.lat.toFixed(4)}, Lng: {selectedShipment.deliveryCoords.lng.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Driver & Progress tracking */}
            <div className="space-y-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Courier Dispatch Node</span>
              
              {selectedDriver ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {selectedDriver.name.charAt(0)}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 dark:text-white">{selectedDriver.name}</h5>
                      <p className="text-[10px] text-slate-400 font-mono">{selectedDriver.vehicleType} | {selectedDriver.vehiclePlate}</p>
                    </div>
                  </div>

                  {/* Progress along route */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-400">TRANSIT PROGRESS</span>
                      <span className="text-blue-600 font-bold">{calculateProgress(selectedShipment)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${calculateProgress(selectedShipment)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-xl flex items-center gap-2 text-slate-400 text-xs">
                  <Info size={14} />
                  <span>No courier assigned to this waybill yet.</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400 font-medium">
            Select a dispatch waybill from the sidebar telemetry tracker to project details, route lines, courier tracking vectors, and progress calculations.
          </div>
        )}
      </div>
    </div>
  );
}
