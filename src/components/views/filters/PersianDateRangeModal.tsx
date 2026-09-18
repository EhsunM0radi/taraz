import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  RotateCcw,
  Check,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  toPersianDigits,
  getCurrentJalaliDate,
  getJalaliMonthName,
  getJalaliMonthDays,
  getJalaliFirstDayOfWeek,
  gregorianToJalali,
  jalaliToTimestamp,
  parseJalaliDate,
  formatJalaliDateStr,
  compareJalaliDates,
  JALALI_MONTH_NAMES,
  getJalaliDayOfWeekName,
  formatShortPersianDate,
  formatFullPersianDate,
} from '../../../utils/persianDate';

interface PersianDateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStartDate: string; // YYYY/MM/DD
  initialEndDate: string; // YYYY/MM/DD
  onApply: (startDate: string, endDate: string) => void;
}

type CalendarViewMode = 'days' | 'years' | 'months';

const WEEKDAYS = [
  { short: 'ش', full: 'شنبه', isWeekend: false },
  { short: 'ی', full: 'یکشنبه', isWeekend: false },
  { short: 'د', full: 'دوشنبه', isWeekend: false },
  { short: 'س', full: 'سه‌شنبه', isWeekend: false },
  { short: 'چ', full: 'چهارشنبه', isWeekend: false },
  { short: 'پ', full: 'پنج‌شنبه', isWeekend: false },
  { short: 'ج', full: 'جمعه', isWeekend: true },
];

const AVAILABLE_YEARS = [1398, 1399, 1400, 1401, 1402, 1403, 1404, 1405, 1406, 1407, 1408];

