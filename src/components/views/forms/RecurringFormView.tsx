import React, { useState } from 'react';
import {
  CalendarSync,
  Check,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Layers,
  Calendar,
} from 'lucide-react';
import { RecurringTransaction, Category, Account, Currency } from '../../../types';
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

interface RecurringFormViewProps {
  categories: Category[];
  accounts: Account[];
  currency: Currency;
  onSave: (rec: RecurringTransaction) => void;
  onBack: () => void;
}

export const RecurringFormView: React.FC<RecurringFormViewProps> = ({
  categories,
  accounts,
  currency,
  onSave,
  onBack,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');

  const numericAmount = parseInt(amountStr, 10) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || numericAmount <= 0) return;

    const rec: RecurringTransaction = {
      id: 'rec_' + Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      type,
      amount: numericAmount,
      frequency: 'monthly',
      dayOfMonth: parseInt(dayOfMonth, 10) || 1,
      nextDueDate: Date.now() + 30 * 86400000,
      accountId,
      categoryId,
      isActive: true,
      createdAt: Date.now(),
    };

    onSave(rec);
    onBack();
  };

  const filteredCategories = categories.filter((c) => c.type === (type === 'income' ? 'income' : 'expense'));

  return (
    <FormPageLayout
      title="تعریف پرداخت یا دریافت دوره‌ای"
      subtitle="تنظیم یادآوری منظم حقوق، اجاره‌بها، اقساط وام و قبوض ماهانه"
      onBack={onBack}
      accentColor="cyan"
      icon={<CalendarSync className="w-5 h-5 text-cyan-400" />}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          {/* Type Picker */}
          <SegmentedControl
            options={[
              {
                id: 'expense',
                label: 'هزینه دوره‌ای (اقساط، اجاره)',
                icon: <ArrowUpRight className="w-4 h-4" />,
                activeColorClass: 'bg-rose-600 text-white shadow-lg shadow-rose-950/60 ring-1 ring-white/20',
              },
              {
                id: 'income',
                label: 'درآمد دوره‌ای (حقوق، سود)',
                icon: <ArrowDownLeft className="w-4 h-4" />,
                activeColorClass: 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60 ring-1 ring-white/20',
              },
            ]}
            value={type}
            onChange={(val) => {
              setType(val);
              const first = categories.find((c) => c.type === val);
              if (first) setCategoryId(first.id);
            }}
          />

          {/* Title */}
          <FormField label="عنوان پرداخت دوره‌ای" required>
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: قسط وام مسکن، اجاره خانه، شارژ ساختمان، حقوق ماهانه"
              accent="cyan"
              autoFocus
              required
              onClear={() => setTitle('')}
            />
          </FormField>

          {/* Amount */}
          <FormField label="مبلغ هر دوره (تومان)" required>
            <MoneyInput
              value={amountStr}
              onChange={(val) => setAmountStr(val)}
              currency={currency}
              accent="cyan"
              required
            />
          </FormField>

          {/* Day of Month */}
          <FormField
            label="روز سررسید در هر ماه شمسی (۱ تا ۳۱)"
            required
            hint="موعد تکرار در هر ماه"
            icon={<Calendar className="w-4 h-4" />}
          >
            <TextInput
              type="number"
              min={1}
              max={31}
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              accent="cyan"
              className="font-mono font-bold"
              required
            />
          </FormField>

          {/* Account Selection */}
          <FormField label="حساب بانکی مبدأ/مقصد" icon={<Wallet className="w-4 h-4" />}>
            <Select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              accent="cyan"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.bankName})
                </option>
              ))}
            </Select>
          </FormField>

          {/* Category Selection */}
          <FormField label="دسته‌بندی" icon={<Layers className="w-4 h-4" />}>
            <Select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              accent="cyan"
            >
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </FormField>
        </Card>

        {/* Buttons */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={!title.trim() || numericAmount <= 0}
            accent="cyan"
            className="w-full py-3.5"
            rightIcon={<Check className="w-4 h-4 stroke-[3]" />}
          >
            ذخیره پرداخت دوره‌ای
          </Button>
        </div>
      </form>
    </FormPageLayout>
  );
};
