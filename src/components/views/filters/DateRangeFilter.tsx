import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  X,
  CalendarRange,
  ChevronLeft,
} from 'lucide-react';
import {
  toPersianDigits,
  getCurrentJalaliDate,
  getJalaliMonthName,
  parseJalaliDate,
  formatShortPersianDate,
  jalaliToTimestamp,
} from '../../../utils/persianDate';
import { PersianDateRangeModal } from './PersianDateRangeModal';

export type TimeframeMode =
  | 'all'
  | 'today'
  | 'yesterday'
  | '7days'
  | '30days'
  | 'this_month'
  | 'last_month'
  | '90days'
  | 'this_year'
  | 'custom';

interface DateRangeFilterProps {
  timeframe: TimeframeMode;
  customStartDate: string; // YYYY/MM/DD
  customEndDate: string; // YYYY/MM/DD
  onSelectTimeframe: (mode: TimeframeMode) => void;
  onCustomDateChange: (start: string, end: string) => void;
  onClear: () => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  timeframe,
  customStartDate,
  customEndDate,
  onSelectTimeframe,
  onCustomDateChange,
  onClear,
}) => {
  const currentJalali = getCurrentJalaliDate();
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  const presets = [
    { id: 'all', label: 'همه زمان‌ها', icon: '🌐' },
    { id: 'today', label: 'امروز', icon: '⚡' },
    { id: 'yesterday', label: 'دیروز', icon: '⏮️' },
    { id: '7days', label: '۷ روز اخیر', icon: '📅' },
    { id: '30days', label: '۳۰ روز اخیر', icon: '📆' },
    { id: 'this_month', label: `این ماه (${getJalaliMonthName(currentJalali.jm)})`, icon: '🌙' },
    { id: 'last_month', label: 'ماه گذشته', icon: '🗓️' },
    { id: '90days', label: '۳ ماه گذشته', icon: '📊' },
    { id: 'this_year', label: `سال ${toPersianDigits(currentJalali.jy)}`, icon: '📈' },
    { id: 'custom', label: 'بازه دلخواه تقویمی', icon: '🎯' },
  ];

  const handlePresetClick = (id: string) => {
    if (id === 'custom') {
      onSelectTimeframe('custom');
      setIsCalendarModalOpen(true);
    } else {
      onSelectTimeframe(id as TimeframeMode);
    }
  };

  const handleApplyCustomModal = (start: string, end: string) => {
    onCustomDateChange(start, end);
    onSelectTimeframe('custom');
  };

  // Human readable description of custom range
  const customSummary = React.useMemo(() => {
    if (!customStartDate || !customEndDate) return null;
    const s = parseJalaliDate(customStartDate);
    const e = parseJalaliDate(customEndDate);
    if (!s || !e) return null;
    const sStr = formatShortPersianDate(s.jy, s.jm, s.jd);
    const eStr = formatShortPersianDate(e.jy, e.jm, e.jd);
    const tsStart = jalaliToTimestamp(s.jy, s.jm, s.jd);
    const tsEnd = jalaliToTimestamp(e.jy, e.jm, e.jd);
    const diff = Math.round((tsEnd - tsStart) / 86400000) + 1;
    return {
      text: `از ${sStr} تا ${eStr}`,
      days: diff > 0 ? diff : 1,
    };
  }, [customStartDate, customEndDate]);

  const hasActiveDate = timeframe !== 'all';
  const isCustom = timeframe === 'custom';

  return (
    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3.5 font-sans">
      {/* Header with Icon-only Clear */}
      <div className="flex items-center justify-between">
        <label className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
          <CalendarIcon className="w-4 h-4 text-emerald-400" />
          <span>بازه زمانی و تاریخ تراکنش‌ها</span>
        </label>
        {hasActiveDate && (
          <button
            type="button"
            onClick={onClear}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="حذف فیلتر تاریخ"
            aria-label="حذف فیلتر تاریخ"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Preset Grid Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
        {presets.map((t) => {
          const isSelected = timeframe === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handlePresetClick(t.id)}
              className={`p-2.5 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-950/40 ring-2 ring-emerald-400/40'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span className="text-xs">{t.icon}</span>
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Custom Date Banner if Custom is Selected */}
      {isCustom && (
        <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 flex items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0">
              <CalendarRange className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate tabular-nums">
                {customSummary ? customSummary.text : 'بازه تقویمی مشخص نشده'}
              </div>
              {customSummary && (
                <div className="text-[10px] text-emerald-400 font-semibold tabular-nums">
                  طول بازه: {toPersianDigits(customSummary.days)} روز
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCalendarModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0 active:scale-95 shadow-sm"
          >
            <span>تغییر تقویم</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Dedicated Mobile Calendar Modal */}
      <PersianDateRangeModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        initialStartDate={customStartDate || currentJalali.dateStr}
        initialEndDate={customEndDate || currentJalali.dateStr}
        onApply={handleApplyCustomModal}
      />
    </div>
  );
};
