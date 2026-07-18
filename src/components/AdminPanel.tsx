import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard, Package, PlusCircle, Search, Bell, User, Moon, Sun, LogOut, Menu, X,
  TrendingUp, BarChart2, DollarSign, ArrowRight, Truck, Users, CreditCard, Settings as SettingsIcon,
  MapPin, Clock, ShieldCheck, RefreshCw, ChevronRight, Activity, Map, MessageSquare, ClipboardCheck
} from 'lucide-react';
import { User as UserType, Shipment, Driver, Payment, Settings, TimelineEvent } from '../types.js';

// Modular view imports
import AdminDashboardView from './AdminDashboardView.tsx';
import AdminShipmentsView from './AdminShipmentsView.tsx';
import AdminCreateShipmentView from './AdminCreateShipmentView.tsx';
import AdminTrackingView from './AdminTrackingView.tsx';
import AdminAgentsView from './AdminAgentsView.tsx';
import AdminCustomersView from './AdminCustomersView.tsx';
import AdminFinanceView from './AdminFinanceView.tsx';
import AdminSettingsView from './AdminSettingsView.tsx';
import AdminAnalyticsView from './AdminAnalyticsView.tsx';
import ShipmentMap from './ShipmentMap.tsx';
import AdminSupportView from './AdminSupportView.tsx';
import AdminDriverPortalView from './AdminDriverPortalView.tsx';

