import React from 'react';
import { ArrowRight } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  onBack: () => void;
  rightAction?: React.ReactNode;
  icon?: React.ReactNode;
  accentColor?: 'emerald' | 'cyan' | 'purple' | 'amber' | 'rose' | 'slate';
}

const accentTextMap = {
  emerald: 'text-emerald-400',
  cyan: 'text-cyan-400',
  purple: 'text-purple-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
  slate: 'text-slate-300',
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  onBack,
  rightAction,
  icon,
  accentColor = 'emerald',
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 select-none">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
          title="بازگشت"
        >
          <ArrowRight className={`w-4 h-4 ${accentTextMap[accentColor]}`} />
          <span>بازگشت</span>
        </button>

        <div className="flex items-center gap-2">
          {icon && <span className={`${accentTextMap[accentColor]} shrink-0`}>{icon}</span>}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight">{title}</h1>
              {badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && <p className="text-[11px] text-slate-400 font-medium">{subtitle}</p>}
          </div>
        </div>
      </div>

      {rightAction ? (
        <div>{rightAction}</div>
      ) : null}
    </header>
  );
};
