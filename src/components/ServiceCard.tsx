import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';

interface ServiceCardProps {
  variant?: 'simple' | 'detailed';
  icon: React.ReactNode;
  title: string;
  description: string;
  bullets?: string[];
  ctaText?: string;
  onClick?: () => void;
  className?: string;
}

export default function ServiceCard({
  variant = 'simple',
  icon,
  title,
  description,
  bullets = [],
  ctaText,
  onClick,
  className = '',
}: ServiceCardProps) {
  if (variant === 'detailed') {
    return (
      <motion.div
        whileHover={{ y: -6, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-md flex flex-col justify-between text-left space-y-6 ${className}`}
        onClick={onClick}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#D40511] dark:text-red-450 shadow-sm shrink-0">
              {icon}
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">
              {title}
            </h3>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
          </p>

          {bullets.length > 0 && (
            <ul className="space-y-2 pt-2">
              {bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-350">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                    <Check size={11} className="stroke-[3]" />
                  </div>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {ctaText && (
          <button
            onClick={(e) => {
              if (onClick) {
                e.stopPropagation();
                onClick();
              }
            }}
            className="w-full sm:w-auto mt-4 px-5 py-2.5 border-2 border-slate-900 hover:bg-slate-900 hover:text-white dark:border-slate-100 dark:hover:bg-slate-100 dark:hover:text-slate-950 text-xs font-extrabold rounded-lg tracking-wide transition-all cursor-pointer text-center"
          >
            {ctaText}
          </button>
        )}
      </motion.div>
    );
  }

  // Simple layout (for quick hero cards)
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 text-left flex flex-col justify-between h-full ${className}`}
    >
      <div className="space-y-3">
        <div className="w-10 h-10 rounded-xl bg-[#FFCC00]/10 flex items-center justify-center text-[#D40511] shrink-0 font-bold">
          {icon}
        </div>
        <div>
          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            {title}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mt-1">
            {description}
          </p>
        </div>
      </div>
      <div className="pt-3 text-[10px] text-[#D40511] font-extrabold uppercase tracking-widest flex items-center gap-1 mt-3">
        <span>Explore Solutions</span>
        <span className="text-xs font-sans">➔</span>
      </div>
    </motion.div>
  );
}
