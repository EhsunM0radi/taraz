import {
  Account,
  BankCard,
  Transaction,
  Category,
  Counterparty,
  Budget,
  RecurringTransaction,
  DebtRecord,
  SyncChange,
  FinancialInsights,
  TransactionType
} from '../types';
import { CryptoEngine } from '../crypto/encryption';
import { formatJalaliDate, getCurrentJalaliYearMonth } from '../utils/persianDate';

const STORAGE_BASE_KEYS = {
  ACCOUNTS: 'accounts_v1',
  CARDS: 'cards_v1',
  TRANSACTIONS: 'transactions_v1',
  CATEGORIES: 'categories_v1',
  COUNTERPARTIES: 'counterparties_v1',
  BUDGETS: 'budgets_v1',
  RECURRING: 'recurring_v1',
  DEBTS: 'debts_v1',
  SYNC_QUEUE: 'sync_queue_v1',
  INITIALIZED: 'initialized_v1',
  PROCESSED_SMS_HASHES: 'sms_hashes_v1',
};

export class LocalDatabaseService {
  private static subscribers: Array<() => void> = [];
  private static activeTenantId: string = 'default';

  public static setTenantId(tenantId: string): void {
    const cleanId = tenantId.trim().replace(/[^\w]/g, '_') || 'default';
    this.activeTenantId = cleanId;
    this.initDatabase();
    this.notifySubscribers();
  }

  public static getTenantId(): string {
    return this.activeTenantId;
  }

  private static getKey(key: keyof typeof STORAGE_BASE_KEYS): string {
    return `taraz_tenant_${this.activeTenantId}_${STORAGE_BASE_KEYS[key]}`;
  }

  public static subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private static notifySubscribers() {
    this.subscribers.forEach(cb => cb());
  }

