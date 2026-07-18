import React from 'react';
import { BarChart2, TrendingUp, Clock, Truck, ShieldCheck, Zap, ArrowUpRight } from 'lucide-react';
import { Shipment, Driver } from '../types.js';

interface AdminAnalyticsViewProps {
  shipments: Shipment[];
  drivers: Driver[];
}

export default function AdminAnalyticsView({
  shipments,
  drivers,
}: AdminAnalyticsViewProps) {
  // Calculations
  const total = shipments.length;
  
  const standardCount = shipments.filter(s => s.type === 'Standard').length;
  const expressCount = shipments.filter(s => s.type === 'Express').length;
  const freightCount = shipments.filter(s => s.type === 'Freight').length;
  const documentCount = shipments.filter(s => s.type === 'Document').length;
  const fragileCount = shipments.filter(s => s.type === 'Fragile').length;

  // Percentage calculations
  const pctStandard = total > 0 ? Math.round((standardCount / total) * 100) : 40;
  const pctExpress = total > 0 ? Math.round((expressCount / total) * 100) : 25;
  const pctFreight = total > 0 ? Math.round((freightCount / total) * 100) : 15;
  const pctDocument = total > 0 ? Math.round((documentCount / total) * 100) : 10;
  const pctFragile = total > 0 ? Math.round((fragileCount / total) * 100) : 10;

  return (
    <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300">
      
      {/* Cards layout */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* On-Time Run Metric */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-2">
          <span className="text-[9px] uppercase font-bold tracking-wider font-mono text-slate-400">On-Time Clearance</span>
          <div className="flex justify-between items-end">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">98.4%</h3>
            <span className="text-[10px] text-emerald-500 font-mono font-bold flex items-center gap-0.5">
              <ArrowUpRight size={11} /> +1.2%
            </span>
          </div>
          <p className="text-[10px] text-slate-400">Maintained across commercial air and road segment runs.</p>
        </div>

        {/* Avg Delivery Duration */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-2">
          <span className="text-[9px] uppercase font-bold tracking-wider font-mono text-slate-400">Average Seg Transit</span>
          <div className="flex justify-between items-end">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">26.8h</h3>
            <span className="text-[10px] text-blue-500 font-mono font-medium flex items-center gap-0.5">
              <Zap size={11} className="text-blue-500 animate-pulse" /> Fast track
            </span>
          </div>
          <p className="text-[10px] text-slate-400">From consignor collections dispatch to terminal clearing.</p>
        </div>

        {/* Dispatch Utilization */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-2">
          <span className="text-[9px] uppercase font-bold tracking-wider font-mono text-slate-400">Active Fleet Load</span>
          <div className="flex justify-between items-end">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-mono">82.5%</h3>
            <span className="text-[10px] text-emerald-500 font-mono font-bold">Optimal</span>
          </div>
          <p className="text-[10px] text-slate-400">Current carrier agent route and payload distribution ratio.</p>
        </div>
      </div>

      {/* Analytics Visualization modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Cargo categories breakdown bar (2/3 width) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm space-y-5">
          <div className="border-b border-slate-50 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400">Cargo Fleet Classification</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Statistical ratio of active logistics package categories.</p>
          </div>

          <div className="space-y-4">
            {/* Standard */}
            <div className="space-y-1">
              <div className="flex justify-between font-mono text-[10px] text-slate-500 font-bold">
                <span>Standard Freight Cargo ({standardCount} waybills)</span>
                <span>{pctStandard}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pctStandard}%` }}></div>
              </div>
            </div>

            {/* Express */}
            <div className="space-y-1">
              <div className="flex justify-between font-mono text-[10px] text-slate-500 font-bold">
                <span>Expedited Priority Segment ({expressCount} waybills)</span>
                <span>{pctExpress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${pctExpress}%` }}></div>
              </div>
            </div>

            {/* Freight */}
            <div className="space-y-1">
              <div className="flex justify-between font-mono text-[10px] text-slate-500 font-bold">
                <span>Heavy Industrial Freight ({freightCount} waybills)</span>
                <span>{pctFreight}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pctFreight}%` }}></div>
              </div>
            </div>

            {/* Document */}
            <div className="space-y-1">
              <div className="flex justify-between font-mono text-[10px] text-slate-500 font-bold">
                <span>Secure Documents ({documentCount} waybills)</span>
                <span>{pctDocument}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pctDocument}%` }}></div>
              </div>
            </div>

            {/* Fragile */}
            <div className="space-y-1">
              <div className="flex justify-between font-mono text-[10px] text-slate-500 font-bold">
                <span>Fragile Electronics / Elements ({fragileCount} waybills)</span>
                <span>{pctFragile}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pctFragile}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Transit segment intervals (1/3 width) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
          <div className="border-b border-slate-50 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400">Segment Milestones Timeline</h3>
          </div>

          <div className="space-y-4 pt-1 font-mono text-[10px]">
            <div className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                1
              </div>
              <div className="space-y-0.5">
                <h5 className="font-bold text-slate-800 dark:text-white">Waybill Registration</h5>
                <p className="text-slate-400 font-sans leading-tight">Average 12 minutes until dispatch pool assignment.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                2
              </div>
              <div className="space-y-0.5">
                <h5 className="font-bold text-slate-800 dark:text-white">Consignor Collection</h5>
                <p className="text-slate-400 font-sans leading-tight">Average 2.4 hours from carrier assignment to cargo scan.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                3
              </div>
              <div className="space-y-0.5">
                <h5 className="font-bold text-slate-800 dark:text-white">Transit Hub Corridors</h5>
                <p className="text-slate-400 font-sans leading-tight">Average 18.5 hours in routing sorting depots.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                4
              </div>
              <div className="space-y-0.5">
                <h5 className="font-bold text-slate-800 dark:text-white">Consignee Delivery</h5>
                <p className="text-slate-400 font-sans leading-tight">Average 1.8 hours from courier dispatch to clearing signature.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
