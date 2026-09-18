import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  CalendarClock,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  Sparkles,
  Repeat,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Account, RecurringTransaction, Currency } from '../types';
import {
  formatMoney,
  toPersianDigits,
  formatJalaliDayMonth,
  formatJalaliDate,
  gregorianToJalali,
} from '../utils/persianDate';

interface RecurringForecastChartProps {
  accounts: Account[];
  recurring: RecurringTransaction[];
  currency: Currency;
  onNavigate: (tab: any) => void;
}

export const RecurringForecastChart: React.FC<RecurringForecastChartProps> = ({
  accounts,
  recurring,
  currency,
  onNavigate,
}) => {
  const currentTotalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => (acc.isArchived ? sum : sum + acc.currentBalance), 0);
  }, [accounts]);

  // 30-Day Forward Projection Engine
  const { chartData, forecastSummary, scheduledEventsList } = useMemo(() => {
    const activeRules = recurring.filter((r) => r.isActive);
    const data = [];
    let runningBalance = currentTotalBalance;
    let totalInflow = 0;
    let totalOutflow = 0;
    const eventsRoadmap: Array<{
      dayIndex: number;
      dateLabel: string;
      title: string;
      amount: number;
      type: string;
      daysRemaining: number;
    }> = [];

    const now = Date.now();
    const todayGregorian = new Date(now);
    const todayJalali = gregorianToJalali(
      todayGregorian.getFullYear(),
      todayGregorian.getMonth() + 1,
      todayGregorian.getDate()
    );

    for (let day = 0; day <= 30; day++) {
      const dayTimestamp = now + day * 86400000;
      const d = new Date(dayTimestamp);
      const jDate = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());

      let dayInflow = 0;
      let dayOutflow = 0;
      const dayEvents: Array<{ title: string; amount: number; type: string }> = [];

      // Evaluate active recurring rules (skip Day 0 as today's starting baseline)
      if (day > 0) {
        for (const rule of activeRules) {
          let triggersToday = false;

          if (rule.frequency === 'daily') {
            triggersToday = true;
          } else if (rule.frequency === 'weekly') {
            // Triggers every 7 days
            if (rule.nextDueDate) {
              const diffDays = Math.round((dayTimestamp - rule.nextDueDate) / 86400000);
              if (diffDays >= 0 && diffDays % 7 === 0) triggersToday = true;
            } else if (day % 7 === 0) {
              triggersToday = true;
            }
          } else if (rule.frequency === 'monthly') {
            // Check dayOfMonth (e.g. 1st or 5th of solar month)
            if (rule.dayOfMonth !== undefined) {
              if (jDate.jd === rule.dayOfMonth) triggersToday = true;
            } else if (rule.nextDueDate) {
              const nextDueGregorian = new Date(rule.nextDueDate);
              const nextDueJalali = gregorianToJalali(
                nextDueGregorian.getFullYear(),
                nextDueGregorian.getMonth() + 1,
                nextDueGregorian.getDate()
              );
              if (jDate.jd === nextDueJalali.jd) triggersToday = true;
            } else if (day === 30 || (todayJalali.jd + day === 30)) {
              triggersToday = true;
            }
          } else if (rule.frequency === 'yearly') {
            if (rule.nextDueDate) {
              const diffDays = Math.round((dayTimestamp - rule.nextDueDate) / 86400000);
              if (diffDays === 0) triggersToday = true;
            }
          }

          if (triggersToday) {
            const isIncome = rule.type === 'income' || rule.type === 'deposit' || rule.type === 'refund';
            if (isIncome) {
              dayInflow += rule.amount;
              totalInflow += rule.amount;
            } else {
              dayOutflow += rule.amount;
              totalOutflow += rule.amount;
            }

            dayEvents.push({
              title: rule.title,
              amount: rule.amount,
              type: rule.type,
            });

            eventsRoadmap.push({
              dayIndex: day,
              dateLabel: formatJalaliDayMonth(dayTimestamp),
              title: rule.title,
              amount: rule.amount,
              type: rule.type,
              daysRemaining: day,
            });
          }
        }
      }

      runningBalance = runningBalance + dayInflow - dayOutflow;

      data.push({
        dayIndex: day,
        dateLabel: formatJalaliDayMonth(dayTimestamp),
        fullDate: formatJalaliDate(dayTimestamp),
        shortLabel: day === 0 ? 'امروز' : `${toPersianDigits(day)} روز بعد`,
        projectedBalance: runningBalance,
        inflow: dayInflow,
        outflow: dayOutflow,
        events: dayEvents,
      });
    }

    const endBalance = data[data.length - 1]?.projectedBalance ?? currentTotalBalance;
    const netDelta = endBalance - currentTotalBalance;
    const percentageChange = currentTotalBalance > 0
      ? Math.round((netDelta / currentTotalBalance) * 100)
      : 0;

    let minBal = currentTotalBalance;
    let maxBal = currentTotalBalance;
    data.forEach((p) => {
      if (p.projectedBalance < minBal) minBal = p.projectedBalance;
      if (p.projectedBalance > maxBal) maxBal = p.projectedBalance;
    });

    return {
      chartData: data,
      forecastSummary: {
        currentBalance: currentTotalBalance,
        endBalance,
        netDelta,
        percentageChange,
        totalInflow,
        totalOutflow,
        minBalance: minBal,
        maxBalance: maxBal,
        activeRulesCount: activeRules.length,
      },
      scheduledEventsList: eventsRoadmap.sort((a, b) => a.dayIndex - b.dayIndex),
    };
  }, [currentTotalBalance, recurring]);

  const isPositiveTrend = forecastSummary.netDelta >= 0;

  // Custom Chart Tooltip
  const CustomForecastTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const point = payload[0]?.payload;
    if (!point) return null;

    const diffFromStart = point.projectedBalance - currentTotalBalance;

    return (
      <div className="p-3.5 rounded-2xl bg-slate-950/95 border border-slate-700 shadow-2xl backdrop-blur-md text-xs space-y-2 text-right max-w-xs min-w-[210px] z-50">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="font-bold text-white flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>{point.dateLabel} ({point.shortLabel})</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">{point.fullDate}</span>
        </div>

        <div className="space-y-1">
          <div className="text-[11px] text-slate-400">موجودی پیش‌بینی‌شده:</div>
          <div className="text-base font-black text-white tabular-nums">
            {formatMoney(point.projectedBalance, currency)}
          </div>
          <div className={`text-[10px] font-semibold flex items-center gap-1 ${
            diffFromStart >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {diffFromStart >= 0 ? (
              <>
                <TrendingUp className="w-3 h-3" />
                <span>+{formatMoney(diffFromStart, currency)} نسبت به امروز</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3" />
                <span>{formatMoney(diffFromStart, currency)} نسبت به امروز</span>
              </>
            )}
          </div>
        </div>

        {/* Triggering Events on this Day */}
        {point.events && point.events.length > 0 && (
          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <div className="text-[10px] font-bold text-cyan-300 flex items-center gap-1">
              <Repeat className="w-3 h-3" />
              <span>تراکنش‌های موعد این روز:</span>
            </div>
            {point.events.map((ev: any, idx: number) => {
              const isIncome = ev.type === 'income' || ev.type === 'deposit' || ev.type === 'refund';
              return (
                <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-900/80 px-2 py-1 rounded-lg">
                  <span className="text-slate-300 font-medium truncate max-w-[120px]">{ev.title}</span>
                  <span className={`font-bold tabular-nums ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isIncome ? '+' : '-'}{formatMoney(ev.amount, currency)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="recurring_forecast_section" className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">پیش‌بینی ۳۰ روزه موجودی حساب‌ها</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                تحلیل هوشمند
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              مدل‌سازی روند نقدینگی بر اساس {toPersianDigits(forecastSummary.activeRulesCount)} تراکنش تکرارپذیر فعال
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('recurring')}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer self-end sm:self-center"
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>مدیریت دوره‌ای‌ها</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top 4 Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Metric 1: Projected 30d End Balance */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">موجودی پایان ۳۰ روز</span>
          <div className="text-base sm:text-lg font-black text-white tabular-nums tracking-tight">
            {formatMoney(forecastSummary.endBalance, currency)}
          </div>
          <div className="text-[10px] text-slate-500">
            شروع: {formatMoney(forecastSummary.currentBalance, currency)}
          </div>
        </div>

        {/* Metric 2: Net Cashflow Change */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">تغییر خالص ۳۰ روزه</span>
          <div className={`text-base sm:text-lg font-black tabular-nums tracking-tight flex items-center gap-1 ${
            isPositiveTrend ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {isPositiveTrend ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{isPositiveTrend ? '+' : ''}{formatMoney(forecastSummary.netDelta, currency)}</span>
          </div>
          <div className="text-[10px] text-slate-500 font-semibold">
            {isPositiveTrend ? '+' : ''}{toPersianDigits(forecastSummary.percentageChange)}٪ تغییر موجودی
          </div>
        </div>

        {/* Metric 3: Total Scheduled Inflow */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>ورودی‌های دوره‌ای</span>
          </span>
          <div className="text-base sm:text-lg font-black text-emerald-400 tabular-nums tracking-tight">
            +{formatMoney(forecastSummary.totalInflow, currency)}
          </div>
          <div className="text-[10px] text-slate-500">حقوق، سود و واریزی‌های معین</div>
        </div>

        {/* Metric 4: Total Scheduled Outflow */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
            <span>خروجی‌های دوره‌ای</span>
          </span>
          <div className="text-base sm:text-lg font-black text-rose-400 tabular-nums tracking-tight">
            -{formatMoney(forecastSummary.totalOutflow, currency)}
          </div>
          <div className="text-[10px] text-slate-500">اجاره، اقساط، قبوض و اشتراک‌ها</div>
        </div>
      </div>

      {/* Main Responsive Area Chart */}
      <div className="space-y-2">
        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositiveTrend ? '#10B981' : '#F43F5E'} stopOpacity={0.45} />
                  <stop offset="95%" stopColor={isPositiveTrend ? '#10B981' : '#F43F5E'} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} opacity={0.6} />

              <XAxis
                dataKey="dateLabel"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                interval={4}
              />

              <YAxis
                hide
                domain={['dataMin - 1000000', 'dataMax + 1000000']}
              />

              <Tooltip content={<CustomForecastTooltip />} />

              <Area
                type="monotone"
                dataKey="projectedBalance"
                name="موجودی پیش‌بینی‌شده"
                stroke={isPositiveTrend ? '#10B981' : '#F43F5E'}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#forecastGrad)"
                activeDot={{ r: 6, fill: '#FFFFFF', stroke: isPositiveTrend ? '#10B981' : '#F43F5E', strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Axis Reference Guide */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-2">
          <span>امروز ({formatJalaliDayMonth(Date.now())})</span>
          <span>۱۵ روز بعد</span>
          <span>۳۰ روز بعد ({formatJalaliDayMonth(Date.now() + 30 * 86400000)})</span>
        </div>
      </div>

      {/* Upcoming Scheduled Recurring Roadmap */}
      {scheduledEventsList.length > 0 ? (
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>تراکنش‌های برنامه‌ریزی‌شده ۳۰ روز آینده:</span>
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              {toPersianDigits(scheduledEventsList.length)} موعد پرداخت
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {scheduledEventsList.slice(0, 6).map((ev, idx) => {
              const isIncome = ev.type === 'income' || ev.type === 'deposit' || ev.type === 'refund';
              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isIncome ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <div className="truncate">
                      <div className="font-bold text-white truncate">{ev.title}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span>{ev.dateLabel}</span>
                        <span>•</span>
                        <span className="text-cyan-400 font-medium">
                          {ev.daysRemaining === 0 ? 'امروز' : `${toPersianDigits(ev.daysRemaining)} روز دیگر`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`font-bold text-xs tabular-nums shrink-0 ${
                    isIncome ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {isIncome ? '+' : '-'}{formatMoney(ev.amount, currency)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-slate-600" />
          <span>هیچ تراکنش تکرارپذیر فعالی برای ۳۰ روز آینده تعریف نشده است.</span>
        </div>
      )}
    </div>
  );
};
