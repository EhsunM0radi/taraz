import React, { useState } from 'react';
import {
  CreditCard,
  Check,
  Lock,
  Calendar,
  Wallet,
  Camera,
  Building2,
  Sparkles,
} from 'lucide-react';
import { BankCard, Account } from '../../../types';
import { IRANIAN_BANKS } from '../../../parser/bankRules';
import { toEnglishDigits } from '../../../utils/persianDate';
import { DetectedCardResult } from '../../../utils/cardScanner';
import {
  FormPageLayout,
  FormField,
  TextInput,
  BaseDropdown,
  Button,
  Card,
  InfoNotice,
} from '../../ui';
import { CardScannerModal } from '../../CardScannerModal';

interface CardFormViewProps {
  cardToEdit?: BankCard | null;
  accounts: Account[];
  onSave: (card: BankCard) => void;
  onBack: () => void;
}

export const CardFormView: React.FC<CardFormViewProps> = ({
  cardToEdit,
  accounts,
  onSave,
  onBack,
}) => {
  const [accountId, setAccountId] = useState(cardToEdit?.accountId || (accounts[0]?.id ?? ''));
  const [cardNickname, setCardNickname] = useState(cardToEdit?.cardNickname || '');
  const [last4Digits, setLast4Digits] = useState(cardToEdit?.last4Digits || '');
  const [expireDate, setExpireDate] = useState(cardToEdit?.expireDate || '');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const targetAccount = accounts.find((a) => a.id === accountId) || accounts[0];
  const bankDef = targetAccount ? IRANIAN_BANKS[targetAccount.bankCode] || IRANIAN_BANKS.mellat : IRANIAN_BANKS.mellat;
  const prefix = bankDef.defaultCardPrefix || '603799';

  const cleanLast4 = toEnglishDigits(last4Digits).replace(/[^0-9]/g, '').slice(0, 4);

  // Handle scanned card result from Sabad OCR scanner
  const handleCardDetected = (result: DetectedCardResult) => {
    if (result.last4Digits) {
      setLast4Digits(result.last4Digits);
    }
    if (!cardNickname) {
      setCardNickname(`کارت ${result.bankName}`);
    }
    // Match account if same bankCode exists
    if (result.bankCode) {
      const matchedAccount = accounts.find((a) => a.bankCode === result.bankCode);
      if (matchedAccount) {
        setAccountId(matchedAccount.id);
      }
    }
  };

  const accountOptions = accounts.map((acc) => {
    const bDef = IRANIAN_BANKS[acc.bankCode] || IRANIAN_BANKS.mellat;
    return {
      value: acc.id,
      label: acc.name,
      sublabel: `${acc.bankName} • موجودی: ${acc.currentBalance.toLocaleString('fa-IR')} تومان`,
      badge: bDef.name,
      icon: (
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: bDef.color || '#9333ea' }}
        />
      ),
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cleanLast4.length !== 4) return;

    const card: BankCard = {
      id: cardToEdit ? cardToEdit.id : 'card_' + Math.random().toString(36).substring(2, 9),
      accountId: targetAccount.id,
      bankName: targetAccount.bankName,
      bankCode: targetAccount.bankCode,
      cardNumberMasked: `${prefix}********${cleanLast4}`,
      last4Digits: cleanLast4,
      cardNickname: cardNickname.trim() || `کارت ${targetAccount.bankName}`,
      color: bankDef.color || '#E11D48',
      isActive: true,
      expireDate: expireDate.trim() || undefined,
      createdAt: cardToEdit ? cardToEdit.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    onSave(card);
    onBack();
  };

  return (
    <FormPageLayout
      title={cardToEdit ? 'ویرایش کارت بانکی' : 'افزودن کارت شتاب جدید'}
      subtitle="اتصال ۴ رقم آخر کارت جهت تطبیق خودکار با پیامک‌های بانکی"
      onBack={onBack}
      accentColor="purple"
      icon={<CreditCard className="w-5 h-5 text-purple-400" />}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          {/* Top Scan Bar with Sabad Engine */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Camera className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <span>اسکن هوشمند کارت بانکی</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                    وب‌سرویس سبد
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  تشخیص خودکار ۴ رقم آخر و نام بانک با دوربین
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-950/50 cursor-pointer shrink-0"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>اسکن کارت</span>
            </button>
          </div>

          {/* Security Notice */}
          <InfoNotice
            title="حریم خصوصی و امنیت داده‌های بانکی"
            icon={<Lock className="w-5 h-5 text-purple-400" />}
            variant="purple"
          >
            برای امنیت حداکثری، سامانه تراز هیچ‌گاه شماره ۱۶ رقمی یا رمز/CVV2 را ذخیره نمی‌کند. تنها ۴ رقم آخر برای شناسایی کارت در پیامک‌ها استفاده می‌شود.
          </InfoNotice>

          {/* Account Selection using BaseDropdown */}
          <FormField label="متصل به حساب بانکی" required icon={<Wallet className="w-4 h-4" />}>
            <BaseDropdown
              options={accountOptions}
              value={accountId}
              onChange={(val) => setAccountId(val)}
              placeholder="انتخاب حساب بانکی متصل..."
              searchPlaceholder="جستجوی حساب‌ها و بانک‌ها..."
              accent="purple"
              emptyMessage="هیچ حساب بانکی یافت نشد"
            />
          </FormField>

          {/* Card Nickname */}
          <FormField label="نام یا عنوان کارت">
            <TextInput
              value={cardNickname}
              onChange={(e) => setCardNickname(e.target.value)}
              placeholder="مثلاً: کارت حقوق، بلو کارت مشکی، کارت بنزین"
              accent="purple"
              onClear={() => setCardNickname('')}
            />
          </FormField>

          {/* 4 digits & Expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="۴ رقم آخر کارت" required hint="فقط ۴ رقم سمت راست">
              <TextInput
                inputMode="numeric"
                maxLength={4}
                value={cleanLast4}
                onChange={(e) => setLast4Digits(e.target.value)}
                placeholder="1234"
                accent="purple"
                className="font-mono tracking-widest text-center text-base sm:text-lg font-bold"
                required
              />
            </FormField>

            <FormField label="تاریخ انقضا (ماه/سال)" hint="مثلاً 06/08" icon={<Calendar className="w-4 h-4" />}>
              <TextInput
                maxLength={5}
                value={expireDate}
                onChange={(e) => setExpireDate(e.target.value)}
                placeholder="06/08"
                accent="purple"
                className="font-mono text-center"
              />
            </FormField>
          </div>

          {/* Interactive Live Card Preview */}
          <div
            className="p-6 rounded-2xl text-white shadow-xl space-y-4 transition-all"
            style={{ backgroundColor: bankDef.color }}
          >
            <div className="flex justify-between items-center text-xs opacity-90">
              <span className="font-bold">{bankDef.name}</span>
              <span className="font-medium bg-black/25 px-2 py-0.5 rounded-md backdrop-blur-sm">
                {cardNickname || 'کارت شتاب'}
              </span>
            </div>
            <div className="text-center font-mono tracking-widest text-lg sm:text-xl font-black dir-ltr py-2">
              {prefix} •••• •••• {cleanLast4 || '••••'}
            </div>
            <div className="flex justify-between items-center text-xs opacity-80 font-mono">
              <span>EXP: {expireDate || '••/••'}</span>
              <span>شبکه شتاب ایران</span>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={cleanLast4.length !== 4}
            accent="purple"
            className="w-full py-3.5"
            rightIcon={<Check className="w-4 h-4 stroke-[3]" />}
          >
            {cardToEdit ? 'به‌روزرسانی کارت' : 'افزودن و اتصال کارت'}
          </Button>
        </div>
      </form>

      {/* Sabad Card Scanner Modal */}
      <CardScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onCardDetected={handleCardDetected}
      />
    </FormPageLayout>
  );
};
