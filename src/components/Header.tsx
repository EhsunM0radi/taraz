import React from 'react';
import {
  Layers,
  ArrowLeftRight,
  Plus
} from 'lucide-react';
import { Currency } from '../types';

interface HeaderProps {
  currency: Currency;
  onToggleCurrency: () => void;
  onOpenNewTransaction: () => void;
  onOpenTransfer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currency,
  onToggleCurrency,
  onOpenNewTransaction,
  onOpenTransfer,
}) => {
  return (
    <header
      id="app_header"
      className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3 select-none"
    >
      {/* Logo */}
      <div id="app_header_brand" className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center shadow-md shadow-emerald-950/40 ring-1 ring-white/20 shrink-0">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-black tracking-tight text-white">
          تَـراز
        </span>
      </div>

      {/* Actions: Currency + Internal Transfer + Large Circular Plus Button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Currency Toggle */}
        <button
          id="btn_toggle_currency"
          type="button"
          onClick={onToggleCurrency}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 text-xs font-bold text-slate-200 transition-all shadow-sm active:scale-95 cursor-pointer"
          title="تغییر واحد پول بین تومان و ریال"
        >
          <span className="text-slate-400 font-medium">واحد:</span>
          <span className="text-emerald-400 font-black">
            {currency === 'TOMAN' ? 'تومان' : 'ریال'}
          </span>
        </button>

        {/* Internal Transfer */}
        <button
          id="btn_internal_transfer"
          type="button"
          onClick={onOpenTransfer}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 text-xs font-bold text-cyan-300 transition-all active:scale-95 cursor-pointer shadow-sm"
          title="ثبت انتقال وجه بین حساب‌های شخصی"
        >
          <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
          <span className="hidden xs:inline sm:inline">انتقال داخلی</span>
        </button>

        {/* Circular Add Transaction Button */}
        <button
          id="btn_quick_add_transaction"
          type="button"
          onClick={onOpenNewTransaction}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-950/70 border border-white/20 transition-all transform active:scale-90 hover:scale-105 cursor-pointer shrink-0"
          title="ثبت تراکنش جدید"
          aria-label="ثبت تراکنش جدید"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>
    </header>
  );
};
