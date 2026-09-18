export interface UserProfile {
  phoneNumber: string;
  name: string;
  avatarColor: string;
  joinedAt: number;
  isAuthenticated: boolean;
  tenantId: string;
}

const AUTH_STORAGE_KEY = 'taraz_user_auth_v1';

export const AuthService = {
  getUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && parsed.phoneNumber) {
          if (!parsed.tenantId) {
            parsed.tenantId = parsed.phoneNumber;
          }
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return null;
  },

  getActiveTenantId(): string {
    const user = this.getUser();
    return user?.tenantId || user?.phoneNumber || 'default';
  },

  login(phoneNumber: string, name = 'کاربر گرامی'): UserProfile {
    const cleanPhone = phoneNumber.trim().replace(/[^\d]/g, '');
    const user: UserProfile = {
      phoneNumber: cleanPhone,
      name: name.trim() || 'کاربر گرامی',
      avatarColor: '#10B981',
      joinedAt: Date.now(),
      isAuthenticated: true,
      tenantId: cleanPhone,
    };
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user session:', e);
    }
    return user;
  },

  updateName(name: string): UserProfile | null {
    const current = this.getUser();
    if (!current) return null;
    const updated = { ...current, name };
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update name:', e);
    }
    return updated;
  },

  logout(): void {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear user session:', e);
    }
  },

  hasCompletedOnboarding(tenantId?: string): boolean {
    const tid = tenantId || this.getActiveTenantId();
    return localStorage.getItem(`taraz_tenant_${tid}_onboarding_completed`) === 'true';
  },

  setOnboardingCompleted(tenantId?: string): void {
    const tid = tenantId || this.getActiveTenantId();
    localStorage.setItem(`taraz_tenant_${tid}_onboarding_completed`, 'true');
  },

  resetOnboarding(tenantId?: string): void {
    const tid = tenantId || this.getActiveTenantId();
    localStorage.removeItem(`taraz_tenant_${tid}_onboarding_completed`);
  },
};
