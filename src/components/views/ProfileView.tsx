import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Compass,
  Sparkles,
  LogOut,
  Bell,
  Coins,
  Lock,
  Edit2,
  Check,
  ShieldCheck,
  CheckCircle2,
  Moon,
  Cloud,
  RefreshCw,
  Database,
  Server,
  Zap,
  Clock,
  Copy,
  AlertTriangle,
  Trash2,
  Layers,
} from 'lucide-react';
import { Currency } from '../../types';
import { UserProfile } from '../../services/authService';
import { SyncManager, SyncStatusInfo } from '../../services/syncManager';
import { LocalDatabaseService } from '../../services/localDatabase';
import { formatJalaliFull } from '../../utils/persianDate';

interface ProfileViewProps {
  user: UserProfile | null;
  currency: Currency;
  isOledTheme: boolean;
  onToggleOledTheme: () => void;
  onToggleCurrency: () => void;
  onStartTour: () => void;
  onOpenOnboarding: () => void;
  onLogout: () => void;
  onUpdateName: (name: string) => void;
  onDataRefresh?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  currency,
  isOledTheme,
  onToggleOledTheme,
  onToggleCurrency,
  onStartTour,
  onOpenOnboarding,
  onLogout,
  onUpdateName,
  onDataRefresh,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || 'کاربر گرامی');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Cloud Sync & Backend Queue state
  const [syncStatus, setSyncStatus] = useState<SyncStatusInfo>(SyncManager.getStatus());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [serverHealth, setServerHealth] = useState<any>(null);

  useEffect(() => {
    const unsub = SyncManager.subscribe((st) => {
      setSyncStatus(st);
    });

    // Fetch server health & queue status
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => setServerHealth(data))
      .catch(() => setServerHealth(null));

    return () => unsub();
  }, []);

  const handleSaveName = () => {
    if (editedName.trim()) {
      onUpdateName(editedName.trim());
      setIsEditingName(false);
    }
  };

  const handleTriggerSync = async (force = true) => {
    setIsSyncing(true);
    await SyncManager.performSync(force);
    setIsSyncing(false);
    onDataRefresh?.();
  };

  const handleTriggerRestore = async () => {
    setIsRestoring(true);
    const ok = await SyncManager.pullCloudState();
    setIsRestoring(false);
    if (ok) {
      onDataRefresh?.();
    }
  };

  const handleClearData = () => {
    LocalDatabaseService.clearAllData();
    setShowClearConfirm(false);
    onDataRefresh?.();
  };

  return (
    <div id="profile_view_box" className="space-y-4 pb-12 animate-in fade-in duration-200 text-xs">
      {/* User Info Card */}
      <div id="profile_user_card" className="p-5 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-sm flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 text-center sm:text-right">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-950/40 ring-2 ring-white/10 shrink-0">
            <User className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            {isEditingName ? (
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-emerald-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  className="p-1 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h3 className="text-sm font-bold text-white">{user?.name || 'کاربر گرامی'}</h3>
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="ویرایش نام"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-slate-400 text-[11px] font-mono">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>{user?.phoneNumber || '۰۹۱۲۳۴۵۶۷۸۹'}</span>
            </div>

            <div className="pt-1 flex items-center justify-center sm:justify-start gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium">
                <CheckCircle2 className="w-3 h-3" />
                <span>حساب فعال و پایدار</span>
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>خروج از حساب</span>
        </button>
      </div>

      {/* Cloud Sync & Express + Supabase + Redis Architecture Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/20 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <span>همگام‌سازی ابری و صف بک‌اند</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-normal border border-indigo-500/30">
                  Supabase + Redis Queue
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">معماری اقتصادی: سینک دسته‌ای ۱ بار در ۲۴ ساعت</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {syncStatus.state === 'syncing' ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] flex items-center gap-1 font-semibold">
                <RefreshCw className="w-3 h-3 animate-spin" />
                در حال سینک
              </span>
            ) : syncStatus.state === 'synced' ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] flex items-center gap-1 font-semibold">
                <Check className="w-3 h-3" />
                همگام شده
              </span>
            ) : syncStatus.state === 'offline' ? (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-semibold">
                آفلاین
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold">
                آماده
              </span>
            )}
          </div>
        </div>

        {/* Sync Status Info Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>آخرین همگام‌سازی ابری</span>
            </div>
            <div className="font-semibold text-slate-200">
              {syncStatus.lastSyncAt > 0
                ? formatJalaliFull(syncStatus.lastSyncAt, true)
                : 'هنوز انجام نشده'}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="text-slate-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>تغییرات در صف محلی (Delta)</span>
            </div>
            <div className="font-semibold text-amber-300 font-mono">
              {syncStatus.pendingDeltasCount.toLocaleString('fa-IR')} رکورد جدید
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="text-slate-400 flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>نوع صف پردازش بک‌اند</span>
            </div>
            <div className="font-semibold text-emerald-300 flex items-center gap-1">
              <span>{serverHealth?.services?.redis?.queueType === 'redis' ? 'ردیس (Redis Worker)' : 'صف ناهمگام سرور'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Message Banner */}
        <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-indigo-200 text-[11px] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>{syncStatus.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowSchemaModal(true)}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 underline underline-offset-2 cursor-pointer shrink-0"
          >
            مشاهده اسکیما Supabase
          </button>
        </div>

        {/* Sync & Restore Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            disabled={isSyncing}
            onClick={() => handleTriggerSync(true)}
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>همگام‌سازی ابری اکنون (Force Sync)</span>
          </button>

          <button
            type="button"
            disabled={isRestoring}
            onClick={handleTriggerRestore}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Cloud className="w-3.5 h-3.5 text-slate-400" />
            <span>بازیابی از فضای ابری (Restore)</span>
          </button>
        </div>
      </div>

      {/* Settings & Preferences */}
      <div id="profile_settings_card" className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm space-y-3">
        <h4 className="text-xs font-bold text-slate-300">تنظیمات و ترجیحات</h4>

        <div className="divide-y divide-slate-800/60">
          {/* Currency Toggle */}
          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">واحد پول پیش‌فرض</div>
                <div className="text-[11px] text-slate-400">نمایش مبالغ در تمام بخش‌ها و گزارش‌ها</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleCurrency}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-emerald-400 cursor-pointer transition-colors"
            >
              {currency === 'TOMAN' ? 'تومان' : 'ریال'}
            </button>
          </div>

          {/* Black OLED Theme Toggle */}
          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <span>تم مشکی خالص (Black OLED)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-normal">
                    #000000
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  تبدیل پس‌زمینه به مشکی مطلق جهت بهینه‌سازی مصرف باتری و کنتراست عمیق
                </div>
              </div>
            </div>

            <button
              id="toggle_oled_theme"
              type="button"
              onClick={onToggleOledTheme}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                isOledTheme ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  isOledTheme ? 'translate-x-0' : '-translate-x-5'
                }`}
              />
            </button>
          </div>

          {/* Notifications Toggle */}
          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">یادآوری سررسید اقساط و قبوض</div>
                <div className="text-[11px] text-slate-400">اعلان‌های موعد پرداخت‌های دوره‌ای و چک‌ها</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  notificationsEnabled ? 'translate-x-0' : '-translate-x-5'
                }`}
              />
            </button>
          </div>

          {/* Biometrics App Lock Toggle */}
          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">قفل ورود امنیتی (PIN / بیومتریک)</div>
                <div className="text-[11px] text-slate-400">درخواست رمز هنگام ورود مجدد به برنامه</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setBiometricsEnabled(!biometricsEnabled)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                biometricsEnabled ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  biometricsEnabled ? 'translate-x-0' : '-translate-x-5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Tour & Guides */}
      <div id="profile_tour_section" className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm space-y-3">
        <h4 className="text-xs font-bold text-slate-300">راهنما و آموزش برنامه</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onStartTour}
            className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-emerald-500/40 text-right space-y-1.5 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Compass className="w-4 h-4" />
                <span>تور تعاملی برنامه (Driver.js)</span>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-400">راهنمای مرحله‌به‌مرحله روی اجزا، دکمه‌ها و منوهای مختلف برنامه</p>
          </button>

          <button
            type="button"
            onClick={onOpenOnboarding}
            className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-cyan-500/40 text-right space-y-1.5 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>معرفی امکانات و امنیت تراز</span>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-400">مشاهده اسلایدهای تصویری معرفی قابلیت‌های هوشمند و آفلاین</p>
          </button>
        </div>
      </div>

      {/* Database Management */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm space-y-3">
        <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>مدیریت پایگاه داده محلی</span>
        </h4>

        <div>
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 text-right transition-all cursor-pointer flex items-center gap-2.5"
          >
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-rose-400 text-xs">پاکسازی تمام داده‌ها (شروع از صفر)</div>
              <div className="text-[10px] text-slate-400">حذف تراکنش‌ها و کارت‌ها و بازنشانی به حساب کاربری خالی</div>
            </div>
          </button>
        </div>
      </div>

      {/* Supabase Schema Modal */}
      {showSchemaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400">
                <Database className="w-5 h-5" />
                <h4 className="text-sm font-bold text-white">اسکریپت SQL جداول Supabase</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowSchemaModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                بستن
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              این اسکریپت را در بخش SQL Editor داشبورد Supabase خود اجرا کنید تا جداول پشتیبان روزانه و دلتا ساخته شوند:
            </p>

            <div className="relative flex-1 overflow-hidden rounded-xl bg-slate-950 border border-slate-800 p-3">
              <pre className="text-[10px] text-emerald-300 font-mono overflow-auto max-h-60 dir-ltr text-left">
{`-- 1. Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  phone_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  total_sync_count INT DEFAULT 0
);

-- 2. Daily Snapshots Table
CREATE TABLE IF NOT EXISTS tenant_snapshots (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  encrypted_payload TEXT NOT NULL,
  device_id TEXT,
  client_version TEXT,
  record_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Incremental Deltas Table
CREATE TABLE IF NOT EXISTS tenant_deltas (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  encrypted_data TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`}
              </pre>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS tenants (\n  id TEXT PRIMARY KEY,\n  phone_number TEXT NOT NULL,\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  last_sync_at TIMESTAMPTZ,\n  total_sync_count INT DEFAULT 0\n);\n\nCREATE TABLE IF NOT EXISTS tenant_snapshots (\n  id BIGSERIAL PRIMARY KEY,\n  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,\n  encrypted_payload TEXT NOT NULL,\n  device_id TEXT,\n  client_version TEXT,\n  record_count INT DEFAULT 0,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nCREATE TABLE IF NOT EXISTS tenant_deltas (\n  id BIGSERIAL PRIMARY KEY,\n  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,\n  entity_type TEXT NOT NULL,\n  action TEXT NOT NULL,\n  entity_id TEXT NOT NULL,\n  encrypted_data TEXT NOT NULL,\n  timestamp BIGINT NOT NULL,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);`);
                  setCopiedSchema(true);
                  setTimeout(() => setCopiedSchema(false), 2500);
                }}
                className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-md"
              >
                {copiedSchema ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSchema ? 'کپی شد' : 'کپی کدهای SQL'}</span>
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowSchemaModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="space-y-1.5 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">پاکسازی کامل داده‌ها</h4>
              <p className="text-xs text-slate-400">
                کلیه تراکنش‌ها، کارت‌ها و حساب‌های این کاربر حذف می‌شوند و سیستم به حالت خالی (Zero State) برمی‌گردد. آیا ادامه می‌دهید؟
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleClearData}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                حذف و پاکسازی
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="space-y-1.5 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center">
                <LogOut className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">خروج از حساب کاربری</h4>
              <p className="text-xs text-slate-400">آیا برای خروج از حساب کاربری اطمینان دارید؟</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                تأیید و خروج
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
