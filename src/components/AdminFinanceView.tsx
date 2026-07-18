import React, { useState } from 'react';
import { CreditCard, DollarSign, TrendingUp, RefreshCw, CheckCircle, Clock, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Payment, Settings } from '../types.js';

interface AdminFinanceViewProps {
  payments: Payment[];
  settings: Settings;
  token: string;
  onUpdateSettings: (newSettings: Settings) => void;
  onRefresh: () => void;
}

export default function AdminFinanceView({
  payments,
  settings,
  token,
  onUpdateSettings,
  onRefresh,
}: AdminFinanceViewProps) {
  // Rate edit local state
  const [basePrice, setBasePrice] = useState(settings.pricing.basePrice);
  const [pricePerKg, setPricePerKg] = useState(settings.pricing.pricePerKg);
  const [pricePerKm, setPricePerKm] = useState(settings.pricing.pricePerKm);
  
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400';
    }
  };

  // Submit fresh pricing rates rules to settings DB
  const handleUpdateRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSyncSuccess(false);

    try {
      const updatedSettings = {
        ...settings,
        pricing: {
          basePrice: Number(basePrice),
          pricePerKg: Number(pricePerKg),
          pricePerKm: Number(pricePerKm),
        }
      };

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedSettings),
      });

      if (response.ok) {
        onUpdateSettings(updatedSettings);
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300">
      
      {/* Rate rule synchronizer card & Invoice list split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payments Invoices Ledger (2/3 width) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400">Invoicing Transactions Ledger</h2>
            <span className="text-[10px] font-mono font-bold text-slate-400">Total payments logged: {payments.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4">Invoice Party</th>
                  <th className="p-4">Billing Channel</th>
                  <th className="p-4">Invoicing Date</th>
                  <th className="p-4 text-right">Cleared Amount</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                      {p.id}
                      <span className="text-[9px] text-slate-400 block font-mono">Ref: {p.shipmentId}</span>
                    </td>
                    <td className="p-4 font-medium">{'Registered Client'}</td>
                    <td className="p-4">{p.method || 'Stripe API checkout'}</td>
                    <td className="p-4 font-mono">{new Date(p.timestamp).toLocaleDateString()}</td>
                    <td className="p-4 font-mono font-bold text-right text-slate-900 dark:text-white">
                      ${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusBadge(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 italic">No invoices clearing registered yet in our financial books.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rate Synchronizer sidebar (1/3 width) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 h-fit">
          <div className="border-b border-slate-50 dark:border-slate-800 pb-2 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400">Cargo Tariff Modifiers</h3>
            <CreditCard size={14} className="text-blue-500" />
          </div>

          {syncSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-850 border border-emerald-100 text-[11px] rounded-xl font-bold flex items-center gap-1.5 animate-pulse">
              <CheckCircle size={13} className="text-emerald-500" />
              Pricing rules successfully synced!
            </div>
          )}

          <form onSubmit={handleUpdateRates} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase font-mono">
                <span>Base Booking Price ($)</span>
                <span className="text-blue-600 font-mono font-black">${basePrice}</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="0.5"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase font-mono">
                <span>Weight modifier ($ / kg)</span>
                <span className="text-blue-600 font-mono font-black">${pricePerKg}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="20"
                step="0.1"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase font-mono">
                <span>Mileage modifier ($ / km)</span>
                <span className="text-blue-600 font-mono font-black">${pricePerKm}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.05"
                value={pricePerKm}
                onChange={(e) => setPricePerKm(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl mt-4 flex items-center justify-center gap-1 transition-all shadow-lg shadow-blue-600/15"
            >
              {loading ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
              Sync Tariff Variables
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
