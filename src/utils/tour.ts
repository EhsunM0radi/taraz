import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { NavTabId } from '../components/Sidebar';
import { toPersianDigits } from './persianDate';

interface CustomTourStep extends DriveStep {
  tab?: NavTabId;
}

export function startAppTour(
  onNavigateTab?: (tab: NavTabId) => void,
  onComplete?: () => void
) {
  const isMobile = window.innerWidth < 768;

  // Helper to dynamically get the visible navbar button (mobile bottom nav vs desktop sidebar)
  const getNavSelector = (tabId: NavTabId) => {
    return isMobile ? `#mobile_nav_${tabId}` : `#nav_tab_${tabId}`;
  };

  const tourSteps: CustomTourStep[] = [
    // 1. App Header & Brand (Placed cleanly below header with generous offset)
    {
      tab: 'dashboard',
      element: '#app_header_brand',
      popover: {
        title: '👑 سامانه هوشمند مدیریت مالی تراز',
        description: 'به تراز خوش آمدید! تراز دستیار مالی ۱۰۰٪ آفلاین و هوشمند شماست که داده‌ها، مخارج و کارت‌های بانکی شما را با بالاترین امنیت در دستگاهتان مدیریت می‌کند.',
        side: 'bottom',
        align: isMobile ? 'center' : 'start',
      },
    },

    // 2. Quick Add Transaction (Header action button)
    {
      tab: 'dashboard',
      element: '#btn_quick_add_transaction',
      popover: {
        title: '⚡ ثبت سریع تراکنش (درآمد / هزینه)',
        description: 'برای ثبت فوری خریدها یا درآمدهای روزانه روی این دکمه بزنید تا مبلغ، دسته‌بندی و کارت متصل را در چند ثانیه ذخیره کنید.',
        side: 'bottom',
        align: 'end',
      },
    },

    // 3. Dashboard Tab Button in Navbar (Placed exactly ABOVE on mobile)
    {
      tab: 'dashboard',
      element: getNavSelector('dashboard'),
      popover: {
        title: '📊 داشبورد و شاخص‌های مالی',
        description: 'مشاهده مانده کل دارایی‌ها، خلاصه دریافتی‌ها و مخارج ماه جاری، نرخ پس‌انداز و شاخص‌های زنده سلامت مالی.',
        side: isMobile ? 'top' : 'left',
        align: 'center',
      },
    },

    // 4. Transactions Tab Button in Navbar (Placed exactly ABOVE on mobile)
    {
      tab: 'transactions',
      element: getNavSelector('transactions'),
      popover: {
        title: '🧾 فهرست تراکنش‌ها و جستجو',
        description: 'ثبت و مدیریت تمام مخارج و درآمدها، جستجوی پیشرفته بر اساس فروشگاه و دسته و دریافت خروجی اکسل (CSV).',
        side: isMobile ? 'top' : 'left',
        align: 'center',
      },
    },

    // 5. Accounts & Cards Tab Button in Navbar (Placed exactly ABOVE on mobile)
    {
      tab: 'accounts',
      element: getNavSelector('accounts'),
      popover: {
        title: '💳 حساب‌ها و کارت‌های شتاب',
        description: 'مدیریت کارت‌های بانکی با طرح اختصاصی بانک‌های ایرانی، کپی سریع شماره شبا و پیگیری مانده هر حساب.',
        side: isMobile ? 'top' : 'left',
        align: 'center',
      },
    },

    // 6. Reports & Charts Tab Button in Navbar (Placed exactly ABOVE on mobile)
    {
      tab: 'reports',
      element: getNavSelector('reports'),
      popover: {
        title: '📈 گزارش‌ها و نمودارهای تحلیلی',
        description: 'نمودارهای مقایسه درآمد و مخارج، نمودار دونات سهم هزینه‌ها و بررسی جریان نقدینگی در بازه‌های زمانی مختلف.',
        side: isMobile ? 'top' : 'left',
        align: 'center',
      },
    },

    // 7. Profile & Settings Tab Button in Navbar (Placed exactly ABOVE on mobile)
    {
      tab: 'profile',
      element: getNavSelector('profile'),
      popover: {
        title: '⚙️ پروفایل، امنیت و راهنما',
        description: 'تنظیمات کاربری، قفل امنیتی، اعلانات و دسترسی به اجرای مجدد این تور آموزشی در هر زمان دلخواه.',
        side: isMobile ? 'top' : 'left',
        align: 'center',
      },
    },
  ];

  let currentStepIndex = 0;

  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayColor: '#020617',
    overlayOpacity: 0.6,
    stagePadding: 6,
    stageRadius: 14,
    popoverOffset: 20,
    smoothScroll: true,
    allowClose: true,
    nextBtnText: 'بعدی ←',
    prevBtnText: '→ قبلی',
    doneBtnText: 'پایان تور ✨',
    progressText: 'گام {{current}} از {{total}}',
    onPopoverRender: (popover) => {
      // 1. Format progress numbers to Persian
      const progressEl = popover.wrapper.querySelector('.driver-popover-progress-text');
      if (progressEl && progressEl.textContent) {
        progressEl.textContent = toPersianDigits(progressEl.textContent);
      }

      // 2. Change close button (X) into a clear single-line "رد کردن" (Skip) pill
      const closeBtn = popover.wrapper.querySelector('.driver-popover-close-btn');
      if (closeBtn) {
        closeBtn.innerHTML = 'رد کردن';
        closeBtn.classList.add('driver-custom-skip-btn');
      }
    },
    onHighlightStarted: (element, step, { state }) => {
      const stepIdx = state.activeIndex;
      currentStepIndex = stepIdx ?? 0;
      const targetStep = tourSteps[currentStepIndex];

      if (targetStep && targetStep.tab && onNavigateTab) {
        onNavigateTab(targetStep.tab);
      }

      if (currentStepIndex === 0) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    onDestroyed: () => {
      if (onNavigateTab) {
        onNavigateTab('dashboard');
      }
      if (onComplete) onComplete();
    },
    steps: tourSteps,
  });

  driverObj.drive();
}
