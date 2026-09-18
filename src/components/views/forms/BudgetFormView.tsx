import React, { useState } from 'react';
import {
  Target,
  Check,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { Budget, Category, Currency } from '../../../types';
import { getCurrentJalaliYearMonth, toPersianDigits } from '../../../utils/persianDate';
import {
  FormPageLayout,
  FormField,
  Select,
  MoneyInput,
  Button,
  Card,
} from '../../ui';

interface BudgetFormViewProps {
  budgetToEdit?: Budget | null;
  categories: Category[];
  currency: Currency;
  onSave: (budget: Budget) => void;
  onBack: () => void;
}

export const BudgetFormView: React.FC<BudgetFormViewProps> = ({
  budgetToEdit,
  categories,
  currency,
  onSave,
  onBack,
}) => {
  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const [categoryId, setCategoryId] = useState(budgetToEdit?.categoryId || (expenseCategories[0]?.id ?? ''));
  const [amountStr, setAmountStr] = useState(budgetToEdit ? String(budgetToEdit.amount) : '');
  const [alertThreshold, setAlertThreshold] = useState(budgetToEdit ? budgetToEdit.alertThreshold : 0.8);

  const numericAmount = parseInt(amountStr, 10) || 0;
  const { year, month } = getCurrentJalaliYearMonth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) return;

    const budget: Budget = {
      id: budgetToEdit ? budgetToEdit.id : 'bg_' + Math.random().toString(36).substring(2, 9),
      categoryId,
      amount: numericAmount,
      period: 'monthly',
      year,
      month,
      alertThreshold,
      spent: budgetToEdit ? budgetToEdit.spent : 0,
      createdAt: budgetToEdit ? budgetToEdit.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    onSave(budget);
    onBack();
  };

  return (
    <FormPageLayout
      title={budgetToEdit ? 'ویرایش سقف بودجه ماهانه' : 'تعریف سقف بودجه جدید'}
      subtitle="کنترل مصارف مالی با تعیین سقف برای دسته‌بندی‌های هزینه"
      onBack={onBack}
      accentColor="amber"
      icon={<Target className="w-5 h-5 text-amber-400" />}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          {/* Category */}
          <FormField label="دسته‌بندی هزینه هدف" required icon={<Layers className="w-4 h-4" />}>
            <Select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              accent="amber"
              required
            >
              {expenseCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </FormField>

          {/* Amount */}
          <FormField label="سقف مجاز هزینه در ماه جاری (تومان)" required>
            <MoneyInput
              value={amountStr}
              onChange={(val) => setAmountStr(val)}
              currency={currency}
              accent="amber"
              presets={[1000000, 2000000, 5000000, 10000000, 15000000, 20000000]}
              autoFocus
              required
            />
          </FormField>

          {/* Alert Threshold Slider */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>ارسال هشدار در رسیدن به مصرف:</span>
              </span>
              <span className="text-amber-400 font-black text-sm">
                {toPersianDigits(Math.round(alertThreshold * 100))}٪ سقف بودجه
              </span>
            </div>

            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>50%</span>
              <span>80% (پیش‌فرض هوشمند)</span>
              <span>95%</span>
            </div>
          </div>
        </Card>

        {/* Buttons */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={numericAmount <= 0}
            accent="amber"
            className="w-full py-3.5"
            rightIcon={<Check className="w-4 h-4 stroke-[3]" />}
          >
            {budgetToEdit ? 'به‌روزرسانی بودجه' : 'ثبت و فعال‌سازی بودجه'}
          </Button>
        </div>
      </form>
    </FormPageLayout>
  );
};
