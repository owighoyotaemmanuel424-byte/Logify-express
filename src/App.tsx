import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, HelpCircle, ShieldCheck, Ship, Plane, Truck, Warehouse, Lock, ArrowRight, Loader2 } from 'lucide-react';
import Navbar from './components/Navbar.tsx';
import Footer from './components/Footer.tsx';
import Hero from './components/Hero.tsx';
import PublicTracker from './components/PublicTracker.tsx';
import QuoteCalculator from './components/QuoteCalculator.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import PublicLiveChat from './components/PublicLiveChat.tsx';
import SendPackagePage from './components/pages/SendPackagePage.tsx';
import PricingPage from './components/pages/PricingPage.tsx';
import AboutPage from './components/pages/AboutPage.tsx';
import AuthPage from './components/pages/AuthPage.tsx';
import { User, Settings } from './types.js';

export default function App() {
  const [view, setView] = useState<string>('home');
  const [trackId, setTrackId] = useState<string>('');
  
  // Auth state
  const [token, setToken] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem('logify_token');
      if (stored) return stored;
      
      // Fallback to cookie for robust mobile/Safari session persistence
      const cookieMatch = document.cookie.match(/(^|;)\s*logify_token\s*=\s*([^;]+)/);
      if (cookieMatch) {
        const decoded = decodeURIComponent(cookieMatch[2]);
        localStorage.setItem('logify_token', decoded);
        return decoded;
      }
    } catch (e) {
      console.warn('Failed to retrieve authentication token:', e);
    }
    return null;
  });
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<Settings>({
    companyName: 'Logify Logistics',
    contactEmail: 'operations@logify.com',
    contactPhone: '+1 (800) 555-LOGI',
    pricing: {
      basePrice: 15.0,
      pricePerKg: 2.5,
      pricePerKm: 0.15,
    },
  });

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('logify_theme');
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    } catch (e) {
      console.warn('localStorage not accessible:', e);
    }

    try {
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {}

    return 'light';
  });

  // Sync theme with HTML document class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('logify_theme', theme);
    } catch (e) {
      console.warn('Failed to save theme in localStorage:', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Fetch settings from server on boot
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => setSettings(data))
      .catch(() => {});
  }, []);

  // Sync user profile if token exists
  const fetchProfile = async (authToken: string) => {
    setAuthLoading(true);
    try {
      const response = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.ok) {
        const uData = await response.json();
        const uEmail = uData?.email?.trim().toLowerCase();
        const isSuperAdmin = uEmail === 'expresslogify@gmail.com' && uData?.role === 'super_admin';
        if (!isSuperAdmin) {
          // Immediately sign out and redirect to the admin login page
          localStorage.removeItem('logify_token');
          document.cookie = `logify_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax; Secure`;
          setToken(null);
          setUser(null);
          window.history.replaceState(null, '', '/admin/login?unauthorized=true');
          setView('auth');
        } else {
          setUser(uData);
        }
      } else {
        // Stale or invalid token
        handleLogout(true);
      }
    } catch (err) {
      handleLogout(true);
    } finally {
      setAuthLoading(false);
    }
  };

  const syncViewWithLocation = () => {
    const path = window.location.pathname;
    if (path === '/' || path === '/home') {
      setView('home');
    } else if (path === '/track' || path === '/tracking') {
      setView('track');
    } else if (path === '/send') {
      setView('send');
    } else if (path === '/pricing') {
      setView('pricing');
    } else if (path === '/about') {
      setView('about');
    } else if (path === '/contact') {
      setView('contact');
    } else if (path === '/admin/login') {
      setView('auth');
    } else if (path === '/login' || path === '/register' || path === '/auth' || path === '/admin-login') {
      // Secretly deflect any user trying public standard paths to the main landing page
      window.history.replaceState(null, '', '/');
      setView('home');
    } else if (path === '/admin' || path.startsWith('/admin/')) {
      const storedToken = localStorage.getItem('logify_token');
      if (!storedToken) {
        window.history.replaceState(null, '', '/admin/login');
        setView('auth');
      } else {
        setView('admin');
      }
    } else {
      setView('home');
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    }
    syncViewWithLocation();
    const handlePopState = () => {
      syncViewWithLocation();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [token]);

  const handleLoginSuccess = (authToken: string, loggedUser: User) => {
    try {
      localStorage.setItem('logify_token', authToken);
      // Set backup cookie (7 days) for Safari / iPhone reliability
      const expires = new Date(Date.now() + 7 * 864e5).toUTCString();
      document.cookie = `logify_token=${encodeURIComponent(authToken)}; expires=${expires}; path=/; SameSite=Lax; Secure`;
    } catch (e) {
      console.warn('Failed to persist auth token:', e);
    }
    
    setToken(authToken);
    setUser(loggedUser);
    
    // Redirect directly to admin panel for full administrative control
    window.history.pushState(null, '', '/admin');
    setView('admin');
  };

  const handleLogout = (expired = false) => {
    try {
      localStorage.removeItem('logify_token');
      document.cookie = `logify_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax; Secure`;
    } catch (e) {
      console.warn('Failed to clear auth token persistence:', e);
    }
    setToken(null);
    setUser(null);
    
    if (expired) {
      window.history.pushState(null, '', '/admin/login?expired=true');
      setView('auth');
    } else {
      window.history.pushState(null, '', '/admin/login');
      setView('auth');
    }
  };

  // Handle direct navigation
  const handleNavigate = (newView: string) => {
    let path = '/';
    if (newView === 'home') path = '/';
    else if (newView === 'track' || newView === 'tracking') path = '/track';
    else if (newView === 'send') path = '/send';
    else if (newView === 'pricing') path = '/pricing';
    else if (newView === 'about') path = '/about';
    else if (newView === 'contact') path = '/contact';
    else if (newView === 'auth') {
      path = '/admin/login';
    } else if (newView === 'admin') {
      if (!token) {
        path = '/admin/login';
        newView = 'auth';
      } else {
        path = '/admin';
      }
    } else {
      path = '/' + newView;
    }

    window.history.pushState(null, '', path);
    setView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  // Services informational page
  function ServicesPage() {
    const serviceTiers = [
      {
        icon: <Plane className="text-amber-500 shrink-0" size={32} />,
        name: 'Express Air Freight',
        desc: 'Global overnight delivery segments. Supported by expedited customs clearance waybills and high-priority airport warehouse priority handling.',
        specs: ['Overnight dispatch loops', 'AeroWaybill digital audit trails', 'Temperature-controlled cargo bays'],
        image: '/src/assets/images/air_freight_solution_1784467339500.jpg',
      },
      {
        icon: <Ship className="text-amber-500 shrink-0" size={32} />,
        name: 'Continental Ocean Cargo',
        desc: 'High-volume sea freight distribution for heavy machinery, bulk merchandise, or full container loads (FCL) across global naval trade corridors.',
        specs: ['Seaport terminal custom logs', 'FCL & LCL storage units', 'Satellite waybill tracking telemetry'],
        image: '/src/assets/images/ocean_cargo_solution_1784467350305.jpg',
      },
      {
        icon: <Truck className="text-amber-500 shrink-0" size={32} />,
        name: 'Last-Mile Express Distribution',
        desc: 'Localized parcel logistics, connecting commercial shipping depots straight to doorstep targets with extreme precision and real-time navigation updates.',
        specs: ['Guaranteed delivery corridors', 'Real-time driver location mapping', 'Paperless client-signature receipts'],
        image: '/src/assets/images/last_mile_solution_1784467362755.jpg',
      },
      {
        icon: <Warehouse className="text-amber-500 shrink-0" size={32} />,
        name: 'Smart Storage & Warehousing',
        desc: 'Highly organized stock depots featuring advanced telemetry inventory indexing, real-time climate monitoring sensors, and bulk dispatch packing lines.',
        specs: ['Frictionless API stock audits', '24/7 camera monitoring feeds', 'Dynamic truck dispatch ramps'],
        image: '/src/assets/images/warehouse_solution_1784467375578.jpg',
      },
    ];

    return (
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-12 animate-fade-in">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <span className="text-[10px] font-mono font-black text-[#D40511] uppercase tracking-widest block">Our Fleet Capabilities</span>
          <h1 className="text-4xl font-sans font-black text-slate-900 dark:text-white uppercase tracking-tight">Commercial Logistics Divisions</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Logify operates an intelligent multi-modal delivery grid, matching automated vehicle dispatches with precise air, land, and sea operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {serviceTiers.map((tier, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col group text-left"
            >
              <div className="relative h-48 sm:h-56 overflow-hidden bg-slate-100 dark:bg-slate-950">
                <img
                  src={tier.image}
                  alt={tier.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 w-12 h-12 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/10 flex items-center justify-center text-[#FFCC00] shadow-md">
                  {tier.icon}
                </div>
              </div>
              
              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{tier.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{tier.desc}</p>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {tier.specs.map((s, sidx) => (
                    <span key={sidx} className="text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-bold px-3 py-1 rounded-full uppercase tracking-wider font-mono">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Contact page
  function ContactPage() {
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    const handleContactSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setTimeout(() => {
        setSubmitting(false);
        setSent(true);
      }, 1500);
    };

    return (
      <div className="max-w-5xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8 flex flex-col justify-center">
          <div className="space-y-3">
            <h1 className="text-4xl font-sans font-black text-slate-900 dark:text-white">Connect with Shipping Support</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Have questions regarding multi-modal logistics contracts, API key integrations, custom warehouse spacing, or billing waybills? Get in touch with our operations center.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <MapPin size={18} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white uppercase font-mono text-[10px] tracking-wider text-slate-400">Headquarters</h4>
                <p className="text-slate-600 dark:text-slate-300">100 Broadway, New York, NY 10005, United States</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Mail size={18} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white uppercase font-mono text-[10px] tracking-wider text-slate-400">Operations Email</h4>
                <p className="text-slate-600 dark:text-slate-300">{settings.contactEmail}</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Phone size={18} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white uppercase font-mono text-[10px] tracking-wider text-slate-400">Emergency Hotline</h4>
                <p className="text-slate-600 dark:text-slate-300">{settings.contactPhone}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-3xl shadow-md">
          {sent ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
              <ShieldCheck className="text-emerald-500 animate-pulse" size={48} />
              <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase font-mono">Transmission Dispatched</h3>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Your communication waybill has been safely routed to our operations queue. A manager will reply within 45 minutes.
              </p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
              <h3 className="text-sm font-bold uppercase font-mono text-slate-400 tracking-wider">Leave an Inquiry</h3>
              
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold">Sender Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jack Henderson"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jhenderson@company.com"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold">Message Details</label>
                <textarea
                  required
                  rows={4}
                  placeholder="How can our dispatch coordinators assist your supply chain?"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md mt-4"
              >
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Send Message Waybill
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  function MaintenancePage() {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[75vh] px-4 py-16 bg-[#0b0b0b] text-neutral-300">
        <div className="max-w-md w-full bg-neutral-900/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-orange-500/5">
          <div className="relative w-20 h-20 bg-[#ff7a1a]/10 border border-[#ff7a1a]/20 text-[#ff7a1a] rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <Lock className="animate-pulse text-[#ff7a1a]" size={36} />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white tracking-tight uppercase">
              {settings.companyName || 'Logify'} System Upgrade
            </h1>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Our transit database and auto-routing dispatch algorithms are currently undergoing scheduled upgrades to optimize continental logistics flow.
            </p>
          </div>

          <div className="p-3 bg-neutral-950/40 border border-neutral-800 rounded-xl text-[11px] leading-relaxed text-neutral-500 font-mono">
            ESTIMATED COMPLETION: <span className="text-[#ff7a1a] font-bold">15 MIN</span>
          </div>


        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-300">
      {/* Header bar */}
      {view !== 'admin' && settings.isSiteActive !== false && (
        <Navbar
          currentView={view}
          onNavigate={handleNavigate}
          user={user}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
          settings={settings}
        />
      )}

      {/* Main page content layout switcher */}
      <div className="flex-1 flex flex-col">
        {authLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
            <Loader2 className="text-amber-500 animate-spin" size={36} />
            <p className="text-xs font-mono text-slate-400 mt-2">Authenticating credentials...</p>
          </div>
        ) : settings.isSiteActive === false && view !== 'admin' && view !== 'auth' ? (
          <MaintenancePage />
        ) : (
          <>
            {view === 'home' && (
              <Hero
                onNavigate={handleNavigate}
                onSetTrackId={(id) => {
                  setTrackId(id);
                }}
              />
            )}

            {view === 'track' && (
              <PublicTracker
                initialTrackId={trackId}
                onClearTrackId={() => {
                  setTrackId('');
                }}
                theme={theme}
                settings={settings}
              />
            )}

            {view === 'send' && (
              <SendPackagePage
                settings={settings}
                onNavigate={handleNavigate}
                onSetTrackId={setTrackId}
              />
            )}

            {view === 'pricing' && (
              <PricingPage
                settings={settings}
                onNavigate={handleNavigate}
              />
            )}

            {view === 'about' && (
              <AboutPage
                onNavigate={handleNavigate}
              />
            )}

            {view === 'quote' && (
              <QuoteCalculator
                settings={settings}
                onNavigate={handleNavigate}
                token={token}
              />
            )}

            {view === 'services' && <ServicesPage />}

            {view === 'contact' && <ContactPage />}

            {view === 'auth' && (
              <AuthPage
                onLoginSuccess={handleLoginSuccess}
                onNavigate={handleNavigate}
              />
            )}

            {view === 'admin' && user && token && (
              <AdminPanel
                user={user}
                token={token}
                settings={settings}
                onUpdateSettings={(newS) => setSettings(newS)}
                onLogout={handleLogout}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            )}
          </>
        )}
      </div>

      {/* Footer bar */}
      {view !== 'admin' && <Footer onNavigate={handleNavigate} settings={settings} />}

      {/* Floating Live Chat Widget */}
      {view !== 'admin' && settings.enableLiveChat !== false && (
        <PublicLiveChat companyName={settings.companyName || 'Logify'} />
      )}
    </div>
  );
}
