import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, Package, Truck, CheckCircle, AlertTriangle, 
  ArrowUpRight, TrendingUp, Bell, ArrowRight, FileText, Globe, 
  DollarSign, Activity, Settings as SettingsIcon, ShieldAlert,
  ArrowDownLeft, RefreshCw, Calendar
} from 'lucide-react';
import { Shipment, Driver, Payment, Settings } from '../types.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 110,
      damping: 15
    }
  }
};

interface AdminDashboardViewProps {
  shipments: Shipment[];
  drivers: Driver[];
  payments: Payment[];
  alerts: any[];
  settings: Settings;
  onTrackShipment: (id: string) => void;
  onEditShipment: (shipment: Shipment) => void;
}

export default function AdminDashboardView({
  shipments,
  drivers,
  payments,
  alerts,
  settings,
  onTrackShipment,
  onEditShipment,
}: AdminDashboardViewProps) {
  // Date range filter state
  const [dateFilter, setDateFilter] = React.useState<'today' | '7days' | 'all'>('all');

  // Filter shipments and payments based on selected range
  const filteredShipments = shipments.filter(s => {
    if (dateFilter === 'all') return true;
    if (!s.createdAt) return false;
    
    const shipmentDate = new Date(s.createdAt);
    const now = new Date();
    
    if (dateFilter === 'today') {
      return (
        shipmentDate.getFullYear() === now.getFullYear() &&
        shipmentDate.getMonth() === now.getMonth() &&
        shipmentDate.getDate() === now.getDate()
      );
    }
    
    if (dateFilter === '7days') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sevenDaysAgo = new Date(startOfToday);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return shipmentDate >= sevenDaysAgo;
    }
    
    return true;
  });

  const filteredPayments = payments.filter(p => {
    if (dateFilter === 'all') return true;
    if (!p.timestamp) return false;
    
    const paymentDate = new Date(p.timestamp);
    const now = new Date();
    
    if (dateFilter === 'today') {
      return (
        paymentDate.getFullYear() === now.getFullYear() &&
        paymentDate.getMonth() === now.getMonth() &&
        paymentDate.getDate() === now.getDate()
      );
    }
    
    if (dateFilter === '7days') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sevenDaysAgo = new Date(startOfToday);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return paymentDate >= sevenDaysAgo;
    }
    
    return true;
  });

  // Stats Computations
  const totalShipmentsCount = filteredShipments.length;
  const inTransitCount = filteredShipments.filter(s => s.status === 'In Transit' || s.status === 'Out for Delivery' || s.status === 'Picked Up').length;
  const deliveredCount = filteredShipments.filter(s => s.status === 'Delivered').length;
  const failedCount = filteredShipments.filter(s => s.status === 'Cancelled').length;

  const totalRevenue = filteredPayments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);

  // Status badges colors (FedEx inspired high-contrast colors)
  const getStatusBadge = (status: string) => {
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

  // Monthly Revenue Data for high-contrast custom SVG Line/Area Chart
  const monthlyRevenue = [
    { month: 'Jan', revenue: 4500 },
    { month: 'Feb', revenue: 5800 },
    { month: 'Mar', revenue: 7200 },
    { month: 'Apr', revenue: 6900 },
    { month: 'May', revenue: 8900 },
    { month: 'Jun', revenue: 10400 },
    { month: 'Jul', revenue: totalRevenue > 0 ? totalRevenue : 12300 },
  ];

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue));
  const svgHeight = 140;
  const svgWidth = 600;
  const paddingX = 40;
  const paddingY = 20;

  const chartPoints = monthlyRevenue.map((p, i) => {
    const x = paddingX + (i / (monthlyRevenue.length - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - (p.revenue / maxRevenue) * (svgHeight - paddingY * 2);
    return { x, y, month: p.month, revenue: p.revenue };
  });

  const pathD = chartPoints.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = pathD
    ? `${pathD} L ${chartPoints[chartPoints.length - 1].x} ${svgHeight - paddingY} L ${chartPoints[0].x} ${svgHeight - paddingY} Z`
    : '';

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      
      {/* 1. TOP DYNAMIC BANNER: INTEGRATED LIVE METRICS & SUB-HEADER */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-gradient-to-r from-[#4D148C] via-[#320D5C] to-slate-900 rounded-3xl border border-violet-950 text-white gap-4 relative overflow-hidden shadow-xl"
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />
        <div className="space-y-1 z-10 text-left">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 border border-white/10 text-[10px] font-mono uppercase tracking-widest font-black text-[#FF6600]">
            System Status: Connected
          </div>
          <h2 className="text-xl sm:text-2xl font-sans font-black tracking-tight">Express Command Cockpit</h2>
          <p className="text-xs text-slate-300">Manage real-time waybills, active driver dispatches, and automated SMS alerts.</p>
        </div>
        <div className="flex items-center gap-3 z-10 bg-black/20 p-2.5 rounded-2xl border border-white/5 font-mono text-xs text-left">
          <div>
            <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Global Transit Efficiency</span>
            <span className="text-sm font-black text-emerald-400">99.98% On-Time SLA</span>
          </div>
          <div className="w-px h-8 bg-white/15" />
          <div className="flex items-center gap-1 text-[#FF6600]">
            <Activity size={14} className="animate-pulse" />
            <span className="font-bold text-[10px] uppercase">Active telemetry</span>
          </div>
        </div>
      </motion.div>

      {/* 1.5. DATE-RANGE FILTER BAR */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm gap-4"
      >
        <div className="flex items-center gap-2.5 text-left">
          <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/40 text-[#4D148C] dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-200/20">
            <Calendar size={18} className="stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-sm font-sans font-black text-slate-900 dark:text-white">Operational Date Range</h4>
            <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">
              {dateFilter === 'all' && 'Showing All-Time Logistics Records'}
              {dateFilter === 'today' && "Showing Today's Dispatches"}
              {dateFilter === '7days' && 'Showing Past 7 Days Operational Feed'}
            </p>
          </div>
        </div>

        {/* Segmented Control Buttons */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/60 dark:border-slate-850 self-stretch sm:self-auto justify-between sm:justify-start gap-1">
          <button
            onClick={() => setDateFilter('today')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer flex-1 sm:flex-none ${
              dateFilter === 'today'
                ? 'bg-[#4D148C] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-950 hover:bg-slate-200/40 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900/60'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDateFilter('7days')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer flex-1 sm:flex-none ${
              dateFilter === '7days'
                ? 'bg-[#4D148C] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-950 hover:bg-slate-200/40 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900/60'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDateFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer flex-1 sm:flex-none ${
              dateFilter === 'all'
                ? 'bg-[#4D148C] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-950 hover:bg-slate-200/40 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900/60'
            }`}
          >
            All Time
          </button>
        </div>
      </motion.div>

      {/* 2. OVERVIEW METRICS: HIGH-DENSITY INTENTIONAL BRAND TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Shipments */}
        <motion.div 
          variants={itemVariants}
          className="bg-white dark:bg-slate-900 border-l-4 border-l-[#4D148C] border-y border-r border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:scale-[1.01]"
        >
          <div className="space-y-1.5 text-left">
            <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 font-mono">Total Active Waybills</p>
            <h3 className="text-3xl font-sans font-black text-slate-900 dark:text-white leading-none">{totalShipmentsCount}</h3>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold font-mono flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +12.4% vs last week
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-950/40 text-[#4D148C] dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-200/20">
            <Package size={22} className="stroke-[2.5]" />
          </div>
        </motion.div>

        {/* In Transit */}
        <motion.div 
          variants={itemVariants}
          className="bg-white dark:bg-slate-900 border-l-4 border-l-[#FF6600] border-y border-r border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:scale-[1.01]"
        >
          <div className="space-y-1.5 text-left">
            <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 font-mono">In Transit Telemetry</p>
            <h3 className="text-3xl font-sans font-black text-slate-900 dark:text-white leading-none">{inTransitCount}</h3>
            <span className="text-[9px] text-[#FF6600] font-bold font-mono flex items-center gap-0.5 animate-pulse">
              <Truck size={10} /> Active road dispatches
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/30 text-[#FF6600] flex items-center justify-center shrink-0 border border-orange-200/20">
            <Truck size={22} className="stroke-[2.5]" />
          </div>
        </motion.div>

        {/* Delivered */}
        <motion.div 
          variants={itemVariants}
          className="bg-white dark:bg-slate-900 border-l-4 border-l-emerald-500 border-y border-r border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:scale-[1.01]"
        >
          <div className="space-y-1.5 text-left">
            <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 font-mono">Delivered Runs</p>
            <h3 className="text-3xl font-sans font-black text-slate-900 dark:text-white leading-none">{deliveredCount}</h3>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold font-mono flex items-center gap-0.5">
              <CheckCircle size={10} /> Successful clearing rate
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/20">
            <CheckCircle size={22} className="stroke-[2.5]" />
          </div>
        </motion.div>

        {/* Failed */}
        <motion.div 
          variants={itemVariants}
          className="bg-white dark:bg-slate-900 border-l-4 border-l-rose-500 border-y border-r border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:scale-[1.01]"
        >
          <div className="space-y-1.5 text-left">
            <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 font-mono">Cancelled exceptions</p>
            <h3 className="text-3xl font-sans font-black text-slate-900 dark:text-white leading-none">{failedCount}</h3>
            <span className="text-[9px] text-rose-500 font-bold font-mono flex items-center gap-0.5">
              <AlertTriangle size={10} /> Disruption exception rate
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/20">
            <AlertTriangle size={22} className="stroke-[2.5]" />
          </div>
        </motion.div>
      </div>

      {/* 3. MAIN COCKPIT BODY SPLIT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Hand: Revenue Analytics Area & Waybills (8/12 Columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Revenue Analytics custom chart card */}
          <motion.div 
            variants={itemVariants}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-black uppercase font-mono tracking-wider text-[#FF6600]">Invoicing Revenue Telemetry</span>
                <h4 className="text-lg font-sans font-black text-slate-900 dark:text-white">Cleared Billing Performance</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Consolidated monthly billing clearing rate trends.</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 px-4 py-2 rounded-2xl text-right">
                <span className="text-[9px] font-mono font-extrabold uppercase text-slate-400 block">Total Cleared</span>
                <p className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 leading-none pt-0.5">
                  ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* SVG Visualizer with FedEx high contrast styling */}
            <div className="w-full overflow-x-auto pt-2">
              <div className="min-w-[550px] h-[150px] relative">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                  {/* Gradients */}
                  <defs>
                    <linearGradient id="fedexPurpleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4D148C" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#4D148C" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guidelines with subtle dotted look */}
                  <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} className="stroke-slate-200 dark:stroke-slate-800" strokeDasharray="3,3" />
                  <line x1={paddingX} y1={svgHeight / 2} x2={svgWidth - paddingX} y2={svgHeight / 2} className="stroke-slate-200 dark:stroke-slate-800" strokeDasharray="3,3" />
                  <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} className="stroke-slate-200 dark:stroke-slate-800" strokeDasharray="3,3" />

                  {/* Shaded Area */}
                  {areaD && <path d={areaD} fill="url(#fedexPurpleGrad)" />}

                  {/* Area Border Line */}
                  {pathD && <path d={pathD} fill="none" stroke="#4D148C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

                  {/* Data Circles & Tooltips */}
                  {chartPoints.map((pt, i) => (
                    <g key={i} className="group cursor-pointer">
                      {/* Outer Pulse */}
                      <circle cx={pt.x} cy={pt.y} r="8" fill="#FF6600" className="opacity-0 group-hover:opacity-20 transition-opacity" />
                      {/* Inner Dot */}
                      <circle cx={pt.x} cy={pt.y} r="4.5" fill="#FF6600" className="stroke-white dark:stroke-slate-900 stroke-2 transition-all group-hover:r-6" />
                      {/* High-contrast tooltip background */}
                      <text x={pt.x} y={pt.y - 14} textAnchor="middle" className="text-[10px] font-mono font-black fill-slate-950 dark:fill-white drop-shadow-sm select-none pointer-events-none">
                        ${pt.revenue}
                      </text>
                    </g>
                  ))}

                  {/* Months Axis */}
                  {chartPoints.map((pt, i) => (
                    <text key={i} x={pt.x} y={svgHeight - 2} textAnchor="middle" className="text-[10px] font-mono font-bold fill-slate-400 dark:fill-slate-500">
                      {pt.month}
                    </text>
                  ))}
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Recent Shipments Table card (High-contrast FedEx control layout) */}
          <motion.div 
            variants={itemVariants}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm"
          >
            <div className="px-6 py-4.5 border-b border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="text-left">
                <span className="text-[10px] font-black uppercase font-mono tracking-wider text-[#FF6600]">Terminal Feed</span>
                <h4 className="text-base font-sans font-black text-slate-900 dark:text-white">Recent Dispatched Waybills</h4>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-2.5 py-1 rounded-lg">
                {filteredShipments.slice(0, 5).length} priority packets shown
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-400 font-extrabold uppercase font-mono text-[9px] tracking-wider">
                    <th className="p-4 pl-6">Waybill ID</th>
                    <th className="p-4">Sender / Origin</th>
                    <th className="p-4">Receiver / Target</th>
                    <th className="p-4">Operational Status</th>
                    <th className="p-4">EST Delivery</th>
                    <th className="p-4 pr-6 text-right">Control Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredShipments.slice(0, 5).map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-colors">
                      <td className="p-4 pl-6">
                        <span className="font-mono font-extrabold text-[#4D148C] dark:text-violet-400 block hover:underline cursor-pointer" onClick={() => onTrackShipment(s.id)}>
                          {s.id}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-mono font-medium">{s.type}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-900 dark:text-white block truncate max-w-[120px]">{s.senderName}</span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">{s.pickupAddress}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-900 dark:text-white block truncate max-w-[120px]">{s.receiverName}</span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">{s.deliveryAddress}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-black uppercase border tracking-wider ${getStatusBadge(s.status)}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-500 dark:text-slate-400">
                        {new Date(s.estimatedDelivery).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-4 pr-6 text-right flex items-center justify-end gap-1.5 pt-5">
                        <button
                          onClick={() => generateInvoicePDF(s, settings)}
                          className="px-2 py-1.5 bg-[#FF6600] hover:bg-[#e65c00] text-white font-black rounded-lg text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all border border-orange-500/20"
                          title="Generate & Download PDF Invoice"
                        >
                          <FileText size={10} /> Invoice
                        </button>
                        <button
                          onClick={() => onTrackShipment(s.id)}
                          className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-extrabold rounded-lg text-[9px] uppercase tracking-wider cursor-pointer"
                        >
                          Radar
                        </button>
                        <button
                          onClick={() => onEditShipment(s)}
                          className="px-2 py-1.5 bg-[#4D148C] hover:bg-[#3b0f6c] text-white font-extrabold rounded-lg text-[9px] uppercase tracking-wider cursor-pointer"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredShipments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400 italic">No shipments registered inside logistics system database yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Right Hand: Alert System Feed (4/12 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Automated System Alerts Container */}
          <motion.div 
            variants={itemVariants}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[540px]"
          >
            <div className="px-5 py-4 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="text-[#FF6600] animate-pulse" size={16} />
                <div className="text-left">
                  <span className="text-[10px] font-black uppercase font-mono tracking-wider text-[#FF6600]">Live Streams</span>
                  <h4 className="text-sm font-sans font-black text-slate-900 dark:text-white">SLA Automated Alerts</h4>
                </div>
              </div>
              <span className="text-[9px] font-mono bg-violet-100 dark:bg-violet-950/40 text-[#4D148C] dark:text-violet-400 px-2 py-0.5 rounded-md font-bold">
                Sat Link
              </span>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-left">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center pt-24 space-y-3">
                  <ShieldAlert size={28} className="text-slate-300 dark:text-slate-700" />
                  <p className="text-xs text-slate-400 italic text-center">No automated notification packets dispatched yet.</p>
                </div>
              ) : (
                alerts.slice(-8).reverse().map((alert) => (
                  <div key={alert.id} className="p-3.5 border border-slate-150 dark:border-slate-800/80 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 space-y-2 hover:border-violet-300 dark:hover:border-violet-900/60 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-mono font-black uppercase tracking-wider border ${
                        alert.type === 'SMS' 
                          ? 'bg-amber-100 text-amber-850 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' 
                          : 'bg-indigo-100 text-[#4D148C] border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20'
                      }`}>
                        {alert.type} Broadcast
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono font-medium">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{alert.body || alert.message}</p>
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono pt-1.5 border-t border-slate-100 dark:border-slate-850/60">
                      <span className="truncate max-w-[120px] font-medium">To: {alert.recipient}</span>
                      <span className="font-extrabold text-violet-850 dark:text-violet-400">WAYBILL: {alert.shipmentId || alert.id.slice(-6)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

      </div>
    </motion.div>
  );
}

