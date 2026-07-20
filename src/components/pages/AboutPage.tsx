import React from 'react';
import { Shield, Clock, Award, Globe, Users, Target, CheckCircle2, ChevronRight, Zap, TrendingUp } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (view: string) => void;
}

export default function AboutPage({ onNavigate }: AboutPageProps) {
  const stats = [
    { value: '25M+', label: 'Successful Shipments' },
    { value: '99.98%', label: 'On-Time SLA Delivery' },
    { value: '220+', label: 'Countries Connected' },
    { value: '15,000+', label: 'Internal Fleet Vehicles' }
  ];

  const pillars = [
    {
      icon: <Clock size={24} className="text-blue-500" />,
      title: 'Real-Time Precision Tracking',
      desc: 'Our advanced tracking systems use proprietary telemetry waybill logs and high-frequency GPS positioning to guarantee total shipment transparency.'
    },
    {
      icon: <Shield size={24} className="text-blue-500" />,
      title: 'Cargo Guard SLA',
      desc: 'We are the only carrier providing standard temperature-controlled monitoring, impact logs, and cargo insurance guarantees backed by smart-contracts.'
    },
    {
      icon: <Globe size={24} className="text-blue-500" />,
      title: 'Nationwide & Global Coverage',
      desc: 'Through our intelligent multi-modal shipping network, we seamlessly coordinate sea cargo, air express, and last-mile dispatch schedules.'
    }
  ];

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* 1. Header Hero section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest font-mono">
            Operational Excellence Since 2012
          </h1>
          <h2 className="text-4xl sm:text-5xl font-sans font-black text-slate-900 dark:text-white tracking-tight leading-none">
            Fast, Reliable Logistics <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500">
              You Can Count On.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
            Logify is a premier internal logistics operator managing a high-performance fleet, smart warehousing, and global shipping lanes. We build software and run operations that keep the modern supply chain moving at the speed of light.
          </p>
        </div>

        {/* 2. Stats Board Bento Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {stats.map((stat, idx) => (
            <div 
              key={idx} 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center space-y-1"
            >
              <h3 className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">{stat.value}</h3>
              <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider font-sans">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* 3. Company Vision & Mission Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-sm flex flex-col justify-between space-y-6 text-left">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <Target size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase font-mono tracking-wide">
                Our Primary Mission
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                To simplify the complexities of regional and international shipping by integrating state-of-the-art telemetry, neural pathing, and frictionless dispatch software. We promise maximum speed, security, and a guarantee of absolute on-time performance.
              </p>
            </div>
            <ul className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> Zero-loss logistics insurance
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> Carbon-neutral local vehicle dispatches
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> Paperless airbill API synchronization
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-sm flex flex-col justify-between space-y-6 text-left">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <Users size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase font-mono tracking-wide">
                Why Choose Logify
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                At Logify, we do not treat shipments as mere tracking numbers. Each envelope, vaccine case, or pallet is an SLA contract. Our internally developed routing system automatically evaluates weather, tolls, and driver availability to find the absolute optimal transit path.
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-850 text-slate-500 text-[11px] leading-relaxed flex items-start gap-2.5">
              <Zap size={14} className="text-blue-500 shrink-0 mt-0.5 animate-pulse" />
              <span>
                <strong>Operations Alert:</strong> All drivers undergo complete safety clearances and operate modern high-efficiency vehicles connected directly to our 24/7 central tracking support desk.
              </span>
            </div>
          </div>

        </div>

        {/* 4. Core Values list */}
        <div className="max-w-5xl mx-auto space-y-8 text-left">
          <div className="text-center space-y-1">
            <h3 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest font-mono">Our Core Commitments</h3>
            <h4 className="text-2xl font-sans font-black text-slate-900 dark:text-white">Our Operational Pillars</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map((p, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-3"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  {p.icon}
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{p.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Elegant CTA Banner */}
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-8 sm:p-12 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden text-left">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />
          <div className="space-y-2 relative z-10">
            <h3 className="text-2xl font-black tracking-tight leading-none">Ready to Ship Your Package?</h3>
            <p className="text-xs text-blue-100 max-w-md">
              Calculate instant shipping rates, create a cargo dispatch waybill, and track your transit in real-time.
            </p>
          </div>
          <button
            onClick={() => onNavigate('send')}
            className="px-6 py-3.5 bg-white text-blue-700 hover:bg-slate-50 font-black text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer shrink-0 transition-transform hover:scale-[1.02] flex items-center gap-1.5"
          >
            Send Package
            <ChevronRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}
