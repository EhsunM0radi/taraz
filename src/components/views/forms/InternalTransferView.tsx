import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Check,
  AlertCircle,
  Calendar,
  FileText,
  Wallet,
} from 'lucide-react';
import { Account, Transaction, Currency } from '../../../types';
import { formatJalaliDate } from '../../../utils/persianDate';
import {
  FormPageLayout,
  FormField,
  TextInput,
  Select,
  MoneyInput,
  Button,
  Card,
  InfoNotice,
} from '../../ui';

interface InternalTransferViewProps {
  accounts: Account[];
  currency: Currency;
  onSave: (tx: Transaction) => void;
  onBack: () => void;
}

export const InternalTransferView: React.FC<InternalTransferViewProps> = ({
  accounts,
  currency,
  onSave,
  onBack,
}) => {
  const [sourceAccountId, setSourceAccountId] = useState<string>(accounts[0]?.id ?? '');
  const [targetAccountId, setTargetAccountId] = useState<string>(accounts[1]?.id ?? (accounts[0]?.id ?? ''));
  const [amountStr, setAmountStr] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [jalaliDate, setJalaliDate] = useState<string>(formatJalaliDate(Date.now()));

  const numericAmount = parseInt(amountStr, 10) || 0;
  const sourceAccount = accounts.find((a) => a.id === sourceAccountId);
  const targetAccount = accounts.find((a) => a.id === targetAccountId);
  const isSameAccount = sourceAccountId === targetAccountId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0 || isSameAccount) return;

    const tx: Transaction = {
      id: 'tx_trf_' + Math.random().toString(36).substring(2, 9),
      type: 'transfer',
      amount: numericAmount,
      currency: 'TOMAN',
      timestamp: Date.now(),
      jalaliDate: jalaliDate || formatJalaliDate(Date.now()),
      accountId: sourceAccountId,
      targetAccountId: targetAccountId,
      categoryId: 'cat_transfer',
      description: description.trim() || `انتقال از ${sourceAccount?.name || 'حساب مبدأ'} به ${targetAccount?.name || 'حساب مقصد'}`,
      source: 'manual',
      confidence: 1.0,
      isVerified: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onSave(tx);
    onBack();
  };

  const handleSwap = () => {
    const temp = sourceAccountId;
    setSourceAccountId(targetAccountId);
    setTargetAccountId(temp);
  };

  return (
    <FormPageLayout
      title="انتقال داخلی بین حساب‌ها"
      subtitle="جابجایی وجه بین حساب‌های شخصی بدون تغییر در درآمد یا هزینه خالص"
      onBack={onBack}
      accentColor="cyan"
      icon={<ArrowLeftRight className="w-5 h-5 text-cyan-400" />}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          {/* Accounting Principle Notice */}
          <InfoNotice
            title="اصل عدم تغییر دارایی کل (قانون ناوردایی)"
            icon={<AlertCircle className="w-5 h-5 text-cyan-400" />}
            variant="cyan"
          >
            انتقال بین دو حساب شخصی فقط موجودی مبدأ را کسر و مقصد را شارژ می‌کند؛ این جابجایی هرگز به عنوان درآمد یا هزینه در گزارش‌ها یا نمودارها شمرده نمی‌شود.
          </InfoNotice>

          {/* Amount Input */}
          <FormField label="مبلغ انتقال (تومان)" required>
            <MoneyInput
              id="input_transfer_amount"
              value={amountStr}
              onChange={(val) => setAmountStr(val)}
              currency={currency}
              accent="cyan"
              autoFocus
              required
            />
          </FormField>

          {/* Source & Destination Section */}
          <div className="space-y-4 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
            <FormField label="از حساب مبدأ (کسر وجه)" icon={<Wallet className="w-4 h-4 text-rose-400" />}>
              <Select
                id="select_transfer_source"
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
                accent="cyan"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.bankName})
                  </option>
                ))}
              </Select>
            </FormField>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleSwap}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 flex items-center gap-1.5 px-3"
                title="جابجایی حساب مبدأ و مقصد"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span className="text-[11px] font-bold">جابجایی مبدأ و مقصد</span>
              </button>
            </div>

            <FormField label="به حساب مقصد (افزایش وجه)" icon={<Wallet className="w-4 h-4 text-emerald-400" />}>
              <Select
                id="select_transfer_target"
                value={targetAccountId}
                onChange={(e) => setTargetAccountId(e.target.value)}
                accent="cyan"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.bankName})
                  </option>
                ))}
              </Select>
            </FormField>

            {isSameAccount && (
              <p className="text-xs text-rose-400 font-bold text-center">
                حساب مبدأ و مقصد نمی‌توانند یکسان باشند.
              </p>
            )}
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="تاریخ شمسی" icon={<Calendar className="w-4 h-4" />}>
              <TextInput
                value={jalaliDate}
                onChange={(e) => setJalaliDate(e.target.value)}
                accent="cyan"
              />
            </FormField>

            <FormField label="شرح / یادداشت انتقال" icon={<FileText className="w-4 h-4" />}>
              <TextInput
                id="input_transfer_desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="مثلاً: انتقال برای تسویه کارت یا شارژ حساب"
                accent="cyan"
                onClear={() => setDescription('')}
              />
            </FormField>
          </div>
        </Card>

        {/* Buttons */}
        <div className="pt-2">
          <Button
            id="btn_submit_transfer"
            type="submit"
            disabled={numericAmount <= 0 || isSameAccount}
            accent="cyan"
            className="w-full py-3.5"
            rightIcon={<Check className="w-4 h-4 stroke-[3]" />}
          >
            ثبت انتقال داخلی
          </Button>
        </div>
      </form>
    </FormPageLayout>
  );
};
