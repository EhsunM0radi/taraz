import React, { useState } from 'react';
import {
  Building2,
  Check,
  Wallet,
  Coins,
  CreditCard,
  FileText,
} from 'lucide-react';
import { Account, AccountType, Currency } from '../../../types';
import { IRANIAN_BANKS } from '../../../parser/bankRules';
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

interface AccountFormViewProps {
  accountToEdit?: Account | null;
  currency: Currency;
  onSave: (account: Account) => void;
  onBack: () => void;
}

export const AccountFormView: React.FC<AccountFormViewProps> = ({
  accountToEdit,
  currency,
  onSave,
  onBack,
}) => {
  const [name, setName] = useState(accountToEdit?.name || '');
  const [bankKey, setBankKey] = useState(accountToEdit?.bankCode || 'mellat');
  const [accountType, setAccountType] = useState<AccountType>(accountToEdit?.accountType || 'bank');
  const [initialBalanceStr, setInitialBalanceStr] = useState(
    accountToEdit ? String(accountToEdit.initialBalance) : '0'
  );
  const [accountNumber, setAccountNumber] = useState(accountToEdit?.accountNumber || '');
  const [shaba, setShaba] = useState(accountToEdit?.shaba || '');
  const [notes, setNotes] = useState(accountToEdit?.notes || '');

  const numericBalance = parseInt(initialBalanceStr, 10) || 0;
  const selectedBank = IRANIAN_BANKS[bankKey] || IRANIAN_BANKS.mellat;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const account: Account = {
      id: accountToEdit ? accountToEdit.id : 'acc_' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      bankName: accountType === 'cash' ? 'نقدی' : selectedBank.name,
      bankCode: accountType === 'cash' ? 'cash' : selectedBank.code,
      accountType,
      accountNumber: accountNumber.trim() || undefined,
      shaba: shaba.trim() || undefined,
      currency: 'TOMAN',
      initialBalance: numericBalance,
      currentBalance: accountToEdit ? accountToEdit.currentBalance : numericBalance,
      color: accountType === 'cash' ? '#10B981' : selectedBank.color,
      icon: accountType === 'cash' ? 'Wallet' : 'Building2',
      isArchived: false,
      notes: notes.trim() || undefined,
      createdAt: accountToEdit ? accountToEdit.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    onSave(account);
    onBack();
  };

  return (
    <FormPageLayout
      title={accountToEdit ? 'ویرایش حساب بانکی' : 'افزودن حساب یا کیف پول جدید'}
      subtitle="مدیریت منابع مالی، بانک‌های شخصی و تعیین موجودی اولیه"
      onBack={onBack}
      accentColor="cyan"
      icon={<Building2 className="w-5 h-5 text-cyan-400" />}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          {/* Account Type Selector */}
          <FormField label="نوع منبع مالی">
            <SegmentedControl
              options={[
                {
                  id: 'bank',
                  label: 'حساب بانکی',
                  icon: <Building2 className="w-4 h-4" />,
                  activeColorClass: 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/60 ring-1 ring-white/20',
                },
                {
                  id: 'cash',
                  label: 'کیف پول نقدی',
                  icon: <Wallet className="w-4 h-4" />,
                  activeColorClass: 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60 ring-1 ring-white/20',
                },
                {
                  id: 'investment',
                  label: 'سرمایه‌گذاری / طلا',
                  icon: <Coins className="w-4 h-4" />,
                  activeColorClass: 'bg-amber-600 text-white shadow-lg shadow-amber-950/60 ring-1 ring-white/20',
                },
              ]}
              value={accountType}
              onChange={(val) => setAccountType(val as AccountType)}
            />
          </FormField>

          {/* Account Name */}
          <FormField label="نام دلخواه حساب" required icon={<CreditCard className="w-4 h-4" />}>
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً: حساب حقوق ملت، بلو بانک پس‌انداز، گاوصندوق"
              accent="cyan"
              autoFocus
              required
              onClear={() => setName('')}
            />
          </FormField>

          {/* Bank Selection */}
          {accountType !== 'cash' && (
            <FormField label="انتخاب بانک صادرکننده" icon={<Building2 className="w-4 h-4" />}>
              <Select
                value={bankKey}
                onChange={(e) => setBankKey(e.target.value)}
                accent="cyan"
              >
                {Object.keys(IRANIAN_BANKS).map((k) => (
                  <option key={k} value={k}>
                    {IRANIAN_BANKS[k].name} {IRANIAN_BANKS[k].defaultCardPrefix ? `(${IRANIAN_BANKS[k].defaultCardPrefix})` : ''}
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          {/* Initial Balance */}
          <FormField label="موجودی اولیه (تومان)">
            <MoneyInput
              value={initialBalanceStr}
              onChange={(val) => setInitialBalanceStr(val)}
              currency={currency}
              accent="cyan"
            />
          </FormField>

          {/* Account Number & Shaba */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="شماره حساب (اختیاری)">
              <TextInput
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="0104589623001"
                accent="cyan"
                className="font-mono text-left"
              />
            </FormField>

            <FormField label="شماره شبا (اختیاری)">
              <TextInput
                value={shaba}
                onChange={(e) => setShaba(e.target.value)}
                placeholder="IR1201..."
                accent="cyan"
                className="font-mono uppercase text-left"
              />
            </FormField>
          </div>

          {/* Notes */}
          <FormField label="یادداشت یا توضیحات" icon={<FileText className="w-4 h-4" />}>
            <TextInput
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="توضیحات تکمیلی..."
              accent="cyan"
              onClear={() => setNotes('')}
            />
          </FormField>
        </Card>

        {/* Buttons */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={!name.trim()}
            accent="cyan"
            className="w-full py-3.5"
            rightIcon={<Check className="w-4 h-4 stroke-[3]" />}
          >
            {accountToEdit ? 'به‌روزرسانی حساب' : 'ایجاد و ذخیره حساب'}
          </Button>
        </div>
      </form>
    </FormPageLayout>
  );
};
