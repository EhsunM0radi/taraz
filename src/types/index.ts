export type Currency = 'TOMAN' | 'IRR';

export type TransactionType =
  | 'income'          // درآمد
  | 'expense'         // هزینه
  | 'transfer'        // انتقال بین حساب‌های شخصی
  | 'refund'          // برگشت وجه
  | 'withdrawal'      // برداشت نقدی
  | 'deposit'         // واریز
  | 'adjustment'      // تعدیل موجودی
  | 'debt'            // بدهی / قرض دادن یا گرفتن
  | 'debt_payment'    // تسویه بدهی
  | 'investment'      // سرمایه‌گذاری
  | 'fee';            // کارمزد بانکی

export type AccountType =
  | 'bank'            // حساب بانکی
  | 'cash'            // وجه نقد
  | 'wallet'          // کیف پول دیجیتال
  | 'investment'      // سرمایه‌گذاری (بورس، طلا، صندوق)
  | 'crypto';         // رمزارز

export type CounterpartyType =
  | 'person'          // شخص حقیقی
  | 'merchant'        // فروشگاه یا کسب‌وکار
  | 'organization'    // سازمان یا ارگان
  | 'unknown';        // نامشخص

export type TransactionSource =
  | 'manual'          // ثبت دستی
  | 'sms'             // پیامک بانکی
  | 'csv'             // فایل اکسل/CSV
  | 'recurring';      // تراکنش دوره‌ای خودکار

export interface Account {
  id: string;
  name: string;
  bankName: string;
  bankCode: string;
  accountType: AccountType;
  accountNumber?: string;
  shaba?: string;
  currency: Currency;
  initialBalance: number; // in Toman
  currentBalance: number; // in Toman
  color: string;
  icon: string;
  isArchived: boolean;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BankCard {
  id: string;
  accountId: string;
  bankName: string;
  bankCode: string;
  cardNumberMasked: string; // e.g. 6037********1234
  last4Digits: string;      // e.g. 1234
  cardNickname: string;
  color: string;
  isActive: boolean;
  expireDate?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  parentId?: string;
  isDefault?: boolean;
}

export interface Counterparty {
  id: string;
  name: string;
  type: CounterpartyType;
  phone?: string;
  knownCardLast4Digits?: string[];
  totalSent: number;      // Toman sent to them
  totalReceived: number;  // Toman received from them
  currentBalance: number; // >0 means they owe me (طلبکارم), <0 means I owe them (بدهکارم)
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;         // Always normalized to Toman in DB
  currency: Currency;
  timestamp: number;      // Unix timestamp (ms) - Gregorian
  jalaliDate: string;     // e.g. "1404/06/04" for easy search
  accountId: string;
  targetAccountId?: string; // Only for 'transfer' (destination account)
  cardId?: string;
  cardLast4?: string;
  categoryId?: string;
  counterpartyId?: string;
  counterpartyName?: string;
  merchantName?: string;
  description?: string;
  balanceAfter?: number;  // Balance reported by bank
  source: TransactionSource;
  confidence: number;     // 0.0 - 1.0
  rawSmsId?: string;
  dedupHash?: string;
  isVerified: boolean;
  tags?: string[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;         // Monthly limit in Toman
  period: 'monthly' | 'yearly';
  year: number;           // Jalali year (e.g. 1404)
  month: number;          // Jalali month (1-12)
  alertThreshold: number; // 0.8 = 80%
  spent: number;
  createdAt: number;
  updatedAt: number;
}

export interface RecurringTransaction {
  id: string;
  title: string;
  type: TransactionType;
  amount: number;
  accountId: string;
  categoryId?: string;
  counterpartyId?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  dayOfMonth?: number;    // 1-31
  nextDueDate: number;
  isActive: boolean;
  notes?: string;
  createdAt: number;
}

export interface DebtRecord {
  id: string;
  counterpartyId: string;
  counterpartyName: string;
  type: 'give' | 'take';  // 'give' = طلب من (I lent), 'take' = بدهی من (I borrowed)
  amount: number;         // in Toman
  paidAmount: number;     // in Toman
  dueDate?: number;
  isSettled: boolean;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ParsedSmsResult {
  bankCode: string;
  bankName: string;
  type: TransactionType;
  amount: number;         // In Toman
  rawAmount: number;      // Original raw amount
  rawUnit: 'IRR' | 'TOMAN';
  cardLast4?: string;
  accountNumber?: string;
  balanceAfter?: number;  // In Toman
  timestamp: number;
  jalaliDate: string;
  counterpartyName?: string;
  merchantName?: string;
  confidence: number;     // 0.0 - 1.0
  confidenceReasons: string[];
  trackingCode?: string;
  dedupHash: string;
  rawSms: string;
}

export interface SyncChange {
  id: string;
  table: 'accounts' | 'cards' | 'transactions' | 'categories' | 'counterparties' | 'budgets' | 'debts';
  action: 'create' | 'update' | 'delete';
  recordId: string;
  encryptedPayload: string; // AES-GCM-256 encrypted base64 payload
  timestamp: number;
  version: number;
  deviceId: string;
}

export interface SecurityState {
  isEncryptionActive: boolean;
  masterKeyDerived: boolean;
  keyDerivationAlgorithm: string;
  encryptionAlgorithm: string;
  iterations: number;
  saltHex: string;
  activeSessionsCount: number;
  lastSyncTimestamp: number | null;
  pendingSyncCount: number;
  deviceId: string;
}

export interface FinancialInsights {
  monthlyIncome: number;
  monthlyExpense: number;
  netCashFlow: number;
  savingsRate: number;
  topExpenseCategory?: { name: string; amount: number; percentage: number; color: string };
  comparisonWithLastMonth: number; // percentage change (e.g. +14% or -8%)
  mostFrequentCounterparty?: { name: string; amount: number; count: number };
  activeBudgetsAtRiskCount: number;
  totalReceivableDebt: number; // طلب‌های من
  totalPayableDebt: number;    // بدهی‌های من
}
