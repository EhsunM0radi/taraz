import React from 'react';

export interface SegmentOption<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  activeColorClass?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
  size = 'md',
}: SegmentedControlProps<T>) {
  const sizeClasses = {
    sm: 'py-1.5 px-2.5 text-xs',
    md: 'py-2.5 px-3 text-xs sm:text-sm',
    lg: 'py-3.5 px-4 text-sm',
  }[size];

  return (
    <div
      className={`grid p-1.5 bg-slate-950 rounded-2xl border border-slate-800 gap-1.5 ${
        options.length === 2 ? 'grid-cols-2' : options.length === 3 ? 'grid-cols-3' : 'grid-cols-4'
      } ${className}`}
    >
      {options.map((opt) => {
        const isActive = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`${sizeClasses} rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer select-none ${
              isActive
                ? opt.activeColorClass || 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60 ring-1 ring-white/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
