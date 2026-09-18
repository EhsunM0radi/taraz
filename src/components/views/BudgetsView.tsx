import React from 'react';
import { Target, Plus, AlertTriangle, CheckCircle2, Edit2, Trash2, ShieldAlert, ArrowRight } from 'lucide-react';
import { Budget, Category, Currency } from '../../types';
import { formatMoney, toPersianDigits, getCurrentJalaliYearMonth } from '../../utils/persianDate';
import { Button } from '../ui';

interface BudgetsViewProps {
  budgets: Budget[];
  categories: Category[];
  currency: Currency;
  onOpenNewBudget: () => void;
  onEditBudget: (budget: Budget) => void;
  onDeleteBudget: (id: string) => void;
  onBack?: () => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  categories,
  currency,
  onOpenNewBudget,
  onEditBudget,
  onDeleteBudget,
  onBack,
}) => {
  const { monthName } = getCurrentJalaliYearMonth();

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overallPercentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  return (
    <div id="budgets_view_box" className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 text-amber-400" />
              <span>بازگشت</span>
            </button>
          )}
          <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-medium">
            بودجه {monthName}
          </span>
        </div>

        <Button
          id="btn_create_budget"
          onClick={onOpenNewBudget}
          accent="amber"
          rightIcon={<Plus className="w-3.5 h-3.5 stroke-[3]" />}
        >
          بودجه جدید
        </Button>
      </div>

      {/* Overall Progress Widget */}
      <div id="budget_overview_card" className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <div>
            <span className="text-slate-400">سقف بودجه: </span>
            <span className="font-bold text-white tabular-nums">
              {formatMoney(totalBudgeted, currency)}
            </span>
          </div>

          <div>
            <span className="text-slate-400">مصرف شده: </span>
            <span className="font-bold text-amber-400 tabular-nums">
              {formatMoney(totalSpent, currency)} ({toPersianDigits(overallPercentage)}٪)
            </span>
          </div>
        </div>

        <div className="w-full h-2.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              overallPercentage > 100 ? 'bg-rose-500' : overallPercentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, overallPercentage)}%` }}
          />
        </div>
      </div>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {budgets.map((b) => {
          const cat = categories.find((c) => c.id === b.categoryId);
          const percent = Math.min(100, Math.round((b.spent / b.amount) * 100));
          const isOverBudget = b.spent > b.amount;
          const isAtRisk = b.spent >= b.amount * b.alertThreshold && !isOverBudget;
          const remaining = Math.max(0, b.amount - b.spent);

          return (
            <div
              key={b.id}
              className={`p-4 rounded-2xl bg-slate-900 border shadow-sm space-y-3 transition-all ${
                isOverBudget
                  ? 'border-rose-500/40'
                  : isAtRisk
                  ? 'border-amber-500/40'
                  : 'border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat?.color || '#F59E0B' }}
                  />
                  <span className="font-bold text-white text-xs">{cat?.name || 'دسته‌بندی'}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEditBudget(b)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="ویرایش"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteBudget(b.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">مصرف شده:</span>
                  <span className={`tabular-nums ${isOverBudget ? 'text-rose-400 font-bold' : 'text-slate-200'}`}>
                    {toPersianDigits(percent)}٪ ({formatMoney(b.spent, currency)})
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isOverBudget ? 'bg-rose-500' : isAtRisk ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Status Message */}
              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/60">
                <div className="flex items-center gap-1">
                  {isOverBudget ? (
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  ) : isAtRisk ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                  <span
                    className={
                      isOverBudget
                        ? 'text-rose-400 font-bold'
                        : isAtRisk
                        ? 'text-amber-400 font-semibold'
                        : 'text-slate-400'
                    }
                  >
                    {isOverBudget
                      ? `بیش از سقف (${formatMoney(b.spent - b.amount, currency)})`
                      : isAtRisk
                      ? 'نزدیک به سقف'
                      : `مانده: ${formatMoney(remaining, currency)}`}
                  </span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">سقف: {formatMoney(b.amount, currency)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {budgets.length === 0 && (
        <div className="text-center py-14 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 space-y-2.5">
          <Target className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-xs font-medium">بودجه‌ای برای این ماه تعریف نشده است.</p>
          <Button
            onClick={onOpenNewBudget}
            accent="amber"
            rightIcon={<Plus className="w-3.5 h-3.5 stroke-[3]" />}
          >
            تعریف بودجه
          </Button>
        </div>
      )}
    </div>
  );
};