  /**
   * Initialize Local DB for current tenant with rich realistic Persian default data
   */
  public static async initDatabase(): Promise<void> {
    const initKey = this.getKey('INITIALIZED');
    const isInit = localStorage.getItem(initKey);
    if (isInit) return;

    // Check for legacy data migration for default tenant
    if (this.activeTenantId === 'default' && localStorage.getItem('taraz_db_initialized_v1')) {
      const legacyMap: Record<string, string> = {
        ACCOUNTS: 'taraz_db_accounts_v1',
        CARDS: 'taraz_db_cards_v1',
        TRANSACTIONS: 'taraz_db_transactions_v1',
        CATEGORIES: 'taraz_db_categories_v1',
        COUNTERPARTIES: 'taraz_db_counterparties_v1',
        BUDGETS: 'taraz_db_budgets_v1',
        RECURRING: 'taraz_db_recurring_v1',
        DEBTS: 'taraz_db_debts_v1',
        SYNC_QUEUE: 'taraz_db_sync_queue_v1',
        PROCESSED_SMS_HASHES: 'taraz_db_sms_hashes_v1',
      };
      for (const [k, legacyKey] of Object.entries(legacyMap)) {
        const val = localStorage.getItem(legacyKey);
        if (val) {
          localStorage.setItem(this.getKey(k as keyof typeof STORAGE_BASE_KEYS), val);
        }
      }
      localStorage.setItem(initKey, 'true');
      this.recalculateAllAccountBalances();
      return;
    }

    // 1. Initial Categories
    const defaultCategories: Category[] = [
      { id: 'cat_salary', name: 'حقوق و دستمزد', type: 'income', icon: 'Briefcase', color: '#10B981', isDefault: true },
      { id: 'cat_freelance', name: 'فریلنسری و پروژه', type: 'income', icon: 'Laptop', color: '#06B6D4', isDefault: true },
      { id: 'cat_investment_in', name: 'سود بانکی و سرمایه‌گذاری', type: 'income', icon: 'TrendingUp', color: '#8B5CF6', isDefault: true },
      
      { id: 'cat_food', name: 'خوراک و رستوران', type: 'expense', icon: 'Utensils', color: '#F59E0B', isDefault: true },
      { id: 'cat_supermarket', name: 'سوپرمارکت و خرید روزانه', type: 'expense', icon: 'ShoppingCart', color: '#EC4899', isDefault: true },
      { id: 'cat_transport', name: 'حمل و نقل و اسنپ', type: 'expense', icon: 'Car', color: '#3B82F6', isDefault: true },
      { id: 'cat_housing', name: 'اجاره و مسکن', type: 'expense', icon: 'Home', color: '#EF4444', isDefault: true },
      { id: 'cat_bills', name: 'قبوض و خدمات اینترنت', type: 'expense', icon: 'Zap', color: '#6366F1', isDefault: true },
      { id: 'cat_health', name: 'بهداشت و درمان', type: 'expense', icon: 'HeartPulse', color: '#14B8A6', isDefault: true },
      { id: 'cat_shopping', name: 'خرید کالا و پوشاک', type: 'expense', icon: 'ShoppingBag', color: '#D946EF', isDefault: true },
      { id: 'cat_fun', name: 'تفریح و سرگرمی', type: 'expense', icon: 'Film', color: '#F97316', isDefault: true },
      { id: 'cat_loan', name: 'اقساط و وام', type: 'expense', icon: 'Landmark', color: '#64748B', isDefault: true },
      { id: 'cat_transfer', name: 'انتقال حساب به حساب', type: 'expense', icon: 'ArrowLeftRight', color: '#6B7280', isDefault: true },
    ];

    // 2. Initial Accounts
    const defaultAccounts: Account[] = [
      {
        id: 'acc_mellat',
        name: 'حساب جاری ملت',
        bankName: 'بانک ملت',
        bankCode: 'mellat',
        accountType: 'bank',
        accountNumber: '4859623145',
        shaba: 'IR120120000000004859623145',
        currency: 'TOMAN',
        initialBalance: 12500000,
        currentBalance: 12500000,
        color: '#E11D48',
        icon: 'CreditCard',
        isArchived: false,
        notes: 'حساب اصلی دریافت حقوق و خریدهای روزمره',
        createdAt: Date.now() - 30 * 86400000,
        updatedAt: Date.now(),
      },
      {
        id: 'acc_blubank',
        name: 'بلو بانک (سامان)',
        bankName: 'بلو بانک',
        bankCode: 'blubank',
        accountType: 'bank',
        accountNumber: '8874125632',
        shaba: 'IR890560000000008874125632',
        currency: 'TOMAN',
        initialBalance: 8200000,
        currentBalance: 8200000,
        color: '#06B6D4',
        icon: 'CreditCard',
        isArchived: false,
        notes: 'حساب اینترنتی و خریدهای آنلاین',
        createdAt: Date.now() - 25 * 86400000,
        updatedAt: Date.now(),
      },
      {
        id: 'acc_melli',
        name: 'پس‌انداز بانک ملی',
        bankName: 'بانک ملی ایران',
        bankCode: 'melli',
        accountType: 'bank',
        accountNumber: '0104589623001',
        currency: 'TOMAN',
        initialBalance: 35000000,
        currentBalance: 35000000,
        color: '#2563EB',
        icon: 'Building2',
        isArchived: false,
        notes: 'صندوق ذخیره اضطراری',
        createdAt: Date.now() - 60 * 86400000,
        updatedAt: Date.now(),
      },
      {
        id: 'acc_cash',
        name: 'کیف پول نقدی',
        bankName: 'نقدی',
        bankCode: 'cash',
        accountType: 'cash',
        currency: 'TOMAN',
        initialBalance: 1500000,
        currentBalance: 1500000,
        color: '#10B981',
        icon: 'Wallet',
        isArchived: false,
        notes: 'اسکناس و پول نقد همراه',
        createdAt: Date.now() - 30 * 86400000,
        updatedAt: Date.now(),
      },
    ];

    // 3. Bank Cards
    const defaultCards: BankCard[] = [
      {
        id: 'card_mellat_1234',
        accountId: 'acc_mellat',
        bankName: 'بانک ملت',
        bankCode: 'mellat',
        cardNumberMasked: '6104********1234',
        last4Digits: '1234',
        cardNickname: 'کارت حقوق ملت',
        color: '#E11D48',
        isActive: true,
        expireDate: '06/06',
        createdAt: Date.now() - 30 * 86400000,
        updatedAt: Date.now(),
      },
      {
        id: 'card_blubank_9876',
        accountId: 'acc_blubank',
        bankName: 'بلو بانک',
        bankCode: 'blubank',
        cardNumberMasked: '6219********9876',
        last4Digits: '9876',
        cardNickname: 'بلو کارت مشکی',
        color: '#06B6D4',
        isActive: true,
        expireDate: '09/07',
        createdAt: Date.now() - 25 * 86400000,
        updatedAt: Date.now(),
      },
      {
        id: 'card_melli_5678',
        accountId: 'acc_melli',
        bankName: 'بانک ملی ایران',
        bankCode: 'melli',
        cardNumberMasked: '6037********5678',
        last4Digits: '5678',
        cardNickname: 'ملی پس‌انداز',
        color: '#2563EB',
        isActive: true,
        createdAt: Date.now() - 60 * 86400000,
        updatedAt: Date.now(),
      },
    ];

    // 4. Counterparties
    const defaultCounterparties: Counterparty[] = [
      {
        id: 'cp_ali_rezaei',
        name: 'علی رضایی',
        type: 'person',
        phone: '09121234567',
        knownCardLast4Digits: ['5678'],
        totalSent: 3500000,
        totalReceived: 0,
        currentBalance: -500000, // بدهکارم بهش 500 هزار تومان
        notes: 'همکار پروژه و دوست صمیمی',
        createdAt: Date.now() - 20 * 86400000,
        updatedAt: Date.now(),
      },
      {
        id: 'cp_sara_mohammadi',
        name: 'سارا محمدی',
        type: 'person',
        phone: '09359876543',
        totalSent: 2000000,
        totalReceived: 0,
        currentBalance: 2000000, // طلبکارم ازش ۲ میلیون تومان
        notes: 'قرض داده شده بابت سفر',
        createdAt: Date.now() - 15 * 86400000,
        updatedAt: Date.now(),
      },
      {
        id: 'cp_snapp',
        name: 'اسنپ',
        type: 'merchant',
        totalSent: 780000,
        totalReceived: 0,
        currentBalance: 0,
        createdAt: Date.now() - 30 * 86400000,
        updatedAt: Date.now(),
      },
      {
        id: 'cp_digikala',
        name: 'دیجی‌کالا',
        type: 'merchant',
        totalSent: 1850000,
        totalReceived: 0,
        currentBalance: 0,
        createdAt: Date.now() - 30 * 86400000,
        updatedAt: Date.now(),
      },
      {
        id: 'cp_rayan_company',
        name: 'شرکت رایان پرداز',
        type: 'organization',
        totalSent: 0,
        totalReceived: 45000000,
        currentBalance: 0,
        notes: 'کارفرمای اصلی و حقوق',
        createdAt: Date.now() - 30 * 86400000,
        updatedAt: Date.now(),
      },
    ];

    // 5. Default Transactions
    const now = Date.now();
    const defaultTransactions: Transaction[] = [
      {
        id: 'tx_1',
        type: 'income',
        amount: 45000000,
        currency: 'TOMAN',
        timestamp: now - 3 * 86400000,
        jalaliDate: formatJalaliDate(now - 3 * 86400000),
        accountId: 'acc_mellat',
        cardId: 'card_mellat_1234',
        cardLast4: '1234',
        categoryId: 'cat_salary',
        counterpartyId: 'cp_rayan_company',
        counterpartyName: 'شرکت رایان پرداز',
        description: 'حقوق ماهانه مرداد شرکت رایان پرداز',
        balanceAfter: 57500000,
        source: 'sms',
        confidence: 0.98,
        isVerified: true,
        createdAt: now - 3 * 86400000,
        updatedAt: now - 3 * 86400000,
      },
      {
        id: 'tx_2',
        type: 'expense',
        amount: 485000,
        currency: 'TOMAN',
        timestamp: now - 2 * 86400000,
        jalaliDate: formatJalaliDate(now - 2 * 86400000),
        accountId: 'acc_mellat',
        cardId: 'card_mellat_1234',
        cardLast4: '1234',
        categoryId: 'cat_shopping',
        counterpartyId: 'cp_digikala',
        counterpartyName: 'دیجی‌کالا',
        merchantName: 'دیجی‌کالا',
        description: 'خرید تجهیزات الکترونیک و کابل',
        balanceAfter: 57015000,
        source: 'sms',
        confidence: 0.96,
        isVerified: true,
        createdAt: now - 2 * 86400000,
        updatedAt: now - 2 * 86400000,
      },
      {
        id: 'tx_3',
        type: 'transfer',
        amount: 5000000,
        currency: 'TOMAN',
        timestamp: now - 2 * 86400000 + 3600000,
        jalaliDate: formatJalaliDate(now - 2 * 86400000 + 3600000),
        accountId: 'acc_mellat',
        targetAccountId: 'acc_blubank',
        categoryId: 'cat_transfer',
        description: 'انتقال داخلی بین حساب ملت و بلو بانک',
        source: 'manual',
        confidence: 1.0,
        isVerified: true,
        createdAt: now - 2 * 86400000 + 3600000,
        updatedAt: now - 2 * 86400000 + 3600000,
      },
      {
        id: 'tx_4',
        type: 'expense',
        amount: 85000,
        currency: 'TOMAN',
        timestamp: now - 86400000,
        jalaliDate: formatJalaliDate(now - 86400000),
        accountId: 'acc_blubank',
        cardId: 'card_blubank_9876',
        cardLast4: '9876',
        categoryId: 'cat_transport',
        counterpartyId: 'cp_snapp',
        counterpartyName: 'اسنپ',
        merchantName: 'اسنپ تاکسی',
        description: 'سفر به سمت دفتر کار',
        balanceAfter: 13115000,
        source: 'sms',
        confidence: 0.95,
        isVerified: true,
        createdAt: now - 86400000,
        updatedAt: now - 86400000,
      },
      {
        id: 'tx_5',
        type: 'expense',
        amount: 3500000,
        currency: 'TOMAN',
        timestamp: now - 12 * 3600000,
        jalaliDate: formatJalaliDate(now - 12 * 3600000),
        accountId: 'acc_blubank',
        cardId: 'card_blubank_9876',
        cardLast4: '9876',
        categoryId: 'cat_food',
        counterpartyId: 'cp_ali_rezaei',
        counterpartyName: 'علی رضایی',
        description: 'کارت به کارت به علی رضایی بابت دونگ شام و کافه',
        balanceAfter: 9615000,
        source: 'sms',
        confidence: 0.94,
        isVerified: true,
        createdAt: now - 12 * 3600000,
        updatedAt: now - 12 * 3600000,
      },
      {
        id: 'tx_6',
        type: 'expense',
        amount: 920000,
        currency: 'TOMAN',
        timestamp: now - 4 * 3600000,
        jalaliDate: formatJalaliDate(now - 4 * 3600000),
        accountId: 'acc_mellat',
        cardId: 'card_mellat_1234',
        cardLast4: '1234',
        categoryId: 'cat_supermarket',
        merchantName: 'فروشگاه کوروش',
        description: 'خرید اقلام پروتئینی و شوینده',
        balanceAfter: 56095000,
        source: 'manual',
        confidence: 1.0,
        isVerified: true,
        createdAt: now - 4 * 3600000,
        updatedAt: now - 4 * 3600000,
      },
    ];

    // 6. Budgets
    const { year, month } = getCurrentJalaliYearMonth();
    const defaultBudgets: Budget[] = [
      {
        id: 'bg_food',
        categoryId: 'cat_food',
        amount: 6000000,
        period: 'monthly',
        year,
        month,
        alertThreshold: 0.8,
        spent: 3500000,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'bg_supermarket',
        categoryId: 'cat_supermarket',
        amount: 5000000,
        period: 'monthly',
        year,
        month,
        alertThreshold: 0.8,
        spent: 920000,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'bg_transport',
        categoryId: 'cat_transport',
        amount: 1500000,
        period: 'monthly',
        year,
        month,
        alertThreshold: 0.8,
        spent: 85000,
        createdAt: now,
        updatedAt: now,
      },
    ];

    // 7. Debts
    const defaultDebts: DebtRecord[] = [
      {
        id: 'debt_sara',
        counterpartyId: 'cp_sara_mohammadi',
        counterpartyName: 'سارا محمدی',
        type: 'give', // طلب من
        amount: 2000000,
        paidAmount: 0,
        isSettled: false,
        description: 'قرض بابت بلیت و هتل سفر شمال',
        createdAt: now - 15 * 86400000,
        updatedAt: now - 15 * 86400000,
      },
      {
        id: 'debt_ali',
        counterpartyId: 'cp_ali_rezaei',
        counterpartyName: 'علی رضایی',
        type: 'take', // بدهی من
        amount: 500000,
        paidAmount: 0,
        isSettled: false,
        description: 'باقیمانده حساب خرید کتاب',
        createdAt: now - 5 * 86400000,
        updatedAt: now - 5 * 86400000,
      },
    ];

    // 8. Recurring Transactions
    const defaultRecurring: RecurringTransaction[] = [
      {
        id: 'rec_salary',
        title: 'حقوق ماهانه رایان پرداز',
        type: 'income',
        amount: 45000000,
        accountId: 'acc_mellat',
        categoryId: 'cat_salary',
        frequency: 'monthly',
        dayOfMonth: 1,
        nextDueDate: now + 25 * 86400000,
        isActive: true,
        notes: 'واریز اول هر ماه شمسی',
        createdAt: now,
      },
      {
        id: 'rec_rent',
        title: 'اجاره بها منزل',
        type: 'expense',
        amount: 12000000,
        accountId: 'acc_mellat',
        categoryId: 'cat_housing',
        frequency: 'monthly',
        dayOfMonth: 5,
        nextDueDate: now + 5 * 86400000,
        isActive: true,
        notes: 'واریز به شماره کارت مالک',
        createdAt: now,
      },
    ];

    localStorage.setItem(this.getKey('CATEGORIES'), JSON.stringify(defaultCategories));
    localStorage.setItem(this.getKey('ACCOUNTS'), JSON.stringify([]));
    localStorage.setItem(this.getKey('CARDS'), JSON.stringify([]));
    localStorage.setItem(this.getKey('COUNTERPARTIES'), JSON.stringify([]));
    localStorage.setItem(this.getKey('TRANSACTIONS'), JSON.stringify([]));
    localStorage.setItem(this.getKey('BUDGETS'), JSON.stringify([]));
    localStorage.setItem(this.getKey('DEBTS'), JSON.stringify([]));
    localStorage.setItem(this.getKey('RECURRING'), JSON.stringify([]));
    localStorage.setItem(this.getKey('SYNC_QUEUE'), JSON.stringify([]));
    localStorage.setItem(this.getKey('PROCESSED_SMS_HASHES'), JSON.stringify([]));
    localStorage.setItem(this.getKey('INITIALIZED'), 'true');

    // Recalculate balances based on transactions
    this.recalculateAllAccountBalances();
  }

