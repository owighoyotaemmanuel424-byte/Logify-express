import React, { useState, useEffect } from 'react';
import { Lock, Mail, ArrowRight, Loader2, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminLoginProps {
  onLoginSuccess: (token: string, user: any) => void;
  onNavigate?: (view: string) => void;
}

export default function AdminLogin({ onLoginSuccess, onNavigate }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('expired') === 'true') {
        setError('Session expired. Please log in again.');
        window.history.replaceState(null, '', '/admin/login');
      } else if (params.get('unauthorized') === 'true') {
        setError('Unauthorized access. Only authorized administrators are permitted.');
        window.history.replaceState(null, '', '/admin/login');
      }
    } catch (e) {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const normalizedEmail = email.trim().toLowerCase();

    // Strict check to ensure authorized admin email is permitted
    const isAllowedAdmin = normalizedEmail === 'owighoyotaemmanuel424@gmail.com';
    if (!isAllowedAdmin) {
      setError('Access Denied: Only owighoyotaemmanuel424@gmail.com is permitted.');
      setLoading(false);
      return;
    }

    try {
      let sbToken = '';
      
      // 1. Authenticate via Supabase Auth client if initialized
      if (supabase) {
        try {
          const { data: sbData, error: sbErr } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });
          if (!sbErr && sbData?.session) {
            sbToken = sbData.session.access_token;
          }
        } catch (sbException) {
          console.warn('Supabase client authentication notice:', sbException);
        }
      }

      // 2. Authenticate with backend workspace controller
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed. Please check your credentials.');
      }

      if (data.user?.role !== 'super_admin' && data.user?.role !== 'admin') {
        throw new Error('Unauthorized role. Only admin role can access dashboard.');
      }

      const activeToken = sbToken || data.token;
      setSuccessMsg('Supabase Admin Authentication successful. Redirecting to /admin/dashboard...');
      
      setTimeout(() => {
        onLoginSuccess(activeToken, data.user);
      }, 700);
    } catch (e: any) {
      setError(e.message || 'Authentication service error.');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-left">
        
        {/* Header/Logo */}
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-1">
            <Lock size={20} />
          </div>
          <h2 className="text-xl font-sans font-black text-slate-900 dark:text-white uppercase tracking-tight">
            ADMIN WORKSPACE ACCESS
          </h2>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
            Authorized administrative personnel only. System is protected by end-to-end security policies.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs font-bold leading-relaxed flex items-start gap-2">
            <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={15} className="animate-pulse text-emerald-500 shrink-0" />
            <div>{successMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wide flex items-center gap-1">
              <Mail size={12} className="text-amber-500" /> Administrative Email
            </label>
            <input
              type="email"
              required
              placeholder="e.g. owighoyotaemmanuel424@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-all text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wide flex items-center gap-1">
              <KeyRound size={12} className="text-amber-500" /> Workspace Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-all text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            Secure Admin Login
            <ArrowRight size={13} />
          </button>
        </form>

        {/* Back to Public Site */}
        {onNavigate && (
          <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="text-[11px] font-mono text-slate-500 hover:text-amber-500 transition-colors cursor-pointer"
            >
              &larr; Return to Public Logistics Site
            </button>
          </div>
        )}

      </div>
    </div>
  );
}


