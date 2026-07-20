import React from 'react';
import { 
  Truck, Package, Warehouse, FileText, Ship, Plane, Train, 
  ArrowRight, ShieldAlert, Globe, Leaf, Briefcase, 
  Clock, Activity, AlertCircle, Check, DollarSign, Building, ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import TrackingBox from './TrackingBox.tsx';

interface HeroProps {
  onNavigate: (view: string) => void;
  onSetTrackId: (id: string) => void;
}

export default function Hero({ onNavigate, onSetTrackId }: HeroProps) {
  const handleTrack = (trackingNumber: string) => {
    onSetTrackId(trackingNumber);
    onNavigate('track');
  };

  return (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-300">
      
      {/* 1. HERO SECTION (TOP AREA) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#111111] via-slate-900 to-[#111111] text-white py-14 sm:py-20 border-b border-slate-900 px-4 sm:px-6 lg:px-8">
        {/* Subtle Decorative SVG grids and radial yellow glow spots */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FFCC00]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-8">
          {/* Live Operational Status Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 dark:bg-slate-800/80 border border-white/10 text-white text-[10px] font-mono uppercase tracking-wider font-extrabold shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFCC00] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFCC00]"></span>
            </span>
            Logify Operational Status: <span className="text-[#FFCC00] font-black">99.98% SLA On-Time</span>
          </motion.div>

          {/* Large display Typography */}
          <div className="space-y-4 max-w-3xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-sans font-black tracking-tight leading-none uppercase"
            >
              The World <span className="text-[#FFCC00]">On-Time</span>. <br />
              Delivered.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xs sm:text-sm md:text-base text-slate-300 max-w-xl mx-auto font-medium leading-relaxed"
            >
              Logify coordinates express document shipping, freight forwarding contracts, and global sea-air supply chains with extreme precision.
            </motion.p>
          </div>

          {/* "Track Your Shipment" Card */}
          <div className="pt-2 max-w-xl mx-auto" id="hero-tracking-input-container">
            <TrackingBox onTrack={handleTrack} />
          </div>

          {/* THREE QUICK ACTION CARDS (IMMEDIATELY BELOW TRACKING INPUT) */}
          <div className="pt-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="hero-quick-action-cards">
              
              {/* Card 1: Ship Now */}
              <motion.button
                whileHover={{ y: -4, borderColor: '#FFCC00' }}
                onClick={() => onNavigate('send')}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm text-left flex items-start gap-4 transition-all hover:shadow-md group cursor-pointer"
                id="action-card-ship-now"
              >
                <div className="w-10 h-10 rounded-lg bg-[#FFCC00]/10 flex items-center justify-center text-[#D40511] shrink-0 font-bold group-hover:bg-[#FFCC00]/20 transition-colors">
                  <Package size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1">
                    Ship Now <ChevronRight size={12} className="text-[#D40511]" />
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-normal">
                    Find the right service
                  </p>
                </div>
              </motion.button>

              {/* Card 2: Get a Quote */}
              <motion.button
                whileHover={{ y: -4, borderColor: '#FFCC00' }}
                onClick={() => onNavigate('pricing')}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm text-left flex items-start gap-4 transition-all hover:shadow-md group cursor-pointer"
                id="action-card-get-quote"
              >
                <div className="w-10 h-10 rounded-lg bg-[#FFCC00]/10 flex items-center justify-center text-[#D40511] shrink-0 font-bold group-hover:bg-[#FFCC00]/20 transition-colors">
                  <DollarSign size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1">
                    Get a Quote <ChevronRight size={12} className="text-[#D40511]" />
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-normal">
                    Estimate cost to share and compare
                  </p>
                </div>
              </motion.button>

              {/* Card 3: Logify for Business */}
              <motion.button
                whileHover={{ y: -4, borderColor: '#FFCC00' }}
                onClick={() => onNavigate('contact')}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm text-left flex items-start gap-4 transition-all hover:shadow-md group cursor-pointer"
                id="action-card-logify-business"
              >
                <div className="w-10 h-10 rounded-lg bg-[#FFCC00]/10 flex items-center justify-center text-[#D40511] shrink-0 font-bold group-hover:bg-[#FFCC00]/20 transition-colors">
                  <Building size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1">
                    Logify for Business <ChevronRight size={12} className="text-[#D40511]" />
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-normal">
                    Request business account for exclusive benefits
                  </p>
                </div>
              </motion.button>

            </div>
          </div>

        </div>
      </section>

      {/* 2. FULL-WIDTH VISUAL BANNER */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="visual-banner-section">
        <div className="relative h-[220px] sm:h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
          <img
            src="/src/assets/images/logistics_personnel_port_1784465855777.jpg"
            alt="Logify Global Cargo Terminal & Port Operations"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {/* Stark overlay to add luxury feel and high contrast caption */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 sm:p-10 text-left">
            <span className="text-[9px] font-mono font-black text-[#FFCC00] uppercase tracking-widest mb-1 block">
              Logify Operations Core
            </span>
            <h3 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight max-w-xl">
              Connecting Global Infrastructure with Seamless Delivery
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-1 max-w-md font-medium">
              Our smart network operates across 180 countries, delivering next-business-day packages with military-grade precision.
            </p>
          </div>
        </div>
      </section>

      {/* 3. CORE SERVICES SECTION (Split into two distinct pillars) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10" id="core-services-section">
        <div className="text-left space-y-1.5 border-l-4 border-[#D40511] pl-3">
          <span className="text-[10px] font-mono font-extrabold uppercase text-slate-500 tracking-widest block">
            Core Service Pillars
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Choose Your Way Forward
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Pillar 1: Document and Parcel Shipping */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col justify-between text-left space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#D40511] shadow-sm shrink-0">
                    <FileText size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">
                      Document & Parcel Shipping
                    </h3>
                    <p className="text-[10px] font-mono font-bold text-slate-400">TARGETED AT ALL SHIPPERS</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Reliable, high-speed delivery schedules for documents, files, and customer boxes. Perfect for individual senders or high-growth online shops needing daily dispatch services.
              </p>

              {/* Express Services Bullet List */}
              <div className="pt-3 space-y-2.5">
                <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider font-mono">
                  Express Services Included:
                </h4>
                <ul className="grid grid-cols-1 gap-2.5">
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                      <Check size={11} className="stroke-[3]" />
                    </div>
                    <div>
                      <strong className="text-slate-950 dark:text-white">Next Possible Business Day:</strong> Delivered to top markets inside a single business day.
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                      <Check size={11} className="stroke-[3]" />
                    </div>
                    <div>
                      <strong className="text-slate-950 dark:text-white">Flexible Import/Export:</strong> Ship globally with streamlined custom clearance assistance.
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                      <Check size={11} className="stroke-[3]" />
                    </div>
                    <div>
                      <strong className="text-slate-950 dark:text-white">Tailored Business Solutions:</strong> Dynamic return pipelines and smart pickup scheduling.
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => onNavigate('send')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#111111] hover:bg-black text-[#FFCC00] hover:text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
              >
                <span>Explore Logify Express</span>
                <ArrowRight size={14} className="stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Pillar 2: Cargo Shipping */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col justify-between text-left space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#D40511] shadow-sm shrink-0">
                    <Ship size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">
                      Cargo Shipping
                    </h3>
                    <p className="text-[10px] font-mono font-bold text-[#D40511]">BUSINESS ONLY</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Industrial transport for oversized containers, raw manufacturing materials, and heavy bulk cargo. We consolidate global networks across major sea ports and intercontinental hubs.
              </p>

              {/* Four Main Freight Types Grid */}
              <div className="pt-3 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider font-mono">
                  Primary Freight Divisions:
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Air Freight */}
                  <div className="flex items-center gap-2.5 p-2.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="w-8 h-8 rounded-lg bg-[#FFCC00]/10 flex items-center justify-center text-[#D40511] shrink-0">
                      <Plane size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Air Freight</span>
                  </div>

                  {/* Road Freight */}
                  <div className="flex items-center gap-2.5 p-2.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="w-8 h-8 rounded-lg bg-[#FFCC00]/10 flex items-center justify-center text-[#D40511] shrink-0">
                      <Truck size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Road Freight</span>
                  </div>

                  {/* Ocean Freight */}
                  <div className="flex items-center gap-2.5 p-2.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="w-8 h-8 rounded-lg bg-[#FFCC00]/10 flex items-center justify-center text-[#D40511] shrink-0">
                      <Ship size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Ocean Freight</span>
                  </div>

                  {/* Rail Freight */}
                  <div className="flex items-center gap-2.5 p-2.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="w-8 h-8 rounded-lg bg-[#FFCC00]/10 flex items-center justify-center text-[#D40511] shrink-0">
                      <Train size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Rail Freight</span>
                  </div>

                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => onNavigate('pricing')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#111111] hover:bg-black text-[#FFCC00] hover:text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
              >
                <span>Explore Global Forwarding</span>
                <ArrowRight size={14} className="stroke-[2.5]" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 4. TARIFF UPDATE BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="bg-[#FFCC00] text-slate-950 rounded-2xl p-6 sm:p-8 shadow-lg border-l-8 border-[#D40511] text-left relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/10 border border-slate-950/10 text-slate-950 text-[9px] font-mono uppercase tracking-widest font-black">
                <ShieldAlert size={12} className="stroke-[2.5]" />
                Regulatory Update
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight uppercase font-sans">
                Navigating Latest Tariff Developments
              </h2>
              <p className="text-xs sm:text-sm text-slate-900 leading-relaxed max-w-xl font-medium">
                In light of evolving customs structures and compliance requirements globally, Logify provides up-to-the-minute analysis and flexible options to ensure your supply chain remains uninterrupted.
              </p>
            </div>
            <div className="shrink-0">
              <button
                onClick={() => onNavigate('pricing')}
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#111111] hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-md"
              >
                <span>Explore Our Solutions</span>
                <ArrowRight size={14} className="stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. RESOURCES & UPDATES GRID */}
      <section className="bg-white dark:bg-slate-900 border-y border-slate-150 dark:border-slate-800 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto text-left space-y-10">
          
          {/* Main Title */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3 md:border-r border-slate-150 dark:border-slate-800 pr-4">
              <span className="text-[10px] font-mono font-black text-[#D40511] uppercase tracking-widest block">
                Bulletin Desk
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Important Service Updates
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Immediate operational notices regarding global routing networks, local port compliance, and weather safety corridors.
              </p>
            </div>

            <div className="md:col-span-2 space-y-5">
              <div className="flex gap-3 items-start text-xs border-b border-slate-100 dark:border-slate-850 pb-4">
                <div className="w-5 h-5 rounded bg-[#FFCC00]/10 flex items-center justify-center text-[#D40511] font-bold shrink-0 mt-0.5">
                  <AlertCircle size={12} />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">
                    Global Geopolitical Transport Delays & Re-routing Plans
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Due to high traffic density and local customs restrictions, certain sea routes are being actively re-directed through southern land channels. All affected customers will receive SMS waybill updates.
                  </p>
                  <span className="text-[10px] font-mono text-slate-400 block mt-1.5">Updated: July 19, 2026</span>
                </div>
              </div>

              <div className="flex gap-3 items-start text-xs pb-1">
                <div className="w-5 h-5 rounded bg-[#FFCC00]/10 flex items-center justify-center text-[#D40511] font-bold shrink-0 mt-0.5">
                  <ShieldAlert size={12} />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">
                    New Automated Customs Clearance Protocols for Transatlantic Freight
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    We have fully implemented direct API handshakes with European Union customs nodes. Waybill processing speed is reduced from 4 hours to under 8 minutes.
                  </p>
                  <span className="text-[10px] font-mono text-slate-400 block mt-1.5">Updated: July 10, 2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Underneath: Two Distinct Card Layouts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            
            {/* Card A: Sustainability */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => onNavigate('about')}
              className="group cursor-pointer bg-slate-50 dark:bg-slate-950 rounded-2xl p-6 sm:p-8 text-left border border-slate-150 dark:border-slate-800 shadow-sm relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                    <Leaf size={18} />
                  </div>
                  <div className="text-slate-400 group-hover:text-emerald-500 transition-colors">
                    <ArrowRight size={18} className="transform group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono font-black text-emerald-500 uppercase tracking-wider block">Eco-Supply Chains</span>
                  <h3 className="text-base font-extrabold uppercase text-slate-900 dark:text-white tracking-tight">
                    Sustainability & Greener Cargo
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Learn how Logify actively invests in sustainable aviation fuels, low-carbon maritime transport, and electric last-mile delivery vans to minimize global emissions.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card B: Connectedness Report */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => onNavigate('about')}
              className="group cursor-pointer bg-slate-50 dark:bg-slate-950 rounded-2xl p-6 sm:p-8 text-left border border-slate-150 dark:border-slate-800 shadow-sm relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                    <Globe size={18} />
                  </div>
                  <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
                    <ArrowRight size={18} className="transform group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono font-black text-blue-500 uppercase tracking-wider block">Industry Insight</span>
                  <h3 className="text-base font-extrabold uppercase text-slate-900 dark:text-white tracking-tight">
                    Logify Connectedness Report
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Dive into our annual publication mapping trade corridors, international tariff policies, and deep trends transforming physical distribution globally.
                  </p>
                </div>
              </div>
            </motion.div>

          </div>

        </div>
      </section>

    </div>
  );
}
