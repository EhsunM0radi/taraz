import React from 'react';
import { Users, Plus, CheckCircle, Trash2, ArrowUpRight, ArrowDownLeft, ArrowRight } from 'lucide-react';
import { DebtRecord, Counterparty, Currency } from '../../types';
import { formatMoney } from '../../utils/persianDate';
import { Button } from '../ui';

interface DebtsViewProps {
  debts: DebtRecord[];
  counterparties: Counterparty[];
  currency: Currency;
  onOpenNewDebt: () => void;
  onEditDebt: (debt: DebtRecord) => void;
  onDeleteDebt: (id: string) => void;
  onSettleDebt: (id: string) => void;
  onBack?: () => void;
}

export const DebtsView: React.FC<DebtsViewProps> = ({
  debts,
  currency,
  onOpenNewDebt,
  onEditDebt,
  onDeleteDebt,
  onSettleDebt,
  onBack,
}) => {
  const totalReceivable = debts.filter((d) => d.type === 'give' && !d.isSettled).reduce((sum, d) => sum + (d.amount - d.paidAmount), 0);
  const totalPayable = debts.filter((d) => d.type === 'take' && !d.isSettled).reduce((sum, d) => sum + (d.amount - d.paidAmount), 0);

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
              <ArrowRight className="w-4 h-4 text-emerald-400" />
              <span>بازگشت</span>
            </button>
          )}
        </div>

        <Button
          id="btn_create_debt"
          onClick={onOpenNewDebt}
          accent="emerald"
          rightIcon={<Plus className="w-3.5 h-3.5 stroke-[3]" />}
        >
          ثبت سند جدید
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">طلب‌های من</div>
            <div className="text-lg font-black text-emerald-400 mt-0.5 tabular-nums">{formatMoney(totalReceivable, currency)}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">بدهی‌های من</div>
            <div className="text-lg font-black text-rose-400 mt-0.5 tabular-nums">{formatMoney(totalPayable, currency)}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Debts List */}
      <div className="space-y-2.5">
        {debts.map((d) => {
          const remaining = d.amount - d.paidAmount;
          return (
            <div
              key={d.id}
              className={`p-3.5 sm:p-4 rounded-2xl bg-slate-900 border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                d.isSettled
                  ? 'border-slate-800/50 opacity-50'
                  : d.type === 'give'
                  ? 'border-slate-800/80 hover:border-emerald-700/60'
                  : 'border-slate-800/80 hover:border-rose-700/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    d.type === 'give' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {d.type === 'give' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{d.counterpartyName}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        d.type === 'give'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-rose-500/15 text-rose-300'
                      }`}
                    >
                      {d.type === 'give' ? 'طلب' : 'بدهی'}
                    </span>
                    {d.isSettled && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        تسویه شده
                      </span>
                    )}
                  </div>
                  {d.description && <div className="text-[11px] text-slate-400 mt-0.5">{d.description}</div>}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3.5 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/60 text-xs">
                <div className="text-right sm:text-left">
                  <div className="text-[11px] text-slate-400">مانده:</div>
                  <div
                    className={`font-black tabular-nums ${
                      d.type === 'give' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatMoney(remaining, currency)}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!d.isSettled && (
                    <button
                      type="button"
                      onClick={() => onSettleDebt(d.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                      title="تسویه کامل"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>تسویه</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteDebt(d.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {debts.length === 0 && (
        <div className="text-center py-14 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 space-y-2.5">
          <Users className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-xs font-medium">هیچ طلب یا بدهی ثبت نشده است.</p>
          <Button
            onClick={onOpenNewDebt}
            accent="emerald"
            rightIcon={<Plus className="w-3.5 h-3.5 stroke-[3]" />}
          >
            ثبت سند جدید
          </Button>
        </div>
      )}
    </div>
  );
};
