import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  accent?: 'emerald' | 'cyan' | 'purple' | 'amber' | 'rose';
  icon?: React.ReactNode;
}

const accentFocusMap = {
  emerald: 'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30',
  cyan: 'focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30',
  purple: 'focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30',
  amber: 'focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30',
  rose: 'focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30',
};

export const Select: React.FC<SelectProps> = ({
  options,
  children,
  accent = 'emerald',
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className="relative flex items-center">
      {icon && (
        <span className="absolute right-3.5 text-slate-500 pointer-events-none shrink-0">
          {icon}
        </span>
      )}
      <select
        {...props}
        className={`w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm text-slate-100 outline-none appearance-none cursor-pointer transition-all ${
          accentFocusMap[accent]
        } ${icon ? 'pr-10' : ''} pl-9 ${className}`}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-slate-900 text-slate-100 py-1">
                {opt.label} {opt.sublabel ? `(${opt.sublabel})` : ''}
              </option>
            ))
          : children}
      </select>
      <ChevronDown className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
    </div>
  );
};
