import React, { useState } from 'react';
import { Truck, PlusCircle, Trash2, MapPin, CheckCircle, ShieldAlert, Navigation, Loader2, Phone } from 'lucide-react';
import { Driver } from '../types.js';
import InteractiveMap from './InteractiveMap.tsx';

interface AdminAgentsViewProps {
  drivers: Driver[];
  token: string;
  onRefresh: () => void;
}

export default function AdminAgentsView({
  drivers,
  token,
  onRefresh,
}: AdminAgentsViewProps) {
  // Add driver form
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverVehicle, setNewDriverVehicle] = useState<'Truck' | 'Van' | 'Motorcycle' | 'Drones'>('Van');
  const [newDriverPlate, setNewDriverPlate] = useState('');
  
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Focus map driver coordinate projection
  const [focusedDriver, setFocusedDriver] = useState<Driver | null>(null);

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    setFormSuccess(false);

    try {
      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newDriverName,
          phone: newDriverPhone,
          vehicleType: newDriverVehicle,
          vehiclePlate: newDriverPlate,
        }),
      });

      if (!response.ok) {
        throw new Error('Onboarding failed. Please review values.');
      }

      setNewDriverName('');
      setNewDriverPhone('');
      setNewDriverPlate('');
      setFormSuccess(true);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Error occurred during onboarding.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDriver = async (id: string) => {
    if (!confirm('Are you sure you want to remove this driver from the fleet?')) return;
    try {
      const response = await fetch(`/api/drivers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        if (focusedDriver?.id === id) {
          setFocusedDriver(null);
        }
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {focusedDriver && (
        <div className="space-y-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase font-mono text-slate-400 flex items-center gap-1">
              <Navigation className="text-blue-500 animate-pulse" size={12} /> Live Agent Satellite Projection
            </span>
            <button 
              onClick={() => setFocusedDriver(null)}
              className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
            >
              Close Projection
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-2 bg-slate-50 dark:bg-slate-800/10 rounded-xl">
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-400 font-mono">Agent Name:</span>
              <p className="text-xs font-bold text-slate-800 dark:text-white">{focusedDriver.name}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-400 font-mono">Plate ID:</span>
              <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">{focusedDriver.vehiclePlate}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-400 font-mono">Current Coordinates:</span>
              <p className="text-xs font-mono font-semibold text-slate-600">Lat: {focusedDriver.currentCoords.lat.toFixed(4)}, Lng: {focusedDriver.currentCoords.lng.toFixed(4)}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-400 font-mono">Telemetry status:</span>
              <p className="text-xs font-bold text-emerald-500">{focusedDriver.status}</p>
            </div>
          </div>
          <div className="h-[250px] rounded-xl overflow-hidden relative border border-slate-100 dark:border-slate-800">
            <InteractiveMap
              pickupCoords={focusedDriver.currentCoords}
              deliveryCoords={focusedDriver.currentCoords}
              currentCoords={focusedDriver.currentCoords}
              status={focusedDriver.status}
              driverName={focusedDriver.name}
            />
          </div>
        </div>
      )}

      {/* Main content grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Roster list (2/3 width) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400">Registered Couriers</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="p-4">Name</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Vehicle Specs</th>
                  <th className="p-4">Plate ID</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50">
                    <td className="p-4">
                      <div className="font-bold text-slate-850 dark:text-white">{d.name}</div>
                      <span className="text-[9px] text-slate-400 font-mono">Agent ID: {d.id}</span>
                    </td>
                    <td className="p-4 font-mono font-medium">{d.phone}</td>
                    <td className="p-4">{d.vehicleType}</td>
                    <td className="p-4 font-mono font-bold text-slate-500">{d.vehiclePlate}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        d.status === 'Available'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-1.5 pt-5">
                      <button
                        onClick={() => {
                          setFocusedDriver(null);
                          setTimeout(() => setFocusedDriver(d), 50);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-[10px]"
                      >
                        Project Map
                      </button>
                      <button
                        onClick={() => handleDeleteDriver(d.id)}
                        className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 transition-all"
                        title="Delete Driver"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
                {drivers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 italic">No fleet drivers registered yet. Onboard one on the right.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Onboarding form card (1/3 width) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 h-fit">
          <div className="border-b border-slate-50 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400">Onboard New Courier</h3>
          </div>

          {formSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 text-[11px] rounded-xl font-bold flex items-center gap-1.5 animate-pulse">
              <CheckCircle size={13} className="text-emerald-500" />
              Courier successfully onboarded!
            </div>
          )}

          {formError && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-100 text-[11px] rounded-xl font-medium">
              {formError}
            </div>
          )}

          <form onSubmit={handleAddDriver} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase font-mono">Courier Name *</label>
              <input
                type="text"
                required
                value={newDriverName}
                onChange={(e) => setNewDriverName(e.target.value)}
                placeholder="e.g. Robert Kowalski"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase font-mono">Mobile Number *</label>
              <input
                type="text"
                required
                value={newDriverPhone}
                onChange={(e) => setNewDriverPhone(e.target.value)}
                placeholder="e.g. +1 555-2015"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-950 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase font-mono">Vehicle Segment</label>
                <select
                  value={newDriverVehicle}
                  onChange={(e: any) => setNewDriverVehicle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-950 dark:text-white font-medium"
                >
                  <option value="Van">Van</option>
                  <option value="Truck">Truck</option>
                  <option value="Motorcycle">Motorcycle</option>
                  <option value="Drones">Drones</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase font-mono">License Plate *</label>
                <input
                  type="text"
                  required
                  value={newDriverPlate}
                  onChange={(e) => setNewDriverPlate(e.target.value)}
                  placeholder="e.g. LOG-391B"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-950 dark:text-white font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl mt-4 flex items-center justify-center gap-1 transition-all shadow-lg shadow-blue-600/15"
            >
              {loading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <PlusCircle size={13} />
              )}
              Complete Courier Onboarding
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