  /**
   * Seed realistic sample demo data for testing or preview purposes
   */
  public static seedDemoData(): void {
    const now = Date.now();
    const defaultAccounts: Account[] = [
      {
        id: 'acc_mellat',
        name: 'حساب جاری ملت',
        bankName: 'بانک ملت',
        bankCode: 'mellat',
        accountType: 'bank',
        accountNumber: '4859623145',
        shaba: 'IR120120000000004859623145',
        currency: 'TOMAN',
        initialBalance: 12500000,
        currentBalance: 12500000,
        color: '#E11D48',
        icon: 'CreditCard',
        isArchived: false,
        notes: 'حساب اصلی دریافت حقوق و خریدهای روزمره',
        createdAt: now - 30 * 86400000,
        updatedAt: now,
      },
      {
        id: 'acc_blubank',
        name: 'بلو بانک (سامان)',
        bankName: 'بلو بانک',
        bankCode: 'blubank',
        accountType: 'bank',
        accountNumber: '8874125632',
        shaba: 'IR890560000000008874125632',
        currency: 'TOMAN',
        initialBalance: 4200000,
        currentBalance: 4200000,
        color: '#2563EB',
        icon: 'CreditCard',
        isArchived: false,
        notes: 'کارت خریدهای آنلاین و پرداخت روزمره',
        createdAt: now - 20 * 86400000,
        updatedAt: now,
      },
      {
        id: 'acc_cash',
        name: 'کیف پول نقدی',
        bankName: 'وجه نقد',
        bankCode: 'mellat',
        accountType: 'cash',
        currency: 'TOMAN',
        initialBalance: 850000,
        currentBalance: 850000,
        color: '#10B981',
        icon: 'Wallet',
        isArchived: false,
        notes: 'تنخواه و اسکناس‌های همراه',
        createdAt: now - 10 * 86400000,
        updatedAt: now,
      },
    ];

    const defaultCards: BankCard[] = [
      {
        id: 'card_mellat_1',
        accountId: 'acc_mellat',
        bankName: 'بانک ملت',
        bankCode: 'mellat',
        cardNumberMasked: '610433******4892',
        last4Digits: '4892',
        cardNickname: 'کارت حقوق ملت',
        color: '#E11D48',
        isActive: true,
        expireDate: '06/08',
        createdAt: now - 30 * 86400000,
        updatedAt: now,
      },
      {
        id: 'card_blu_1',
        accountId: 'acc_blubank',
        bankName: 'بلو بانک',
        bankCode: 'blubank',
        cardNumberMasked: '621986******7714',
        last4Digits: '7714',
        cardNickname: 'بلو کارت مشکی',
        color: '#2563EB',
        isActive: true,
        expireDate: '09/07',
        createdAt: now - 20 * 86400000,
        updatedAt: now,
      },
    ];

    const defaultCounterparties: Counterparty[] = [
      { id: 'cp_digikala', name: 'دیجی‌کالا', type: 'merchant', totalSent: 3850000, totalReceived: 0, currentBalance: 0, createdAt: now, updatedAt: now },
      { id: 'cp_snapp', name: 'اسنپ / تپسی', type: 'merchant', totalSent: 720000, totalReceived: 0, currentBalance: 0, createdAt: now, updatedAt: now },
      { id: 'cp_okala', name: 'افق کوروش / اکالا', type: 'merchant', totalSent: 2900000, totalReceived: 0, currentBalance: 0, createdAt: now, updatedAt: now },
      { id: 'cp_company', name: 'شرکت داده‌پرداز پایا', type: 'organization', totalSent: 0, totalReceived: 64000000, currentBalance: 0, createdAt: now, updatedAt: now },
    ];

    const defaultTransactions: Transaction[] = [
      {
        id: 'tx_demo_1',
        accountId: 'acc_mellat',
        cardId: 'card_mellat_1',
        type: 'income',
        amount: 32000000,
        currency: 'TOMAN',
        balanceAfter: 35000000,
        categoryId: 'cat_salary',
        timestamp: now - 3 * 86400000,
        jalaliDate: '1404/06/01',
        description: 'واریز حقوق ماهانه شرکت داده‌پرداز',
        source: 'sms',
        confidence: 1.0,
        isVerified: true,
        createdAt: now - 3 * 86400000,
        updatedAt: now - 3 * 86400000,
      },
      {
        id: 'tx_demo_2',
        accountId: 'acc_blubank',
        cardId: 'card_blu_1',
        type: 'expense',
        amount: 850000,
        currency: 'TOMAN',
        balanceAfter: 3350000,
        categoryId: 'cat_supermarket',
        timestamp: now - 1 * 86400000,
        jalaliDate: '1404/06/03',
        description: 'خرید مواد غذایی سوپرمارکت',
        source: 'manual',
        confidence: 1.0,
        isVerified: true,
        createdAt: now - 1 * 86400000,
        updatedAt: now - 1 * 86400000,
      },
    ];

    localStorage.setItem(this.getKey('ACCOUNTS'), JSON.stringify(defaultAccounts));
    localStorage.setItem(this.getKey('CARDS'), JSON.stringify(defaultCards));
    localStorage.setItem(this.getKey('COUNTERPARTIES'), JSON.stringify(defaultCounterparties));
    localStorage.setItem(this.getKey('TRANSACTIONS'), JSON.stringify(defaultTransactions));
    this.recalculateAllAccountBalances();
    this.notifySubscribers();
  }

