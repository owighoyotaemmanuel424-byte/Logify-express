import React from 'react';
import { Truck, Mail, Phone, MapPin, Linkedin, Instagram, Facebook } from 'lucide-react';
import { Settings } from '../types.js';

interface FooterProps {
  onNavigate: (view: string) => void;
  settings?: Settings;
}

export default function Footer({ onNavigate, settings }: FooterProps) {
  const companyName = settings?.companyName || 'Logify';
  const contactPhone = settings?.contactPhone || '+1 (800) 555-LOGI';
  const contactEmail = settings?.contactEmail || 'support@logify.com';

  return (
    <footer className="bg-[#111111] text-slate-400 border-t border-slate-900 transition-colors duration-300" id="global-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 text-left">
          
          {/* Brand Info */}
          <div className="space-y-4 col-span-1 md:col-span-1">
            <div
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 cursor-pointer group"
              id="footer-logo-container"
            >
              <div className="w-9 h-9 rounded-xl bg-[#FFCC00] flex items-center justify-center text-[#D40511] font-black shadow-md">
                <Truck size={18} className="fill-current" />
              </div>
              <span className="font-sans font-black text-lg tracking-tight text-white uppercase">
                <span className="text-[#FFCC00]">Log</span><span className="text-white">ify</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {companyName} is a next-generation smart supply chain solution, delivering freight, documents, express cargo, and digital order tracking globally with extreme precision.
            </p>
            <div className="flex gap-3 text-slate-500">
              <a href="#" className="hover:text-[#FFCC00] transition-colors" aria-label="Facebook"><Facebook size={16} /></a>
              <a href="#" className="hover:text-[#FFCC00] transition-colors" aria-label="LinkedIn"><Linkedin size={16} /></a>
              <a href="#" className="hover:text-[#FFCC00] transition-colors" aria-label="Instagram"><Instagram size={16} /></a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3 col-span-1">
            <h4 className="text-white text-xs font-black tracking-wider uppercase font-mono border-l-2 border-[#D40511] pl-2">Quick Links</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-[#FFCC00] transition-colors cursor-pointer">
                  Customer Service
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('track')} className="hover:text-[#FFCC00] transition-colors cursor-pointer">
                  Portals & Tracking
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('pricing')} className="hover:text-[#FFCC00] transition-colors cursor-pointer">
                  Get a Quote & Rates
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Our Divisions */}
          <div className="space-y-3 col-span-1">
            <h4 className="text-white text-xs font-black tracking-wider uppercase font-mono border-l-2 border-[#D40511] pl-2">Our Divisions</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>
                <button onClick={() => onNavigate('send')} className="hover:text-[#FFCC00] transition-colors cursor-pointer">
                  Logify Express
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('pricing')} className="hover:text-[#FFCC00] transition-colors cursor-pointer">
                  Global Forwarding
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-[#FFCC00] transition-colors cursor-pointer">
                  Supply Chain Solutions
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Company Information */}
          <div className="space-y-3 col-span-1 text-xs">
            <h4 className="text-white text-xs font-black tracking-wider uppercase font-mono border-l-2 border-[#D40511] pl-2">Company Information</h4>
            <div className="space-y-2.5 text-slate-500">
              <div className="flex gap-2 items-start">
                <MapPin size={14} className="text-[#D40511] shrink-0 mt-0.5" />
                <span>100 Broadway, New York, NY 10005, USA</span>
              </div>
              <div className="flex gap-2 items-center">
                <Phone size={14} className="text-[#D40511] shrink-0" />
                <span>{contactPhone}</span>
              </div>
              <div className="flex gap-2 items-center">
                <Mail size={14} className="text-[#D40511] shrink-0" />
                <span>{contactEmail}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900 mt-12 pt-8 flex flex-col md:flex-row md:justify-between text-[11px] text-slate-600 gap-4 text-left md:text-center">
          <p>© 2026 {companyName} Ltd. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[#FFCC00] transition-colors">Security Guidelines</a>
            <a href="#" className="hover:text-[#FFCC00] transition-colors">Terms & Conditions</a>
            <a href="#" className="hover:text-[#FFCC00] transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
