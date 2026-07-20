import React from 'react';
import { Truck, LogIn, LogOut, LayoutDashboard, Menu, X, Sun, Moon } from 'lucide-react';
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

export default function Navbar({
  currentView,
  onNavigate,
  user,
  onLogout,
  theme,
  onToggleTheme,
  settings,
}: NavbarProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const companyName = settings?.companyName || 'Logify';

  const navItems = [
    { label: 'Home', view: 'home' },
    { label: 'Send Package', view: 'send' },
    { label: 'Tracking', view: 'track' },
    { label: 'Pricing', view: 'pricing' },
    { label: 'About Us', view: 'about' },
    { label: 'Contact', view: 'contact' },
  ];

  return (
    <nav className="sticky top-0 z-45 w-full border-b backdrop-blur-md bg-white/90 border-slate-200 dark:bg-slate-950/90 dark:border-slate-850/80 transition-colors duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FFCC00] flex items-center justify-center text-[#D40511] font-black shadow-md group-hover:scale-105 transition-transform duration-300">
              <Truck size={20} className="fill-current" />
            </div>
            <span className="font-sans font-black text-xl tracking-tight text-slate-900 dark:text-white uppercase">
              <span className="text-[#D40511] dark:text-[#FFCC00]">Log</span>
              <span className="text-slate-900 dark:text-white">ify</span>
            </span>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => {
                  onNavigate(item.view);
                  setIsOpen(false);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-colors cursor-pointer ${
                  currentView === item.view
                    ? 'bg-[#FFCC00]/15 text-[#D40511] dark:bg-[#FFCC00]/20 dark:text-[#FFCC00]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Controls */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Dark/Light mode selector */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 transition-colors cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {user && (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => onNavigate('admin')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#D40511] hover:bg-[#b8000e] text-white text-xs font-black rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <LayoutDashboard size={14} />
                  Dashboard
                </button>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-850 dark:text-slate-300 dark:hover:bg-slate-900 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  Log Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden border-t bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 px-4 pt-2 pb-4 space-y-1 text-left">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => {
                onNavigate(item.view);
                setIsOpen(false);
              }}
              className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                currentView === item.view
                  ? 'bg-[#FFCC00]/15 text-[#D40511] dark:bg-[#FFCC00]/20 dark:text-[#FFCC00]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
          {user && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex flex-col gap-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('admin');
                }}
                className="w-full py-2.5 bg-[#D40511] hover:bg-[#b8000e] text-white text-xs font-bold rounded-lg text-center shadow-sm cursor-pointer"
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full py-2.5 border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg text-center cursor-pointer"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