  /**
   * Export encrypted database dump for cloud snapshot sync
   */
  public static async exportDatabaseEncrypted(): Promise<string> {
    const rawDump = this.exportDatabaseDump();
    return await CryptoEngine.encryptPayload(rawDump);
  }

  /**
   * Import encrypted database dump from cloud
   */
  public static async importDatabaseEncrypted(encryptedDump: string): Promise<boolean> {
    try {
      const decrypted = await CryptoEngine.decryptPayload<string>(encryptedDump);
      this.importDatabaseDump(decrypted);
      return true;
    } catch (err) {
      console.error('Failed to import encrypted cloud dump:', err);
      return false;
    }
  }

  /**
   * Clear all financial data for current tenant (zero-state)
   */
  public static clearAllData(): void {
    localStorage.setItem(this.getKey('ACCOUNTS'), JSON.stringify([]));
    localStorage.setItem(this.getKey('CARDS'), JSON.stringify([]));
    localStorage.setItem(this.getKey('COUNTERPARTIES'), JSON.stringify([]));
    localStorage.setItem(this.getKey('TRANSACTIONS'), JSON.stringify([]));
    localStorage.setItem(this.getKey('BUDGETS'), JSON.stringify([]));
    localStorage.setItem(this.getKey('DEBTS'), JSON.stringify([]));
    localStorage.setItem(this.getKey('RECURRING'), JSON.stringify([]));
    localStorage.setItem(this.getKey('SYNC_QUEUE'), JSON.stringify([]));
    this.notifySubscribers();
  }

