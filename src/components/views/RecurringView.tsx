import React from 'react';
import { CalendarSync, Plus, Trash2, ArrowUpRight, ArrowDownLeft, Clock, ArrowRight } from 'lucide-react';
import { RecurringTransaction, Category, Account, Currency } from '../../types';
import { formatMoney, toPersianDigits } from '../../utils/persianDate';
import { Button } from '../ui';

interface RecurringViewProps {
  recurringList: RecurringTransaction[];
  categories: Category[];
  accounts: Account[];
  currency: Currency;
  onOpenNewRecurring: () => void;
  onDeleteRecurring: (id: string) => void;
  onBack?: () => void;
}

export const RecurringView: React.FC<RecurringViewProps> = ({
  recurringList,
  categories,
  accounts,
  currency,
  onOpenNewRecurring,
  onDeleteRecurring,
  onBack,
}) => {
  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3">
        <div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 text-cyan-400" />
              <span>بازگشت</span>
            </button>
          )}
        </div>

        <Button
          id="btn_create_recurring"
          onClick={onOpenNewRecurring}
          accent="cyan"
          rightIcon={<Plus className="w-3.5 h-3.5 stroke-[3]" />}
        >
          پرداخت دوره‌ای جدید
        </Button>
      </div>

      {/* Recurring List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {recurringList.map((r) => {
          const cat = categories.find((c) => c.id === r.categoryId);
          const acc = accounts.find((a) => a.id === r.accountId);

          return (
            <div
              key={r.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm space-y-3 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      r.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {r.type === 'income' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">{r.title}</div>
                    <div className="text-[11px] text-slate-400">{cat?.name || 'دسته‌بندی'}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteRecurring(r.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>سررسید:</span>
                  <span className="font-bold text-white">{toPersianDigits(r.dayOfMonth)} هر ماه</span>
                </div>

                <div
                  className={`text-xs font-black tabular-nums ${
                    r.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatMoney(r.amount, currency)}
                </div>
              </div>

              {acc && (
                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                  <span>حساب:</span>
                  <span className="text-slate-300 font-medium">
                    {acc.name} ({acc.bankName})
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {recurringList.length === 0 && (
        <div className="text-center py-14 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 space-y-2.5">
          <CalendarSync className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-xs font-medium">هیچ پرداخت یا قسط دوره‌ای تعریف نشده است.</p>
          <Button
            onClick={onOpenNewRecurring}
            accent="cyan"
            rightIcon={<Plus className="w-3.5 h-3.5 stroke-[3]" />}
          >
            تعریف پرداخت دوره‌ای
          </Button>
        </div>
      )}
    </div>
  );
};
