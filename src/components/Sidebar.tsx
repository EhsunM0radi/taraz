import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  CreditCard,
  PieChart,
  Target,
  Users,
  CalendarSync,
  User,
  Code2
} from 'lucide-react';

export type NavTabId =
  | 'dashboard'
  | 'transactions'
  | 'accounts'
  | 'reports'
  | 'budgets'
  | 'debts'
  | 'recurring'
  | 'profile'
  | 'architecture';

interface SidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  budgetsAtRiskCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  budgetsAtRiskCount = 0,
}) => {
  const navItems: Array<{
    id: NavTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }> = [
    { id: 'dashboard', label: 'داشبورد مالی', icon: LayoutDashboard },
    { id: 'transactions', label: 'تراکنش‌ها و جستجو', icon: ReceiptText },
    { id: 'accounts', label: 'حساب‌ها و کارت‌ها', icon: CreditCard },
    { id: 'reports', label: 'گزارش‌ها و نمودارها', icon: PieChart },
    {
      id: 'budgets',
      label: 'بودجه‌بندی و اهداف',
      icon: Target,
      badge: budgetsAtRiskCount > 0 ? `${budgetsAtRiskCount} در خطر` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    { id: 'debts', label: 'افراد و طلب / بدهی', icon: Users },
    { id: 'recurring', label: 'تراکنش‌های دوره‌ای', icon: CalendarSync },
    { id: 'profile', label: 'پروفایل و تنظیمات', icon: User },
    { id: 'architecture', label: 'مستندات و معماری فنی', icon: Code2 },
  ];

  return (
    <aside id="app_sidebar" className="w-64 bg-slate-900/60 border-l border-slate-800/80 flex flex-col justify-between p-3.5 select-none shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          منوی ناوبری اصلی
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav_tab_${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/25 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center space-y-1">
        <div className="text-[11px] font-semibold text-slate-300">
          تراز v1.0.0 Pro
        </div>
        <div className="text-[10px] text-slate-400">
          تشخیص خودکار پیامک بانکی
        </div>
      </div>
    </aside>
  );
};