  // --- ACCOUNTS ---
  public static getAccounts(): Account[] {
    const raw = localStorage.getItem(this.getKey('ACCOUNTS'));
    return raw ? JSON.parse(raw) : [];
  }

  public static saveAccount(account: Account): void {
    const accounts = this.getAccounts();
    const idx = accounts.findIndex(a => a.id === account.id);
    if (idx >= 0) {
      accounts[idx] = { ...account, updatedAt: Date.now() };
    } else {
      accounts.push({ ...account, createdAt: Date.now(), updatedAt: Date.now() });
    }
    localStorage.setItem(this.getKey('ACCOUNTS'), JSON.stringify(accounts));
    this.queueSyncChange('accounts', idx >= 0 ? 'update' : 'create', account.id, account);
    this.notifySubscribers();
  }

  public static deleteAccount(id: string): void {
    let accounts = this.getAccounts();
    accounts = accounts.filter(a => a.id !== id);
    localStorage.setItem(this.getKey('ACCOUNTS'), JSON.stringify(accounts));
    this.queueSyncChange('accounts', 'delete', id, { id });
    this.notifySubscribers();
  }

  // --- CARDS ---
  public static getCards(): BankCard[] {
    const raw = localStorage.getItem(this.getKey('CARDS'));
    return raw ? JSON.parse(raw) : [];
  }

  public static saveCard(card: BankCard): void {
    const cards = this.getCards();
    const idx = cards.findIndex(c => c.id === card.id);
    if (idx >= 0) {
      cards[idx] = { ...card, updatedAt: Date.now() };
    } else {
      cards.push({ ...card, createdAt: Date.now(), updatedAt: Date.now() });
    }
    localStorage.setItem(this.getKey('CARDS'), JSON.stringify(cards));
    this.queueSyncChange('cards', idx >= 0 ? 'update' : 'create', card.id, card);
    this.notifySubscribers();
  }

  public static deleteCard(id: string): void {
    let cards = this.getCards();
    cards = cards.filter(c => c.id !== id);
    localStorage.setItem(this.getKey('CARDS'), JSON.stringify(cards));
    this.queueSyncChange('cards', 'delete', id, { id });
    this.notifySubscribers();
  }

  // --- TRANSACTIONS ---
  public static getTransactions(): Transaction[] {
    const raw = localStorage.getItem(this.getKey('TRANSACTIONS'));
    const txs: Transaction[] = raw ? JSON.parse(raw) : [];
    // Sort descending by timestamp
    return txs.sort((a, b) => b.timestamp - a.timestamp);
  }

  public static saveTransaction(tx: Transaction): void {
    const txs = this.getTransactions();
    const idx = txs.findIndex(t => t.id === tx.id);
    if (idx >= 0) {
      txs[idx] = { ...tx, updatedAt: Date.now() };
    } else {
      txs.push({ ...tx, createdAt: Date.now(), updatedAt: Date.now() });
    }
    localStorage.setItem(this.getKey('TRANSACTIONS'), JSON.stringify(txs));
    this.recalculateAllAccountBalances();
    this.queueSyncChange('transactions', idx >= 0 ? 'update' : 'create', tx.id, tx);
    this.notifySubscribers();
  }

  public static deleteTransaction(id: string): void {
    let txs = this.getTransactions();
    txs = txs.filter(t => t.id !== id);
    localStorage.setItem(this.getKey('TRANSACTIONS'), JSON.stringify(txs));
    this.recalculateAllAccountBalances();
    this.queueSyncChange('transactions', 'delete', id, { id });
    this.notifySubscribers();
  }

  // --- CATEGORIES ---
  public static getCategories(): Category[] {
    const raw = localStorage.getItem(this.getKey('CATEGORIES'));
    return raw ? JSON.parse(raw) : [];
  }

  public static saveCategory(category: Category): void {
    const categories = this.getCategories();
    const idx = categories.findIndex(c => c.id === category.id);
    if (idx >= 0) {
      categories[idx] = category;
    } else {
      categories.push(category);
    }
    localStorage.setItem(this.getKey('CATEGORIES'), JSON.stringify(categories));
    this.notifySubscribers();
  }

  // --- COUNTERPARTIES ---
  public static getCounterparties(): Counterparty[] {
    const raw = localStorage.getItem(this.getKey('COUNTERPARTIES'));
    return raw ? JSON.parse(raw) : [];
  }

