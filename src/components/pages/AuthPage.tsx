import React, { useState, useEffect } from 'react';
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck, KeyRound } from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess: (token: string, user: any) => void;
  onNavigate: (view: string) => void;
}

export default function AuthPage({ onLoginSuccess, onNavigate }: AuthPageProps) {
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Check for expired session query parameter or unauthorized role
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('expired') === 'true') {
        setError('Session expired. Please log in again.');
        // Clean URL parameter
        window.history.replaceState(null, '', '/login');
      } else if (params.get('unauthorized') === 'true') {
        setError('Unauthorized access. Only authorized administrators are permitted to enter this workspace.');
        window.history.replaceState(null, '', '/login');
      }
    } catch (e) {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    // Strict client-side protection: hard restrict domain or specific admin email if requested
    // Let's allow either admin@logify.com or a valid @logify.com account.
    const normalizedEmail = email.trim().toLowerCase();
    
    try {
      // Sign In Flow
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Invalid credentials or connection issue.');
      }

      // Check if user is an authorized admin email
      const isAdmin = normalizedEmail === 'admin@logify.com';

      if (!isAdmin) {
        // Silently deflect unauthorized user back to main landing page
        window.history.replaceState(null, '', '/');
        window.location.href = '/';
        return;
      }

      setSuccessMsg('Authentication verified. Accessing secure dashboard...');
      
      setTimeout(() => {
        onLoginSuccess(data.token, data.user);
      }, 1000);
    } catch (e: any) {
      setError(e.message || 'Authentication service communication error.');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-left">
        
        {/* Heading */}
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto mb-1">
            <Lock size={20} />
          </div>
          <h2 className="text-xl font-sans font-black text-slate-900 dark:text-white uppercase tracking-tight">
            LOGIFY WORKSPACE ACCESS
          </h2>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
            Authorized administrative personnel only. Real-time shipping telemetry, security waybills, and fleet routing control systems.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs font-bold leading-relaxed">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck size={14} className="animate-pulse text-emerald-500" />
            {successMsg}
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wide flex items-center gap-1">
              <Mail size={12} className="text-blue-500" /> Administrative Email
            </label>
            <input
              type="email"
              required
              placeholder="e.g. admin@logify.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wide flex items-center gap-1">
              <KeyRound size={12} className="text-blue-500" /> Workspace Password
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
            Secure Access Auth
            <ArrowRight size={13} />
          </button>
        </form>

      </div>
    </div>
  );
}