interface AdminPanelProps {
  user: UserType;
  token: string;
  settings: Settings;
  onUpdateSettings: (newSettings: Settings) => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function AdminPanel({
  user,
  token,
  settings,
  onUpdateSettings,
  onLogout,
  theme,
  onToggleTheme,
}: AdminPanelProps) {
  // Navigation
  const [activeTab, setActiveTab] = useState<'overview' | 'shipments' | 'create' | 'tracking' | 'drivers' | 'users' | 'analytics' | 'finance' | 'settings' | 'shipmentMap' | 'support' | 'driverPortal'>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Consolidated server state
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Interactive tracking routing reference
  const [trackingIdTarget, setTrackingIdTarget] = useState<string>('');

  // Dropdown states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Centralized fetching mechanism
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [shipRes, driverRes, usersRes, paymentsRes, alertsRes] = await Promise.all([
        fetch('/api/shipments', { headers }),
        fetch('/api/drivers', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/payments', { headers }),
        fetch('/api/admin/alerts', { headers }),
      ]);

      if (shipRes.ok) setShipments(await shipRes.json());
      if (driverRes.ok) setDrivers(await driverRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (paymentsRes.ok) setPayments(await paymentsRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
    } catch (err) {
      console.error("Error synchronizing admin datastore:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  // Click outside handlers for dropdown popovers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global search filtering computations
  const searchedShipments = globalSearch ? shipments.filter(s => s.id.toLowerCase().includes(globalSearch.toLowerCase()) || s.senderName.toLowerCase().includes(globalSearch.toLowerCase()) || s.receiverName.toLowerCase().includes(globalSearch.toLowerCase())) : [];
  const searchedDrivers = globalSearch ? drivers.filter(d => d.name.toLowerCase().includes(globalSearch.toLowerCase()) || d.vehiclePlate.toLowerCase().includes(globalSearch.toLowerCase())) : [];

  const handleTrackAction = (id: string) => {
    setTrackingIdTarget(id);
    setActiveTab('tracking');
    setGlobalSearch('');
    setShowSearchResults(false);
  };

  const handleEditAction = (shipment: Shipment) => {
    setActiveTab('shipments');
    setGlobalSearch('');
    setShowSearchResults(false);
  };

  const navItems = [
    { key: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'shipments', label: 'Shipments', icon: Package },
    { key: 'create', label: 'Create Shipment', icon: PlusCircle },
    { key: 'tracking', label: 'Tracking Console', icon: Search },
    { key: 'drivers', label: 'Courier Agents', icon: Truck },
    { key: 'driverPortal', label: 'Driver Portal', icon: ClipboardCheck },
    { key: 'users', label: 'Customers', icon: Users },
    { key: 'shipmentMap', label: 'Live Traffic Map', icon: Map },
    { key: 'support', label: 'Support & Messaging', icon: MessageSquare },
    { key: 'finance', label: 'Analytics & Billing', icon: DollarSign },
    { key: 'settings', label: 'Settings', icon: SettingsIcon },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-200">
      
      {/* 1. Left Fixed Sidebar Layout */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 z-40 transition-transform duration-300 transform lg:translate-x-0 ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand Identity */}
        <div className="h-16 border-b border-slate-800 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-base">
              L
            </div>
            <div>
              <h1 className="font-sans font-black text-sm tracking-tight text-white leading-tight">Logify Logistics</h1>
              <p className="text-[9px] font-bold font-mono tracking-wider text-slate-400 uppercase">Administrator System</p>
            </div>
          </div>
          
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="p-4 space-y-1.5 overflow-y-auto h-[calc(100vh-140px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setActiveTab(item.key);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/10'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Operating status footer */}
        <div className="absolute bottom-4 left-4 right-4 p-3 border border-slate-850 bg-slate-850/50 rounded-xl text-[9px] font-semibold text-slate-400 font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          All Systems Operational (UTC)
        </div>
      </aside>

      {/* 2. Main content block wrapper layout */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Top Header Navbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors duration-200">
          
          {/* Left search bar / responsive trigger */}
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"
            >
              <Menu size={18} />
            </button>

            {/* Global telemetry search input with dropdown matches */}
            <div ref={searchContainerRef} className="relative w-full max-w-xs sm:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => {
                    setGlobalSearch(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  placeholder="Global search ID or sender..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-850 rounded-xl pl-9 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white"
                />
              </div>

              {/* Floating search dropdown */}
              {showSearchResults && globalSearch && (
                <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3 z-50 text-xs text-left max-h-[300px] overflow-y-auto">
                  {searchedShipments.length === 0 && searchedDrivers.length === 0 && (
                    <p className="text-slate-400 italic text-center py-2">No matching telemetry records found.</p>
                  )}

                  {searchedShipments.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono">Waybills ({searchedShipments.length})</h4>
                      {searchedShipments.map(s => (
                        <button
                          key={s.id}
                          onClick={() => handleTrackAction(s.id)}
                          className="w-full p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg text-left flex justify-between items-center transition-all font-mono"
                        >
                          <div>
                            <span className="font-bold text-slate-800 dark:text-white block">{s.id}</span>
                            <span className="text-[9px] text-slate-400 font-sans block">{s.senderName} ➜ {s.receiverName}</span>
                          </div>
                          <ChevronRight size={12} className="text-slate-400" />
                        </button>
                      ))}
                    </div>
                  )}

                  {searchedDrivers.length > 0 && (
                    <div className="space-y-1.5 border-t border-slate-50 dark:border-slate-800/50 pt-2">
                      <h4 className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono">Courier Agents ({searchedDrivers.length})</h4>
                      {searchedDrivers.map(d => (
                        <button
                          key={d.id}
                          onClick={() => {
                            setActiveTab('drivers');
                            setGlobalSearch('');
                            setShowSearchResults(false);
                          }}
                          className="w-full p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg text-left flex justify-between items-center transition-all"
                        >
                          <div>
                            <span className="font-bold text-slate-800 dark:text-white block">{d.name}</span>
                            <span className="text-[9px] text-slate-400 font-mono block">Plate: {d.vehiclePlate}</span>
                          </div>
                          <ChevronRight size={12} className="text-slate-400" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            
            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all duration-200 cursor-pointer text-[10px] sm:text-xs font-bold tracking-wide"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? (
                <>
                  <Moon size={14} className="text-slate-500" />
                  <span className="hidden sm:inline">Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun size={14} className="text-amber-400" />
                  <span className="hidden sm:inline">Light Mode</span>
                </>
              )}
            </button>

            {/* Notification Bell Dropdown */}
            <div ref={notificationsRef} className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 relative transition-all cursor-pointer"
              >
                <Bell size={16} />
                {alerts.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce"></span>
                )}
              </button>

              {/* Bell popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-4 w-72 sm:w-80 space-y-3 z-50 text-xs text-left">
                  <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-2">
                    <h4 className="font-black text-slate-800 dark:text-white">Central dispatch alerts</h4>
                    <span className="text-[10px] font-mono text-slate-400">{alerts.length} total</span>
                  </div>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {alerts.slice(-5).reverse().map((a) => (
                      <div key={a.id} className="p-2 border border-slate-50 dark:border-slate-800/80 rounded-lg space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[8px] font-bold uppercase text-blue-600 bg-blue-50 px-1 py-0.5 rounded">{a.type}</span>
                          <span className="text-[8px] text-slate-400 font-mono">{new Date(a.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-[11px] leading-snug font-medium text-slate-600 dark:text-slate-300">{a.body}</p>
                      </div>
                    ))}
                    {alerts.length === 0 && (
                      <p className="text-slate-400 italic text-center py-4">No pending alerts queued.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu Dropdown */}
            <div ref={profileMenuRef} className="relative border-l border-slate-100 dark:border-slate-800 pl-3">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 cursor-pointer focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">
                  {user.name[0]}
                </div>
                <div className="hidden sm:block text-left">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white leading-tight">{user.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wider">{user.role}</p>
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-2 w-48 z-50 text-xs">
                  <div className="p-2.5 border-b border-slate-50 dark:border-slate-800 text-slate-500">
                    <p className="font-semibold text-slate-850 dark:text-white truncate">{user.name}</p>
                    <p className="text-[10px] truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={onLogout}
                    className="w-full text-left p-2 hover:bg-rose-50 hover:text-rose-600 rounded-xl font-bold flex items-center gap-2 text-rose-500 mt-1 transition-all"
                  >
                    <LogOut size={14} />
                    Sign Out Account
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Main Content Pane */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          
          {loading ? (
            <div className="h-64 flex items-center justify-center gap-2 text-slate-400 text-xs font-mono font-bold">
              <RefreshCw className="animate-spin text-blue-600" size={16} />
              Loading real-time admin metrics...
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-6"
            >
              {activeTab === 'overview' && (
                <AdminDashboardView
                  shipments={shipments}
                  drivers={drivers}
                  payments={payments}
                  alerts={alerts}
                  settings={settings}
                  onTrackShipment={handleTrackAction}
                  onEditShipment={handleEditAction}
                />
              )}

              {activeTab === 'shipments' && (
                <AdminShipmentsView
                  shipments={shipments}
                  drivers={drivers}
                  token={token}
                  settings={settings}
                  onRefresh={fetchAdminData}
                  onTrackShipment={handleTrackAction}
                  onCreateNewShipment={() => setActiveTab('create')}
                />
              )}

              {activeTab === 'create' && (
                <AdminCreateShipmentView
                  token={token}
                  settings={settings}
                  onSuccess={() => {
                    fetchAdminData();
                    setActiveTab('shipments');
                  }}
                  onBackToLogs={() => setActiveTab('shipments')}
                />
              )}

              {activeTab === 'tracking' && (
                <AdminTrackingView
                  shipments={shipments}
                  drivers={drivers}
                  initialTrackId={trackingIdTarget}
                />
              )}

              {activeTab === 'drivers' && (
                <AdminAgentsView
                  drivers={drivers}
                  token={token}
                  onRefresh={fetchAdminData}
                />
              )}

              {activeTab === 'driverPortal' && (
                <AdminDriverPortalView
                  shipments={shipments}
                  drivers={drivers}
                  token={token}
                  onRefresh={fetchAdminData}
                />
              )}

              {activeTab === 'users' && (
                <AdminCustomersView
                  users={users}
                  currentUser={user}
                  token={token}
                  onRefresh={fetchAdminData}
                />
              )}

              {activeTab === 'shipmentMap' && (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                    <h2 className="text-sm font-bold text-slate-800 dark:text-white">Active Fleet Traffic Corridors</h2>
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">Live routing coordinate nodes projection</p>
                  </div>
                  <div className="h-[450px] bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 relative">
                    <ShipmentMap shipments={shipments} drivers={drivers} />
                  </div>
                </div>
              )}

              {activeTab === 'finance' && (
                <div className="space-y-6">
                  <AdminAnalyticsView shipments={shipments} drivers={drivers} />
                  <AdminFinanceView
                    payments={payments}
                    settings={settings}
                    token={token}
                    onUpdateSettings={onUpdateSettings}
                    onRefresh={fetchAdminData}
                  />
                </div>
              )}

              {activeTab === 'settings' && (
                <AdminSettingsView
                  settings={settings}
                  token={token}
                  onUpdateSettings={onUpdateSettings}
                />
              )}

              {activeTab === 'support' && (
                <AdminSupportView
                  token={token}
                  drivers={drivers}
                  users={users}
                />
              )}
            </motion.div>
          )}

        </main>
        
      </div>

    </div>
  );
}
