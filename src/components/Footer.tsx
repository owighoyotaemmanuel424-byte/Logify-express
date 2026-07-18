import React from 'react';
import { Truck, Mail, Phone, MapPin, Linkedin, Twitter, Facebook } from 'lucide-react';
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
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand Info */}
          <div className="space-y-4 col-span-1 md:col-span-1">
            <div
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-dhl-yellow flex items-center justify-center text-dhl-red font-black">
                <Truck size={16} className="fill-current" />
              </div>
              <span className="font-sans font-bold text-base tracking-tight text-white uppercase">
                <span className="text-dhl-red">Log</span><span className="text-dhl-yellow">ify</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {companyName} is a next-generation smart supply chain solution, delivering freight, documents, express cargo, and digital order tracking globally with extreme precision.
            </p>
            <div className="flex gap-3 text-slate-500">
              <a href="#" className="hover:text-dhl-yellow transition-colors"><Twitter size={16} /></a>
              <a href="#" className="hover:text-dhl-yellow transition-colors"><Linkedin size={16} /></a>
              <a href="#" className="hover:text-dhl-yellow transition-colors"><Facebook size={16} /></a>
            </div>
          </div>

          {/* Nav Links */}
          <div className="space-y-3 col-span-1">
            <h4 className="text-white text-xs font-bold tracking-wider uppercase">Shipment Portal</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>
                <button onClick={() => onNavigate('track')} className="hover:text-dhl-yellow transition-colors">
                  Track Cargo Order
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('quote')} className="hover:text-dhl-yellow transition-colors">
                  Get Booking Quote
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-dhl-yellow transition-colors">
                  Global Logistics Services
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 col-span-1">
            <h4 className="text-white text-xs font-bold tracking-wider uppercase">Quick Access</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>
                <button onClick={() => onNavigate('admin-login')} className="hover:text-dhl-yellow transition-colors">
                  Admin Portal Login
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-dhl-yellow transition-colors">
                  Help & Contact Support
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3 col-span-1 text-xs">
            <h4 className="text-white text-xs font-bold tracking-wider uppercase">Global Offices</h4>
            <div className="space-y-2.5 text-slate-500">
              <div className="flex gap-2 items-start">
                <MapPin size={14} className="text-dhl-yellow shrink-0 mt-0.5" />
                <span>100 Broadway, New York, NY 10005, USA</span>
              </div>
              <div className="flex gap-2 items-center">
                <Phone size={14} className="text-dhl-yellow shrink-0" />
                <span>{contactPhone}</span>
              </div>
              <div className="flex gap-2 items-center">
                <Mail size={14} className="text-dhl-yellow shrink-0" />
                <span>{contactEmail}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900 mt-12 pt-8 flex flex-col md:flex-row md:justify-between text-[11px] text-slate-600 gap-4">
          <p>© 2026 {companyName} Ltd. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-dhl-yellow">Security Guidelines</a>
            <a href="#" className="hover:text-dhl-yellow">Terms & Conditions</a>
            <a href="#" className="hover:text-dhl-yellow">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
