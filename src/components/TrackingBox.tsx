import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface TrackingBoxProps {
  onTrack: (trackingNumber: string) => void;
  className?: string;
}

export default function TrackingBox({ onTrack, className = '' }: TrackingBoxProps) {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number.');
      return;
    }

    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      onTrack(trackingNumber.trim().toUpperCase());
    }, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-xl p-5 sm:p-6 w-full max-w-xl mx-auto ${className}`}
      id="tracking-box-container"
    >
      <div className="space-y-4">
        <div className="text-left">
          <span className="text-[10px] font-mono font-black text-dhl-red uppercase tracking-wider block mb-1">
            Real-time Logistics Engine
          </span>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            Track Your Shipment
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Enter your waybill or order tracking reference number to inspect real-time progress.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3" id="tracking-box-form">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => {
                setTrackingNumber(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g., LOG-739102-US, TRK-99210-DE"
              className={`block w-full pl-11 pr-4 py-3 border rounded-xl text-sm font-medium tracking-wide transition-all bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-dhl-yellow focus:border-dhl-yellow/50 outline-none text-slate-900 dark:text-white dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:focus:bg-slate-900 ${
                error
                  ? 'border-red-500 focus:ring-red-500/25 focus:border-red-500'
                  : 'border-slate-200 dark:border-slate-700/80'
              }`}
              id="tracking-input-field"
            />
          </div>

          {error && (
            <p className="text-xs font-bold text-red-600 dark:text-red-400 text-left pl-1">
              {error}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              disabled={isSearching}
              className="w-full sm:w-auto sm:flex-1 py-3 px-6 bg-[#111111] hover:bg-black text-[#FFCC00] hover:text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 border border-slate-800"
              id="tracking-submit-btn"
            >
              {isSearching ? (
                <>
                  <Loader2 size={14} className="animate-spin text-[#FFCC00]" />
                  <span>Searching Ledger...</span>
                </>
              ) : (
                <>
                  <span>Track</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>SLA Grace Window: 15 mins</span>
          <span className="text-emerald-500 font-bold">● Operations Online</span>
        </div>
      </div>
    </motion.div>
  );
}
