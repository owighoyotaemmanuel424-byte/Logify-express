import React from 'react';
import { Truck, LogOut, LayoutDashboard, Menu, X, Sun, Moon, MapPinned, Package, ChevronRight } from 'lucide-react';
import { User, Settings } from '../types.js';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  user: User | null;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  settings?: Settings;
}

export default function Navbar({ currentView, onNavigate, user, onLogout, theme, onToggleTheme, settings }: NavbarProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const companyName = settings?.companyName || 'Logify Logistics';
  const navItems = [
    { label: 'Overview', view: 'home' },
    { label: 'Shipments', view: 'send' },
    { label: 'Tracking', view: 'track' },
    { label: 'Rates', view: 'pricing' },
    { label: 'Company', view: 'about' },
    { label: 'Support', view: 'contact' },
  ];

  const navigate = (view: string) => { onNavigate(view); setIsOpen(false); };

  return (
    <>
      <div className="logistics-status-bar hidden sm:block text-[10px] font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between">
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Network operational · 99.98% on-time</div>
          <div className="flex items-center gap-4 text-slate-400"><span>GLOBAL FREIGHT NETWORK</span><span>24/7 CONTROL TOWER</span></div>
        </div>
      </div>
      <nav className="sticky top-0 z-45 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#071521]/95 backdrop-blur-xl transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px]">
            <button onClick={() => navigate('home')} className="flex items-center gap-3 cursor-pointer group" aria-label={`${companyName} home`}>
              <span className="relative w-10 h-10 rounded-xl bg-[#0b1f33] text-white flex items-center justify-center shadow-lg shadow-slate-900/10 group-hover:-translate-y-0.5 transition-transform">
                <Truck size={19} strokeWidth={2.4} />
                <span className="absolute -right-1 -bottom-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white dark:border-[#071521]" />
              </span>
              <span className="text-left leading-none">
                <span className="block font-display font-bold text-xl tracking-tight text-[#0b1f33] dark:text-white">Logify</span>
                <span className="block mt-1 text-[8px] font-mono font-bold tracking-[.22em] text-slate-400 uppercase">Logistics Network</span>
              </span>
            </button>

            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <button key={item.view} onClick={() => navigate(item.view)} className={`px-3.5 py-2.5 rounded-lg text-[11px] font-bold tracking-wide transition-all cursor-pointer ${currentView === item.view ? 'bg-slate-100 text-[#0b1f33] dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-[#0b1f33] hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900'}`}>
                  {item.label}
                </button>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-2.5">
              <button onClick={onToggleTheme} className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer" aria-label="Toggle theme">
                {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
              </button>
              <button onClick={() => navigate('track')} className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#0b1f33] text-[11px] font-black transition-colors cursor-pointer shadow-sm">
                <MapPinned size={14} /> Track shipment
              </button>
              {user && <>
                <button onClick={() => navigate('admin')} className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#0b1f33] hover:bg-[#123552] text-white text-[11px] font-black rounded-lg transition-colors cursor-pointer"><LayoutDashboard size={14} /> Control tower</button>
                <button onClick={onLogout} className="p-2.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer" aria-label="Log out"><LogOut size={15} /></button>
              </>}
            </div>

            <div className="lg:hidden flex items-center gap-2">
              <button onClick={onToggleTheme} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 cursor-pointer" aria-label="Toggle theme">{theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}</button>
              <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer" aria-label="Open menu">{isOpen ? <X size={20} /> : <Menu size={20} />}</button>
            </div>
          </div>
        </div>

        {isOpen && <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071521] px-4 py-4 space-y-1 shadow-xl">
          {navItems.map((item) => <button key={item.view} onClick={() => navigate(item.view)} className={`flex items-center justify-between w-full text-left px-3 py-3 rounded-lg text-sm font-bold cursor-pointer ${currentView === item.view ? 'bg-slate-100 text-[#0b1f33] dark:bg-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><span className="flex items-center gap-2"><Package size={15} />{item.label}</span><ChevronRight size={14} /></button>)}
          <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button onClick={() => navigate('track')} className="w-full py-3 rounded-lg bg-amber-400 text-[#0b1f33] text-xs font-black cursor-pointer">Track shipment</button>
            {user && <><button onClick={() => navigate('admin')} className="w-full py-3 rounded-lg bg-[#0b1f33] text-white text-xs font-black cursor-pointer">Open control tower</button><button onClick={() => { setIsOpen(false); onLogout(); }} className="w-full py-3 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer">Log out</button></>}
          </div>
        </div>}
      </nav>
    </>
  );
}
