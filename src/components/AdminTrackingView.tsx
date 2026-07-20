import React, { useState, useEffect } from 'react';
import { 
  Package, Search, MapPin, Calendar, Clock, CheckCircle2, Circle, 
  Truck, Sparkles, User, FileText, ArrowRight, Edit, Plus, Trash2, 
  Settings, Check, Loader2, RefreshCw, X, Shield, Map, Info
} from 'lucide-react';
import { Shipment, Driver } from '../types.js';

interface AdminTrackingViewProps {
  shipments: Shipment[];
  drivers: Driver[];
  token: string;
  onRefresh: () => void;
  initialTrackId?: string;
}

export default function AdminTrackingView({
  shipments,
  drivers,
  token,
  onRefresh,
  initialTrackId = '',
}: AdminTrackingViewProps) {
  const [trackQuery, setTrackQuery] = useState<string>(initialTrackId);
  const [activeShipment, setActiveShipment] = useState<Shipment | null>(
    shipments.find(s => s.id.toLowerCase() === initialTrackId.toLowerCase()) || null
  );
  const [searched, setSearched] = useState<boolean>(initialTrackId !== '');
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'edit' | 'milestones'>('timeline');

  // Form states for Edit Details
  const [status, setStatus] = useState('');
  const [tag, setTag] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [assignedDriverId, setAssignedDriverId] = useState('');
  
  const [weight, setWeight] = useState('');
  const [type, setType] = useState('');
  const [price, setPrice] = useState('');
  const [packageValue, setPackageValue] = useState('');
  const [dimLength, setDimLength] = useState('');
  const [dimWidth, setDimWidth] = useState('');
  const [dimHeight, setDimHeight] = useState('');

  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');

  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  
  const [pickupLat, setPickupLat] = useState('');
  const [pickupLng, setPickupLng] = useState('');
  const [deliveryLat, setDeliveryLat] = useState('');
  const [deliveryLng, setDeliveryLng] = useState('');
  const [currentLat, setCurrentLat] = useState('');
  const [currentLng, setCurrentLng] = useState('');

  const [proofOfDelivery, setProofOfDelivery] = useState('');

  // States for Manage Checkpoints
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [newCheckStatus, setNewCheckStatus] = useState('');
  const [newCheckLocation, setNewCheckLocation] = useState('');
  const [newCheckTime, setNewCheckTime] = useState('');
  const [newCheckDesc, setNewCheckDesc] = useState('');
  const [editingMilestoneIndex, setEditingMilestoneIndex] = useState<number | null>(null);

  // Status indicators
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state whenever shipments database updates or active shipment is selected
  useEffect(() => {
    if (activeShipment) {
      // Find the most fresh data from props shipments
      const fresh = shipments.find(s => s.id === activeShipment.id);
      const current = fresh || activeShipment;
      
      setStatus(current.status || '');
      setTag(current.tag || '');
      setEstimatedDelivery(current.estimatedDelivery || '');
      setAssignedDriverId(current.assignedDriverId || '');
      
      setWeight(String(current.weight || ''));
      setType(current.type || '');
      setPrice(String(current.price || ''));
      setPackageValue(String(current.packageValue || ''));
      setDimLength(String(current.packageDimensions?.length || ''));
      setDimWidth(String(current.packageDimensions?.width || ''));
      setDimHeight(String(current.packageDimensions?.height || ''));

      setSenderName(current.senderName || '');
      setSenderEmail(current.senderEmail || '');
      setSenderPhone(current.senderPhone || '');
      setReceiverName(current.receiverName || '');
      setReceiverEmail(current.receiverEmail || '');
      setReceiverPhone(current.receiverPhone || '');

      setPickupAddress(current.pickupAddress || '');
      setDeliveryAddress(current.deliveryAddress || '');
      
      setPickupLat(String(current.pickupCoords?.[0] || ''));
      setPickupLng(String(current.pickupCoords?.[1] || ''));
      setDeliveryLat(String(current.deliveryCoords?.[0] || ''));
      setDeliveryLng(String(current.deliveryCoords?.[1] || ''));
      setCurrentLat(String(current.currentCoords?.[0] || ''));
      setCurrentLng(String(current.currentCoords?.[1] || ''));

      setProofOfDelivery(current.proofOfDelivery || '');

      setTimelineEvents(current.timeline || []);
    }
  }, [activeShipment, shipments]);

  const handleTrack = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearched(true);
    if (!trackQuery.trim()) {
      setActiveShipment(null);
      return;
    }
    const found = shipments.find(s => s.id.toLowerCase().trim() === trackQuery.toLowerCase().trim());
    setActiveShipment(found || null);
    setActiveSubTab('timeline');
  };

  const handleQuickTrack = (id: string) => {
    setTrackQuery(id);
    setSearched(true);
    const found = shipments.find(s => s.id === id);
    setActiveShipment(found || null);
    setActiveSubTab('timeline');
  };

  // Milestones sequence
  const milestones = [
    { key: 'Pending', label: 'Waybill Registered', desc: 'Package registered and route logistics queued.' },
    { key: 'Picked Up', label: 'Consignment Collected', desc: 'Cargo collected from consignor pickup facility.' },
    { key: 'In Transit', label: 'In Transit Transfer', desc: 'Package in sorting terminal transit corridors.' },
    { key: 'Out for Delivery', label: 'Out for Delivery', desc: 'Courier dispatched to consignee doorstep coordinates.' },
    { key: 'Delivered', label: 'Delivered', desc: 'Successfully consigned and signed receipt.' },
  ];

  const getMilestoneIndex = (statusStr: string) => {
    switch (statusStr) {
      case 'Pending': return 0;
      case 'Picked Up': return 1;
      case 'In Transit': return 2;
      case 'Out for Delivery': return 3;
      case 'Delivered': return 4;
      default: return -1; // Cancelled
    }
  };

  const activeIndex = activeShipment ? getMilestoneIndex(activeShipment.status) : -1;

  // Save the full details form
  const handleSaveShipmentDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShipment) return;
    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const updatedPayload = {
      status,
      tag,
      estimatedDelivery,
      assignedDriverId: assignedDriverId || null,
      weight: parseFloat(weight) || 0,
      type,
      price: parseFloat(price) || 0,
      packageValue: parseFloat(packageValue) || 0,
      packageDimensions: {
        length: parseFloat(dimLength) || 0,
        width: parseFloat(dimWidth) || 0,
        height: parseFloat(dimHeight) || 0,
      },
      pickupAddress,
      deliveryAddress,
      pickupCoords: [parseFloat(pickupLat) || 0, parseFloat(pickupLng) || 0],
      deliveryCoords: [parseFloat(deliveryLat) || 0, parseFloat(deliveryLng) || 0],
      currentCoords: currentLat && currentLng ? [parseFloat(currentLat) || 0, parseFloat(currentLng) || 0] : null,
      senderName,
      senderEmail,
      senderPhone,
      receiverName,
      receiverEmail,
      receiverPhone,
      proofOfDelivery,
      timeline: timelineEvents // Save the timeline checklists
    };

    try {
      const response = await fetch(`/api/shipments/${activeShipment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedPayload),
      });

      if (response.ok) {
        const result = await response.json();
        setActiveShipment(result);
        setSuccessMsg('Shipment details successfully synchronized.');
        onRefresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        const err = await response.json();
        setErrorMsg(err.error || 'Failed to sync modifications.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  // Add/Edit milestone logic
  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckStatus.trim() || !newCheckLocation.trim() || !newCheckTime) {
      alert('Please fill out the Checkpoint label, Location, and Timestamp fields.');
      return;
    }

    const mEvent = {
      status: newCheckStatus,
      location: newCheckLocation,
      timestamp: new Date(newCheckTime).toISOString(),
      description: newCheckDesc || `Cargo arrived at ${newCheckLocation}.`,
    };

    let updatedEvents = [...timelineEvents];
    if (editingMilestoneIndex !== null) {
      updatedEvents[editingMilestoneIndex] = mEvent;
      setEditingMilestoneIndex(null);
    } else {
      updatedEvents.push(mEvent);
    }

    // Sort chronologically by default
    updatedEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    setTimelineEvents(updatedEvents);
    setNewCheckStatus('');
    setNewCheckLocation('');
    setNewCheckTime('');
    setNewCheckDesc('');
  };

  const handleEditMilestone = (idx: number) => {
    const m = timelineEvents[idx];
    setNewCheckStatus(m.status);
    setNewCheckLocation(m.location);
    try {
      const d = new Date(m.timestamp);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      setNewCheckTime(`${year}-${month}-${day}T${hours}:${minutes}`);
    } catch {
      setNewCheckTime('');
    }
    setNewCheckDesc(m.description || '');
    setEditingMilestoneIndex(idx);
  };

  const handleDeleteMilestone = (idx: number) => {
    const updated = timelineEvents.filter((_, i) => i !== idx);
    setTimelineEvents(updated);
    if (editingMilestoneIndex === idx) {
      setEditingMilestoneIndex(null);
      setNewCheckStatus('');
      setNewCheckLocation('');
      setNewCheckTime('');
      setNewCheckDesc('');
    }
  };

  const handleCommitTimeline = async () => {
    if (!activeShipment) return;
    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const response = await fetch(`/api/shipments/${activeShipment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          timeline: timelineEvents
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setActiveShipment(result);
        setSuccessMsg('Chronological milestones audit trail successfully saved.');
        onRefresh();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        const err = await response.json();
        setErrorMsg(err.error || 'Failed to commit milestone updates.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search Tracker Console Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5 text-center max-w-2xl mx-auto">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold font-mono tracking-widest text-blue-600 dark:text-blue-400">Cargo Telemetry Tracking</span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Central Waybill Tracker Console</h2>
          <p className="text-xs text-slate-400">Enter a Tracking ID or waybill code to retrieve and modify its real-time telemetry.</p>
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
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-600/10 cursor-pointer"
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
                className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-blue-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-left flex justify-between items-center transition-all cursor-pointer"
              >
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white block">{s.id}</span>
                  <span className="text-[10px] text-slate-400 font-medium block">Route: {s.pickupAddress.split(',')[1] || s.pickupAddress} → {s.deliveryAddress.split(',')[1] || s.deliveryAddress}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  Track & Edit <ArrowRight size={12} />
                </div>
              </button>
            ))}
            {shipments.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-4 col-span-2">No shipments currently logged in the ledger database.</p>
            )}
          </div>
        </div>
      )}

      {/* Main Tracked Output Details & Control Deck */}
      {activeShipment && (
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Notification feedback alerts */}
          {(successMsg || errorMsg) && (
            <div className="max-w-5xl mx-auto">
              {successMsg && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 rounded-xl font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 rounded-xl font-bold text-xs flex items-center gap-2">
                  <X size={14} />
                  {errorMsg}
                </div>
              )}
            </div>
          )}

          {/* Sub-Tab Selector Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-1">
            <button
              onClick={() => setActiveSubTab('timeline')}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeSubTab === 'timeline' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Progress Timeline
            </button>
            <button
              onClick={() => setActiveSubTab('edit')}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeSubTab === 'edit' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Edit Shipment Details
            </button>
            <button
              onClick={() => setActiveSubTab('milestones')}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeSubTab === 'milestones' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Manage Checkpoint List ({timelineEvents.length})
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN: Read-Only Meta facts (1/3 width, stays on screen) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 h-fit text-slate-800 dark:text-slate-200">
              <div className="border-b border-slate-50 dark:border-slate-800 pb-3 flex justify-between items-center">
                <span className="font-mono text-slate-400 uppercase text-[9px] font-bold">Consignment Ledger</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold border uppercase tracking-wider ${
                  activeShipment.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                  activeShipment.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                  'bg-blue-500/10 text-blue-500 border-blue-500/20'
                }`}>
                  {activeShipment.status}
                </span>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase font-mono block">Sender (Consignor)</span>
                  <h5 className="font-bold text-slate-800 dark:text-white text-xs">{activeShipment.senderName}</h5>
                  <p className="text-[10px] text-slate-500 font-mono leading-tight flex items-center gap-1">
                    <MapPin size={10} className="shrink-0" /> {activeShipment.pickupAddress}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase font-mono block">Receiver (Consignee)</span>
                  <h5 className="font-bold text-slate-800 dark:text-white text-xs">{activeShipment.receiverName}</h5>
                  <p className="text-[10px] text-slate-500 font-mono leading-tight flex items-center gap-1">
                    <MapPin size={10} className="shrink-0" /> {activeShipment.deliveryAddress}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] space-y-1.5 text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between font-mono">
                    <span>Waybill ID:</span>
                    <span className="font-bold text-slate-800 dark:text-white">{activeShipment.id}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span>SLA Custom Tag:</span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      {activeShipment.tag ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-bold">
                          {activeShipment.tag}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">None</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span>Cargo Weight:</span>
                    <span className="font-bold text-slate-800 dark:text-white">{activeShipment.weight} kg</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span>Freight Class:</span>
                    <span className="font-bold text-slate-800 dark:text-white">{activeShipment.type}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span>Calculated Cost:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">${activeShipment.price.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span>Declared Value:</span>
                    <span className="font-bold text-slate-800 dark:text-white">${activeShipment.packageValue || '150.00'}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span>Assigned Agent:</span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      {activeShipment.assignedDriverId 
                        ? drivers.find(d => d.id === activeShipment.assignedDriverId)?.name || 'Courier Active'
                        : 'Pending Pool Dispatch'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: The Interactive Tab Contents (2/3 width) */}
            <div className="lg:col-span-2">

              {/* TAB 1: READ-ONLY MILESTONES PROGRESS */}
              {activeSubTab === 'timeline' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
                  <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                    <span>Telemetry Milestone Audit Trail</span>
                    <span className="text-[9px] text-[#aaa]">Customer View Simulation</span>
                  </h3>

                  {/* Vertical timeline stack */}
                  <div className="space-y-8 relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
                    
                    {/* Dynamic historical milestones */}
                    {timelineEvents.map((event, idx) => (
                      <div key={idx} className="relative space-y-1 transition-all">
                        <div className="absolute -left-7 top-1 w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center font-bold z-10 shadow-sm">
                          <CheckCircle2 size={13} />
                        </div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">{event.status}</h4>
                          <span className="text-[9px] font-mono font-bold text-slate-400">
                            {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono leading-tight flex items-center gap-0.5">
                          <MapPin size={9} /> Depot: {event.location}
                        </p>
                        <p className="text-xs text-slate-500 leading-relaxed pt-0.5">{event.description}</p>
                      </div>
                    ))}

                    {/* Standard progression markers based on status */}
                    {milestones.slice(activeIndex + 1).map((m, idx) => (
                      <div key={idx} className="relative space-y-1 opacity-55">
                        <div className="absolute -left-7 top-1.5 w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 border-2 border-white dark:border-slate-900 flex items-center justify-center z-10">
                          <Circle size={8} />
                        </div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-xs text-slate-400">{m.label}</h4>
                          <span className="text-[9px] font-mono text-slate-400 italic">Expected Step</span>
                        </div>
                        <p className="text-xs text-slate-400/80 leading-relaxed">{m.desc}</p>
                      </div>
                    ))}

                    {activeShipment.status === 'Cancelled' && (
                      <div className="relative space-y-1 text-rose-500">
                        <div className="absolute -left-7 top-1 w-6 h-6 rounded-full bg-rose-500/10 text-rose-500 border-2 border-white dark:border-slate-900 flex items-center justify-center font-bold z-10">
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
              )}

              {/* TAB 2: EDIT SHIPMENT DETAILS FORM */}
              {activeSubTab === 'edit' && (
                <form onSubmit={handleSaveShipmentDetails} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
                  
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400">
                      Update Consignment & Routing Properties
                    </h3>
                    <span className="text-[8px] font-mono text-blue-500 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded">DIRECT DB UPDATE</span>
                  </div>

                  {/* Core Status & Tags */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold font-mono uppercase tracking-wider text-slate-400">Core Status *</label>
                      <select
                        required
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white"
                      >
                        <option value="Pending">Pending (Waybill Registered)</option>
                        <option value="Picked Up">Picked Up (Consignment Collected)</option>
                        <option value="In Transit">In Transit (En Route)</option>
                        <option value="Out for Delivery">Out for Delivery (Courier Dispatched)</option>
                        <option value="Delivered">Delivered (Completed)</option>
                        <option value="Cancelled">Cancelled (Void)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold font-mono uppercase tracking-wider text-slate-400">SLA Custom Tag / Info Banner</label>
                      <input
                        type="text"
                        value={tag}
                        onChange={(e) => setTag(e.target.value)}
                        placeholder="e.g. Delayed, Customs Hold, Severe Weather"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold font-mono uppercase tracking-wider text-slate-400">Estimated Delivery Date</label>
                      <input
                        type="date"
                        value={estimatedDelivery ? estimatedDelivery.split('T')[0] : ''}
                        onChange={(e) => setEstimatedDelivery(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold font-mono uppercase tracking-wider text-slate-400">Assigned Courier Agent</label>
                      <select
                        value={assignedDriverId}
                        onChange={(e) => setAssignedDriverId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white"
                      >
                        <option value="">-- Unassigned / Pool Dispatch --</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.name} ({d.status})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Packaging Specifications */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                    <h4 className="text-[10px] font-bold font-mono uppercase tracking-wider text-[#ff7a1a]">Consignment Specifications</h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold font-mono uppercase tracking-wider text-slate-400">Weight (kg) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-bold font-mono uppercase tracking-wider text-slate-400">Cargo Class *</label>
                        <input
                          type="text"
                          required
                          value={type}
                          onChange={(e) => setType(e.target.value)}
                          placeholder="e.g. Standard Freight, Express Air"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-bold font-mono uppercase tracking-wider text-slate-400">Pricing ($ USD) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-bold font-mono uppercase tracking-wider text-slate-400">Declared Value ($)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={packageValue}
                          onChange={(e) => setPackageValue(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Dimensions */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold font-mono uppercase tracking-wider text-slate-400">Length (cm)</label>
                        <input
                          type="number"
                          value={dimLength}
                          onChange={(e) => setDimLength(e.target.value)}
                          placeholder="Length"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs outline-none text-slate-950 dark:text-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold font-mono uppercase tracking-wider text-slate-400">Width (cm)</label>
                        <input
                          type="number"
                          value={dimWidth}
                          onChange={(e) => setDimWidth(e.target.value)}
                          placeholder="Width"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs outline-none text-slate-950 dark:text-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold font-mono uppercase tracking-wider text-slate-400">Height (cm)</label>
                        <input
                          type="number"
                          value={dimHeight}
                          onChange={(e) => setDimHeight(e.target.value)}
                          placeholder="Height"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs outline-none text-slate-950 dark:text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Routing Addresses & GPS Coords */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                    <h4 className="text-[10px] font-bold font-mono uppercase tracking-wider text-emerald-500">Routing & GPS Telemetry</h4>

                    <div className="space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[8px] font-bold font-mono uppercase tracking-wider text-slate-400">Pickup Address *</label>
                          <input
                            type="text"
                            required
                            value={pickupAddress}
                            onChange={(e) => setPickupAddress(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[7px] font-bold font-mono uppercase text-slate-400">Pickup Lat</label>
                            <input
                              type="number"
                              step="0.000001"
                              value={pickupLat}
                              onChange={(e) => setPickupLat(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-1.5 py-1.5 text-xs text-slate-950 dark:text-white font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[7px] font-bold font-mono uppercase text-slate-400">Pickup Lng</label>
                            <input
                              type="number"
                              step="0.000001"
                              value={pickupLng}
                              onChange={(e) => setPickupLng(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-1.5 py-1.5 text-xs text-slate-950 dark:text-white font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[8px] font-bold font-mono uppercase tracking-wider text-slate-400">Delivery Address *</label>
                          <input
                            type="text"
                            required
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[7px] font-bold font-mono uppercase text-slate-400">Delivery Lat</label>
                            <input
                              type="number"
                              step="0.000001"
                              value={deliveryLat}
                              onChange={(e) => setDeliveryLat(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-1.5 py-1.5 text-xs text-slate-950 dark:text-white font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[7px] font-bold font-mono uppercase text-slate-400">Delivery Lng</label>
                            <input
                              type="number"
                              step="0.000001"
                              value={deliveryLng}
                              onChange={(e) => setDeliveryLng(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-1.5 py-1.5 text-xs text-slate-950 dark:text-white font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Current Truck Coords */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div className="sm:col-span-2 text-[10px] text-slate-400 leading-normal flex items-center">
                          <Info size={14} className="text-blue-500 shrink-0 mr-1.5" />
                          Set Current Vehicle Coords to override live position telemetry on the public Map view.
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[7px] font-bold font-mono uppercase text-rose-500">Current Lat</label>
                            <input
                              type="number"
                              step="0.000001"
                              value={currentLat}
                              onChange={(e) => setCurrentLat(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-1.5 py-1.5 text-xs text-slate-950 dark:text-white font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[7px] font-bold font-mono uppercase text-rose-500">Current Lng</label>
                            <input
                              type="number"
                              step="0.000001"
                              value={currentLng}
                              onChange={(e) => setCurrentLng(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-1.5 py-1.5 text-xs text-slate-950 dark:text-white font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Parties Details */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                    <h4 className="text-[10px] font-bold font-mono uppercase tracking-wider text-blue-500 font-sans">Contact Party registries</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Sender */}
                      <div className="bg-slate-50/40 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/80 p-3.5 rounded-xl space-y-3">
                        <span className="text-[8px] font-bold text-slate-400 uppercase font-mono block">Consignor (Sender) Contact details</span>
                        
                        <div className="space-y-2">
                          <input
                            type="text"
                            required
                            placeholder="Sender Full Name"
                            value={senderName}
                            onChange={(e) => setSenderName(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-950 dark:text-white"
                          />
                          <input
                            type="email"
                            placeholder="Sender Email Address"
                            value={senderEmail}
                            onChange={(e) => setSenderEmail(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-950 dark:text-white"
                          />
                          <input
                            type="text"
                            placeholder="Sender Phone Number"
                            value={senderPhone}
                            onChange={(e) => setSenderPhone(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-950 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Receiver */}
                      <div className="bg-slate-50/40 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/80 p-3.5 rounded-xl space-y-3">
                        <span className="text-[8px] font-bold text-slate-400 uppercase font-mono block">Consignee (Receiver) Contact details</span>
                        
                        <div className="space-y-2">
                          <input
                            type="text"
                            required
                            placeholder="Receiver Full Name"
                            value={receiverName}
                            onChange={(e) => setReceiverName(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-950 dark:text-white"
                          />
                          <input
                            type="email"
                            placeholder="Receiver Email Address"
                            value={receiverEmail}
                            onChange={(e) => setReceiverEmail(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-950 dark:text-white"
                          />
                          <input
                            type="text"
                            placeholder="Receiver Phone Number"
                            value={receiverPhone}
                            onChange={(e) => setReceiverPhone(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-950 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Proof of delivery & Digital signature */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                    <label className="text-[9px] font-bold font-mono uppercase tracking-wider text-slate-400">Proof of Delivery (PDF document url, image link, or custom signing text)</label>
                    <input
                      type="text"
                      value={proofOfDelivery}
                      onChange={(e) => setProofOfDelivery(e.target.value)}
                      placeholder="e.g. Signed by Emmanual O. at dispatch door."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white font-sans"
                    />
                  </div>

                  {/* Submit save button */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 bg-[#ff7a1a] hover:bg-[#e66c15] disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          Committing changes...
                        </>
                      ) : (
                        <>
                          <Check size={13} />
                          Save & Sync Shipment Ledger
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: MANAGE CHRONOLOGY LIST */}
              {activeSubTab === 'milestones' && (
                <div className="space-y-6">
                  
                  {/* Milestones Scan check form */}
                  <form onSubmit={handleAddMilestone} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-[#ff7a1a]">
                        {editingMilestoneIndex !== null ? 'Modify Milestone Scan Checkpoint' : 'Add Telemetry Scan Checkpoint'}
                      </h3>
                      {editingMilestoneIndex !== null && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMilestoneIndex(null);
                            setNewCheckStatus('');
                            setNewCheckLocation('');
                            setNewCheckTime('');
                            setNewCheckDesc('');
                          }}
                          className="text-[10px] text-rose-500 font-mono hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold font-mono uppercase tracking-wider text-slate-400">Milestone Action / Label *</label>
                        <input
                          type="text"
                          required
                          value={newCheckStatus}
                          onChange={(e) => setNewCheckStatus(e.target.value)}
                          placeholder="e.g. DepartedSorting Hub, Customs Cleared"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold font-mono uppercase tracking-wider text-slate-400">Scan Depot / Location Location *</label>
                        <input
                          type="text"
                          required
                          value={newCheckLocation}
                          onChange={(e) => setNewCheckLocation(e.target.value)}
                          placeholder="e.g. Frankfurt Central Sorting, Germany"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold font-mono uppercase tracking-wider text-slate-400">Timestamp *</label>
                        <input
                          type="datetime-local"
                          required
                          value={newCheckTime}
                          onChange={(e) => setNewCheckTime(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold font-mono uppercase tracking-wider text-slate-400">Detailed scanning description (Optional)</label>
                        <input
                          type="text"
                          value={newCheckDesc}
                          onChange={(e) => setNewCheckDesc(e.target.value)}
                          placeholder="e.g. Consignment processed and sorted onto outbound air route."
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {editingMilestoneIndex !== null ? (
                          <>
                            <Check size={13} />
                            Save Milestone Scan Checkpoint
                          </>
                        ) : (
                          <>
                            <Plus size={13} />
                            Append Scan Checkpoint
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* List of current milestones */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400">
                        Current Checkpoint Checklist Sequence ({timelineEvents.length})
                      </h3>
                      <button
                        onClick={handleCommitTimeline}
                        disabled={submitting}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {submitting ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Check size={12} />
                        )}
                        Commit & Save Checklist Sequence
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-normal">
                      Drag-reordering is simulated by sorting milestones chronologically using their timestamps. Click the edit pencil to update details, or the red bin to discard checkpoints. Remember to click "Commit & Save" to persist the changes.
                    </p>

                    <div className="space-y-2.5">
                      {timelineEvents.map((m, idx) => (
                        <div key={idx} className="flex items-start justify-between p-3 border border-slate-100 dark:border-slate-800/60 rounded-xl hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-all text-slate-800 dark:text-slate-200">
                          <div className="space-y-1 max-w-[80%]">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">{m.status}</span>
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                Depot: {m.location}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-snug">{m.description || 'No checkpoint descriptions provided.'}</p>
                            <span className="text-[9px] font-mono text-slate-400 block pt-0.5">
                              {new Date(m.timestamp).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                            <button
                              onClick={() => handleEditMilestone(idx)}
                              className="p-1.5 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-400 hover:text-blue-500 rounded-lg transition-colors cursor-pointer"
                              title="Edit checkpoint"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteMilestone(idx)}
                              className="p-1.5 border border-slate-200 dark:border-slate-700 hover:border-rose-500 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                              title="Delete checkpoint"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {timelineEvents.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-6">No scan checkpoints mapped yet. Add one above to establish a progress timeline.</p>
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
