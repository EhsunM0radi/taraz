import { LocalDatabaseService } from './localDatabase';
import { AuthService } from './authService';
import { CryptoEngine } from '../crypto/encryption';

export type SyncState = 'idle' | 'syncing' | 'synced' | 'error' | 'offline' | 'waiting_24h';

export interface SyncStatusInfo {
  state: SyncState;
  isOnline: boolean;
  lastSyncAt: number;
  nextAllowedSync: number;
  pendingDeltasCount: number;
  message: string;
  serverQueueType?: 'redis' | 'in-memory';
}

type SyncSubscriber = (status: SyncStatusInfo) => void;

const SYNC_META_KEY = 'taraz_sync_metadata_v1';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export class SyncManager {
  private static subscribers: SyncSubscriber[] = [];
  private static currentState: SyncState = 'idle';
  private static lastSyncMessage = 'آماده همگام‌سازی';
  private static isInitialized = false;

  public static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Listen to network state changes
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('🌐 Network is online. Checking 24-hour daily sync condition...');
        this.checkAndAutoSync();
      });

      window.addEventListener('offline', () => {
        this.currentState = 'offline';
        this.lastSyncMessage = 'دستگاه آفلاین است. تغییرات در صف محلی نگهداری می‌شوند.';
        this.notifySubscribers();
      });

      // Periodic check every 15 minutes when app is active
      setInterval(() => {
        this.checkAndAutoSync();
      }, 15 * 60 * 1000);

      // Initial check on boot
      setTimeout(() => {
        this.checkAndAutoSync();
      }, 2000);
    }
  }

  public static subscribe(callback: SyncSubscriber): () => void {
    this.subscribers.push(callback);
    callback(this.getStatus());
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  private static notifySubscribers(): void {
    const status = this.getStatus();
    this.subscribers.forEach((cb) => cb(status));
  }

  public static getLastSyncTimestamp(): number {
    const tenantId = AuthService.getActiveTenantId();
    const raw = localStorage.getItem(`${SYNC_META_KEY}_${tenantId}_last`);
    return raw ? parseInt(raw, 10) : 0;
  }

  public static setLastSyncTimestamp(ts: number): void {
    const tenantId = AuthService.getActiveTenantId();
    localStorage.setItem(`${SYNC_META_KEY}_${tenantId}_last`, ts.toString());
    this.notifySubscribers();
  }

  public static getStatus(): SyncStatusInfo {
    const lastSyncAt = this.getLastSyncTimestamp();
    const nextAllowedSync = lastSyncAt > 0 ? lastSyncAt + ONE_DAY_MS : 0;
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const pendingDeltas = LocalDatabaseService.getSyncQueue().length;

    let state = this.currentState;
    if (!isOnline) {
      state = 'offline';
    } else if (state === 'idle' && lastSyncAt > 0 && Date.now() < nextAllowedSync) {
      state = 'waiting_24h';
    }

    return {
      state,
      isOnline,
      lastSyncAt,
      nextAllowedSync,
      pendingDeltasCount: pendingDeltas,
      message: this.lastSyncMessage,
    };
  }

  /**
   * Automatic Daily Sync:
   * Triggers ONLY if device is online AND more than 24 hours passed since last sync (or first sync)
   */
  public static async checkAndAutoSync(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.currentState = 'offline';
      this.lastSyncMessage = 'دستگاه آفلاین است';
      this.notifySubscribers();
      return false;
    }

    const lastSyncAt = this.getLastSyncTimestamp();
    const now = Date.now();
    const isFirstTime = lastSyncAt === 0;
    const has24HoursPassed = now - lastSyncAt >= ONE_DAY_MS;

    if (isFirstTime || has24HoursPassed) {
      console.log('🔄 Executing scheduled 24-hour daily cloud sync...');
      return await this.performSync(false);
    } else {
      const remainingHours = Math.ceil((lastSyncAt + ONE_DAY_MS - now) / (1000 * 60 * 60));
      this.currentState = 'waiting_24h';
      this.lastSyncMessage = `همگام‌سازی روزانه قبلاً انجام شده (${remainingHours} ساعت تا نوبت بعدی)`;
      this.notifySubscribers();
      return false;
    }
  }

  /**
   * Perform sync with Express + Supabase + Redis queue
   */
  public static async performSync(force = false): Promise<boolean> {
    const user = AuthService.getUser();
    if (!user) {
      this.lastSyncMessage = 'ابتدا وارد حساب کاربری شوید';
      this.notifySubscribers();
      return false;
    }

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!isOnline) {
      this.currentState = 'offline';
      this.lastSyncMessage = 'امکان همگام‌سازی در حالت آفلاین وجود ندارد';
      this.notifySubscribers();
      return false;
    }

    this.currentState = 'syncing';
    this.lastSyncMessage = 'در حال ارسال بسته‌بندی رمزنگاری‌شده به صف سرور...';
    this.notifySubscribers();

    try {
      // 1. Gather pending deltas and full state backup
      const syncQueue = LocalDatabaseService.getSyncQueue();
      const fullDump = await LocalDatabaseService.exportDatabaseEncrypted();

      const deltasPayload = syncQueue.map((item) => ({
        entityType: item.table,
        action: item.action,
        entityId: item.recordId,
        payload: item.encryptedPayload,
        timestamp: item.timestamp,
      }));

      // 2. Call Express API /api/sync/push
      const response = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: user.tenantId,
          phoneNumber: user.phoneNumber,
          deltas: deltasPayload,
          snapshot: fullDump,
          deviceId: typeof navigator !== 'undefined' ? navigator.userAgent : 'web-client',
          clientVersion: '1.0.0',
          force,
        }),
      });

      if (!response.ok) {
        throw new Error(`خطای سرور: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'skipped_within_24h') {
        this.currentState = 'waiting_24h';
        this.lastSyncMessage = `همگام‌سازی امروز انجام شده است (${result.hoursRemaining} ساعت تا نوبت بعدی)`;
        this.notifySubscribers();
        return true;
      }

      // Success: Clear local delta queue and update sync timestamp
      LocalDatabaseService.clearSyncQueue();
      this.setLastSyncTimestamp(Date.now());
      this.currentState = 'synced';
      this.lastSyncMessage = `همگام‌سازی ابری موفق (${result.deltasCount || 0} تغییر در صف سرور ثبت شد)`;
      this.notifySubscribers();

      setTimeout(() => {
        if (this.currentState === 'synced') {
          this.currentState = 'idle';
          this.notifySubscribers();
        }
      }, 5000);

      return true;
    } catch (err: any) {
      console.error('Cloud Sync failed:', err);
      this.currentState = 'error';
      this.lastSyncMessage = err?.message || 'خطا در ارتباط با سرور همگام‌سازی';
      this.notifySubscribers();
      return false;
    }
  }

  /**
   * Pull and restore latest cloud snapshot (for new device or restore)
   */
  public static async pullCloudState(): Promise<boolean> {
    const user = AuthService.getUser();
    if (!user) return false;

    this.currentState = 'syncing';
    this.lastSyncMessage = 'در حال دریافت اطلاعات از فضای ابری...';
    this.notifySubscribers();

    try {
      const res = await fetch(`/api/sync/pull?tenantId=${encodeURIComponent(user.tenantId)}`);
      if (!res.ok) throw new Error('خطا در دریافت پشتیبان ابری');

      const data = await res.json();
      if (data.snapshot) {
        const restored = await LocalDatabaseService.importDatabaseEncrypted(data.snapshot);
        if (restored) {
          this.setLastSyncTimestamp(Date.now());
          this.currentState = 'synced';
          this.lastSyncMessage = 'بازیابی اطلاعات از ابری با موفقیت انجام شد';
          this.notifySubscribers();
          return true;
        }
      }

      this.currentState = 'idle';
      this.lastSyncMessage = 'نسخه پشتیبانی در سرور یافت نشد';
      this.notifySubscribers();
      return false;
    } catch (err: any) {
      this.currentState = 'error';
      this.lastSyncMessage = err.message || 'خطا در بازیابی';
      this.notifySubscribers();
      return false;
    }
  }
}
