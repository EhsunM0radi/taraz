import React, { useState } from 'react';
import {
  Building2,
  CreditCard,
  Plus,
  ArrowLeftRight,
  Edit2,
  Trash2,
  Copy,
  Check
} from 'lucide-react';
import { Account, BankCard, Currency } from '../../types';
import { formatMoney, toPersianDigits } from '../../utils/persianDate';
import { IRANIAN_BANKS } from '../../parser/bankRules';

interface AccountsAndCardsViewProps {
  accounts: Account[];
  cards: BankCard[];
  currency: Currency;
  onOpenNewAccount: () => void;
  onOpenNewCard: () => void;
  onOpenTransfer: () => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  onEditCard: (card: BankCard) => void;
  onDeleteCard: (id: string) => void;
}

export const AccountsAndCardsView: React.FC<AccountsAndCardsViewProps> = ({
  accounts,
  cards,
  currency,
  onOpenNewAccount,
  onOpenNewCard,
  onOpenTransfer,
  onEditAccount,
  onDeleteAccount,
  onEditCard,
  onDeleteCard,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalAssets = accounts.reduce((sum, a) => sum + (a.isArchived ? 0 : a.currentBalance), 0);

  return (
    <div id="accounts_view_box" className="space-y-5 pb-12 animate-in fade-in duration-200">
      {/* Top Assets Summary & Actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-bold tabular-nums">
          مجموع: {formatMoney(totalAssets, currency)}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenTransfer}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-cyan-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
            <span>انتقال</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewCard}
            className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-xs font-bold text-purple-300 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>کارت جدید</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewAccount}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-black text-slate-950 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>حساب جدید</span>
          </button>
        </div>
      </div>

      {/* Shetab Cards Carousel / Grid */}
      <div id="accounts_cards_grid" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-purple-400" />
            <span>کارت‌های بانکی ({toPersianDigits(cards.length)})</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {cards.map((card) => {
            const acc = accounts.find((a) => a.id === card.accountId);

            return (
              <div
                key={card.id}
                className="relative rounded-2xl p-4 sm:p-5 text-white shadow-md overflow-hidden flex flex-col justify-between h-44 border border-white/10 group transition-all"
                style={{
                  background: `linear-gradient(135deg, ${card.color || '#3B82F6'} 0%, #090E1A 130%)`,
                }}
              >
                {/* Chip & Bank Logo */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-black tracking-wide">{card.bankName}</div>
                    {card.cardNickname && (
                      <div className="text-[11px] text-white/80">{card.cardNickname}</div>
                    )}
                  </div>
                  {/* EMV Gold Chip */}
                  <div className="w-7 h-5 rounded bg-amber-300/90 border border-amber-400 flex items-center justify-center shadow-xs">
                    <div className="w-4 h-3 border border-amber-600/40 rounded-xs" />
                  </div>
                </div>

                {/* Masked Card Number */}
                <div className="my-auto text-center">
                  <div className="font-mono text-base sm:text-lg font-bold tracking-widest text-white dir-ltr drop-shadow-sm flex items-center justify-center gap-2">
                    <span>•••• •••• •••• {card.last4Digits}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(`****${card.last4Digits}`, `crd_${card.id}`)}
                      className="p-1 text-white/70 hover:text-white transition-colors cursor-pointer"
                      title="کپی"
                    >
                      {copiedId === `crd_${card.id}` ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {acc && (
                    <div className="text-[10px] text-white/70 mt-0.5">
                      حساب: {acc.name}
                    </div>
                  )}
                </div>

                {/* Footer: Expiry & Actions */}
                <div className="flex justify-between items-end pt-2 border-t border-white/10 text-xs">
                  <div>
                    <div className="text-[9px] text-white/60">انقضا</div>
                    <div className="font-mono font-bold text-[11px] text-white/90">{card.expireDate || '••/••'}</div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditCard(card)}
                      className="p-1.5 rounded-lg bg-black/30 hover:bg-black/50 text-white/90 transition-colors cursor-pointer"
                      title="ویرایش"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCard(card.id)}
                      className="p-1.5 rounded-lg bg-black/30 hover:bg-rose-900/60 text-rose-200 transition-colors cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bank Accounts Grid */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>حساب‌های بانکی ({toPersianDigits(accounts.length)})</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm space-y-3 hover:border-slate-700/80 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-7 rounded-full shrink-0"
                      style={{ backgroundColor: acc.color }}
                    />
                    <div>
                      <h4 className="font-bold text-white text-xs">{acc.name}</h4>
                      <p className="text-[11px] text-slate-400">{acc.bankName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditAccount(acc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="ویرایش"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteAccount(acc.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Balance */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400">موجودی:</div>
                  <div className="text-base font-black text-emerald-400 tracking-tight mt-0.5 tabular-nums">
                    {formatMoney(acc.currentBalance, currency)}
                  </div>
                </div>

                {/* Account & Shaba Numbers */}
                {(acc.accountNumber || acc.shaba) && (
                  <div className="space-y-1 text-xs">
                    {acc.accountNumber && (
                      <div className="flex items-center justify-between text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800/60 text-[11px]">
                        <span>حساب:</span>
                        <div className="flex items-center gap-1 font-mono text-slate-200">
                          <span>{acc.accountNumber}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(acc.accountNumber!, `acc_${acc.id}`)}
                            className="p-0.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                            title="کپی"
                          >
                            {copiedId === `acc_${acc.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    )}
                    {acc.shaba && (
                      <div className="flex items-center justify-between text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800/60 text-[11px]">
                        <span>شبا:</span>
                        <div className="flex items-center gap-1 font-mono text-slate-200">
                          <span>{acc.shaba}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(acc.shaba!, `shb_${acc.id}`)}
                            className="p-0.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                            title="کپی"
                          >
                            {copiedId === `shb_${acc.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
