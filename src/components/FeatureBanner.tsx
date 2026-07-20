import React from 'react';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface FeatureBannerProps {
  headline?: string;
  description?: string;
  ctaText?: string;
  onClick?: () => void;
  className?: string;
}

export default function FeatureBanner({
  headline = 'Navigating Latest Tariff Developments',
  description = 'In light of evolving customs structures and compliance requirements globally, Logify provides up-to-the-minute analysis and flexible options to ensure your supply chain remains uninterrupted.',
  ctaText = 'Explore Our Solutions',
  onClick,
  className = '',
}: FeatureBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`bg-[#FFCC00] text-slate-950 rounded-2xl p-6 sm:p-8 md:p-10 shadow-lg border-l-8 border-[#D40511] text-left relative overflow-hidden ${className}`}
      id="tariff-banner-card"
    >
      {/* Subtle Vector Accents */}
      <div className="absolute top-0 right-0 w-32 h-full opacity-10 bg-[radial-gradient(#111111_1.5px,transparent_1.5px)] [background-size:12px_12px] pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/10 border border-slate-950/10 text-slate-950 text-[10px] font-mono uppercase tracking-widest font-black">
            <ShieldAlert size={12} className="stroke-[2.5]" />
            Regulatory Bulletin
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight uppercase font-sans">
            {headline}
          </h2>
          <p className="text-xs sm:text-sm text-slate-900 leading-relaxed max-w-xl font-medium">
            {description}
          </p>
        </div>

        <div className="shrink-0 pt-2 md:pt-0">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#111111] hover:bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-md shadow-black/10"
            id="tariff-explore-btn"
          >
            <span>{ctaText}</span>
            <ArrowRight size={14} className="stroke-[2.5]" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
