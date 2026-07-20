import React, { useState, useEffect } from 'react';
import { Lock, Mail, Phone, User, ArrowRight, Loader2, ShieldCheck, EyeOff, KeyRound } from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess: (token: string, user: any) => void;
  onNavigate: (view: string) => void;
}

export default function AuthPage({ onLoginSuccess, onNavigate }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Check for expired session query parameter
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('expired') === 'true') {
        setError('Session expired. Please log in again.');
        // Clean URL parameter
        window.history.replaceState(null, '', '/login');
      }
    } catch (e) {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    
    // Validations
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Sign Up Flow
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, phone }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Registration failed. Please check your network or try a different email.');
        }

        setSuccessMsg('Registration successful! Accessing workspace...');
        
        // Auto sign-in
        setTimeout(() => {
          onLoginSuccess(data.token, data.user);
        }, 1500);

      } else {
        // Sign In Flow
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Invalid credentials or connection issue.');
        }

        setSuccessMsg('Authentication verified. Welcome back!');
        
        setTimeout(() => {
          onLoginSuccess(data.token, data.user);
        }, 1000);
      }
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
            {isSignUp ? 'Create Staff Account' : 'Logify Workspace Access'}
          </h2>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
            {isSignUp 
              ? 'Register a new administrative member to manage waybills, transit telemetry, and billing.'
              : 'Access real-time shipping telemetry, waybills, and fleet management panels. Secure access only.'
            }
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              !isSignUp 
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              isSignUp 
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs font-bold">
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
          {isSignUp && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wide flex items-center gap-1">
                  <User size={12} className="text-blue-500" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wide flex items-center gap-1">
                  <Phone size={12} className="text-blue-500" /> Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +1 555-0100"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all text-slate-900 dark:text-white"
                />
              </div>
            </>
          )}

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
              <KeyRound size={12} className="text-blue-500" /> Account Password
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
            {isSignUp ? 'Create Workspace Account' : 'Sign In to Workspace'}
            <ArrowRight size={13} />
          </button>
        </form>

      </div>
    </div>
  );
}
