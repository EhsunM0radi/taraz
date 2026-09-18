import React from 'react';
import { X } from 'lucide-react';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClear?: () => void;
  accent?: 'emerald' | 'cyan' | 'purple' | 'amber' | 'rose';
}

const accentFocusMap = {
  emerald: 'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30',
  cyan: 'focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30',
  purple: 'focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30',
  amber: 'focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30',
  rose: 'focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30',
};

export const TextInput: React.FC<TextInputProps> = ({
  leftIcon,
  rightIcon,
  onClear,
  value,
  accent = 'emerald',
  className = '',
  ...props
}) => {
  const hasValue = Boolean(value && String(value).length > 0);

  return (
    <div className="relative flex items-center">
      {rightIcon && (
        <span className="absolute right-3.5 text-slate-500 pointer-events-none shrink-0">
          {rightIcon}
        </span>
      )}
      <input
        value={value}
        {...props}
        className={`w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none transition-all ${
          accentFocusMap[accent]
        } ${rightIcon ? 'pr-10' : ''} ${leftIcon || onClear ? 'pl-9' : ''} ${className}`}
      />
      {onClear && hasValue && (
        <button
          type="button"
          onClick={onClear}
          className="absolute left-3 text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors"
          tabIndex={-1}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      {leftIcon && !onClear && (
        <span className="absolute left-3.5 text-slate-500 pointer-events-none shrink-0">
          {leftIcon}
        </span>
      )}
    </div>
  );
};