  public static saveCounterparty(cp: Counterparty): void {
    const list = this.getCounterparties();
    const idx = list.findIndex(c => c.id === cp.id);
    if (idx >= 0) {
      list[idx] = { ...cp, updatedAt: Date.now() };
    } else {
      list.push({ ...cp, createdAt: Date.now(), updatedAt: Date.now() });
    }
    localStorage.setItem(this.getKey('COUNTERPARTIES'), JSON.stringify(list));
    this.notifySubscribers();
  }

  // --- BUDGETS ---
  public static getBudgets(): Budget[] {
    const raw = localStorage.getItem(this.getKey('BUDGETS'));
    const budgets: Budget[] = raw ? JSON.parse(raw) : [];
    // Update spent amounts dynamically
    const txs = this.getTransactions();
    const { year, month } = getCurrentJalaliYearMonth();
    
    return budgets.map(b => {
      const monthPrefix = `${year}/${String(month).padStart(2, '0')}`;
      const spent = txs
        .filter(t => t.categoryId === b.categoryId && t.type === 'expense' && t.jalaliDate.startsWith(monthPrefix))
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...b, spent };
    });
  }

  public static saveBudget(budget: Budget): void {
    const budgets = this.getBudgets();
    const idx = budgets.findIndex(b => b.id === budget.id);
    if (idx >= 0) {
      budgets[idx] = { ...budget, updatedAt: Date.now() };
    } else {
      budgets.push({ ...budget, createdAt: Date.now(), updatedAt: Date.now() });
    }
    localStorage.setItem(this.getKey('BUDGETS'), JSON.stringify(budgets));
    this.notifySubscribers();
  }

  public static deleteBudget(id: string): void {
    let budgets = this.getBudgets();
    budgets = budgets.filter(b => b.id !== id);
    localStorage.setItem(this.getKey('BUDGETS'), JSON.stringify(budgets));
    this.notifySubscribers();
  }

  // --- DEBTS ---
  public static getDebts(): DebtRecord[] {
    const raw = localStorage.getItem(this.getKey('DEBTS'));
    return raw ? JSON.parse(raw) : [];
  }

  public static saveDebt(debt: DebtRecord): void {
    const debts = this.getDebts();
    const idx = debts.findIndex(d => d.id === debt.id);
    if (idx >= 0) {
      debts[idx] = { ...debt, updatedAt: Date.now() };
    } else {
      debts.push({ ...debt, createdAt: Date.now(), updatedAt: Date.now() });
    }
    localStorage.setItem(this.getKey('DEBTS'), JSON.stringify(debts));
    this.notifySubscribers();
  }

  public static deleteDebt(id: string): void {
    let debts = this.getDebts();
    debts = debts.filter(d => d.id !== id);
    localStorage.setItem(this.getKey('DEBTS'), JSON.stringify(debts));
    this.notifySubscribers();
  }

  public static settleDebt(id: string): void {
    const debts = this.getDebts();
    const idx = debts.findIndex(d => d.id === id);
    if (idx >= 0) {
      debts[idx].isSettled = true;
      debts[idx].paidAmount = debts[idx].amount;
      debts[idx].updatedAt = Date.now();
      localStorage.setItem(this.getKey('DEBTS'), JSON.stringify(debts));
      this.notifySubscribers();
    }
  }

  // --- RECURRING ---
  public static getRecurring(): RecurringTransaction[] {
    const raw = localStorage.getItem(this.getKey('RECURRING'));
    return raw ? JSON.parse(raw) : [];
  }

  public static saveRecurring(rec: RecurringTransaction): void {
    const recs = this.getRecurring();
    const idx = recs.findIndex(r => r.id === rec.id);
    if (idx >= 0) {
      recs[idx] = rec;
    } else {
      recs.push(rec);
    }
    localStorage.setItem(this.getKey('RECURRING'), JSON.stringify(recs));
    this.notifySubscribers();
  }

  public static deleteRecurring(id: string): void {
    let recs = this.getRecurring();
    recs = recs.filter(r => r.id !== id);
    localStorage.setItem(this.getKey('RECURRING'), JSON.stringify(recs));
    this.notifySubscribers();
  }

  // --- DEDUPLICATION ---
  public static isDuplicateSmsHash(hash: string): boolean {
    return this.isSmsDuplicate(hash);
  }

  public static isSmsDuplicate(hash: string): boolean {
    const raw = localStorage.getItem(this.getKey('PROCESSED_SMS_HASHES'));
    const hashes: string[] = raw ? JSON.parse(raw) : [];
    return hashes.includes(hash);
  }

  public static markSmsProcessed(hash: string): void {
    const raw = localStorage.getItem(this.getKey('PROCESSED_SMS_HASHES'));
    const hashes: string[] = raw ? JSON.parse(raw) : [];
    if (!hashes.includes(hash)) {
      hashes.push(hash);
      localStorage.setItem(this.getKey('PROCESSED_SMS_HASHES'), JSON.stringify(hashes));
    }
  }

  // --- BALANCE RECALCULATION ENGINE ---
  public static recalculateAllAccountBalances(): void {
    const accounts = this.getAccounts();
    const txs = this.getTransactions();

    const balanceMap: Record<string, number> = {};
    accounts.forEach(a => {
      balanceMap[a.id] = a.initialBalance;
    });

    // Traverse transactions chronologically
    const chronologicalTxs = [...txs].sort((a, b) => a.timestamp - b.timestamp);

    for (const tx of chronologicalTxs) {
      if (!balanceMap[tx.accountId]) balanceMap[tx.accountId] = 0;

      switch (tx.type) {
        case 'income':
        case 'deposit':
        case 'refund':
          balanceMap[tx.accountId] += tx.amount;
          break;
        case 'expense':
        case 'withdrawal':
        case 'fee':
        case 'investment':
          balanceMap[tx.accountId] -= tx.amount;
          break;
        case 'transfer':
          // Decrement source
          balanceMap[tx.accountId] -= tx.amount;
          // Increment destination
          if (tx.targetAccountId) {
            if (!balanceMap[tx.targetAccountId]) balanceMap[tx.targetAccountId] = 0;
            balanceMap[tx.targetAccountId] += tx.amount;
          }
          break;
        case 'adjustment':
          balanceMap[tx.accountId] = tx.amount;
          break;
      }
    }

    const updatedAccounts = accounts.map(a => ({
      ...a,
      currentBalance: balanceMap[a.id] !== undefined ? balanceMap[a.id] : a.initialBalance,
      updatedAt: Date.now(),
    }));

    localStorage.setItem(this.getKey('ACCOUNTS'), JSON.stringify(updatedAccounts));
  }

  // --- DELTA SYNC QUEUE ---
  private static async queueSyncChange(
    table: SyncChange['table'],
    action: SyncChange['action'],
    recordId: string,
    payload: unknown
  ): Promise<void> {
    try {
      const encryptedPayload = await CryptoEngine.encryptPayload(payload);
      const raw = localStorage.getItem(this.getKey('SYNC_QUEUE'));
      const queue: SyncChange[] = raw ? JSON.parse(raw) : [];

      const change: SyncChange = {
        id: 'chg_' + Math.random().toString(36).substring(2, 9),
        table,
        action,
        recordId,
        encryptedPayload,
        timestamp: Date.now(),
        version: 1,
        deviceId: CryptoEngine.getDeviceId(),
      };

      queue.push(change);
      localStorage.setItem(this.getKey('SYNC_QUEUE'), JSON.stringify(queue));
    } catch {
      // Quiet fail in local sandbox
    }
  }

  public static getSyncQueue(): SyncChange[] {
    const raw = localStorage.getItem(this.getKey('SYNC_QUEUE'));
    return raw ? JSON.parse(raw) : [];
  }

  public static clearSyncQueue(): void {
    localStorage.setItem(this.getKey('SYNC_QUEUE'), JSON.stringify([]));
    this.notifySubscribers();
  }

  // --- FINANCIAL INSIGHTS CALCULATION ---
  public static getFinancialInsights(): FinancialInsights {
    return this.calculateInsights();
  }

  public static calculateInsights(): FinancialInsights {
    const txs = this.getTransactions();
    const { year, month } = getCurrentJalaliYearMonth();
    const currentMonthPrefix = `${year}/${String(month).padStart(2, '0')}`;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonthPrefix = `${prevYear}/${String(prevMonth).padStart(2, '0')}`;

    let monthlyIncome = 0;
    let monthlyExpense = 0;
    let prevMonthlyExpense = 0;
    const categoryExpenseMap: Record<string, number> = {};
    const cpMap: Record<string, { name: string; amount: number; count: number }> = {};

    for (const t of txs) {
      if (t.jalaliDate.startsWith(currentMonthPrefix)) {
        if (t.type === 'income') {
          monthlyIncome += t.amount;
        } else if (t.type === 'expense' || t.type === 'fee' || t.type === 'withdrawal') {
          monthlyExpense += t.amount;
          if (t.categoryId) {
            categoryExpenseMap[t.categoryId] = (categoryExpenseMap[t.categoryId] || 0) + t.amount;
          }
          if (t.counterpartyName) {
            if (!cpMap[t.counterpartyName]) {
              cpMap[t.counterpartyName] = { name: t.counterpartyName, amount: 0, count: 0 };
            }
            cpMap[t.counterpartyName].amount += t.amount;
            cpMap[t.counterpartyName].count += 1;
          }
        }
      } else if (t.jalaliDate.startsWith(prevMonthPrefix)) {
        if (t.type === 'expense' || t.type === 'fee' || t.type === 'withdrawal') {
          prevMonthlyExpense += t.amount;
        }
      }
    }

    const netCashFlow = monthlyIncome - monthlyExpense;
    const savingsRate = monthlyIncome > 0 ? Math.max(0, Math.round((netCashFlow / monthlyIncome) * 100)) : 0;

    // Top Category
    const categories = this.getCategories();
    let topCat: FinancialInsights['topExpenseCategory'] = undefined;
    let maxCatAmount = 0;
    for (const [catId, amount] of Object.entries(categoryExpenseMap)) {
      if (amount > maxCatAmount) {
        maxCatAmount = amount;
        const cat = categories.find(c => c.id === catId);
        topCat = {
          name: cat ? cat.name : 'متفرقه',
          amount,
          percentage: monthlyExpense > 0 ? Math.round((amount / monthlyExpense) * 100) : 0,
          color: cat ? cat.color : '#94A3B8',
        };
      }
    }

    // Comparison
    let comparisonWithLastMonth = 0;
    if (prevMonthlyExpense > 0) {
      comparisonWithLastMonth = Math.round(((monthlyExpense - prevMonthlyExpense) / prevMonthlyExpense) * 100);
    }

    // Top Counterparty
    let mostFrequentCounterparty: FinancialInsights['mostFrequentCounterparty'] = undefined;
    let maxCpCount = 0;
    for (const cp of Object.values(cpMap)) {
      if (cp.count > maxCpCount) {
        maxCpCount = cp.count;
        mostFrequentCounterparty = cp;
      }
    }

    // Budgets at risk
    const budgets = this.getBudgets();
    const activeBudgetsAtRiskCount = budgets.filter(b => b.amount > 0 && b.spent / b.amount >= b.alertThreshold).length;

    // Debts
    const debts = this.getDebts();
    const totalReceivableDebt = debts.filter(d => d.type === 'give' && !d.isSettled).reduce((s, d) => s + (d.amount - d.paidAmount), 0);
    const totalPayableDebt = debts.filter(d => d.type === 'take' && !d.isSettled).reduce((s, d) => s + (d.amount - d.paidAmount), 0);

    return {
      monthlyIncome,
      monthlyExpense,
      netCashFlow,
      savingsRate,
      topExpenseCategory: topCat,
      comparisonWithLastMonth,
      mostFrequentCounterparty,
      activeBudgetsAtRiskCount,
      totalReceivableDebt,
      totalPayableDebt,
    };
  }

  // --- SEARCH ENGINE ---
  public static searchTransactions(query: {
    text?: string;
    type?: TransactionType;
    categoryId?: string;
    accountId?: string;
    counterpartyId?: string;
    minAmount?: number;
    maxAmount?: number;
    startDateJalali?: string; // e.g. "1404/05/01"
    endDateJalali?: string;   // e.g. "1404/06/31"
  }): Transaction[] {
    let txs = this.getTransactions();

    if (query.type) {
      txs = txs.filter(t => t.type === query.type);
    }
    if (query.categoryId) {
      txs = txs.filter(t => t.categoryId === query.categoryId);
    }
    if (query.accountId) {
      txs = txs.filter(t => t.accountId === query.accountId || t.targetAccountId === query.accountId);
    }
    if (query.counterpartyId) {
      txs = txs.filter(t => t.counterpartyId === query.counterpartyId);
    }
    if (query.minAmount !== undefined && query.minAmount > 0) {
      txs = txs.filter(t => t.amount >= query.minAmount!);
    }
    if (query.maxAmount !== undefined && query.maxAmount > 0) {
      txs = txs.filter(t => t.amount <= query.maxAmount!);
    }
    if (query.startDateJalali) {
      txs = txs.filter(t => t.jalaliDate >= query.startDateJalali!);
    }
    if (query.endDateJalali) {
      txs = txs.filter(t => t.jalaliDate <= query.endDateJalali!);
    }

    if (query.text && query.text.trim()) {
      const q = query.text.trim().toLowerCase();
      txs = txs.filter(t => {
        const descMatch = t.description && t.description.toLowerCase().includes(q);
        const cpMatch = t.counterpartyName && t.counterpartyName.toLowerCase().includes(q);
        const merchMatch = t.merchantName && t.merchantName.toLowerCase().includes(q);
        const cardMatch = t.cardLast4 && t.cardLast4.includes(q);
        const dateMatch = t.jalaliDate && t.jalaliDate.includes(q);
        return descMatch || cpMatch || merchMatch || cardMatch || dateMatch;
      });
    }

    return txs;
  }

  // --- EXPORT & BACKUP (Zero-Knowledge) ---
  public static async exportEncryptedBackup(passphrase?: string): Promise<string> {
    const data = {
      version: 1,
      exportedAt: Date.now(),
      accounts: this.getAccounts(),
      cards: this.getCards(),
      transactions: this.getTransactions(),
      categories: this.getCategories(),
      counterparties: this.getCounterparties(),
      budgets: this.getBudgets(),
      debts: this.getDebts(),
      recurring: this.getRecurring(),
    };

    return await CryptoEngine.encryptPayload(data);
  }

  public static async importEncryptedBackup(encryptedPayload: string): Promise<boolean> {
    try {
      const data = await CryptoEngine.decryptPayload<Record<string, unknown>>(encryptedPayload);
      if (!data || !data.transactions) return false;

      if (data.accounts) localStorage.setItem(this.getKey('ACCOUNTS'), JSON.stringify(data.accounts));
      if (data.cards) localStorage.setItem(this.getKey('CARDS'), JSON.stringify(data.cards));
      if (data.transactions) localStorage.setItem(this.getKey('TRANSACTIONS'), JSON.stringify(data.transactions));
      if (data.categories) localStorage.setItem(this.getKey('CATEGORIES'), JSON.stringify(data.categories));
      if (data.counterparties) localStorage.setItem(this.getKey('COUNTERPARTIES'), JSON.stringify(data.counterparties));
      if (data.budgets) localStorage.setItem(this.getKey('BUDGETS'), JSON.stringify(data.budgets));
      if (data.debts) localStorage.setItem(this.getKey('DEBTS'), JSON.stringify(data.debts));
      if (data.recurring) localStorage.setItem(this.getKey('RECURRING'), JSON.stringify(data.recurring));

      this.recalculateAllAccountBalances();
      this.notifySubscribers();
      return true;
    } catch {
      return false;
    }
  }

  public static exportCsv(): string {
    const txs = this.getTransactions();
    const categories = this.getCategories();
    const accounts = this.getAccounts();

    const headers = ['شناسه', 'نوع', 'مبلغ (تومان)', 'تاریخ شمسی', 'حساب', 'کارت', 'دسته‌بندی', 'طرف معامله / پذیرنده', 'توضیحات'];
    const rows = txs.map(t => {
      const cat = categories.find(c => c.id === t.categoryId)?.name || '-';
      const acc = accounts.find(a => a.id === t.accountId)?.name || '-';
      return [
        t.id,
        t.type,
        t.amount,
        t.jalaliDate,
        `"${acc}"`,
        t.cardLast4 || '-',
        `"${cat}"`,
        `"${t.counterpartyName || t.merchantName || '-'}"`,
        `"${t.description || '-'}"`,
      ].join(',');
    });

    return '\uFEFF' + [headers.join(','), ...rows].join('\n');
  }

  public static exportDatabaseDump(): string {
    const data = {
      version: 1,
      exportedAt: Date.now(),
      accounts: this.getAccounts(),
      cards: this.getCards(),
      transactions: this.getTransactions(),
      categories: this.getCategories(),
      counterparties: this.getCounterparties(),
      budgets: this.getBudgets(),
      debts: this.getDebts(),
      recurring: this.getRecurring(),
    };
    return JSON.stringify(data, null, 2);
  }

  public static importDatabaseDump(json: string): void {
    const data = JSON.parse(json);
    if (data.accounts) localStorage.setItem(this.getKey('ACCOUNTS'), JSON.stringify(data.accounts));
    if (data.cards) localStorage.setItem(this.getKey('CARDS'), JSON.stringify(data.cards));
    if (data.transactions) localStorage.setItem(this.getKey('TRANSACTIONS'), JSON.stringify(data.transactions));
    if (data.categories) localStorage.setItem(this.getKey('CATEGORIES'), JSON.stringify(data.categories));
    if (data.counterparties) localStorage.setItem(this.getKey('COUNTERPARTIES'), JSON.stringify(data.counterparties));
    if (data.budgets) localStorage.setItem(this.getKey('BUDGETS'), JSON.stringify(data.budgets));
    if (data.debts) localStorage.setItem(this.getKey('DEBTS'), JSON.stringify(data.debts));
    if (data.recurring) localStorage.setItem(this.getKey('RECURRING'), JSON.stringify(data.recurring));

    this.recalculateAllAccountBalances();
    this.notifySubscribers();
  }

  public static resetToDefaults(): void {
    this.resetToDefault();
  }

  public static resetToDefault(): void {
    localStorage.removeItem(this.getKey('INITIALIZED'));
    this.initDatabase();
    this.notifySubscribers();
  }
}
