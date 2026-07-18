import React, { useState } from 'react';
import { Package, Search, MapPin, Calendar, Clock, CheckCircle2, Circle, Truck, Sparkles, User, FileText, ArrowRight } from 'lucide-react';
import { Shipment, Driver } from '../types.js';

interface AdminTrackingViewProps {
  shipments: Shipment[];
  drivers: Driver[];
  initialTrackId?: string;
}

export default function AdminTrackingView({
  shipments,
  drivers,
  initialTrackId = '',
}: AdminTrackingViewProps) {
  const [trackQuery, setTrackQuery] = useState<string>(initialTrackId);
  const [activeShipment, setActiveShipment] = useState<Shipment | null>(
    shipments.find(s => s.id.toLowerCase() === initialTrackId.toLowerCase()) || null
  );
  const [searched, setSearched] = useState<boolean>(initialTrackId !== '');

  const handleTrack = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearched(true);
    if (!trackQuery.trim()) {
      setActiveShipment(null);
      return;
    }
    const found = shipments.find(s => s.id.toLowerCase().trim() === trackQuery.toLowerCase().trim());
    setActiveShipment(found || null);
  };

  const handleQuickTrack = (id: string) => {
    setTrackQuery(id);
    setSearched(true);
    const found = shipments.find(s => s.id === id);
    setActiveShipment(found || null);
  };

  // Milestones sequence
  const milestones = [
    { key: 'Pending', label: 'Waybill Registered', desc: 'Package registered and route logistics queued.' },
    { key: 'Picked Up', label: 'Consignment Collected', desc: 'Cargo collected from consignor pickup facility.' },
    { key: 'In Transit', label: 'In Transit Transfer', desc: 'Package in sorting terminal transit corridors.' },
    { key: 'Out for Delivery', label: 'Out for Delivery', desc: 'Courier dispatched to consignee doorstep coordinates.' },
    { key: 'Delivered', label: 'Delivered', desc: 'Successfully consigned and signed receipt.' },
  ];

  // Check if a milestone is completed or active
  const getMilestoneIndex = (status: string) => {
    switch (status) {
      case 'Pending': return 0;
      case 'Picked Up': return 1;
      case 'In Transit': return 2;
      case 'Out for Delivery': return 3;
      case 'Delivered': return 4;
      default: return -1; // Cancelled
    }
  };

  const activeIndex = activeShipment ? getMilestoneIndex(activeShipment.status) : -1;

  return (
    <div className="space-y-6">
      
      {/* Search Tracker Console Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5 text-center max-w-2xl mx-auto">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold font-mono tracking-widest text-blue-600 dark:text-blue-400">Cargo Telemetry Tracking</span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Central Waybill Tracker Console</h2>
          <p className="text-xs text-slate-400">Enter a Tracking ID or waybill code to retrieve real-time location dispatches.</p>
        </div>

        <form onSubmit={handleTrack} className="flex gap-2 max-w-lg mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={trackQuery}
              onChange={(e) => setTrackQuery(e.target.value)}
              placeholder="e.g. LOG-548102-US"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500 font-mono text-slate-950 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-600/10"
          >
            Track Cargo
          </button>
        </form>
      </div>

      {/* Roster list if nothing has been searched / tracked yet */}
      {!activeShipment && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm max-w-2xl mx-auto space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800 pb-3">
            <Sparkles size={14} className="text-blue-600 animate-pulse" />
            <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400">Reviewer Quick-Access Waybills</h4>
          </div>

          {searched && !activeShipment && trackQuery.trim() !== '' && (
            <p className="text-xs text-rose-500 font-bold bg-rose-50 dark:bg-rose-500/10 p-3 rounded-xl border border-rose-100 dark:border-rose-500/20 text-center">
              No matching waybill found in database. Try quick-tracking one of these instead:
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shipments.slice(0, 4).map((s) => (
              <button
                key={s.id}
                onClick={() => handleQuickTrack(s.id)}
                className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-blue-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-left flex justify-between items-center transition-all"
              >
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white block">{s.id}</span>
                  <span className="text-[10px] text-slate-400 font-medium block">Route: {s.pickupAddress.split(',')[1] || s.pickupAddress} → {s.deliveryAddress.split(',')[1] || s.deliveryAddress}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  Track <ArrowRight size={12} />
                </div>
              </button>
            ))}
            {shipments.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-4 col-span-2">No shipments currently logged in the ledger database.</p>
            )}
          </div>
        </div>
      )}

      {/* Main Tracked Output Details */}
      {activeShipment && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          {/* Metadata details card (1/3 width) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 h-fit">
            <div className="border-b border-slate-50 dark:border-slate-800 pb-3 flex justify-between items-center">
              <span className="font-mono text-slate-400 uppercase text-[9px] font-bold">Consignment Ledger</span>
              <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${
                activeShipment.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'
              }`}>
                {activeShipment.status}
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">1. Consignor Party</span>
                <h5 className="font-semibold text-slate-900 dark:text-white text-xs">{activeShipment.senderName}</h5>
                <p className="text-[10px] text-slate-500 font-mono leading-tight flex items-center gap-1">
                  <MapPin size={10} /> {activeShipment.pickupAddress}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">2. Consignee Party</span>
                <h5 className="font-semibold text-slate-900 dark:text-white text-xs">{activeShipment.receiverName}</h5>
                <p className="text-[10px] text-slate-500 font-mono leading-tight flex items-center gap-1">
                  <MapPin size={10} /> {activeShipment.deliveryAddress}
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-50 dark:border-slate-800 text-[11px] space-y-1.5 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between font-mono">
                  <span>Weight:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{activeShipment.weight} kg</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Cargo Class:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{activeShipment.type}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Est Price:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">${activeShipment.price.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Cargo value:</span>
                  <span className="font-bold text-slate-900 dark:text-white">${activeShipment.packageValue || '150.00'}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Carrier Run:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {activeShipment.assignedDriverId 
                      ? drivers.find(d => d.id === activeShipment.assignedDriverId)?.name || 'Assigned Courier'
                      : 'Pending Dispatch Pool'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Tracking progress details (2/3 width) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400 border-b border-slate-50 dark:border-slate-800 pb-3">
              Telemetry Milestone Audit Trail
            </h3>

            {/* Vertical timeline stack */}
            <div className="space-y-8 relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
              
              {/* Dynamic historical milestone edits */}
              {activeShipment.timeline && activeShipment.timeline.map((event, idx) => (
                <div key={idx} className="relative space-y-1 transition-all">
                  <div className="absolute -left-7 top-1 w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-2 border-white dark:border-slate-900 flex items-center justify-center font-bold z-10 shadow-sm">
                    <CheckCircle2 size={13} />
                  </div>
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">{event.status}</h4>
                    <span className="text-[9px] font-mono font-bold text-slate-400">
                      {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono leading-tight flex items-center gap-0.5">
                    <MapPin size={9} /> Depot Location: {event.location}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed pt-0.5">{event.description}</p>
                </div>
              ))}

              {/* Standard generic progression milestones for gaps */}
              {milestones.slice(activeIndex + 1).map((m, idx) => (
                <div key={idx} className="relative space-y-1 opacity-55">
                  <div className="absolute -left-7 top-1.5 w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 border-2 border-white dark:border-slate-900 flex items-center justify-center z-10">
                    <Circle size={8} />
                  </div>
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-xs text-slate-400">{m.label}</h4>
                    <span className="text-[9px] font-mono text-slate-400 italic">Scheduled Segment</span>
                  </div>
                  <p className="text-xs text-slate-400/80 leading-relaxed">{m.desc}</p>
                </div>
              ))}

              {/* Cancelled edge status timeline */}
              {activeShipment.status === 'Cancelled' && (
                <div className="relative space-y-1 text-rose-500">
                  <div className="absolute -left-7 top-1 w-6 h-6 rounded-full bg-rose-100 text-rose-600 border-2 border-white dark:border-slate-900 flex items-center justify-center font-bold z-10">
                    ✖
                  </div>
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-xs">Cargo Dispatch Cancelled</h4>
                    <span className="text-[9px] font-mono font-bold">Waybill Void</span>
                  </div>
                  <p className="text-xs leading-relaxed">The consignor requested cancellation of this segment routing.</p>
                </div>
              )}
            </div>
          </div>
          
        </div>
      )}

    </div>
  );
}
