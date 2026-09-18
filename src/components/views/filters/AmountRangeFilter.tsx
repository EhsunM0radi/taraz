import React from 'react';
import {
  CircleDollarSign,
  X,
  Plus,
  Minus,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { Currency } from '../../../types';
import {
  formatMoney,
  toPersianDigits,
  toEnglishDigits,
  numberToPersianWords,
} from '../../../utils/persianDate';

interface AmountRangeFilterProps {
  minAmount: string;
  maxAmount: string;
  amountPreset: string;
  currency: Currency;
  onMinChange: (val: string) => void;
  onMaxChange: (val: string) => void;
  onSelectPreset: (presetId: string, min: string, max: string) => void;
  onClear: () => void;
}

export const AmountRangeFilter: React.FC<AmountRangeFilterProps> = ({
  minAmount,
  maxAmount,
  amountPreset,
  currency,
  onMinChange,
  onMaxChange,
  onSelectPreset,
  onClear,
}) => {
  const minNum = parseInt(toEnglishDigits(minAmount) || '0', 10) || 0;
  const maxNum = parseInt(toEnglishDigits(maxAmount) || '0', 10) || 0;

  const presets = [
    { id: 'all', label: 'همه مبالغ', min: '', max: '' },
    { id: 'under_100k', label: 'زیر ۱۰۰ هزار', min: '', max: '100000' },
    { id: '100k_500k', label: '۱۰۰ تا ۵۰۰ هزار', min: '100000', max: '500000' },
    { id: '500k_2m', label: '۵۰۰ هزار تا ۲ م', min: '500000', max: '2000000' },
    { id: '2m_10m', label: '۲ تا ۱۰ م', min: '2000000', max: '10000000' },
    { id: '10m_50m', label: '۱۰ تا ۵۰ م', min: '10000000', max: '50000000' },
    { id: 'above_50m', label: 'بیش از ۵۰ م', min: '50000000', max: '' },
  ];

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = toEnglishDigits(e.target.value).replace(/[^0-9]/g, '');
    onMinChange(raw);
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = toEnglishDigits(e.target.value).replace(/[^0-9]/g, '');
    onMaxChange(raw);
  };

  const stepAmount = (type: 'min' | 'max', delta: number) => {
    if (type === 'min') {
      const next = Math.max(0, minNum + delta);
      onMinChange(next > 0 ? String(next) : '');
    } else {
      const next = Math.max(0, maxNum + delta);
      onMaxChange(next > 0 ? String(next) : '');
    }
  };

  const formatDisplayInput = (val: string) => {
    if (!val) return '';
    const num = parseInt(toEnglishDigits(val), 10);
    if (isNaN(num)) return '';
    return toPersianDigits(num.toLocaleString('en-US'));
  };

  const hasActiveAmount = Boolean(minAmount || maxAmount);

  return (
    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
          <CircleDollarSign className="w-4 h-4 text-emerald-400" />
          <span>محدوده مبلغ ({currency === 'TOMAN' ? 'تومان' : 'ریال'})</span>
        </label>
        {hasActiveAmount && (
          <button
            type="button"
            onClick={onClear}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="حذف بازه مبلغ"
            aria-label="حذف بازه مبلغ"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Amount Preset Pills */}
      <div>
        <div className="text-[10px] text-slate-400 font-semibold mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>پیش‌تنظیم‌های پرکاربرد:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => {
            const isSelected = amountPreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPreset(p.id, p.min, p.max)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-950/40 ring-2 ring-emerald-400/40'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Mobile Dual Input Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Min Amount Card */}
        <div className={`p-3 rounded-xl border transition-all ${
          minAmount ? 'bg-slate-900/90 border-emerald-500/50' : 'bg-slate-900/40 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-slate-300">از مبلغ (حداقل):</span>
            {minNum > 0 && (
              <button
                type="button"
                onClick={() => onMinChange('')}
                className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
                title="پاک‌سازی حداقل مبلغ"
                aria-label="پاک‌سازی حداقل مبلغ"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={formatDisplayInput(minAmount)}
              onChange={handleMinInputChange}
              placeholder="مثال: ۱۰۰,۰۰۰"
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 rounded-xl px-3 py-2.5 text-white outline-none font-mono text-sm font-bold transition-all text-left dir-ltr placeholder:text-slate-600 placeholder:text-right placeholder:font-sans placeholder:text-xs"
            />
            {minAmount && (
              <button
                type="button"
                onClick={() => onMinChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Persian Words Explanation */}
          {minNum > 0 && (
            <div className="mt-1.5 px-2 py-1 rounded-lg bg-emerald-950/40 border border-emerald-900/40 text-[10px] font-medium text-emerald-300 truncate">
              {numberToPersianWords(minNum)} {currency === 'TOMAN' ? 'تومان' : 'ریال'}
            </div>
          )}

          {/* Touch Stepper Quick Increment Pills */}
          <div className="flex items-center gap-1 pt-2 flex-wrap">
            <button
              type="button"
              onClick={() => stepAmount('min', 100000)}
              className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 hover:text-white font-mono font-medium transition-all active:scale-95 cursor-pointer flex items-center gap-0.5"
            >
              <Plus className="w-2.5 h-2.5 text-emerald-400" />
              <span>۱۰۰ هزار</span>
            </button>
            <button
              type="button"
              onClick={() => stepAmount('min', 1000000)}
              className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 hover:text-white font-mono font-medium transition-all active:scale-95 cursor-pointer flex items-center gap-0.5"
            >
              <Plus className="w-2.5 h-2.5 text-emerald-400" />
              <span>۱ میلیون</span>
            </button>
            {minNum >= 500000 && (
              <button
                type="button"
                onClick={() => stepAmount('min', -500000)}
                className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-400 hover:text-rose-300 font-mono transition-all active:scale-95 cursor-pointer flex items-center gap-0.5"
                title="کاهش ۵۰۰ هزار"
              >
                <Minus className="w-2.5 h-2.5 text-rose-400" />
                <span>۵۰۰ هزار</span>
              </button>
            )}
          </div>
        </div>

        {/* Max Amount Card */}
        <div className={`p-3 rounded-xl border transition-all ${
          maxAmount ? 'bg-slate-900/90 border-emerald-500/50' : 'bg-slate-900/40 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-slate-300">تا مبلغ (حداکثر):</span>
            {maxNum > 0 && (
              <button
                type="button"
                onClick={() => onMaxChange('')}
                className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
                title="پاک‌سازی حداکثر مبلغ"
                aria-label="پاک‌سازی حداکثر مبلغ"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={formatDisplayInput(maxAmount)}
              onChange={handleMaxInputChange}
              placeholder="مثال: ۱۰,۰۰۰,۰۰۰"
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 rounded-xl px-3 py-2.5 text-white outline-none font-mono text-sm font-bold transition-all text-left dir-ltr placeholder:text-slate-600 placeholder:text-right placeholder:font-sans placeholder:text-xs"
            />
            {maxAmount && (
              <button
                type="button"
                onClick={() => onMaxChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Persian Words Explanation */}
          {maxNum > 0 && (
            <div className="mt-1.5 px-2 py-1 rounded-lg bg-emerald-950/40 border border-emerald-900/40 text-[10px] font-medium text-emerald-300 truncate">
              {numberToPersianWords(maxNum)} {currency === 'TOMAN' ? 'تومان' : 'ریال'}
            </div>
          )}

          {/* Touch Stepper Quick Increment Pills */}
          <div className="flex items-center gap-1 pt-2 flex-wrap">
            <button
              type="button"
              onClick={() => stepAmount('max', 1000000)}
              className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 hover:text-white font-mono font-medium transition-all active:scale-95 cursor-pointer flex items-center gap-0.5"
            >
              <Plus className="w-2.5 h-2.5 text-emerald-400" />
              <span>۱ میلیون</span>
            </button>
            <button
              type="button"
              onClick={() => stepAmount('max', 10000000)}
              className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 hover:text-white font-mono font-medium transition-all active:scale-95 cursor-pointer flex items-center gap-0.5"
            >
              <Plus className="w-2.5 h-2.5 text-emerald-400" />
              <span>۱۰ میلیون</span>
            </button>
            {maxNum >= 1000000 && (
              <button
                type="button"
                onClick={() => stepAmount('max', -1000000)}
                className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-400 hover:text-rose-300 font-mono transition-all active:scale-95 cursor-pointer flex items-center gap-0.5"
                title="کاهش ۱ میلیون"
              >
                <Minus className="w-2.5 h-2.5 text-rose-400" />
                <span>۱ م</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Range Visual Indicator */}
      {hasActiveAmount && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              فیلتر فعال: {minNum > 0 ? `از ${formatMoney(minNum, currency)}` : 'از ۰'} {maxNum > 0 ? `تا ${formatMoney(maxNum, currency)}` : 'به بالا'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
