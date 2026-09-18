import React from 'react';
import { toEnglishDigits, toPersianDigits, formatMoney } from '../../utils/persianDate';
import { Currency } from '../../types';

interface MoneyInputProps {
  value: string | number;
  onChange: (value: string, numericValue: number) => void;
  currency?: Currency;
  accent?: 'emerald' | 'cyan' | 'purple' | 'amber' | 'rose';
  presets?: number[];
  autoFocus?: boolean;
  placeholder?: string;
  id?: string;
  required?: boolean;
}

const accentFocusMap = {
  emerald: 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-emerald-400',
  cyan: 'focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-cyan-400',
  purple: 'focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-purple-400',
  amber: 'focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-amber-400',
  rose: 'focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-rose-400',
};

const presetButtonAccent = {
  emerald: 'hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-950/20',
  cyan: 'hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-950/20',
  purple: 'hover:text-purple-400 hover:border-purple-500/40 hover:bg-purple-950/20',
  amber: 'hover:text-amber-400 hover:border-amber-500/40 hover:bg-amber-950/20',
  rose: 'hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-950/20',
};

export const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChange,
  currency = 'TOMAN',
  accent = 'emerald',
  presets = [100000, 250000, 500000, 1000000, 2500000, 5000000],
  autoFocus = false,
  placeholder = '۰',
  id = 'input_money',
  required = false,
}) => {
  const rawStr = String(value || '');
  const numericAmount = parseInt(toEnglishDigits(rawStr).replace(/[^0-9]/g, ''), 10) || 0;
  const displayFormatted = numericAmount > 0 ? toPersianDigits(numericAmount.toLocaleString()) : '';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const cleanNum = parseInt(toEnglishDigits(rawVal).replace(/[^0-9]/g, ''), 10) || 0;
    onChange(cleanNum > 0 ? String(cleanNum) : '', cleanNum);
  };

  const handleAddPreset = (amount: number) => {
    const newAmount = numericAmount + amount;
    onChange(String(newAmount), newAmount);
  };

  const handleSetPreset = (amount: number) => {
    onChange(String(amount), amount);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={displayFormatted}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          autoFocus={autoFocus}
          className={`w-full bg-slate-950 border-2 border-slate-700/80 rounded-2xl px-4 py-3.5 text-xl sm:text-2xl font-black text-white tracking-wide placeholder-slate-600 outline-none transition-all ${
            accentFocusMap[accent].split(' ')[0]
          } ${accentFocusMap[accent].split(' ')[1]}`}
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-slate-400 font-bold select-none">
          {currency === 'TOMAN' ? 'تومان' : 'ریال'}
        </span>
      </div>

      {/* Quick Suggestion Pills */}
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleSetPreset(p)}
              className={`px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 transition-colors cursor-pointer font-medium select-none ${presetButtonAccent[accent]}`}
            >
              {p >= 1000000
                ? `${toPersianDigits((p / 1000000).toLocaleString())} میلیون`
                : `${toPersianDigits((p / 1000).toLocaleString())} هزار`}
            </button>
          ))}
        </div>
      )}

      {/* Currency Equivalence info */}
      {numericAmount > 0 && (
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
          <span className="text-slate-400">
            معادل {currency === 'TOMAN' ? 'ریالی' : 'تومانی'}:{' '}
            <strong className="text-slate-200 font-mono">
              {formatMoney(numericAmount, currency === 'TOMAN' ? 'IRR' : 'TOMAN')}
            </strong>
          </span>
          <span className="font-bold text-emerald-400">
            {formatMoney(numericAmount, currency === 'IRR' ? 'IRR' : 'TOMAN')}
          </span>
        </div>
      )}
    </div>
  );
};
