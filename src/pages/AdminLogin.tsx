import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck, KeyRound, Database, Settings2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

// Get Supabase credentials from any of the standard environment variable names
const getEnvVar = (key: string) => {
  return (import.meta as any).env?.[key] || '';
};

const defaultSupabaseUrl =
  getEnvVar('VITE_SUPABASE_URL') ||
  getEnvVar('NEXT_PUBLIC_SUPABASE_URL') ||
  getEnvVar('SUPABASE_URL') ||
  '';

const defaultSupabaseKey =
  getEnvVar('VITE_SUPABASE_ANON_KEY') ||
  getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  getEnvVar('SUPABASE_ANON_KEY') ||
  '';

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

  // Custom Supabase config state
  const [supabaseUrl, setSupabaseUrl] = useState(defaultSupabaseUrl);
  const [supabaseKey, setSupabaseKey] = useState(defaultSupabaseKey);
  const [showSupabaseSettings, setShowSupabaseSettings] = useState(false);
  const [supabaseClient, setSupabaseClient] = useState<any>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Initialize or re-initialize Supabase client dynamically when URL/Key changes
  useEffect(() => {
    if (supabaseUrl && supabaseKey) {
      try {
        const client = createClient(supabaseUrl, supabaseKey);
        setSupabaseClient(client);
      } catch (err) {
        console.warn('Failed to initialize Supabase client:', err);
        setSupabaseClient(null);
      }
    } else {
      setSupabaseClient(null);
    }
  }, [supabaseUrl, supabaseKey]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('expired') === 'true') {
        setError('Session expired. Please log in again.');
        window.history.replaceState(null, '', '/secure-admin-portal-9x7k');
      } else if (params.get('unauthorized') === 'true') {
        setError('Unauthorized access. Only authorized administrators are permitted.');
        window.history.replaceState(null, '', '/secure-admin-portal-9x7k');
      }
    } catch (e) {}
  }, []);

  const handleSupabaseMagicLink = async () => {
    if (!email.trim()) {
      setError('Please enter your administrative email address first.');
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const isAllowedAdmin = normalizedEmail === 'owighoyotaemmanuel424@gmail.com';
    if (!isAllowedAdmin) {
      setError('Access Denied: Only owighoyotaemmanuel424@gmail.com is permitted.');
      return;
    }

    if (!supabaseClient) {
      setError('Supabase Auth client is not active. Please provide your Supabase Project URL and Anon Key.');
      setShowSupabaseSettings(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { error: sbErr } = await supabaseClient.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: window.location.origin + '/secure-admin-portal-9x7k',
        },
      });
      if (sbErr) throw sbErr;
      setMagicLinkSent(true);
      setSuccessMsg(`Supabase Magic Link dispatched to ${normalizedEmail}. Check your inbox!`);
    } catch (err: any) {
      setError(err.message || 'Failed to send Supabase Magic Link.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Strict check to ensure authorized admin email is permitted
    const isAllowedAdmin = normalizedEmail === 'owighoyotaemmanuel424@gmail.com';
    if (!isAllowedAdmin) {
      setError('Access Denied: Only owighoyotaemmanuel424@gmail.com is permitted.');
      setLoading(false);
      return;
    }

    try {
      let authToken = '';
      let loggedUser: any = null;
      let authenticatedViaSupabase = false;

      // 2. Authenticate against Supabase Auth directly if client instance is available
      if (supabaseClient) {
        try {
          const { data: sbData, error: sbError } = await supabaseClient.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });

          if (!sbError && sbData?.session) {
            authToken = sbData.session.access_token || '';
            loggedUser = {
              id: sbData.user?.id || 'admin-supabase',
              email: normalizedEmail,
              name: sbData.user?.user_metadata?.name || 'Logify Super Admin',
              role: 'super_admin',
              status: 'active',
              authProvider: 'Supabase Auth',
            };
            authenticatedViaSupabase = true;
          } else if (sbError) {
            console.warn('Supabase Auth sign-in message:', sbError.message);
          }
        } catch (sbErr) {
          console.warn('Supabase client auth error, attempting backend sync:', sbErr);
        }
      }

      // 3. Sync with Backend Controller
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      const data = await response.json();
      if (!response.ok && !authenticatedViaSupabase) {
        throw new Error(data.error || 'Authentication failed. Please check your credentials.');
      }

      // Ensure we use the server's signed JWT token and mapped user
      authToken = data.token || authToken;
      loggedUser = data.user || loggedUser;

      if (loggedUser?.role !== 'super_admin') {
        throw new Error('Unauthorized role. Only super_admin role can access dashboard.');
      }

      const authProviderText = authenticatedViaSupabase ? 'Verified via Supabase Auth' : 'Verified via Secure Workspace Controller';
      setSuccessMsg(`Authentication successful (${authProviderText}). Redirecting...`);
      
      setTimeout(() => {
        onLoginSuccess(authToken, loggedUser);
      }, 800);
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
            Authorized administrative personnel only. System is protected by Supabase Authentication & security policies.
          </p>
        </div>

        {/* Optional Supabase Config Panel */}
        {showSupabaseSettings && (
          <div className="p-4 bg-slate-100 dark:bg-slate-950/80 border border-amber-500/30 rounded-2xl space-y-3 text-xs font-mono animate-in fade-in">
            <div className="flex items-center justify-between text-amber-400 font-bold">
              <span className="flex items-center gap-1.5 text-[11px]">
                <Database size={13} /> Supabase Project Connection
              </span>
              <button
                type="button"
                onClick={() => setShowSupabaseSettings(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                &times;
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal font-sans">
              Enter your Supabase project credentials below to connect client-side authentication directly.
            </p>

            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 uppercase font-bold">Supabase Project URL</label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-[11px] text-slate-900 dark:text-white font-mono outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 uppercase font-bold">Supabase Anon API Key</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-[11px] text-slate-900 dark:text-white font-mono outline-none focus:border-amber-500"
              />
            </div>

            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 font-sans">
              <span>Status: {supabaseClient ? <strong className="text-emerald-400">Connected</strong> : <strong className="text-amber-400">Not Connected</strong>}</span>
            </div>
          </div>
        )}

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
            <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wide flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Mail size={12} className="text-amber-500" /> Administrative Email
              </span>
              {supabaseClient && (
                <button
                  type="button"
                  onClick={handleSupabaseMagicLink}
                  className="text-[9.5px] text-amber-500 hover:underline font-mono cursor-pointer flex items-center gap-0.5"
                >
                  <Sparkles size={10} /> Send Magic Link
                </button>
              )}
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
            {supabaseClient ? 'Login via Supabase Auth' : 'Secure Admin Login'}
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

