import React, { useState } from 'react';
import {
  Check,
  ArrowUpRight,
  ArrowDownLeft,
  User,
  FileText,
} from 'lucide-react';
import { DebtRecord, Counterparty, Currency } from '../../../types';
import {
  FormPageLayout,
  FormField,
  TextInput,
  MoneyInput,
  SegmentedControl,
  Button,
  Card,
} from '../../ui';

interface DebtFormViewProps {
  debtToEdit?: DebtRecord | null;
  counterparties: Counterparty[];
  currency: Currency;
  onSave: (debt: DebtRecord) => void;
  onBack: () => void;
}

export const DebtFormView: React.FC<DebtFormViewProps> = ({
  debtToEdit,
  currency,
  onSave,
  onBack,
}) => {
  const [type, setType] = useState<'give' | 'take'>(debtToEdit?.type || 'give');
  const [counterpartyName, setCounterpartyName] = useState(debtToEdit?.counterpartyName || '');
  const [amountStr, setAmountStr] = useState(debtToEdit ? String(debtToEdit.amount) : '');
  const [description, setDescription] = useState(debtToEdit?.description || '');

  const numericAmount = parseInt(amountStr, 10) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterpartyName.trim() || numericAmount <= 0) return;

    const debt: DebtRecord = {
      id: debtToEdit ? debtToEdit.id : 'debt_' + Math.random().toString(36).substring(2, 9),
      counterpartyId: 'cp_' + Math.random().toString(36).substring(2, 7),
      counterpartyName: counterpartyName.trim(),
      type,
      amount: numericAmount,
      paidAmount: debtToEdit ? debtToEdit.paidAmount : 0,
      isSettled: debtToEdit ? debtToEdit.isSettled : false,
      description: description.trim() || undefined,
      createdAt: debtToEdit ? debtToEdit.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    onSave(debt);
    onBack();
  };

  return (
    <FormPageLayout
      title={debtToEdit ? 'ویرایش سند مالی شخص' : 'ثبت طلب یا بدهی جدید'}
      subtitle="مدیریت قرض‌ها، طلب‌ها و بدهی‌های بین‌فردی با اشخاص و دوستان"
      onBack={onBack}
      accentColor={type === 'give' ? 'emerald' : 'rose'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          {/* Type Segment */}
          <SegmentedControl
            options={[
              {
                id: 'give',
                label: 'طلب من (به او قرض دادم)',
                icon: <ArrowUpRight className="w-4 h-4" />,
                activeColorClass: 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60 ring-1 ring-white/20',
              },
              {
                id: 'take',
                label: 'بدهی من (از او قرض گرفتم)',
                icon: <ArrowDownLeft className="w-4 h-4" />,
                activeColorClass: 'bg-rose-600 text-white shadow-lg shadow-rose-950/60 ring-1 ring-white/20',
              },
            ]}
            value={type}
            onChange={(val) => setType(val as 'give' | 'take')}
          />

          {/* Counterparty Name */}
          <FormField label="نام طرف حساب / شخص" required icon={<User className="w-4 h-4" />}>
            <TextInput
              value={counterpartyName}
              onChange={(e) => setCounterpartyName(e.target.value)}
              placeholder="مثلاً: علی رضایی، مهندس کاظمی"
              accent={type === 'give' ? 'emerald' : 'rose'}
              autoFocus
              required
              onClear={() => setCounterpartyName('')}
            />
          </FormField>

          {/* Amount */}
          <FormField label="مبلغ کل سند (تومان)" required>
            <MoneyInput
              value={amountStr}
              onChange={(val) => setAmountStr(val)}
              currency={currency}
              accent={type === 'give' ? 'emerald' : 'rose'}
              required
            />
          </FormField>

          {/* Description */}
          <FormField label="توضیحات و بابت قرض" icon={<FileText className="w-4 h-4" />}>
            <TextInput
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثلاً: بابت اجاره، خرید لپ‌تاپ، دستی و مساعده"
              accent={type === 'give' ? 'emerald' : 'rose'}
              onClear={() => setDescription('')}
            />
          </FormField>
        </Card>

        {/* Buttons */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={!counterpartyName.trim() || numericAmount <= 0}
            accent={type === 'give' ? 'emerald' : 'rose'}
            className="w-full py-3.5"
            rightIcon={<Check className="w-4 h-4 stroke-[3]" />}
          >
            {debtToEdit ? 'به‌روزرسانی سند' : 'ثبت سند مالی شخص'}
          </Button>
        </div>
      </form>
    </FormPageLayout>
  );
};
