import React, { useState, useEffect } from 'react';
import {
  Check,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Layers,
  Calendar,
  User,
  FileText,
  CreditCard,
  Camera,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Transaction, TransactionType, Account, Category, Counterparty, Currency, BankCard } from '../../../types';
import { formatJalaliDate } from '../../../utils/persianDate';
import { CardScannerModal } from '../../CardScannerModal';
import { DetectedCardResult } from '../../../utils/cardScanner';
import {
  FormPageLayout,
  FormField,
  TextInput,
  Select,
  MoneyInput,
  SegmentedControl,
  Button,
  Card,
} from '../../ui';

interface TransactionFormViewProps {
  transactionToEdit?: Transaction | null;
  accounts: Account[];
  cards: BankCard[];
  categories: Category[];
  counterparties: Counterparty[];
  currency: Currency;
  onSave: (tx: Transaction) => void;
  onBack: () => void;
}

export const TransactionFormView: React.FC<TransactionFormViewProps> = ({
  transactionToEdit,
  accounts,
  cards,
  categories,
  counterparties,
  currency,
  onSave,
  onBack,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [cardId, setCardId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [counterpartyName, setCounterpartyName] = useState<string>('');
  const [jalaliDate, setJalaliDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Bank Card Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmountStr(String(transactionToEdit.amount));
      setAccountId(transactionToEdit.accountId || (accounts[0]?.id ?? ''));
      setCardId(transactionToEdit.cardId || '');
      setCategoryId(transactionToEdit.categoryId || '');
      setCounterpartyName(transactionToEdit.counterpartyName || transactionToEdit.merchantName || '');
      setJalaliDate(transactionToEdit.jalaliDate || formatJalaliDate(Date.now()));
      setDescription(transactionToEdit.description || '');
      setNotes(transactionToEdit.notes || '');
    } else {
      setType('expense');
      setAmountStr('');
      setAccountId(accounts[0]?.id ?? '');
      setCardId('');
      setCategoryId(categories.find((c) => c.type === 'expense')?.id || '');
      setCounterpartyName('');
      setJalaliDate(formatJalaliDate(Date.now()));
      setDescription('');
      setNotes('');
    }
  }, [transactionToEdit, accounts, categories]);

  const numericAmount = parseInt(amountStr, 10) || 0;

  // Handle Card Auto-Detection from Camera Scanner
  const handleCardDetected = (result: DetectedCardResult) => {
    // 1. Try to find a matching card in user's saved cards
    const matchingCard = cards.find(
      (c) =>
        c.last4Digits === result.last4Digits ||
        c.bankCode === result.bankCode ||
        c.bankName.includes(result.bankShortName)
    );

    // 2. Try to find a matching account in user's accounts
    const matchingAccount = accounts.find(
      (a) =>
        a.bankCode === result.bankCode ||
        a.bankName.includes(result.bankShortName) ||
        (matchingCard && a.id === matchingCard.accountId)
    );

    if (matchingAccount) {
      setAccountId(matchingAccount.id);
    }
    if (matchingCard) {
      setCardId(matchingCard.id);
    }

    if (!description) {
      setDescription(`کارت ${result.bankName} (****${result.last4Digits})`);
    }

    setScanSuccessMessage(
      `کارت ${result.bankName} با شماره ****${result.last4Digits} با موفقیت شناسایی و اعمال شد.`
    );

    // Auto dismiss toast after 4s
    setTimeout(() => {
      setScanSuccessMessage(null);
    }, 4000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) return;

    const matchedCp = counterparties.find((c) => c.name.trim() === counterpartyName.trim());
    const matchedCard = cards.find((c) => c.id === cardId);

    const tx: Transaction = {
      id: transactionToEdit ? transactionToEdit.id : 'tx_' + Math.random().toString(36).substring(2, 9),
      type,
      amount: numericAmount,
      currency: 'TOMAN',
      timestamp: transactionToEdit ? transactionToEdit.timestamp : Date.now(),
      jalaliDate: jalaliDate || formatJalaliDate(Date.now()),
      accountId: accountId || accounts[0]?.id || 'acc_1',
      cardId: cardId || undefined,
      cardLast4: matchedCard?.last4Digits,
      categoryId: categoryId || undefined,
      counterpartyId: matchedCp ? matchedCp.id : undefined,
      counterpartyName: counterpartyName ? counterpartyName.trim() : undefined,
      description: description.trim() || undefined,
      notes: notes.trim() || undefined,
      source: transactionToEdit ? transactionToEdit.source : 'manual',
      confidence: 1.0,
      isVerified: true,
      createdAt: transactionToEdit ? transactionToEdit.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    onSave(tx);
    onBack();
  };

  const filteredCategories = categories.filter((c) => c.type === (type === 'income' ? 'income' : 'expense'));

  return (
    <FormPageLayout
      title={transactionToEdit ? 'ویرایش تراکنش' : 'ثبت تراکنش جدید'}
      subtitle="ثبت دقیق هزینه یا درآمد شخصی با اختصاص دسته‌بندی و حساب بانکی"
      onBack={onBack}
      accentColor={type === 'expense' ? 'rose' : 'emerald'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          {/* Type Segment (Expense vs Income) */}
          <SegmentedControl
            options={[
              {
                id: 'expense',
                label: 'هزینه / پرداخت',
                icon: <ArrowUpRight className="w-4 h-4" />,
                activeColorClass: 'bg-rose-600 text-white shadow-lg shadow-rose-950/60 ring-1 ring-white/20',
              },
              {
                id: 'income',
                label: 'درآمد / واریز',
                icon: <ArrowDownLeft className="w-4 h-4" />,
                activeColorClass: 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60 ring-1 ring-white/20',
              },
            ]}
            value={type}
            onChange={(val) => {
              setType(val);
              const firstCat = categories.find((c) => c.type === val);
              if (firstCat) setCategoryId(firstCat.id);
            }}
          />

          {/* Amount Input with Currency and Presets */}
          <FormField label="مبلغ تراکنش (تومان)" required>
            <MoneyInput
              id="input_tx_amount"
              value={amountStr}
              onChange={(val) => setAmountStr(val)}
              currency={currency}
              accent={type === 'expense' ? 'rose' : 'emerald'}
              autoFocus
              required
            />
          </FormField>

          {/* Quick Bank Card Camera Scanner Feature */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-white flex items-center gap-1.5">
                  <span>اسکن هوشمند کارت بانکی با دوربین</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-normal">
                    جدید
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  شناسایی خودکار نام بانک و شماره کارت و انتخاب مستقیم حساب
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 cursor-pointer shrink-0"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>اسکن کارت</span>
            </button>
          </div>

          {/* Card Scan Success Notification */}
          {scanSuccessMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{scanSuccessMessage}</span>
            </div>
          )}

          {/* Account Selection */}
          <FormField label="حساب بانکی / منبع پرداخت" required icon={<Wallet className="w-4 h-4" />}>
            <Select
              id="select_tx_account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              accent={type === 'expense' ? 'rose' : 'emerald'}
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.bankName})
                </option>
              ))}
            </Select>
          </FormField>

          {/* Connected Card (Optional) */}
          {cards.length > 0 && (
            <FormField label="کارت بانکی مرتبط (اختیاری)" icon={<CreditCard className="w-4 h-4" />}>
              <Select
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                accent={type === 'expense' ? 'rose' : 'emerald'}
              >
                <option value="">-- بدون انتخاب کارت --</option>
                {cards
                  .filter((c) => !accountId || c.accountId === accountId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.cardNickname} (کارت ****{c.last4Digits} {c.bankName})
                    </option>
                  ))}
              </Select>
            </FormField>
          )}

          {/* Category Chips Grid */}
          <FormField label="دسته‌بندی تراکنش" icon={<Layers className="w-4 h-4" />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800">
              {filteredCategories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`p-2.5 rounded-xl text-center border text-xs font-semibold transition-all truncate flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? type === 'expense'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold shadow-sm'
                          : 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </FormField>

          {/* Counterparty & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="طرف معامله / فروشگاه" icon={<User className="w-4 h-4" />}>
              <TextInput
                id="input_tx_counterparty"
                value={counterpartyName}
                onChange={(e) => setCounterpartyName(e.target.value)}
                placeholder="مثلاً: فروشگاه افق، اسنپ، علی حسینی"
                accent={type === 'expense' ? 'rose' : 'emerald'}
                onClear={() => setCounterpartyName('')}
              />
            </FormField>

            <FormField label="تاریخ شمسی" icon={<Calendar className="w-4 h-4" />}>
              <TextInput
                id="input_tx_date"
                value={jalaliDate}
                onChange={(e) => setJalaliDate(e.target.value)}
                placeholder="1404/06/04"
                accent={type === 'expense' ? 'rose' : 'emerald'}
              />
            </FormField>
          </div>

          {/* Description */}
          <FormField label="شرح یا یادداشت تراکنش (اختیاری)" icon={<FileText className="w-4 h-4" />}>
            <TextInput
              id="input_tx_desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثلاً: خرید میوه، نان و مایحتاج منزل"
              accent={type === 'expense' ? 'rose' : 'emerald'}
              onClear={() => setDescription('')}
            />
          </FormField>
        </Card>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            id="btn_submit_transaction"
            type="submit"
            disabled={numericAmount <= 0}
            accent={type === 'expense' ? 'rose' : 'emerald'}
            className="w-full py-3.5"
            rightIcon={<Check className="w-4 h-4 stroke-[3]" />}
          >
            {transactionToEdit ? 'به‌روزرسانی تراکنش' : 'ثبت تراکنش در حساب'}
          </Button>
        </div>
      </form>

      {/* Camera Card Scanner Modal */}
      <CardScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onCardDetected={handleCardDetected}
      />
    </FormPageLayout>
  );
};
