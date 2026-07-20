import React, { useState } from 'react';
import { Lock, Mail, Phone, User, ArrowRight, Loader2, Sparkles, CheckSquare, EyeOff, ShieldCheck } from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess: (token: string, user: any) => void;
  onNavigate: (view: string) => void;
}

export default function AuthPage({ onLoginSuccess, onNavigate }: AuthPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    
    try {
      // Standard Login
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || 'Invalid credentials');
      }

      const data = await response.json();
      onLoginSuccess(data.token, data.user);
    } catch (e: any) {
      setError(e.message || 'Authentication node communication error.');
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: quickEmail, password: 'password123' }),
      });

      if (response.ok) {
        const data = await response.json();
        onLoginSuccess(data.token, data.user);
      } else {
        throw new Error('Quick login node stale.');
      }
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-880 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-left">
        
        {/* Heading */}
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto mb-1">
            <Lock size={20} />
          </div>
          <h2 className="text-xl font-sans font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Logify Staff & Admin Access
          </h2>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
            Access real-time shipping telemetry, waybills, and fleet management panels. Only authorized administrators can log in.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs font-bold">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck size={14} className="animate-pulse" />
            {successMsg}
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wide flex items-center gap-1">
              <Mail size={12} className="text-blue-500" /> Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. sarah@logify.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wide flex items-center gap-1">
              <EyeOff size={12} className="text-blue-500" /> Account Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/10 cursor-pointer"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            Sign In to Workspace
            <ArrowRight size={13} />
          </button>
        </form>

        {/* Sandbox quick access logins */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-2">
          <h4 className="text-[9px] text-slate-400 font-black uppercase tracking-wider text-center">
            Authorized Admin Credentials
          </h4>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <button
              onClick={() => handleQuickLogin('sarah@logify.com')}
              className="p-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-250/20 dark:border-slate-850 rounded-xl text-left flex items-center justify-between font-bold text-slate-700 dark:text-slate-300"
            >
              <span>Manager Sarah <span className="text-[9px] text-slate-400 font-mono font-normal">(sarah@logify.com)</span></span>
              <ArrowRight size={12} className="text-blue-500" />
            </button>

            <button
              onClick={() => handleQuickLogin('courier@logify.com')}
              className="p-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-250/20 dark:border-slate-850 rounded-xl text-left flex items-center justify-between font-bold text-slate-700 dark:text-slate-300"
            >
              <span>Courier Robert <span className="text-[9px] text-slate-400 font-mono font-normal">(courier@logify.com)</span></span>
              <ArrowRight size={12} className="text-blue-500" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
