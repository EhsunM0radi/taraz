import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Sparkles,
  ChevronLeft,
  CreditCard,
  Target,
  Users,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import {
  Account,
  BankCard,
  Transaction,
  Category,
  Budget,
  DebtRecord,
  FinancialInsights,
  Currency,
  RecurringTransaction,
} from '../../types';
import { formatMoney, formatJalaliFull, toPersianDigits, getJalaliMonthName, getCurrentJalaliYearMonth } from '../../utils/persianDate';
import { RecurringForecastChart } from '../RecurringForecastChart';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardViewProps {
  accounts: Account[];
  cards: BankCard[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  debts: DebtRecord[];
  recurring: RecurringTransaction[];
  insights: FinancialInsights;
  currency: Currency;
  onNavigate: (tab: any) => void;
  onOpenNewTransaction: () => void;
  onOpenTransfer: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  accounts,
  cards,
  transactions,
  categories,
  budgets,
  debts,
  recurring,
  insights,
  currency,
  onNavigate,
  onOpenNewTransaction,
  onOpenTransfer,
}) => {
  const totalBalance = accounts.reduce((sum, a) => sum + (a.isArchived ? 0 : a.currentBalance), 0);
  const { year, month, monthName } = getCurrentJalaliYearMonth();

  // Recent 6 transactions
  const recentTransactions = transactions.slice(0, 6);

  // Category breakdown for Pie Chart
  const currentMonthPrefix = `${year}/${String(month).padStart(2, '0')}`;
  const categoryExpenseMap: Record<string, number> = {};
  transactions
    .filter(t => (t.type === 'expense' || t.type === 'fee') && t.jalaliDate.startsWith(currentMonthPrefix))
    .forEach(t => {
      const catId = t.categoryId || 'cat_other';
      categoryExpenseMap[catId] = (categoryExpenseMap[catId] || 0) + t.amount;
    });

  const categoryPieData = Object.entries(categoryExpenseMap).map(([catId, amount]) => {
    const cat = categories.find(c => c.id === catId);
    return {
      name: cat ? cat.name : 'متفرقه',
      value: amount,
      color: cat ? cat.color : '#94A3B8',
    };
  }).sort((a, b) => b.value - a.value);

  // Monthly trend mockup from transactions
  const monthlyTrendData = [
    { month: 'خرداد', income: 42000000, expense: 28500000 },
    { month: 'تیر', income: 44000000, expense: 31200000 },
    { month: 'مرداد', income: 45000000, expense: insights.monthlyExpense || 26500000 },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Zero State Alert / Quick Action for new users */}
      {accounts.length === 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/50 border border-emerald-500/30 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-right">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">به حسابداری هوشمند تراز خوش آمدید!</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                حساب‌ها و اطلاعات شما کاملاً ایزوله، محلی و امن است. برای شروع، اولین حساب یا کارت خود را ثبت کنید یا پیامک‌های بانکی‌تان را تحلیل کنید.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('accounts')}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              افزودن حساب یا کارت
            </button>
            <button
              type="button"
              onClick={() => onNavigate('sms_lab')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              آزمایشگاه پیامک
            </button>
          </div>
        </div>
      )}

      {/* Top Overview Financial Metrics */}
      <div id="dashboard_quick_stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Net Balance */}
        <div id="dashboard_card_balance" className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">موجودی کل</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl lg:text-2xl font-black text-white tracking-tight tabular-nums">
            {formatMoney(totalBalance, currency)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>{toPersianDigits(accounts.length)} حساب متصل</span>
            <button
              type="button"
              onClick={() => onNavigate('accounts')}
              className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-0.5 cursor-pointer"
            >
              کارت‌ها <ChevronLeft className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Monthly Income */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">درآمد ({monthName})</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl lg:text-2xl font-black text-emerald-400 tracking-tight tabular-nums">
            {formatMoney(insights.monthlyIncome, currency)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>ماه جاری</span>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">مخارج ({monthName})</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl lg:text-2xl font-black text-rose-400 tracking-tight tabular-nums">
            {formatMoney(insights.monthlyExpense, currency)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            {insights.comparisonWithLastMonth >= 0 ? (
              <span className="text-rose-400 font-medium">+{toPersianDigits(insights.comparisonWithLastMonth)}٪ نسبت به ماه قبل</span>
            ) : (
              <span className="text-emerald-400 font-medium">{toPersianDigits(insights.comparisonWithLastMonth)}٪ صرفه‌جویی</span>
            )}
          </div>
        </div>

        {/* Net Cash Flow & Savings */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">پس‌انداز</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl lg:text-2xl font-black text-cyan-400 tracking-tight tabular-nums">
            {formatMoney(insights.netCashFlow, currency)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>نرخ پس‌انداز:</span>
            <span className="font-bold text-cyan-300">{toPersianDigits(insights.savingsRate)}٪</span>
          </div>
        </div>
      </div>

      {/* Local AI / Smart Financial Insights Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs text-slate-300 leading-relaxed">
            {insights.topExpenseCategory ? (
              <>بیشترین مخارج این ماه در <span className="font-bold text-amber-300">{insights.topExpenseCategory.name}</span> با مبلغ {formatMoney(insights.topExpenseCategory.amount, currency)} ({toPersianDigits(insights.topExpenseCategory.percentage)}٪ از کل مخارج) بوده است.</>
            ) : (
              'در حال محاسبه و تحلیل خودکار الگوهای مالی روی دستگاه شما...'
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('transactions')}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 self-end md:self-center"
        >
          <span>مشاهده تراکنش‌ها</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 30-Day Recurring Balance Forecast Chart */}
      <RecurringForecastChart
        accounts={accounts}
        recurring={recurring}
        currency={currency}
        onNavigate={onNavigate}
      />

      {/* Main Grid: Accounts / Cards & Monthly Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Cashflow Chart & Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cashflow Chart */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">جریان نقدی ۳ ماه اخیر</h3>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> درآمد
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> مخارج
                </span>
              </div>
            </div>

            <div className="h-52 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#F8FAFC' }}
                    formatter={(val: any) => [formatMoney(val, currency), '']}
                  />
                  <Area type="monotone" dataKey="income" name="درآمد" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#incomeGrad)" />
                  <Area type="monotone" dataKey="expense" name="مخارج" stroke="#F43F5E" strokeWidth={2.5} fillOpacity={1} fill="url(#expenseGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Transactions List */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">آخرین تراکنش‌ها</h3>
              <button
                type="button"
                onClick={() => onNavigate('transactions')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                مشاهده همه ({toPersianDigits(transactions.length)}) <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-800/60">
              {recentTransactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  هنوز تراکنشی ثبت نشده است.
                </div>
              ) : (
                recentTransactions.map((tx) => {
                  const isIncome = tx.type === 'income' || tx.type === 'deposit' || tx.type === 'refund';
                  const isTransfer = tx.type === 'transfer';
                  const cat = categories.find(c => c.id === tx.categoryId);
                  const acc = accounts.find(a => a.id === tx.accountId);

                  return (
                    <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-800/30 px-2 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2.5 rounded-xl ${
                            isTransfer
                              ? 'bg-cyan-500/10 text-cyan-400'
                              : isIncome
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {isTransfer ? (
                            <ArrowLeftRight className="w-4 h-4" />
                          ) : isIncome ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{tx.counterpartyName || tx.merchantName || cat?.name || 'تراکنش'}</span>
                            {tx.cardLast4 && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                                ****{tx.cardLast4}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{acc?.name || 'حساب'}</span>
                            <span>•</span>
                            <span>{tx.jalaliDate}</span>
                            {tx.source === 'sms' && (
                              <span className="text-[9px] px-1 rounded bg-slate-800 text-emerald-400 border border-emerald-500/20">
                                SMS
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-left">
                        <div className={`font-bold text-sm tabular-nums ${isTransfer ? 'text-cyan-400' : isIncome ? 'text-emerald-400' : 'text-slate-100'}`}>
                          {isIncome ? '+' : isTransfer ? '' : '-'}{formatMoney(tx.amount, currency)}
                        </div>
                        {tx.balanceAfter !== undefined && (
                          <div className="text-[10px] text-slate-400">
                            مانده: {formatMoney(tx.balanceAfter, currency)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Accounts Bento, Category Donut & Budget/Debt summary */}
        <div className="space-y-6">
          {/* Active Bank Cards / Accounts Widget */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">حساب‌ها و کارت‌ها</h3>
              <button
                type="button"
                onClick={() => onNavigate('accounts')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                مدیریت
              </button>
            </div>

            <div className="space-y-2.5">
              {accounts.slice(0, 3).map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-7 rounded-full"
                      style={{ backgroundColor: acc.color }}
                    />
                    <div>
                      <div className="font-bold text-slate-200">{acc.name}</div>
                      <div className="text-[11px] text-slate-400">{acc.bankName}</div>
                    </div>
                  </div>
                  <div className="text-left font-bold text-white tabular-nums">
                    {formatMoney(acc.currentBalance, currency)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Distribution Donut */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">سهم دسته‌بندی‌ها ({monthName})</h3>
            </div>

            {categoryPieData.length > 0 ? (
              <div className="space-y-4">
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={68}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryPieData.map((entry, index) => (
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

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {categoryPieData.slice(0, 4).map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-slate-300">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </span>
                      <span className="font-bold text-slate-200 tabular-nums">
                        {formatMoney(item.value, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                هنوز هزینه‌ای در این ماه ثبت نشده است.
              </div>
            )}
          </div>

          {/* Quick Budgets / Debts Summary Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-400" />
                <span>سقف بودجه‌ها</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('budgets')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                مشاهده همه
              </button>
            </div>

            <div className="space-y-3">
              {budgets.slice(0, 2).map((b) => {
                const cat = categories.find(c => c.id === b.categoryId);
                const percent = Math.min(100, Math.round((b.spent / b.amount) * 100));
                const isWarning = percent >= b.alertThreshold * 100;

                return (
                  <div key={b.id} className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-300">{cat?.name}</span>
                      <span className={isWarning ? 'text-amber-400' : 'text-slate-400'}>
                        {toPersianDigits(percent)}٪ ({formatMoney(b.spent, currency)})
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percent > 100 ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
