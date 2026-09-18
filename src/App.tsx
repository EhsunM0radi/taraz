/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTabId } from './components/Sidebar';
import { DashboardView } from './components/views/DashboardView';
import { TransactionsView } from './components/views/TransactionsView';
import { AccountsAndCardsView } from './components/views/AccountsAndCardsView';
import { SmsParserLabView } from './components/views/SmsParserLabView';
import { ReportsView } from './components/views/ReportsView';
import { BudgetsView } from './components/views/BudgetsView';
import { DebtsView } from './components/views/DebtsView';
import { RecurringView } from './components/views/RecurringView';
import { ProfileView } from './components/views/ProfileView';
import { ArchitectureDocView } from './components/views/ArchitectureDocView';
import { AuthView } from './components/views/AuthView';
import { OnboardingModal } from './components/views/OnboardingModal';

// Dedicated Standalone Form Pages (Mobile-first, No Modals, No App Layout)
import { TransactionFormView } from './components/views/forms/TransactionFormView';
import { InternalTransferView } from './components/views/forms/InternalTransferView';
import { AccountFormView } from './components/views/forms/AccountFormView';
import { CardFormView } from './components/views/forms/CardFormView';
import { BudgetFormView } from './components/views/forms/BudgetFormView';
import { DebtFormView } from './components/views/forms/DebtFormView';
import { RecurringFormView } from './components/views/forms/RecurringFormView';

import { LocalDatabaseService } from './services/localDatabase';
import { AuthService, UserProfile } from './services/authService';
import { SyncManager } from './services/syncManager';
import { MobileNativeSmsBridge } from './services/mobileNativeSmsBridge';
import { startAppTour } from './utils/tour';
import { ParsedSmsResult } from './parser/smsParserEngine';
import {
  Account,
  BankCard,
  Transaction,
  Category,
  Budget,
  DebtRecord,
  RecurringTransaction,
  Currency,
  FinancialInsights,
} from './types';
import {
  LayoutDashboard,
  ReceiptText,
  CreditCard,
  MessageSquareCode,
  PieChart,
  User,
} from 'lucide-react';

type PageView =
  | { type: 'tab'; tabId: NavTabId }
  | { type: 'form_transaction'; txToEdit?: Transaction | null; returnTab: NavTabId }
  | { type: 'form_transfer'; returnTab: NavTabId }
  | { type: 'form_account'; accountToEdit?: Account | null; returnTab: NavTabId }
  | { type: 'form_card'; cardToEdit?: BankCard | null; returnTab: NavTabId }
  | { type: 'form_budget'; budgetToEdit?: Budget | null; returnTab: NavTabId }
  | { type: 'form_debt'; debtToEdit?: DebtRecord | null; returnTab: NavTabId }
  | { type: 'form_recurring'; returnTab: NavTabId };

