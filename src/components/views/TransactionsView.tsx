import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  FileSpreadsheet,
  X,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Building2,
  CreditCard,
  Layers,
  Users,
  Sparkles,
  ArrowDownWideNarrow,
  Tag,
} from 'lucide-react';
import {
  Transaction,
  Account,
  BankCard,
  Category,
  Counterparty,
  Currency,
} from '../../types';
import {
  formatMoney,
  toPersianDigits,
  formatJalaliFull,
  gregorianToJalali,
  getCurrentJalaliYearMonth,
  jalaliToTimestamp,
  parseJalaliDate,
} from '../../utils/persianDate';
import { LocalDatabaseService } from '../../services/localDatabase';
import { AmountRangeFilter } from './filters/AmountRangeFilter';
import { DateRangeFilter, TimeframeMode } from './filters/DateRangeFilter';
import { BottomSheet } from '../ui/BottomSheet';

interface TransactionsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  cards?: BankCard[];
  categories: Category[];
  counterparties: Counterparty[];
  currency: Currency;
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

type SortOrder = 'newest' | 'oldest' | 'amount_desc' | 'amount_asc';

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  accounts,
  cards = [],
  categories,
  counterparties,
  currency,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  // Top bar quick filters
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  // Advanced Bottom Sheet Filters
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [selectedCardId, setSelectedCardId] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<TimeframeMode>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedCounterpartyId, setSelectedCounterpartyId] = useState<string>('all');
  const [onlyWithNotes, setOnlyWithNotes] = useState<boolean>(false);
  const [onlyWithMerchant, setOnlyWithMerchant] = useState<boolean>(false);
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  // Amount Range State
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [amountPreset, setAmountPreset] = useState<string>('all');

  const handleSelectAmountPreset = (presetId: string, min: string, max: string) => {
    setAmountPreset(presetId);
    setMinAmount(min);
    setMaxAmount(max);
  };

  const handleCustomMinChange = (val: string) => {
    setMinAmount(val);
    setAmountPreset('custom');
  };

  const handleCustomMaxChange = (val: string) => {
    setMaxAmount(val);
    setAmountPreset('custom');
  };

  const handleClearAmount = () => {
    setMinAmount('');
    setMaxAmount('');
    setAmountPreset('all');
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    setTimeframe('custom');
  };

  const handleClearDate = () => {
    setTimeframe('all');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  // Count active advanced bottom sheet filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedAccountId !== 'all') count++;
    if (selectedCardId !== 'all') count++;
    if (selectedCategoryId !== 'all') count++;
    if (timeframe !== 'all') count++;
    if (selectedSource !== 'all') count++;
    if (selectedCounterpartyId !== 'all') count++;
    if (minAmount.trim() !== '' || maxAmount.trim() !== '') count++;
    if (onlyWithNotes) count++;
    if (onlyWithMerchant) count++;
    if (onlyVerified) count++;
    if (sortOrder !== 'newest') count++;
    return count;
  }, [
    selectedAccountId,
    selectedCardId,
    selectedCategoryId,
    timeframe,
    selectedSource,
    selectedCounterpartyId,
    minAmount,
    maxAmount,
    onlyWithNotes,
    onlyWithMerchant,
    onlyVerified,
    sortOrder,
  ]);

  // Close bottom sheet on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isBottomSheetOpen) {
        setIsBottomSheetOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBottomSheetOpen]);

  // Prevent background scroll when bottom sheet is open
  useEffect(() => {
    if (isBottomSheetOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isBottomSheetOpen]);

  // Reset all advanced filters
  const handleResetFilters = () => {
    setSelectedAccountId('all');
    setSelectedCardId('all');
    setSelectedCategoryId('all');
    setTimeframe('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedSource('all');
    setSelectedCounterpartyId('all');
    setMinAmount('');
    setMaxAmount('');
    setAmountPreset('all');
    setOnlyWithNotes(false);
    setOnlyWithMerchant(false);
    setOnlyVerified(false);
    setSortOrder('newest');
  };

  // Reset everything including top bar search & categories
  const handleResetAll = () => {
    setSearchText('');
    setSelectedType('all');
    setSelectedCategoryId('all');
    handleResetFilters();
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayTs = startOfToday.getTime();
    const currentJalali = getCurrentJalaliYearMonth();

    const result = transactions.filter((tx) => {
      // 1. Type filter
      if (selectedType !== 'all' && tx.type !== selectedType) {
        return false;
      }

      // 2. Category filter (Top bar)
      if (selectedCategoryId !== 'all' && tx.categoryId !== selectedCategoryId) {
        return false;
      }

      // 3. Account filter
      if (selectedAccountId !== 'all') {
        if (tx.accountId !== selectedAccountId && tx.targetAccountId !== selectedAccountId) {
          return false;
        }
      }

      // 4. Card filter
      if (selectedCardId !== 'all') {
        const matchingCard = cards.find((c) => c.id === selectedCardId);
        if (matchingCard) {
          if (tx.cardId !== selectedCardId && tx.cardLast4 !== matchingCard.last4Digits) {
            return false;
          }
        } else if (tx.cardId !== selectedCardId) {
          return false;
        }
      }

      // 5. Timeframe / Date filter
      if (timeframe !== 'all') {
        if (timeframe === 'today') {
          if (tx.timestamp < startOfTodayTs) return false;
        } else if (timeframe === 'yesterday') {
          const startOfYesterdayTs = startOfTodayTs - 86400000;
          if (tx.timestamp < startOfYesterdayTs || tx.timestamp >= startOfTodayTs) return false;
        } else if (timeframe === '7days') {
          if (tx.timestamp < now - 7 * 86400000) return false;
        } else if (timeframe === '30days') {
          if (tx.timestamp < now - 30 * 86400000) return false;
        } else if (timeframe === '90days') {
          if (tx.timestamp < now - 90 * 86400000) return false;
        } else if (timeframe === 'this_month') {
          const d = new Date(tx.timestamp);
          const jDate = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
          if (jDate.jy !== currentJalali.year || jDate.jm !== currentJalali.month) {
            return false;
          }
        } else if (timeframe === 'last_month') {
          const d = new Date(tx.timestamp);
          const jDate = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
          let targetM = currentJalali.month - 1;
          let targetY = currentJalali.year;
          if (targetM === 0) {
            targetM = 12;
            targetY -= 1;
          }
          if (jDate.jy !== targetY || jDate.jm !== targetM) {
            return false;
          }
        } else if (timeframe === 'this_year') {
          const d = new Date(tx.timestamp);
          const jDate = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
          if (jDate.jy !== currentJalali.year) {
            return false;
          }
        } else if (timeframe === 'custom') {
          if (customStartDate) {
            const p = parseJalaliDate(customStartDate);
            if (p) {
              const startTs = jalaliToTimestamp(p.jy, p.jm, p.jd, false);
              if (tx.timestamp < startTs) return false;
            }
          }
          if (customEndDate) {
            const p = parseJalaliDate(customEndDate);
            if (p) {
              const endTs = jalaliToTimestamp(p.jy, p.jm, p.jd, true);
              if (tx.timestamp > endTs) return false;
            }
          }
        }
      }

      // 6. Source filter
      if (selectedSource !== 'all') {
        if (tx.source !== selectedSource) return false;
      }

      // 7. Counterparty filter
      if (selectedCounterpartyId !== 'all') {
        const cp = counterparties.find((c) => c.id === selectedCounterpartyId);
        const cpMatches =
          tx.counterpartyId === selectedCounterpartyId ||
          (cp && tx.counterpartyName && tx.counterpartyName.toLowerCase() === cp.name.toLowerCase());
        if (!cpMatches) return false;
      }

      // 8. Amount Range
      if (minAmount.trim() !== '') {
        const minVal = parseInt(minAmount, 10);
        if (!isNaN(minVal) && tx.amount < minVal) return false;
      }
      if (maxAmount.trim() !== '') {
        const maxVal = parseInt(maxAmount, 10);
        if (!isNaN(maxVal) && tx.amount > maxVal) return false;
      }

      // 9. Smart Flags
      if (onlyWithNotes && (!tx.notes || tx.notes.trim() === '')) {
        return false;
      }
      if (onlyWithMerchant && (!tx.merchantName || tx.merchantName.trim() === '')) {
        return false;
      }
      if (onlyVerified && !tx.isVerified) {
        return false;
      }

      // 10. Search Text
      if (searchText.trim()) {
        const q = searchText.trim().toLowerCase();
        const cat = categories.find((c) => c.id === tx.categoryId)?.name.toLowerCase() || '';
        const acc = accounts.find((a) => a.id === tx.accountId)?.name.toLowerCase() || '';
        const cp = (tx.counterpartyName || '').toLowerCase();
        const merch = (tx.merchantName || '').toLowerCase();
        const desc = (tx.description || '').toLowerCase();
        const notes = (tx.notes || '').toLowerCase();
        const date = tx.jalaliDate || '';
        const card = tx.cardLast4 || '';
        const amountStr = String(tx.amount);

        const match =
          cat.includes(q) ||
          acc.includes(q) ||
          cp.includes(q) ||
          merch.includes(q) ||
          desc.includes(q) ||
          notes.includes(q) ||
          date.includes(q) ||
          card.includes(q) ||
          amountStr.includes(q);

        if (!match) return false;
      }

      return true;
    });

    // Apply Sorting
    return result.sort((a, b) => {
      if (sortOrder === 'newest') return b.timestamp - a.timestamp;
      if (sortOrder === 'oldest') return a.timestamp - b.timestamp;
      if (sortOrder === 'amount_desc') return b.amount - a.amount;
      if (sortOrder === 'amount_asc') return a.amount - b.amount;
      return b.timestamp - a.timestamp;
    });
  }, [
    transactions,
    selectedType,
    selectedCategoryId,
    selectedAccountId,
    selectedCardId,
    timeframe,
    customStartDate,
    customEndDate,
    selectedSource,
    selectedCounterpartyId,
    minAmount,
    maxAmount,
    onlyWithNotes,
    onlyWithMerchant,
    onlyVerified,
    searchText,
    sortOrder,
    cards,
    categories,
    accounts,
    counterparties,
  ]);

  const handleExportCsv = () => {
    const csvContent = LocalDatabaseService.exportCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `taraz_transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleExpand = (id: string) => {
    setExpandedTxId((prev) => (prev === id ? null : id));
  };

  const typeOptions = [
    { id: 'all', label: 'همه تراکنش‌ها' },
    { id: 'expense', label: 'هزینه‌ها' },
    { id: 'income', label: 'درآمدها' },
    { id: 'transfer', label: 'انتقال داخلی' },
    { id: 'refund', label: 'برگشت وجه' },
    { id: 'fee', label: 'کارمزد بانکی' },
  ];

  // Helper to count transactions per category
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.categoryId) {
        map[tx.categoryId] = (map[tx.categoryId] || 0) + 1;
      }
    });
    return map;
  }, [transactions]);

  return (
    <div id="transactions_view_box" className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* Search Input & Action Bar */}
      <div id="tx_search_filter_bar" className="p-3 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm space-y-3">
        {/* Single Row: Search Input + Bottom Sheet Filter Trigger + Excel Export + Count Badge */}
        <div className="flex items-center gap-2">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              id="input_transaction_search"
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="جستجوی فروشگاه، طرف حساب، بانک، مبلغ یا تاریخ..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pr-9 pl-8 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Trigger Bottom Sheet Filter Button */}
          <button
            id="btn_open_tx_filter_bottomsheet"
            type="button"
            onClick={() => setIsBottomSheetOpen(true)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm ${
              activeFiltersCount > 0
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-500/30'
                : 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-300'
            }`}
            title="فیلترهای پیشرفته (حساب، کارت، مبلغ، تاریخ و...)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">فیلترهای پیشرفته</span>
            <span className="sm:hidden">فیلتر</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                {toPersianDigits(activeFiltersCount)}
              </span>
            )}
          </button>

          {/* Export CSV / Excel Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center cursor-pointer shrink-0"
            title="خروجی اکسل (CSV)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Count Badge */}
          <div
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs font-bold tabular-nums shrink-0 text-center"
            title="تعداد تراکنش‌های مطابق"
          >
            {toPersianDigits(filteredTransactions.length)}
          </div>
        </div>

        {/* Quick Type Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
          {typeOptions.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setSelectedType(chip.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedType === chip.id
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Advanced Filter Summary Bar (if any applied) */}
      {activeFiltersCount > 0 && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs text-emerald-300">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>فیلترهای فعال ({toPersianDigits(activeFiltersCount)}):</span>
            </span>

            {selectedAccountId !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/60 text-[11px]">
                حساب: {accounts.find((a) => a.id === selectedAccountId)?.name || 'انتخابی'}
              </span>
            )}
            {selectedCategoryId !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/60 text-[11px]">
                دسته: {categories.find((c) => c.id === selectedCategoryId)?.name || 'انتخابی'}
              </span>
            )}
            {selectedCardId !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/60 text-[11px]">
                کارت: ****{cards.find((c) => c.id === selectedCardId)?.last4Digits || 'انتخابی'}
              </span>
            )}
            {timeframe !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/60 text-[11px]">
                زمان:{' '}
                {timeframe === 'today'
                  ? 'امروز'
                  : timeframe === 'yesterday'
                  ? 'دیروز'
                  : timeframe === '7days'
                  ? '۷ روز اخیر'
                  : timeframe === '30days'
                  ? '۳۰ روز اخیر'
                  : timeframe === 'this_month'
                  ? 'این ماه شمسی'
                  : timeframe === 'last_month'
                  ? 'ماه گذشته'
                  : timeframe === '90days'
                  ? '۳ ماه گذشته'
                  : timeframe === 'this_year'
                  ? 'امسال'
                  : `از ${toPersianDigits(customStartDate || '...')} تا ${toPersianDigits(customEndDate || '...')}`}
              </span>
            )}
            {(minAmount || maxAmount) && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/60 text-[11px]">
                مبلغ:{' '}
                {minAmount ? `از ${toPersianDigits(Number(minAmount).toLocaleString())}` : 'از ۰'}{' '}
                {maxAmount ? `تا ${toPersianDigits(Number(maxAmount).toLocaleString())}` : 'به بالا'}{' '}
                {currency === 'TOMAN' ? 'تومان' : 'ریال'}
              </span>
            )}
            {selectedSource !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/60 text-[11px]">
                منبع: {selectedSource === 'sms' ? 'پیامک' : selectedSource === 'manual' ? 'دستی' : selectedSource}
              </span>
            )}
            {selectedCounterpartyId !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/60 text-[11px]">
                طرف معامله: {counterparties.find((c) => c.id === selectedCounterpartyId)?.name || 'انتخابی'}
              </span>
            )}
            {onlyWithNotes && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/60 text-[11px]">
                دارای یادداشت
              </span>
            )}
            {onlyVerified && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/60 text-[11px]">
                تأییدشده
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
            title="حذف همه فیلترها"
            aria-label="حذف همه فیلترها"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Transactions List */}
      <div className="p-3 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm">
        {filteredTransactions.length === 0 ? (
          <div className="py-14 text-center space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-300">تراکنشی با این مشخصات پیدا نشد.</div>
            <button
              type="button"
              onClick={handleResetAll}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            >
              پاک‌سازی تمام فیلترها و جستجو
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredTransactions.map((tx) => {
              const isIncome = tx.type === 'income' || tx.type === 'deposit' || tx.type === 'refund';
              const isTransfer = tx.type === 'transfer';
              const cat = categories.find((c) => c.id === tx.categoryId);
              const acc = accounts.find((a) => a.id === tx.accountId);
              const targetAcc = tx.targetAccountId ? accounts.find((a) => a.id === tx.targetAccountId) : null;
              const isExpanded = expandedTxId === tx.id;

              return (
                <div
                  key={tx.id}
                  className="py-3 px-2 rounded-xl transition-all hover:bg-slate-800/30"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div
                      className="flex items-center gap-3.5 flex-1 cursor-pointer select-none"
                      onClick={() => toggleExpand(tx.id)}
                    >
                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${
                          isTransfer
                            ? 'bg-cyan-500/10 text-cyan-400'
                            : isIncome
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {isTransfer ? (
                          <ArrowLeftRight className="w-5 h-5" />
                        ) : isIncome ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="font-bold text-white text-sm flex items-center flex-wrap gap-2">
                          <span>
                            {isTransfer
                              ? `انتقال: ${acc?.name} ⬅️ ${targetAcc?.name || 'حساب مقصد'}`
                              : tx.counterpartyName || tx.merchantName || cat?.name || 'تراکنش'}
                          </span>
                          {cat && !isTransfer && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                              {cat.name}
                            </span>
                          )}
                          {tx.source === 'sms' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-mono">
                              ثبت خودکار پیامک
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center flex-wrap gap-2">
                          <span>{acc?.name || 'حساب'}</span>
                          {tx.cardLast4 && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-slate-300">کارت ****{tx.cardLast4}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{tx.jalaliDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <div className="text-left">
                        <div className={`font-black text-sm tabular-nums ${isTransfer ? 'text-cyan-400' : isIncome ? 'text-emerald-400' : 'text-slate-100'}`}>
                          {isIncome ? '+' : isTransfer ? '' : '-'}{formatMoney(tx.amount, currency)}
                        </div>
                        {tx.balanceAfter !== undefined && (
                          <div className="text-[10px] text-slate-400">
                            مانده: {formatMoney(tx.balanceAfter, currency)}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditTransaction(tx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          title="ویرایش تراکنش"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="حذف تراکنش"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleExpand(tx.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="جزئیات کامل"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Inline Expanded Details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 bg-slate-950/60 p-3 rounded-xl space-y-2 text-xs text-slate-300 animate-in fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500">تاریخ دقیق و زمان: </span>
                          <span className="font-mono text-slate-200">{formatJalaliFull(tx.timestamp)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">نحوه ثبت: </span>
                          <span className="text-emerald-400 font-bold">
                            {tx.source === 'sms'
                              ? 'تشخیص هوشمند پیامک'
                              : tx.source === 'recurring'
                              ? 'تراکنش دوره‌ای'
                              : tx.source === 'csv'
                              ? 'بارگذاری فایل'
                              : 'ثبت دستی'}
                          </span>
                        </div>
                        {tx.merchantName && (
                          <div>
                            <span className="text-slate-500">نام پذیرنده/فروشگاه: </span>
                            <span className="text-white font-medium">{tx.merchantName}</span>
                          </div>
                        )}
                        {tx.counterpartyName && (
                          <div>
                            <span className="text-slate-500">طرف تراکنش: </span>
                            <span className="text-white font-medium">{tx.counterpartyName}</span>
                          </div>
                        )}
                      </div>
                      {tx.description && (
                        <div className="pt-1 text-slate-400">
                          <span className="text-slate-500">توضیحات: </span>
                          <span>{tx.description}</span>
                        </div>
                      )}
                      {tx.notes && (
                        <div className="pt-1 text-slate-400">
                          <span className="text-slate-500">یادداشت شخصی: </span>
                          <span className="text-amber-300/90">{tx.notes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TRANSACTION ADVANCED FILTERS BOTTOM SHEET (DRAG-TO-DISMISS)                */}
      {/* ========================================================================= */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        maxWidth="max-w-2xl"
        maxHeight="max-h-[90vh]"
        icon={<SlidersHorizontal className="w-4 h-4" />}
        title="فیلترهای پیشرفته"
        subtitle="فیلتر بر اساس حساب و کارت بانکی، محدوده هوشمند مبلغ، بازه تاریخ و منبع"
        headerRightAction={
          activeFiltersCount > 0 ? (
            <button
              type="button"
              onClick={handleResetFilters}
              className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors cursor-pointer"
              title="پاک کردن همه فیلترها"
              aria-label="پاک کردن همه فیلترها"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          ) : null
        }
        footer={
          <div className="p-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsBottomSheetOpen(false)}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-950/50 cursor-pointer text-center flex items-center justify-center gap-2"
            >
              <span>مشاهده نتایج</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-950/20 text-[11px]">
                ({toPersianDigits(filteredTransactions.length)} تراکنش)
              </span>
            </button>
          </div>
        }
      >
        {/* Body Content */}
        <div className="p-5 space-y-6 text-xs">
          {/* 1. Account & Bank Card Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>حساب و کارت بانکی</span>
              </label>
              {(selectedAccountId !== 'all' || selectedCardId !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAccountId('all');
                    setSelectedCardId('all');
                  }}
                  className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                >
                  انتخاب همه حساب‌ها
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Option: All Accounts */}
              <button
                type="button"
                onClick={() => {
                  setSelectedAccountId('all');
                  setSelectedCardId('all');
                }}
                className={`flex items-center justify-between p-3 rounded-xl text-right transition-all cursor-pointer ${
                  selectedAccountId === 'all' && selectedCardId === 'all'
                    ? 'bg-emerald-500/15 border-2 border-emerald-500 text-emerald-300 font-bold shadow-sm'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">همه حساب‌ها و کارت‌ها</div>
                    <div className="text-[10px] text-slate-500">شامل کلیه تراکنش‌های واریز و برداشت</div>
                  </div>
                </div>
                {selectedAccountId === 'all' && selectedCardId === 'all' && (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </button>

              {/* Individual Accounts */}
              {accounts.map((acc) => {
                const isSelected = selectedAccountId === acc.id && selectedCardId === 'all';
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setSelectedAccountId(acc.id);
                      setSelectedCardId('all');
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl text-right transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/15 border-2 border-emerald-500 text-emerald-300 font-bold shadow-sm'
                        : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: acc.color || '#10b981' }}
                      />
                      <div className="truncate">
                        <div className="font-bold text-white text-xs truncate">{acc.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {acc.bankName} • موجودی: {formatMoney(acc.currentBalance, currency)}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Sub-Card Filter (Specific Cards) */}
            {cards.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-800/60">
                <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-slate-500" />
                  <span>یا فیلتر بر اساس کارت بانکی خاص:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cards.map((card) => {
                    const isSelected = selectedCardId === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => {
                          setSelectedCardId(card.id);
                          setSelectedAccountId('all');
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                            : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>کارت ****{card.last4Digits}</span>
                        {card.cardNickname && <span className="font-sans text-[10px]">({card.cardNickname})</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. Category Filter */}
          {categories.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>دسته‌بندی تراکنش</span>
                </label>
                {selectedCategoryId !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId('all')}
                    className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                  >
                    انتخاب همه دسته‌ها
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategoryId === 'all'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  همه دسته‌ها
                </button>
                {categories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  const count = categoryCounts[cat.id] || 0;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: isSelected ? '#022c22' : cat.color }}
                      />
                      <span>{cat.name}</span>
                      {count > 0 && (
                        <span className={`text-[10px] font-mono ${isSelected ? 'text-slate-950 font-black' : 'text-slate-400'}`}>
                          ({toPersianDigits(count)})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Amount Range Filter Component */}
          <AmountRangeFilter
            minAmount={minAmount}
            maxAmount={maxAmount}
            amountPreset={amountPreset}
            currency={currency}
            onMinChange={handleCustomMinChange}
            onMaxChange={handleCustomMaxChange}
            onSelectPreset={handleSelectAmountPreset}
            onClear={handleClearAmount}
          />

          {/* 3. Timeframe & Jalali Date Range Filter Component */}
          <DateRangeFilter
            timeframe={timeframe}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onSelectTimeframe={(mode) => setTimeframe(mode)}
            onCustomDateChange={handleCustomDateChange}
            onClear={handleClearDate}
          />

          {/* 4. Transaction Source / Origin */}
          <div className="space-y-2.5">
            <label className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>منبع ثبت تراکنش</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'all', label: 'همه منابع' },
                { id: 'sms', label: '📩 پیامک بانکی' },
                { id: 'manual', label: '✍️ ثبت دستی' },
                { id: 'recurring', label: '🔄 تکرارپذیر' },
              ].map((src) => {
                const isSelected = selectedSource === src.id;
                return (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => setSelectedSource(src.id)}
                    className={`p-2.5 rounded-xl text-center text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {src.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Counterparties & Merchants Filter (if counterparties exist) */}
          {counterparties.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>طرف حساب یا شخص</span>
                </label>
                {selectedCounterpartyId !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCounterpartyId('all')}
                    className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                  >
                    همه اشخاص
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedCounterpartyId('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedCounterpartyId === 'all'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  همه اشخاص
                </button>
                {counterparties.map((cp) => {
                  const isSelected = selectedCounterpartyId === cp.id;
                  return (
                    <button
                      key={cp.id}
                      type="button"
                      onClick={() => setSelectedCounterpartyId(cp.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span>{cp.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. Smart Flags & Toggles */}
          <div className="space-y-2.5">
            <label className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>فیلترهای ویژه</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setOnlyWithNotes((prev) => !prev)}
                className={`p-2.5 rounded-xl border text-right flex items-center justify-between transition-all cursor-pointer ${
                  onlyWithNotes
                    ? 'bg-amber-500/15 border-amber-500/60 text-amber-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                <span>دارای یادداشت / توضیحات</span>
                {onlyWithNotes && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </button>

              <button
                type="button"
                onClick={() => setOnlyWithMerchant((prev) => !prev)}
                className={`p-2.5 rounded-xl border text-right flex items-center justify-between transition-all cursor-pointer ${
                  onlyWithMerchant
                    ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                <span>دارای نام فروشگاه/پذیرنده</span>
                {onlyWithMerchant && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => setOnlyVerified((prev) => !prev)}
                className={`p-2.5 rounded-xl border text-right flex items-center justify-between transition-all cursor-pointer ${
                  onlyVerified
                    ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                <span>فقط تأیید شده‌ها</span>
                {onlyVerified && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            </div>
          </div>

          {/* 7. Sorting Order */}
          <div className="space-y-2.5">
            <label className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <ArrowDownWideNarrow className="w-3.5 h-3.5 text-emerald-400" />
              <span>نحوه مرتب‌سازی</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'newest', label: 'جدیدترین' },
                { id: 'oldest', label: 'قدیمی‌ترین' },
                { id: 'amount_desc', label: 'بیشترین مبلغ' },
                { id: 'amount_asc', label: 'کمترین مبلغ' },
              ].map((s) => {
                const isSelected = sortOrder === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSortOrder(s.id as SortOrder)}
                    className={`p-2 rounded-xl text-center text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-100 text-slate-950 font-black shadow-sm'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