export const PersianDateRangeModal: React.FC<PersianDateRangeModalProps> = ({
  isOpen,
  onClose,
  initialStartDate,
  initialEndDate,
  onApply,
}) => {
  const currentJalali = useMemo(() => getCurrentJalaliDate(), []);

  // Local draft start & end dates
  const [startDate, setStartDate] = useState<string>(initialStartDate);
  const [endDate, setEndDate] = useState<string>(initialEndDate);

  // Sync draft when opened
  useEffect(() => {
    if (isOpen) {
      setStartDate(initialStartDate || currentJalali.dateStr);
      setEndDate(initialEndDate || currentJalali.dateStr);

      const p = parseJalaliDate(initialStartDate) || currentJalali;
      setViewYear(p.jy);
      setViewMonth(p.jm);
      setViewMode('days');
      setActiveTarget('auto');
    }
  }, [isOpen, initialStartDate, initialEndDate, currentJalali]);

  // Calendar View month & year
  const [viewYear, setViewYear] = useState<number>(currentJalali.jy);
  const [viewMonth, setViewMonth] = useState<number>(currentJalali.jm);

  // View Mode: 'days' -> 'years' -> 'months' -> 'days'
  const [viewMode, setViewMode] = useState<CalendarViewMode>('days');

  // Selected year when picking month
  const [tempSelectedYear, setTempSelectedYear] = useState<number>(currentJalali.jy);

  // Active target: 'start' | 'end' | 'auto'
  const [activeTarget, setActiveTarget] = useState<'start' | 'end' | 'auto'>('auto');

  // Parsed dates
  const startParsed = useMemo(() => {
    return parseJalaliDate(startDate) || {
      jy: currentJalali.jy,
      jm: currentJalali.jm,
      jd: currentJalali.jd,
    };
  }, [startDate, currentJalali]);

  const endParsed = useMemo(() => {
    return parseJalaliDate(endDate) || {
      jy: currentJalali.jy,
      jm: currentJalali.jm,
      jd: currentJalali.jd,
    };
  }, [endDate, currentJalali]);

  // Formatted date texts
  const startFormatted = useMemo(() => {
    if (!startDate) return null;
    const p = parseJalaliDate(startDate);
    return p
      ? {
          ...p,
          full: formatFullPersianDate(p.jy, p.jm, p.jd),
          short: formatShortPersianDate(p.jy, p.jm, p.jd),
          dayName: getJalaliDayOfWeekName(p.jy, p.jm, p.jd),
        }
      : null;
  }, [startDate]);

  const endFormatted = useMemo(() => {
    if (!endDate) return null;
    const p = parseJalaliDate(endDate);
    return p
      ? {
          ...p,
          full: formatFullPersianDate(p.jy, p.jm, p.jd),
          short: formatShortPersianDate(p.jy, p.jm, p.jd),
          dayName: getJalaliDayOfWeekName(p.jy, p.jm, p.jd),
        }
      : null;
  }, [endDate]);

  // Day count calculation
  const dayCount = useMemo(() => {
    if (!startDate || !endDate) return null;
    const s = parseJalaliDate(startDate);
    const e = parseJalaliDate(endDate);
    if (!s || !e) return null;
    const tsStart = jalaliToTimestamp(s.jy, s.jm, s.jd);
    const tsEnd = jalaliToTimestamp(e.jy, e.jm, e.jd);
    const diff = Math.round((tsEnd - tsStart) / 86400000) + 1;
    return diff > 0 ? diff : 0;
  }, [startDate, endDate]);

  if (!isOpen) return null;

  // Month navigation (In RTL: Right is Previous Month, Left is Next Month)
  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Day selection
  const handleDayClick = (dayNumber: number) => {
    const clickedDate = { jy: viewYear, jm: viewMonth, jd: dayNumber };
    const clickedStr = formatJalaliDateStr(viewYear, viewMonth, dayNumber);

    if (activeTarget === 'start') {
      if (endDate && compareJalaliDates(clickedDate, endParsed) > 0) {
        setStartDate(clickedStr);
        setEndDate(clickedStr);
      } else {
        setStartDate(clickedStr);
      }
      setActiveTarget('end');
    } else if (activeTarget === 'end') {
      if (startDate && compareJalaliDates(clickedDate, startParsed) < 0) {
        setStartDate(clickedStr);
        setEndDate(startDate);
      } else {
        setEndDate(clickedStr);
      }
      setActiveTarget('auto');
    } else {
      // Auto mode: If both selected and different, start fresh
      if (!startDate || (startDate && endDate && startDate !== endDate)) {
        setStartDate(clickedStr);
        setEndDate(clickedStr);
        setActiveTarget('end');
      } else {
        if (compareJalaliDates(clickedDate, startParsed) >= 0) {
          setEndDate(clickedStr);
        } else {
          setStartDate(clickedStr);
          setEndDate(startDate);
        }
        setActiveTarget('auto');
      }
    }
  };

  // Quick Preset Handlers
  const handleQuickPreset = (type: string) => {
    if (type === 'today') {
      setStartDate(currentJalali.dateStr);
      setEndDate(currentJalali.dateStr);
      setViewYear(currentJalali.jy);
      setViewMonth(currentJalali.jm);
    } else if (type === 'yesterday') {
      const now = new Date();
      const past1 = new Date(now.getTime() - 1 * 86400000);
      const jPast = gregorianToJalali(past1.getFullYear(), past1.getMonth() + 1, past1.getDate());
      const str = formatJalaliDateStr(jPast.jy, jPast.jm, jPast.jd);
      setStartDate(str);
      setEndDate(str);
      setViewYear(jPast.jy);
      setViewMonth(jPast.jm);
    } else if (type === 'last_7_days') {
      const now = new Date();
      const past7 = new Date(now.getTime() - 7 * 86400000);
      const jPast = gregorianToJalali(past7.getFullYear(), past7.getMonth() + 1, past7.getDate());
      const s = formatJalaliDateStr(jPast.jy, jPast.jm, jPast.jd);
      setStartDate(s);
      setEndDate(currentJalali.dateStr);
      setViewYear(currentJalali.jy);
      setViewMonth(currentJalali.jm);
    } else if (type === 'last_30_days') {
      const now = new Date();
      const past30 = new Date(now.getTime() - 30 * 86400000);
      const jPast = gregorianToJalali(past30.getFullYear(), past30.getMonth() + 1, past30.getDate());
      const s = formatJalaliDateStr(jPast.jy, jPast.jm, jPast.jd);
      setStartDate(s);
      setEndDate(currentJalali.dateStr);
      setViewYear(currentJalali.jy);
      setViewMonth(currentJalali.jm);
    } else if (type === 'this_month') {
      const s = `${currentJalali.jy}/${String(currentJalali.jm).padStart(2, '0')}/01`;
      setStartDate(s);
      setEndDate(currentJalali.dateStr);
      setViewYear(currentJalali.jy);
      setViewMonth(currentJalali.jm);
    } else if (type === 'last_month') {
      let lm = currentJalali.jm - 1;
      let ly = currentJalali.jy;
      if (lm === 0) {
        lm = 12;
        ly -= 1;
      }
      const days = getJalaliMonthDays(ly, lm);
      const s = `${ly}/${String(lm).padStart(2, '0')}/01`;
      const e = `${ly}/${String(lm).padStart(2, '0')}/${String(days).padStart(2, '0')}`;
      setStartDate(s);
      setEndDate(e);
      setViewYear(ly);
      setViewMonth(lm);
    } else if (type === 'current_season') {
      const seasonStartMonth = Math.floor((currentJalali.jm - 1) / 3) * 3 + 1;
      const s = `${currentJalali.jy}/${String(seasonStartMonth).padStart(2, '0')}/01`;
      setStartDate(s);
      setEndDate(currentJalali.dateStr);
      setViewYear(currentJalali.jy);
      setViewMonth(currentJalali.jm);
    } else if (type === 'year_start') {
      const s = `${currentJalali.jy}/01/01`;
      setStartDate(s);
      setEndDate(currentJalali.dateStr);
      setViewYear(currentJalali.jy);
      setViewMonth(currentJalali.jm);
    }
  };

  const handleReset = () => {
    setStartDate(currentJalali.dateStr);
    setEndDate(currentJalali.dateStr);
    setViewYear(currentJalali.jy);
    setViewMonth(currentJalali.jm);
    setActiveTarget('auto');
    setViewMode('days');
  };

  const handleConfirm = () => {
    if (startDate && endDate) {
      onApply(startDate, endDate);
      onClose();
    }
  };

  // Calendar math
  const daysInMonth = getJalaliMonthDays(viewYear, viewMonth);
  const firstDayOfWeekOffset = getJalaliFirstDayOfWeek(viewYear, viewMonth);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 animate-in fade-in duration-200 overflow-hidden select-none font-sans">
      {/* 1. Header Bar: Back Button, Title, Reset Button */}
      <div className="px-4 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        {/* Back Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-2 -mr-1 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          title="بازگشت"
          aria-label="بازگشت"
        >
          <ArrowRight className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold hidden sm:inline">بازگشت</span>
        </button>

        {/* Title */}
        <div className="text-center">
          <div className="text-sm font-black text-white flex items-center justify-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-emerald-400" />
            <span>بازه زمانی دلخواه</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            تقویم هجری خورشیدی
          </div>
        </div>

        {/* Reset Button (Icon-Only) */}
        <button
          type="button"
          onClick={handleReset}
          className="p-2 -ml-1 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          title="بازنشانی به امروز"
          aria-label="بازنشانی به امروز"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-w-lg mx-auto w-full">
        {/* 2. Dual Tactile Date Cards (از تاریخ / تا تاریخ) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Start Date Card */}
          <button
            type="button"
            onClick={() => {
              setActiveTarget('start');
              setViewMode('days');
            }}
            className={`p-3 rounded-2xl border text-right transition-all cursor-pointer relative ${
              activeTarget === 'start'
                ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md shadow-emerald-950/50'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>از تاریخ:</span>
              </span>
              {startFormatted && (
                <span className="text-[10px] text-emerald-400 font-medium">
                  {startFormatted.dayName}
                </span>
              )}
            </div>
            <div className="text-sm sm:text-base font-black text-white tabular-nums tracking-wide">
              {startDate ? toPersianDigits(startDate) : 'انتخاب کنید'}
            </div>
            {startFormatted && (
              <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5 tabular-nums">
                {startFormatted.short}
              </div>
            )}
          </button>

          {/* End Date Card */}
          <button
            type="button"
            onClick={() => {
              setActiveTarget('end');
              setViewMode('days');
            }}
            className={`p-3 rounded-2xl border text-right transition-all cursor-pointer relative ${
              activeTarget === 'end'
                ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md shadow-emerald-950/50'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                <span>تا تاریخ:</span>
              </span>
              {endFormatted && (
                <span className="text-[10px] text-teal-400 font-medium">
                  {endFormatted.dayName}
                </span>
              )}
            </div>
            <div className="text-sm sm:text-base font-black text-white tabular-nums tracking-wide">
              {endDate ? toPersianDigits(endDate) : 'انتخاب کنید'}
            </div>
            {endFormatted && (
              <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5 tabular-nums">
                {endFormatted.short}
              </div>
            )}
          </button>
        </div>

        {/* 3. Quick Date Shortcuts (Carousel) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            type="button"
            onClick={() => handleQuickPreset('today')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-300 whitespace-nowrap transition-colors cursor-pointer font-medium"
          >
            ⚡ امروز
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('yesterday')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-300 whitespace-nowrap transition-colors cursor-pointer font-medium"
          >
            ⏮️ دیروز
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('last_7_days')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-300 whitespace-nowrap transition-colors cursor-pointer font-medium"
          >
            📅 ۷ روز اخیر
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('last_30_days')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-300 whitespace-nowrap transition-colors cursor-pointer font-medium"
          >
            📆 ۳۰ روز اخیر
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('this_month')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-300 whitespace-nowrap transition-colors cursor-pointer font-medium"
          >
            🌙 این ماه
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('last_month')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-300 whitespace-nowrap transition-colors cursor-pointer font-medium"
          >
            🗓️ ماه گذشته
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('current_season')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-300 whitespace-nowrap transition-colors cursor-pointer font-medium"
          >
            🍂 فصل جاری
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('year_start')}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-300 whitespace-nowrap transition-colors cursor-pointer font-medium"
          >
            📈 از ابتدای امسال
          </button>
        </div>

        {/* 4. Calendar Container */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4 space-y-4 shadow-xl">
          {/* Calendar Header with Centered Month/Year and Symmetrical Prev/Next Arrows */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            {/* Right Arrow: Previous Month (in RTL, Right arrow goes backward to previous month) */}
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={viewMode !== 'days'}
              className={`p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-90 border border-slate-750 ${
                viewMode !== 'days' ? 'opacity-30 pointer-events-none' : ''
              }`}
              title="ماه قبل"
              aria-label="ماه قبل"
            >
              <ChevronRight className="w-5 h-5 text-slate-200" />
            </button>

            {/* Center: Month & Year Selector Trigger */}
            <button
              type="button"
              onClick={() => {
                if (viewMode === 'days') {
                  setViewMode('years');
                } else {
                  setViewMode('days');
                }
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-slate-800/90 hover:bg-slate-750 text-white transition-all cursor-pointer active:scale-95 border border-slate-700 shadow-sm"
            >
              <span className="text-emerald-400 font-black text-sm">{getJalaliMonthName(viewMonth)}</span>
              <span className="font-black text-sm text-white tabular-nums">{toPersianDigits(viewYear)}</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  viewMode !== 'days' ? 'rotate-180 text-emerald-400' : ''
                }`}
              />
            </button>

            {/* Left Arrow: Next Month (in RTL, Left arrow goes forward to next month) */}
            <button
              type="button"
              onClick={handleNextMonth}
              disabled={viewMode !== 'days'}
              className={`p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-90 border border-slate-750 ${
                viewMode !== 'days' ? 'opacity-30 pointer-events-none' : ''
              }`}
              title="ماه بعد"
              aria-label="ماه بعد"
            >
              <ChevronLeft className="w-5 h-5 text-slate-200" />
            </button>
          </div>

          {/* VIEW MODE 1: Step 1 - YEAR SELECTION */}
          {viewMode === 'years' && (
            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-150 py-2">
              <div className="text-center text-xs font-bold text-slate-400">
                مرحله ۱ از ۲: سال مورد نظر را انتخاب کنید
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {AVAILABLE_YEARS.map((year) => {
                  const isCurrentYear = viewYear === year;
                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => {
                        setTempSelectedYear(year);
                        setViewYear(year);
                        setViewMode('months'); // Sequence: Year -> Month
                      }}
                      className={`py-3 px-2 rounded-2xl text-sm font-black tabular-nums transition-all cursor-pointer active:scale-95 ${
                        isCurrentYear
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-950/80 ring-2 ring-emerald-300'
                          : 'bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200'
                      }`}
                    >
                      {toPersianDigits(year)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW MODE 2: Step 2 - MONTH SELECTION */}
          {viewMode === 'months' && (
            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-150 py-2">
              <div className="text-center text-xs font-bold text-slate-400">
                مرحله ۲ از ۲: ماه مورد نظر برای سال{' '}
                <span className="text-emerald-400 font-black tabular-nums">
                  {toPersianDigits(tempSelectedYear)}
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {JALALI_MONTH_NAMES.map((monthName, idx) => {
                  const monthNum = idx + 1;
                  const isCurrentMonth = viewMonth === monthNum;
                  return (
                    <button
                      key={monthName}
                      type="button"
                      onClick={() => {
                        setViewMonth(monthNum);
                        setViewMode('days'); // Sequence complete: returns to days
                      }}
                      className={`py-3 px-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                        isCurrentMonth
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-950/80 ring-2 ring-emerald-300'
                          : 'bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200'
                      }`}
                    >
                      {monthName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW MODE 3: Normal Days Grid */}
          {viewMode === 'days' && (
            <div className="space-y-2">
              {/* Weekdays Header */}
              <div className="grid grid-cols-7 gap-1 text-center pb-2">
                {WEEKDAYS.map((w) => (
                  <div
                    key={w.short}
                    className={`text-xs font-bold py-1 ${
                      w.isWeekend ? 'text-rose-400 font-black' : 'text-slate-400'
                    }`}
                    title={w.full}
                  >
                    {w.short}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-y-1.5 gap-x-1">
                {/* Empty leading day slots before 1st of month */}
                {Array.from({ length: firstDayOfWeekOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-10 w-full opacity-0 pointer-events-none" />
                ))}

                {/* Days of month */}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const thisDate = { jy: viewYear, jm: viewMonth, jd: day };
                  const isToday =
                    currentJalali.jy === viewYear &&
                    currentJalali.jm === viewMonth &&
                    currentJalali.jd === day;

                  const isStart =
                    startDate &&
                    startParsed.jy === viewYear &&
                    startParsed.jm === viewMonth &&
                    startParsed.jd === day;

                  const isEnd =
                    endDate &&
                    endParsed.jy === viewYear &&
                    endParsed.jm === viewMonth &&
                    endParsed.jd === day;

                  const inRange =
                    startDate &&
                    endDate &&
                    compareJalaliDates(thisDate, startParsed) > 0 &&
                    compareJalaliDates(thisDate, endParsed) < 0;

                  const isSingleDay = isStart && isEnd;

                  return (
                    <div
                      key={day}
                      className={`relative flex items-center justify-center p-0.5 ${
                        inRange ? 'bg-emerald-500/20' : ''
                      } ${isStart && !isSingleDay ? 'rounded-r-2xl bg-emerald-500/20' : ''} ${
                        isEnd && !isSingleDay ? 'rounded-l-2xl bg-emerald-500/20' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleDayClick(day)}
                        className={`h-9 w-9 sm:h-10 sm:w-10 rounded-2xl text-xs sm:text-sm font-bold tabular-nums transition-all flex flex-col items-center justify-center relative cursor-pointer active:scale-90 ${
                          isStart || isEnd
                            ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-950/90 scale-105 z-10 ring-2 ring-emerald-300'
                            : inRange
                            ? 'text-emerald-200 font-bold hover:bg-emerald-500/30'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span>{toPersianDigits(day)}</span>
                        {isToday && !isStart && !isEnd && (
                          <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Bottom Sticky Action Footer */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3 shrink-0">
        {/* Human Readable Summary */}
        <div className="flex items-center justify-between text-xs px-1">
          <div className="text-slate-300 font-medium truncate">
            {startFormatted && endFormatted ? (
              <span>
                از <strong className="text-white tabular-nums">{startFormatted.short}</strong> تا{' '}
                <strong className="text-white tabular-nums">{endFormatted.short}</strong>
              </span>
            ) : (
              <span>تاریخ‌های بازه را انتخاب کنید</span>
            )}
          </div>
          {dayCount !== null && (
            <div className="px-2.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-800/80 text-emerald-300 font-bold tabular-nums shrink-0">
              {toPersianDigits(dayCount)} روز
            </div>
          )}
        </div>

        {/* Apply & Confirm Button */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-lg shadow-emerald-950/60"
        >
          <Check className="w-5 h-5 stroke-[2.5]" />
          <span>تأیید و اعمال بازه تاریخی</span>
        </button>
      </div>
    </div>
  );
};
