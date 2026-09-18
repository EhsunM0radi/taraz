import React, { useState } from 'react';
import {
  PieChart as PieIcon,
  BarChart3,
  Users,
  Calendar,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import {
  Transaction,
  Account,
  Category,
  Counterparty,
  Currency
} from '../../types';
import { formatMoney, toPersianDigits, getCurrentJalaliYearMonth } from '../../utils/persianDate';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface ReportsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  counterparties: Counterparty[];
  currency: Currency;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  categories,
  currency,
}) => {
  const { year, month, monthName } = getCurrentJalaliYearMonth();
  const [reportPeriod, setReportPeriod] = useState<'current_month' | 'three_months' | 'all'>('current_month');

  // Filter transactions by chosen period
  const filteredTxs = transactions.filter(t => {
    if (reportPeriod === 'current_month') {
      const prefix = `${year}/${String(month).padStart(2, '0')}`;
      return t.jalaliDate.startsWith(prefix);
    }
    return true;
  });

  const totalIncome = filteredTxs
    .filter(t => t.type === 'income' || t.type === 'deposit' || t.type === 'refund')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTxs
    .filter(t => t.type === 'expense' || t.type === 'fee')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;

  // Category Pie Data
  const catMap: Record<string, number> = {};
  filteredTxs
    .filter(t => t.type === 'expense' || t.type === 'fee')
    .forEach(t => {
      const catId = t.categoryId || 'cat_other';
      catMap[catId] = (catMap[catId] || 0) + t.amount;
    });

  const categoryChartData = Object.entries(catMap).map(([id, amount]) => {
    const cat = categories.find(c => c.id === id);
    return {
      name: cat?.name || 'متفرقه',
      value: amount,
      color: cat?.color || '#94A3B8',
    };
  }).sort((a, b) => b.value - a.value);

  // Top Merchants / Counterparties
  const merchantMap: Record<string, number> = {};
  filteredTxs
    .filter(t => t.type === 'expense' || t.type === 'fee')
    .forEach(t => {
      const name = t.counterpartyName || t.merchantName || 'سایر فروشگاه‌ها';
      merchantMap[name] = (merchantMap[name] || 0) + t.amount;
    });

  const topMerchants = Object.entries(merchantMap)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  // Monthly Comparison Bar Chart Data
  const comparisonData = [
    { name: 'خرداد', درآمد: 38000000, مخارج: 24000000 },
    { name: 'تیر', درآمد: 42000000, مخارج: 28500000 },
    { name: 'مرداد', درآمد: 44000000, مخارج: 31200000 },
    { name: monthName, درآمد: totalIncome || 45000000, مخارج: totalExpense || 26500000 },
  ];

  return (
    <div id="reports_view_box" className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Centered, Prominent Period Tab Bar */}
      <div id="reports_period_selector" className="flex flex-col items-center justify-center pt-1">
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md gap-1.5 w-full max-w-md">
          <button
            type="button"
            onClick={() => setReportPeriod('current_month')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
              reportPeriod === 'current_month'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>ماه جاری ({monthName})</span>
          </button>

          <button
            type="button"
            onClick={() => setReportPeriod('three_months')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
              reportPeriod === 'three_months'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>۳ ماه اخیر</span>
          </button>

          <button
            type="button"
            onClick={() => setReportPeriod('all')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
              reportPeriod === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>کل زمان‌ها</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">مجموع درآمد</div>
            <div className="text-lg sm:text-xl font-black text-emerald-400 tabular-nums mt-1">
              {formatMoney(totalIncome, currency)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">مجموع مخارج</div>
            <div className="text-lg sm:text-xl font-black text-rose-400 tabular-nums mt-1">
              {formatMoney(totalExpense, currency)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">
              خالص پس‌انداز ({toPersianDigits(savingsRate)}٪)
            </div>
            <div className={`text-lg sm:text-xl font-black tabular-nums mt-1 ${netSavings >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
              {formatMoney(netSavings, currency)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div id="reports_charts_container" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Income vs Expense Bar Chart */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>روند ماهانه درآمد و مخارج</span>
            </h3>
          </div>

          <div className="h-60 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: any) => [formatMoney(val, currency), '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="درآمد" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="مخارج" fill="#F43F5E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Expense Distribution Pie */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-purple-400" />
              <span>سهم دسته‌بندی‌ها از هزینه‌ها</span>
            </h3>
          </div>

          {categoryChartData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                      formatter={(val: any) => [formatMoney(val, currency), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {categoryChartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="font-bold text-slate-200 tabular-nums">
                      {formatMoney(item.value, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-slate-500">
              داده‌ای برای نمایش نمودار یافت نشد.
            </div>
          )}
        </div>
      </div>

      {/* Top Merchants / Counterparties Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <span>بیشترین مبالغ پرداختی به فروشگاه‌ها و افراد</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {topMerchants.map((m, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-400 font-mono font-bold flex items-center justify-center text-[10px]">
                  {toPersianDigits(idx + 1)}
                </span>
                <span className="font-bold text-slate-200">{m.name}</span>
              </div>
              <span className="font-bold text-rose-400 tabular-nums">
                {formatMoney(m.amount, currency)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
