import React from 'react';
import { Activity, BadgeCheck, BellRing, FileCheck2, LockKeyhole, MapPinned, MessageCircle, ShieldCheck } from 'lucide-react';

const items = [
  { icon: LockKeyhole, title: 'Protected access', text: 'Account and operational data should only be accessed by authorized users and services.' },
  { icon: MapPinned, title: 'Shipment visibility', text: 'Follow shipment events, status changes and delivery progress from one place.' },
  { icon: Activity, title: 'Operational status', text: 'Use the service status view to understand whether Logify systems are available.' },
  { icon: FileCheck2, title: 'Clear documentation', text: 'Keep shipment details, tracking events and operational records organized and accessible.' },
  { icon: BellRing, title: 'Exception awareness', text: 'Surface delays, failed delivery attempts and other operational exceptions clearly.' },
  { icon: MessageCircle, title: 'Customer support', text: 'Give customers a direct path to help when a shipment needs attention.' },
];

export default function TrustCenter({ onNavigate }: { onNavigate?: (view: string) => void }) {
  return <section className="relative overflow-hidden bg-[#0b1f33] text-white py-20 sm:py-24">
    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-[.18em] text-slate-300"><ShieldCheck size={13} className="text-amber-400" /> Logify Trust Center</div>
        <h2 className="mt-5 text-3xl sm:text-5xl font-display font-bold tracking-tight">Built for visible, accountable logistics.</h2>
        <p className="mt-5 text-base sm:text-lg leading-8 text-slate-300">Trust comes from knowing what is happening. Logify brings shipment visibility, operational status, security controls and customer support into one clear experience.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(({ icon: Icon, title, text }) => <div key={title} className="rounded-2xl border border-white/10 bg-white/[.06] p-6 backdrop-blur-sm hover:bg-white/[.09] transition-colors">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400"><Icon size={19} /></div>
          <h3 className="mt-5 font-display font-bold text-lg">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
        </div>)}
      </div>
      <div className="mt-8 grid lg:grid-cols-[1fr_auto] gap-5 items-center rounded-2xl border border-white/10 bg-white/[.05] p-6 sm:p-7">
        <div className="flex gap-4"><div className="hidden sm:flex w-11 h-11 rounded-xl bg-emerald-400/10 text-emerald-300 items-center justify-center shrink-0"><BadgeCheck size={21} /></div><div><p className="font-display font-bold">Transparency over empty promises</p><p className="mt-1 text-sm leading-6 text-slate-400">Logify only presents operational metrics, certifications and service commitments that your organization has actually configured and verified.</p></div></div>
        <div className="flex flex-wrap gap-2"><button onClick={() => onNavigate?.('track')} className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-xs font-black text-[#0b1f33] hover:bg-amber-300 cursor-pointer"><MapPinned size={14} /> Track a shipment</button><button onClick={() => onNavigate?.('contact')} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 cursor-pointer"><MessageCircle size={14} /> Get support</button></div>
      </div>
    </div>
  </section>;
}
