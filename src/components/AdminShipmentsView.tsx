import React, { useState } from 'react';
import { Package, Search, PlusCircle, Filter, Calendar, FileText, Download, Check, AlertCircle, X, ChevronRight, User, MapPin, Clock, Camera } from 'lucide-react';
import { Shipment, Driver, Settings } from '../types.js';
import { motion, AnimatePresence } from 'motion/react';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';

interface AdminShipmentsViewProps {
  shipments: Shipment[];
  drivers: Driver[];
  token: string;
  settings: Settings;
  onRefresh: () => void;
  onTrackShipment: (id: string) => void;
  onCreateNewShipment: () => void;
}

export default function AdminShipmentsView({
  shipments,
  drivers,
  token,
  settings,
  onRefresh,
  onTrackShipment,
  onCreateNewShipment,
}: AdminShipmentsViewProps) {
  // Filtering states
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');

  // Bulk selections
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Editing state (Milestone Update form)
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editDriverId, setEditDriverId] = useState<string>('');
  const [editLocation, setEditLocation] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editTag, setEditTag] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Filtered lists
  const filtered = shipments.filter(s => {
    if (filterStatus !== 'All' && s.status !== filterStatus) return false;
    if (filterDate) {
      const createdDate = s.createdAt.substring(0, 10);
      if (createdDate !== filterDate) return false;
    }
    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      const idMatch = s.id.toLowerCase().includes(q);
      const senderMatch = s.senderName.toLowerCase().includes(q);
      const receiverMatch = s.receiverName.toLowerCase().includes(q);
      const pickupMatch = s.pickupAddress?.toLowerCase().includes(q) || false;
      const deliveryMatch = s.deliveryAddress?.toLowerCase().includes(q) || false;
      return idMatch || senderMatch || receiverMatch || pickupMatch || deliveryMatch;
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    const isHighContrast = settings?.enableHighContrastStatus === true;
    switch (status) {
      case 'Pending':
      case 'Picked Up':
      case 'In Transit':
      case 'In-Transit':
      case 'Out for Delivery':
        return isHighContrast
          ? 'bg-amber-200 text-amber-950 border-amber-400 dark:bg-amber-400 dark:text-slate-950 dark:border-amber-300 font-black'
          : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40 font-bold';
      case 'Delivered':
        return isHighContrast
          ? 'bg-emerald-200 text-emerald-950 border-emerald-400 dark:bg-emerald-400 dark:text-slate-950 dark:border-emerald-300 font-black'
          : 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 font-bold';
      case 'Exception':
      case 'Cancelled':
      default: // Exception / Cancelled
        return isHighContrast
          ? 'bg-rose-200 text-rose-950 border-rose-400 dark:bg-rose-400 dark:text-slate-950 dark:border-rose-300 font-black'
          : 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40 font-bold';
    }
  };

  // Bulk dispatch submit
  const handleBulkStatusUpdate = async () => {
    if (selectedIds.length === 0 || !bulkStatus) return;
    setBulkLoading(true);
    try {
      await Promise.all(
        selectedIds.map(id =>
          fetch(`/api/shipments/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: bulkStatus }),
          })
        )
      );
      setSelectedIds([]);
      setBulkStatus('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setBulkLoading(false);
    }
  };

  // Single dispatch submission
  const handleUpdateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShipment) return;
    setEditLoading(true);
    setEditError(null);

    try {
      const response = await fetch(`/api/shipments/${editingShipment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: editStatus,
          assignedDriverId: editDriverId || null,
          location: editLocation,
          description: editDescription,
          tag: editTag || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update cargo dispatch milestones.');
      }

      setEditingShipment(null);
      setEditLocation('');
      setEditDescription('');
      onRefresh();
    } catch (err: any) {
      setEditError(err.message || 'Error sync telemetry.');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Shipment edit dispatcher side overlay or modal */}
      {editingShipment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-6">
            <button
              onClick={() => setEditingShipment(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X size={18} />
            </button>

            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold font-mono tracking-widest text-blue-500">Dispatch Controller</span>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                Waybill ID: <span className="font-mono text-blue-600 dark:text-blue-400">{editingShipment.id}</span>
              </h3>
            </div>

            {editError && (
              <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 rounded-xl text-xs font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateShipment} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase font-mono">Assign Cargo Agent</label>
                  <select
                    value={editDriverId}
                    onChange={(e) => setEditDriverId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none text-slate-950 dark:text-white"
                  >
                    <option value="">-- Unassigned (System auto-pool) --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.vehicleType} - {d.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase font-mono">Milestone Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none text-slate-950 dark:text-white font-bold text-slate-800"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Picked Up">Picked Up</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Location update details */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                  <MapPin size={12} /> Add Timeline Coordinates
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase font-mono">Current Location/City</label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder=" Newark Distribution Depot"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none text-slate-950 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase font-mono">Milestone Activity Notes</label>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="e.g. Package scanned into conveyor belt"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none text-slate-950 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase font-mono">Category Tag</label>
                    <select
                      value={editTag}
                      onChange={(e) => setEditTag(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none text-slate-950 dark:text-white"
                    >
                      <option value="">-- No Tag --</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Fragile">Fragile</option>
                      <option value="High Value">High Value</option>
                      <option value="Cold Chain">Cold Chain</option>
                      <option value="Hazardous">Hazardous</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingShipment(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/15"
                >
                  {editLoading ? 'Syncing...' : 'Save Dispatch Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">Shipment Log Console</h2>
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Configure dispatch pools & telemetry metrics</p>
        </div>
        <button
          onClick={onCreateNewShipment}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-blue-600/10"
        >
          <PlusCircle size={14} />
          Book New Shipment
        </button>
      </div>

      {/* Filtering modules */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search Waybill ID, sender, consignee, or depot addresses..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500 shadow-sm text-slate-950 dark:text-white"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500 shadow-sm text-slate-950 dark:text-white font-medium"
          >
            <option value="All">All Milestones</option>
            <option value="Pending">Pending</option>
            <option value="Picked Up">Picked Up</option>
            <option value="In Transit">In Transit</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className="relative">
          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500 shadow-sm text-slate-950 dark:text-white font-mono"
          />
        </div>
      </div>

      {/* Main Grid Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {/* Floating Bulk Actions Docked Toolbar */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ y: 80, opacity: 0, x: '-50%', scale: 0.95 }}
              animate={{ y: 0, opacity: 1, x: '-50%', scale: 1 }}
              exit={{ y: 80, opacity: 0, x: '-50%', scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-950 border border-slate-800/80 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-white w-[92%] max-w-2xl"
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center bg-blue-600 text-white font-mono text-xs font-black h-6 w-6 rounded-lg shadow-lg shadow-blue-600/30">
                  {selectedIds.length}
                </span>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-100">Batch Shipment Operations</p>
                  <p className="text-[10px] text-slate-400 font-mono">Simultaneously update central ledger coordinates</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="bg-slate-800 dark:bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-semibold outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="" className="text-slate-400">-- Choose Bulk Status --</option>
                  <option value="Pending">Pending</option>
                  <option value="Picked Up">Picked Up</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <button
                  onClick={handleBulkStatusUpdate}
                  disabled={bulkLoading || !bulkStatus}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/25 shrink-0 cursor-pointer"
                >
                  {bulkLoading ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Applying...
                    </>
                  ) : (
                    'Apply Batch'
                  )}
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-slate-400 hover:text-slate-200 text-xs font-bold px-3 py-2 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filtered.map(s => s.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="p-4">Waybill ID</th>
                <th className="p-4">Sender Consignor</th>
                <th className="p-4">Consignee Destination</th>
                <th className="p-4">Assigned Agent</th>
                <th className="p-4">Attached Docs</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filtered.map((s) => (
                <tr 
                  key={s.id} 
                  className={`transition-colors duration-150 ${
                    selectedIds.includes(s.id) 
                      ? 'bg-blue-50/40 dark:bg-blue-950/15 hover:bg-blue-50/60 dark:hover:bg-blue-950/25' 
                      : 'hover:bg-slate-50/20'
                  }`}
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds([...selectedIds, s.id]);
                        } else {
                          setSelectedIds(selectedIds.filter(id => id !== s.id));
                        }
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-4">
                    <span className="font-mono font-bold text-slate-900 dark:text-white block">{s.id}</span>
                    <span className="text-[9px] text-slate-400 block font-mono">{new Date(s.createdAt).toLocaleDateString()}</span>
                    {s.tag && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-[#ff7a1a] rounded text-[8px] font-bold uppercase font-mono tracking-wider border border-neutral-200 dark:border-neutral-750">
                        {s.tag}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="font-semibold block">{s.senderName}</span>
                    <span className="text-[9px] text-slate-400 font-mono block">{s.senderPhone}</span>
                  </td>
                  <td className="p-4 max-w-[150px] truncate">
                    <span className="font-semibold block">{s.receiverName}</span>
                    <span className="text-[9px] text-slate-400 block truncate">{s.deliveryAddress}</span>
                  </td>
                  <td className="p-4">
                    {s.assignedDriverId ? (
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {drivers.find(d => d.id === s.assignedDriverId)?.name || 'Pooled Courier'}
                      </span>
                    ) : (
                      <span className="text-rose-500 italic font-semibold text-[10px]">Unassigned</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 text-[10px]">
                      {s.invoiceDocName ? (
                        <a
                          href={s.invoiceDocData}
                          download={s.invoiceDocName}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-0.5"
                        >
                          <FileText size={10} /> Custom Invoice
                        </a>
                      ) : null}
                      <button
                        onClick={() => generateInvoicePDF(s, settings)}
                        className="text-amber-600 dark:text-amber-500 hover:underline font-bold flex items-center gap-0.5 text-left cursor-pointer transition-colors duration-150"
                        title="Generate and download a professional PDF invoice using this shipment's live data"
                      >
                        <FileText size={10} /> {s.invoiceDocName ? "Generate Digital PDF" : "Generate Invoice PDF"}
                      </button>
                      {s.labelDocName ? (
                        <a
                          href={s.labelDocData}
                          download={s.labelDocName}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-0.5"
                        >
                          <Download size={10} /> Shipping Label
                        </a>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 italic">No Label</span>
                      )}
                      {s.proofOfDelivery && (
                        <a
                          href={s.proofOfDelivery}
                          download={`POD-${s.id}.jpeg`}
                          className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-0.5 mt-0.5"
                          title="Click to download proof of delivery photo receipt"
                        >
                          <Camera size={10} /> Proof of Delivery
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusColor(s.status)}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="p-4 text-right flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => generateInvoicePDF(s, settings)}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[10px] transition-all flex items-center gap-1 cursor-pointer shadow-sm hover:shadow"
                      title="Download full PDF invoice for this shipment"
                    >
                      <Download size={10} /> Invoice PDF
                    </button>
                    <button
                      onClick={() => onTrackShipment(s.id)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-[10px] transition-all cursor-pointer"
                    >
                      Track
                    </button>
                    <button
                      onClick={() => {
                        setEditingShipment(s);
                        setEditStatus(s.status);
                        setEditDriverId(s.assignedDriverId || '');
                        setEditTag(s.tag || '');
                      }}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer"
                    >
                      Dispatch Settings
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-16 text-center text-slate-400 italic">
                    No active matching shipments found in our central ledger database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