export default function App() {
  // Authentication & Onboarding State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => AuthService.getUser());
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Navigation & Settings
  const [activeTab, setActiveTab] = useState<NavTabId>('dashboard');
  const [pageView, setPageView] = useState<PageView>({ type: 'tab', tabId: 'dashboard' });
  const [currency, setCurrency] = useState<Currency>('TOMAN');
  const [isOledTheme, setIsOledTheme] = useState<boolean>(() => {
    try {
      return localStorage.getItem('taraz_oled_theme') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleOledTheme = useCallback(() => {
    setIsOledTheme((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('taraz_oled_theme', String(next));
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    if (isOledTheme) {
      document.documentElement.classList.add('oled-mode');
      document.body.classList.add('oled-mode');
    } else {
      document.documentElement.classList.remove('oled-mode');
      document.body.classList.remove('oled-mode');
    }
  }, [isOledTheme]);

  // Core Data State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<BankCard[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [recurringList, setRecurringList] = useState<RecurringTransaction[]>([]);
  const [insights, setInsights] = useState<FinancialInsights>({
    monthlyIncome: 0,
    monthlyExpense: 0,
    netCashFlow: 0,
    savingsRate: 0,
    comparisonWithLastMonth: 0,
  });
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Reload all data from local database
  const refreshData = useCallback(() => {
    const accs = LocalDatabaseService.getAccounts();
    const crds = LocalDatabaseService.getCards();
    const txs = LocalDatabaseService.getTransactions();
    const cats = LocalDatabaseService.getCategories();
    const bdgs = LocalDatabaseService.getBudgets();
    const dbts = LocalDatabaseService.getDebts();
    const recs = LocalDatabaseService.getRecurring();
    const ins = LocalDatabaseService.getFinancialInsights();
    const syncQ = LocalDatabaseService.getSyncQueue();

    setAccounts(accs);
    setCards(crds);
    setTransactions(txs);
    setCategories(cats);
    setBudgets(bdgs);
    setDebts(dbts);
    setRecurringList(recs);
    setInsights(ins);
    setPendingSyncCount(syncQ.length);
  }, []);

  useEffect(() => {
    const initialUser = AuthService.getUser();
    if (initialUser) {
      LocalDatabaseService.setTenantId(initialUser.tenantId || initialUser.phoneNumber);
    }
    SyncManager.init();
    MobileNativeSmsBridge.init();
    MobileNativeSmsBridge.subscribe(() => {
      refreshData();
    });
    refreshData();
  }, [refreshData]);

  // Auth Handlers
  const handleLoginSuccess = (phoneNumber: string, name?: string) => {
    const user = AuthService.login(phoneNumber, name);
    LocalDatabaseService.setTenantId(user.tenantId);
    setCurrentUser(user);
    refreshData();

    const isFirstTime = !AuthService.hasCompletedOnboarding(user.tenantId);
    if (isFirstTime) {
      setShowOnboarding(true);
      AuthService.setOnboardingCompleted(user.tenantId);
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
  };

  const handleUpdateName = (name: string) => {
    const updated = AuthService.updateName(name);
    if (updated) setCurrentUser(updated);
  };

  // Tab switcher
  const handleSelectTab = (tab: NavTabId) => {
    setActiveTab(tab);
    setPageView({ type: 'tab', tabId: tab });
  };

  // Currency Toggle Handler
  const handleToggleCurrency = () => {
    setCurrency((prev) => (prev === 'TOMAN' ? 'IRR' : 'TOMAN'));
  };

  // Transaction Handlers
  const handleSaveTransaction = (tx: Transaction) => {
    LocalDatabaseService.saveTransaction(tx);
    refreshData();
  };

  const handleDeleteTransaction = (id: string) => {
    LocalDatabaseService.deleteTransaction(id);
    refreshData();
  };

  // Account Handlers
  const handleSaveAccount = (acc: Account) => {
    LocalDatabaseService.saveAccount(acc);
    refreshData();
  };

  const handleDeleteAccount = (id: string) => {
    LocalDatabaseService.deleteAccount(id);
    refreshData();
  };

  // Card Handlers
  const handleSaveCard = (card: BankCard) => {
    LocalDatabaseService.saveCard(card);
    refreshData();
  };

  const handleDeleteCard = (id: string) => {
    LocalDatabaseService.deleteCard(id);
    refreshData();
  };

  // Budget Handlers
  const handleSaveBudget = (b: Budget) => {
    LocalDatabaseService.saveBudget(b);
    refreshData();
  };

  const handleDeleteBudget = (id: string) => {
    LocalDatabaseService.deleteBudget(id);
    refreshData();
  };

  // Debt Handlers
  const handleSaveDebt = (d: DebtRecord) => {
    LocalDatabaseService.saveDebt(d);
    refreshData();
  };

  const handleDeleteDebt = (id: string) => {
    LocalDatabaseService.deleteDebt(id);
    refreshData();
  };

  const handleSettleDebt = (id: string) => {
    LocalDatabaseService.settleDebt(id);
    refreshData();
  };

  // Recurring Handlers
  const handleSaveRecurring = (r: RecurringTransaction) => {
    LocalDatabaseService.saveRecurring(r);
    refreshData();
  };

  const handleDeleteRecurring = (id: string) => {
    LocalDatabaseService.deleteRecurring(id);
    refreshData();
  };

  // SMS Parser Lab Commit
  const handleCommitParsedSms = (result: ParsedSmsResult, rawSms: string): { success: boolean; message: string } => {
    if (result.amount <= 0) {
      return { success: false, message: 'مبلغ تراکنش قابل تشخیص نبود.' };
    }

    if (result.dedupHash && LocalDatabaseService.isDuplicateSmsHash(result.dedupHash)) {
      return {
        success: false,
        message: 'این پیامک قبلاً به عنوان تراکنش در سیستم ثبت شده است (جلوگیری از ثبت تکراری).',
      };
    }

    let matchedAccount = accounts.find((a) => a.bankCode === result.bankCode);
    if (!matchedAccount) {
      matchedAccount = accounts[0];
    }

    let matchedCard: BankCard | undefined;
    if (result.cardLast4) {
      matchedCard = cards.find((c) => c.last4Digits === result.cardLast4);
    }

    let matchedCategory = categories.find((c) =>
      result.type === 'income' ? c.type === 'income' : c.type === 'expense'
    );

    const tx: Transaction = {
      id: 'tx_sms_' + Math.random().toString(36).substring(2, 9),
      type: result.type,
      amount: result.amount,
      currency: 'TOMAN',
      timestamp: Date.now(),
      jalaliDate: result.jalaliDate || '1404/06/04',
      accountId: matchedAccount ? matchedAccount.id : accounts[0]?.id ?? 'acc_1',
      cardId: matchedCard ? matchedCard.id : undefined,
      cardLast4: result.cardLast4,
      categoryId: matchedCategory ? matchedCategory.id : undefined,
      merchantName: result.merchantName,
      counterpartyName: result.counterpartyName,
      balanceAfter: result.balanceAfter,
      description: result.merchantName ? `خرید از ${result.merchantName}` : `تراکنش پیامکی بانک ${result.bankName || ''}`,
      source: 'sms',
      confidence: result.confidence,
      isVerified: true,
      dedupHash: result.dedupHash,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    LocalDatabaseService.saveTransaction(tx);
    refreshData();

    return {
      success: true,
      message: `تراکنش با موفقیت به مبلغ ${tx.amount.toLocaleString('fa-IR')} تومان ثبت شد.`,
    };
  };

  const budgetsAtRisk = budgets.filter((b) => b.spent >= b.amount * b.alertThreshold).length;

  // -------------------------------------------------------------
  // AUTHENTICATION GATE (If not logged in, show Auth / OTP Screen)
  // -------------------------------------------------------------
  if (!currentUser) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  // -------------------------------------------------------------
  // STANDALONE PAGES (No default app layout, no header, no bottom bar)
  // -------------------------------------------------------------
  if (pageView.type !== 'tab') {
    return (
      <div className={`min-h-screen ${isOledTheme ? 'bg-black oled-mode' : 'bg-slate-950'} text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200`}>
        {pageView.type === 'form_transaction' && (
          <TransactionFormView
            transactionToEdit={pageView.txToEdit}
            accounts={accounts}
            cards={cards}
            categories={categories}
            counterparties={LocalDatabaseService.getCounterparties()}
            currency={currency}
            onSave={handleSaveTransaction}
            onBack={() => handleSelectTab(pageView.returnTab)}
          />
        )}

        {pageView.type === 'form_transfer' && (
          <InternalTransferView
            accounts={accounts}
            currency={currency}
            onSave={handleSaveTransaction}
            onBack={() => handleSelectTab(pageView.returnTab)}
          />
        )}

        {pageView.type === 'form_account' && (
          <AccountFormView
            accountToEdit={pageView.accountToEdit}
            currency={currency}
            onSave={handleSaveAccount}
            onBack={() => handleSelectTab(pageView.returnTab)}
          />
        )}

        {pageView.type === 'form_card' && (
          <CardFormView
            cardToEdit={pageView.cardToEdit}
            accounts={accounts}
            onSave={handleSaveCard}
            onBack={() => handleSelectTab(pageView.returnTab)}
          />
        )}

        {pageView.type === 'form_budget' && (
          <BudgetFormView
            budgetToEdit={pageView.budgetToEdit}
            categories={categories}
            currency={currency}
            onSave={handleSaveBudget}
            onBack={() => handleSelectTab(pageView.returnTab)}
          />
        )}

        {pageView.type === 'form_debt' && (
          <DebtFormView
            debtToEdit={pageView.debtToEdit}
            counterparties={LocalDatabaseService.getCounterparties()}
            currency={currency}
            onSave={handleSaveDebt}
            onBack={() => handleSelectTab(pageView.returnTab)}
          />
        )}

        {pageView.type === 'form_recurring' && (
          <RecurringFormView
            categories={categories}
            accounts={accounts}
            currency={currency}
            onSave={handleSaveRecurring}
            onBack={() => handleSelectTab(pageView.returnTab)}
          />
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN APP TABS LAYOUT (Header, Sidebar, Content Area, Bottom Nav)
  // -------------------------------------------------------------
  return (
    <div className={`min-h-screen ${isOledTheme ? 'bg-black oled-mode' : 'bg-slate-950'} text-slate-100 font-sans flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200`}>
      {/* Top Header */}
      <Header
        currency={currency}
        onToggleCurrency={handleToggleCurrency}
        onOpenNewTransaction={() => {
          setPageView({ type: 'form_transaction', txToEdit: null, returnTab: activeTab });
        }}
        onOpenTransfer={() => {
          setPageView({ type: 'form_transfer', returnTab: activeTab });
        }}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex shrink-0">
          <Sidebar
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            budgetsAtRiskCount={budgetsAtRisk}
          />
        </div>

        {/* View Content Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <DashboardView
              accounts={accounts}
              cards={cards}
              transactions={transactions}
              categories={categories}
              budgets={budgets}
              debts={debts}
              recurring={recurringList}
              insights={insights}
              currency={currency}
              onNavigate={handleSelectTab}
              onOpenNewTransaction={() => {
                setPageView({ type: 'form_transaction', txToEdit: null, returnTab: 'dashboard' });
              }}
              onOpenTransfer={() => {
                setPageView({ type: 'form_transfer', returnTab: 'dashboard' });
              }}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              transactions={transactions}
              accounts={accounts}
              cards={cards}
              categories={categories}
              counterparties={LocalDatabaseService.getCounterparties()}
              currency={currency}
              onOpenNewTransaction={() => {
                setPageView({ type: 'form_transaction', txToEdit: null, returnTab: 'transactions' });
              }}
              onEditTransaction={(tx) => {
                setPageView({ type: 'form_transaction', txToEdit: tx, returnTab: 'transactions' });
              }}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountsAndCardsView
              accounts={accounts}
              cards={cards}
              currency={currency}
              onOpenNewAccount={() => {
                setPageView({ type: 'form_account', accountToEdit: null, returnTab: 'accounts' });
              }}
              onOpenNewCard={() => {
                setPageView({ type: 'form_card', cardToEdit: null, returnTab: 'accounts' });
              }}
              onOpenTransfer={() => {
                setPageView({ type: 'form_transfer', returnTab: 'accounts' });
              }}
              onEditAccount={(acc) => {
                setPageView({ type: 'form_account', accountToEdit: acc, returnTab: 'accounts' });
              }}
              onDeleteAccount={handleDeleteAccount}
              onEditCard={(c) => {
                setPageView({ type: 'form_card', cardToEdit: c, returnTab: 'accounts' });
              }}
              onDeleteCard={handleDeleteCard}
            />
          )}

          {activeTab === 'sms_lab' && (
            <SmsParserLabView
              accounts={accounts}
              cards={cards}
              currency={currency}
              onCommitParsedSms={handleCommitParsedSms}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              transactions={transactions}
              accounts={accounts}
              categories={categories}
              counterparties={LocalDatabaseService.getCounterparties()}
              currency={currency}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsView
              budgets={budgets}
              categories={categories}
              currency={currency}
              onOpenNewBudget={() => {
                setPageView({ type: 'form_budget', budgetToEdit: null, returnTab: 'budgets' });
              }}
              onEditBudget={(b) => {
                setPageView({ type: 'form_budget', budgetToEdit: b, returnTab: 'budgets' });
              }}
              onDeleteBudget={handleDeleteBudget}
              onBack={() => handleSelectTab('dashboard')}
            />
          )}

          {activeTab === 'debts' && (
            <DebtsView
              debts={debts}
              counterparties={LocalDatabaseService.getCounterparties()}
              currency={currency}
              onOpenNewDebt={() => {
                setPageView({ type: 'form_debt', debtToEdit: null, returnTab: 'debts' });
              }}
              onEditDebt={(d) => {
                setPageView({ type: 'form_debt', debtToEdit: d, returnTab: 'debts' });
              }}
              onDeleteDebt={handleDeleteDebt}
              onSettleDebt={handleSettleDebt}
              onBack={() => handleSelectTab('dashboard')}
            />
          )}

          {activeTab === 'recurring' && (
            <RecurringView
              recurringList={recurringList}
              categories={categories}
              accounts={accounts}
              currency={currency}
              onOpenNewRecurring={() => {
                setPageView({ type: 'form_recurring', returnTab: 'recurring' });
              }}
              onDeleteRecurring={handleDeleteRecurring}
              onBack={() => handleSelectTab('dashboard')}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              user={currentUser}
              currency={currency}
              isOledTheme={isOledTheme}
              onToggleOledTheme={handleToggleOledTheme}
              onToggleCurrency={handleToggleCurrency}
              onStartTour={() => {
                handleSelectTab('dashboard');
                setTimeout(() => startAppTour((tab) => handleSelectTab(tab)), 150);
              }}
              onOpenOnboarding={() => setShowOnboarding(true)}
              onLogout={handleLogout}
              onUpdateName={handleUpdateName}
              onDataRefresh={refreshData}
            />
          )}

          {activeTab === 'architecture' && (
            <ArchitectureDocView onBack={() => handleSelectTab('dashboard')} />
          )}
        </main>
      </div>

      {/* Onboarding Presentation Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          handleSelectTab('dashboard');
          setTimeout(() => startAppTour((tab) => handleSelectTab(tab)), 300);
        }}
        onStartTour={() => {
          setShowOnboarding(false);
          handleSelectTab('dashboard');
          setTimeout(() => startAppTour((tab) => handleSelectTab(tab)), 300);
        }}
      />

      {/* Mobile Bottom Navigation Bar */}
      <div id="mobile_bottom_nav" className="md:hidden sticky bottom-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-2 flex items-center justify-around">
        {[
          { id: 'dashboard' as NavTabId, label: 'داشبورد', icon: LayoutDashboard },
          { id: 'transactions' as NavTabId, label: 'تراکنش‌ها', icon: ReceiptText },
          { id: 'accounts' as NavTabId, label: 'کارت‌ها', icon: CreditCard },
          { id: 'reports' as NavTabId, label: 'گزارش‌ها', icon: PieChart },
          { id: 'profile' as NavTabId, label: 'پروفایل', icon: User },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile_nav_${item.id}`}
              type="button"
              onClick={() => handleSelectTab(item.id)}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
