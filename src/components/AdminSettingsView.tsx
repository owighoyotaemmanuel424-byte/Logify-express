import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, CheckCircle, RefreshCw, Info, Lock, Copy, 
  Globe, Shield, ToggleLeft, ToggleRight, MessageSquare, Key, AlertTriangle,
  Smile, Cookie, Eye, EyeOff
} from 'lucide-react';
import { Settings } from '../types.js';

interface AdminSettingsViewProps {
  settings: Settings;
  token: string;
  onUpdateSettings: (newSettings: Settings) => void;
}

export default function AdminSettingsView({
  settings,
  token,
  onUpdateSettings,
}: AdminSettingsViewProps) {
  // Brand States
  const [companyName, setCompanyName] = useState(settings.companyName || 'Logify Logistics');
  const [contactEmail, setContactEmail] = useState(settings.contactEmail || 'support@logify.com');
  const [contactPhone, setContactPhone] = useState(settings.contactPhone || '+1 (800) 555-LOGI');
  
  // Status & Options States
  const [isSiteActive, setIsSiteActive] = useState(settings.isSiteActive !== false);
  const [faviconEmoji, setFaviconEmoji] = useState(settings.faviconEmoji || '📦');
  const [showCookieBanner, setShowCookieBanner] = useState(settings.showCookieBanner !== false);
  const [enableLiveChat, setEnableLiveChat] = useState(settings.enableLiveChat !== false);
  const [enableHighContrastStatus, setEnableHighContrastStatus] = useState(settings.enableHighContrastStatus === true);
  
  // Admin Access / Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(settings.is2FAEnabled === true);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorSuccess, setTwoFactorSuccess] = useState(false);
  
  // Show/Hide password toggles
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Status indicators
  const [generalSuccess, setGeneralSuccess] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Copy URL states
  const [copiedHome, setCopiedHome] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  const homeURL = window.location.origin;
  const trackingURL = `${window.location.origin}/?view=track`;

  const handleCopy = (url: string, type: 'home' | 'track') => {
    navigator.clipboard.writeText(url);
    if (type === 'home') {
      setCopiedHome(true);
      setTimeout(() => setCopiedHome(false), 2000);
    } else {
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    }
  };

  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setGeneralSuccess(null);
    setGeneralError(null);

    try {
      const updated: Settings = {
        ...settings,
        companyName,
        contactEmail,
        contactPhone,
        isSiteActive,
        faviconEmoji,
        showCookieBanner,
        enableLiveChat,
        is2FAEnabled,
        enableHighContrastStatus,
      };

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });

      if (response.ok) {
        onUpdateSettings(updated);
        setGeneralSuccess('Configuration successfully synchronized globally.');
        
        // Dynamic favicon update
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (link) {
          link.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${faviconEmoji}</text></svg>`;
        }
        
        setTimeout(() => setGeneralSuccess(null), 3000);
      } else {
        const errData = await response.json();
        setGeneralError(errData.error || 'Failed to update configurations.');
      }
    } catch (err: any) {
      setGeneralError(err.message || 'Connection error while saving settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    setSavingPassword(true);

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (response.ok) {
        setPasswordSuccess('Admin password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(null), 3000);
      } else {
        const errData = await response.json();
        setPasswordError(errData.error || 'Failed to update admin password.');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Connection error while changing password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleToggle2FA = () => {
    if (!is2FAEnabled) {
      setShowTwoFactorModal(true);
    } else {
      setIs2FAEnabled(false);
      // Immediately sync with server
      triggerSettingsUpdate({ ...settings, is2FAEnabled: false });
    }
  };

  const triggerSettingsUpdate = async (updated: Settings) => {
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });
      onUpdateSettings(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorCode === '123456' || twoFactorCode.length === 6) {
      setTwoFactorSuccess(true);
      setTimeout(() => {
        setIs2FAEnabled(true);
        setShowTwoFactorModal(false);
        setTwoFactorCode('');
        setTwoFactorSuccess(false);
        triggerSettingsUpdate({ ...settings, is2FAEnabled: true });
      }, 1500);
    } else {
      alert('Invalid OTP validation code. Try "123456" for simulation.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex justify-between items-center bg-neutral-950/60 backdrop-blur-md border border-neutral-800 rounded-2xl p-5 shadow-xl shadow-black/30">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-white leading-tight flex items-center gap-2">
            <SettingsIcon className="text-[#ff7a1a] animate-spin-slow" size={16} />
            System Control Panel
          </h2>
          <p className="text-[10px] font-mono text-[#aaa] uppercase tracking-wider">Configure brand identity, system status, page rules & security controls</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-neutral-300">
        {/* LEFT COLUMN: BRAND, STATUS, YOUR URLS */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSaveGeneralSettings} className="space-y-6">
            {/* BRAND SECTION */}
            <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2.5">
                <Globe size={15} className="text-[#ff7a1a]" />
                Brand Identity
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[9px] text-[#aaa] font-bold uppercase font-mono tracking-wider">Site / Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Logify Logistics"
                    className="w-full bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 focus:border-[#ff7a1a] rounded-xl p-3 outline-none font-medium text-white transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-[#aaa] font-bold uppercase font-mono tracking-wider">Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="support@logify.com"
                    className="w-full bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 focus:border-[#ff7a1a] rounded-xl p-3 outline-none text-white transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-[#aaa] font-bold uppercase font-mono tracking-wider">Contact Support Hotline *</label>
                  <input
                    type="text"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+1 (800) 555-LOGI"
                    className="w-full bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 focus:border-[#ff7a1a] rounded-xl p-3 outline-none text-white transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* STATUS (MAINTENANCE) SECTION */}
            <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-black text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Shield size={15} className="text-[#ff7a1a]" />
                  System Status
                </div>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${isSiteActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#ff7a1a]/10 text-[#ff7a1a] border border-[#ff7a1a]/20'}`}>
                  {isSiteActive ? 'LIVE & PUBLIC' : 'MAINTENANCE MODE'}
                </span>
              </h3>

              <div className="flex items-center justify-between p-3.5 bg-neutral-950/40 border border-neutral-800/50 rounded-xl">
                <div className="space-y-0.5 max-w-[80%]">
                  <p className="font-bold text-white">Site Active Visibility</p>
                  <p className="text-[10px] text-[#aaa] leading-relaxed">Turn OFF to put the public landing pages and calculators into a clean dark maintenance page. Admin panel remains accessible.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSiteActive(!isSiteActive)}
                  className="text-neutral-400 hover:text-white transition-colors focus:outline-none"
                >
                  {isSiteActive ? (
                    <ToggleRight size={38} className="text-[#ff7a1a] cursor-pointer" />
                  ) : (
                    <ToggleLeft size={38} className="text-neutral-600 cursor-pointer" />
                  )}
                </button>
              </div>
            </div>

            {/* PAGE OPTIONS SECTION */}
            <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2.5">
                <MessageSquare size={15} className="text-[#ff7a1a]" />
                Page Options & Customization
              </h3>

              <div className="space-y-4">
                {/* Favicon Selector */}
                <div className="space-y-1.5">
                  <label className="text-[9px] text-[#aaa] font-bold uppercase font-mono tracking-wider flex items-center gap-1">
                    <Smile size={11} /> Favicon Symbol (Emoji)
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {['📦', '🚚', '🌐', '✈️', '⚓', '🏎️', '🏷️', '🔥'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFaviconEmoji(emoji)}
                        className={`w-10 h-10 text-lg rounded-xl border flex items-center justify-center transition-all cursor-pointer ${faviconEmoji === emoji ? 'border-[#ff7a1a] bg-[#ff7a1a]/10 scale-105' : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/50'}`}
                      >
                        {emoji}
                      </button>
                    ))}
                    <input
                      type="text"
                      maxLength={2}
                      value={faviconEmoji}
                      onChange={(e) => setFaviconEmoji(e.target.value)}
                      placeholder="Custom"
                      className="w-14 h-10 bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 focus:border-[#ff7a1a] rounded-xl text-center text-base outline-none text-white"
                    />
                  </div>
                </div>

                <div className="border-t border-neutral-800/60 pt-4 space-y-3.5">
                  {/* Cookie Banner Toggle */}
                  <div className="flex items-center justify-between p-3 bg-neutral-950/40 border border-neutral-800/40 rounded-xl">
                    <div className="space-y-0.5">
                      <p className="font-bold text-white flex items-center gap-1.5">
                        <Cookie size={12} className="text-[#ff7a1a]" />
                        Show GDPR Cookie Consent Banner
                      </p>
                      <p className="text-[10px] text-[#aaa]">Display a premium dark legal cookie notification to first-time public visitors.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCookieBanner(!showCookieBanner)}
                      className="focus:outline-none"
                    >
                      {showCookieBanner ? (
                        <ToggleRight size={32} className="text-[#ff7a1a] cursor-pointer" />
                      ) : (
                        <ToggleLeft size={32} className="text-neutral-600 cursor-pointer" />
                      )}
                    </button>
                  </div>

                  {/* Live Chat Toggle */}
                  <div className="flex items-center justify-between p-3 bg-neutral-950/40 border border-neutral-800/40 rounded-xl">
                    <div className="space-y-0.5">
                      <p className="font-bold text-white flex items-center gap-1.5">
                        <MessageSquare size={12} className="text-[#ff7a1a]" />
                        Enable Live Chat Widget
                      </p>
                      <p className="text-[10px] text-[#aaa]">Enable the real-time customer support chat bubble on public pages.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnableLiveChat(!enableLiveChat)}
                      className="focus:outline-none"
                    >
                      {enableLiveChat ? (
                        <ToggleRight size={32} className="text-[#ff7a1a] cursor-pointer" />
                      ) : (
                        <ToggleLeft size={32} className="text-neutral-600 cursor-pointer" />
                      )}
                    </button>
                  </div>

                  {/* High-Contrast Toggle */}
                  <div className="flex items-center justify-between p-3 bg-neutral-950/40 border border-neutral-800/40 rounded-xl">
                    <div className="space-y-0.5">
                      <p className="font-bold text-white flex items-center gap-1.5">
                        <Eye size={12} className="text-violet-400" />
                        Accessible High-Contrast Dark Statuses
                      </p>
                      <p className="text-[10px] text-[#aaa]">
                        Boost opacity and color-depth for status tags (Amber, Green, Red) to remain highly distinct and readable in dark environments.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnableHighContrastStatus(!enableHighContrastStatus)}
                      className="focus:outline-none"
                    >
                      {enableHighContrastStatus ? (
                        <ToggleRight size={32} className="text-violet-500 cursor-pointer" />
                      ) : (
                        <ToggleLeft size={32} className="text-neutral-600 cursor-pointer" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* General Settings Save Bar */}
            <div className="flex flex-col gap-3">
              {generalSuccess && (
                <div className="p-3.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle size={14} />
                  {generalSuccess}
                </div>
              )}
              {generalError && (
                <div className="p-3.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl font-semibold flex items-center gap-2 animate-fade-in">
                  <AlertTriangle size={14} />
                  {generalError}
                </div>
              )}

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-3.5 bg-[#ff7a1a] hover:bg-[#e66c15] disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/10 font-sans tracking-wide cursor-pointer text-xs"
              >
                {savingSettings ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    Synchronizing System Data...
                  </>
                ) : (
                  <>
                    <Lock size={12} />
                    Commit & Save General Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: YOUR URLS & SECURITY/ADMIN ACCESS */}
        <div className="space-y-6">
          {/* YOUR URLS */}
          <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Globe size={14} className="text-[#ff7a1a]" />
              Your URLs
            </h3>

            <div className="space-y-3 font-mono">
              <div className="space-y-1">
                <span className="text-[8px] text-[#aaa] uppercase font-bold tracking-wider">Home Landing Page</span>
                <div className="flex items-center gap-2 bg-neutral-950/80 border border-neutral-800 rounded-xl p-2.5 select-all overflow-hidden truncate relative group">
                  <span className="text-[10px] text-neutral-300 truncate pr-8">{homeURL}</span>
                  <button
                    onClick={() => handleCopy(homeURL, 'home')}
                    className="absolute right-2 p-1.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Copy Link"
                  >
                    {copiedHome ? <CheckCircle size={11} className="text-emerald-500" /> : <Copy size={11} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[8px] text-[#aaa] uppercase font-bold tracking-wider">Public Tracking Endpoint</span>
                <div className="flex items-center gap-2 bg-neutral-950/80 border border-neutral-800 rounded-xl p-2.5 select-all overflow-hidden truncate relative group">
                  <span className="text-[10px] text-neutral-300 truncate pr-8">{trackingURL}</span>
                  <button
                    onClick={() => handleCopy(trackingURL, 'track')}
                    className="absolute right-2 p-1.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Copy Link"
                  >
                    {copiedTracking ? <CheckCircle size={11} className="text-emerald-500" /> : <Copy size={11} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PASSWORD RESET */}
          <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Key size={14} className="text-[#ff7a1a]" />
              Admin Access Password
            </h3>

            {passwordSuccess && (
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold text-[10px] flex items-center gap-1.5">
                <CheckCircle size={12} />
                {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="p-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl font-semibold text-[10px] flex items-center gap-1.5">
                <AlertTriangle size={12} />
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[8px] text-[#aaa] uppercase font-bold tracking-wider">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-[#ff7a1a] rounded-xl p-2.5 pr-8 outline-none text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                  >
                    {showCurrentPass ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] text-[#aaa] uppercase font-bold tracking-wider">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-[#ff7a1a] rounded-xl p-2.5 pr-8 outline-none text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                  >
                    {showNewPass ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] text-[#aaa] uppercase font-bold tracking-wider">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-[#ff7a1a] rounded-xl p-2.5 outline-none text-white font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 disabled:opacity-50 text-white font-bold rounded-xl mt-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer text-[10px]"
              >
                {savingPassword ? (
                  <RefreshCw size={11} className="animate-spin" />
                ) : (
                  <Lock size={10} />
                )}
                Commit Password Change
              </button>
            </form>
          </div>

          {/* TWO FACTOR SECURITY CONTROL */}
          <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Shield size={14} className="text-[#ff7a1a]" />
              Multi-Factor Admin Access
            </h3>

            <div className="flex items-center justify-between p-3 bg-neutral-950/40 border border-neutral-800/40 rounded-xl">
              <div className="space-y-0.5 max-w-[70%]">
                <p className="font-bold text-white">Enable 2FA Protection</p>
                <p className="text-[10px] text-[#aaa]">Secure admin session logins with real-time email verification codes.</p>
              </div>
              <button
                type="button"
                onClick={handleToggle2FA}
                className="focus:outline-none"
              >
                {is2FAEnabled ? (
                  <ToggleRight size={32} className="text-[#ff7a1a] cursor-pointer" />
                ) : (
                  <ToggleLeft size={32} className="text-neutral-600 cursor-pointer" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TWO FACTOR POPUP / MODAL MOCKUP */}
      {showTwoFactorModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-5 text-center text-xs relative animate-fade-in">
            <div className="w-12 h-12 bg-[#ff7a1a]/10 border border-[#ff7a1a]/20 text-[#ff7a1a] rounded-full flex items-center justify-center mx-auto">
              <Shield size={24} />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-white">Configure 2-Factor Auth</h3>
              <p className="text-[#aaa] leading-relaxed">
                An verification code has been dispatched to your primary admin email. Enter the 6-digit OTP code below to confirm activation.
              </p>
            </div>

            {twoFactorSuccess ? (
              <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold flex items-center justify-center gap-1.5 animate-pulse">
                <CheckCircle size={14} />
                2FA Confirmed! Syncing state...
              </div>
            ) : (
              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div className="space-y-1">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 123456"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[0.5em] text-lg font-mono bg-neutral-900 border border-neutral-800 focus:border-[#ff7a1a] rounded-xl p-3 outline-none text-white"
                  />
                  <span className="text-[9px] text-[#aaa]">Simulation code: <span className="font-mono text-[#ff7a1a]">123456</span></span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTwoFactorModal(false)}
                    className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#ff7a1a] hover:bg-[#e66c15] text-white font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Confirm Code
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
