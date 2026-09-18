export interface BankDefinition {
  code: string;
  name: string;
  shortName: string;
  color: string;
  logoBg: string;
  defaultCardPrefix?: string;
  keywords: string[];
  smsSenders: string[];
}

export const IRANIAN_BANKS: Record<string, BankDefinition> = {
  mellat: {
    code: 'mellat',
    name: 'بانک ملت',
    shortName: 'ملت',
    color: '#E11D48',
    logoBg: 'bg-rose-600',
    defaultCardPrefix: '610433',
    keywords: ['بانک ملت', 'ملت', 'mellat', 'بهسازان'],
    smsSenders: ['20004000', '9820004000', 'MELLAT'],
  },
  melli: {
    code: 'melli',
    name: 'بانک ملی ایران',
    shortName: 'ملی',
    color: '#2563EB',
    logoBg: 'bg-blue-600',
    defaultCardPrefix: '603799',
    keywords: ['بانک ملی', 'ملی ایران', 'melli', 'بانک‌ملی'],
    smsSenders: ['20006411', '9820006411', 'MELLI', 'B.Melli'],
  },
  saman: {
    code: 'saman',
    name: 'بانک سامان',
    shortName: 'سامان',
    color: '#0284C7',
    logoBg: 'bg-sky-600',
    defaultCardPrefix: '621986',
    keywords: ['بانک سامان', 'سامان', 'saman', 'سامان کیش'],
    smsSenders: ['20008400', '9820008400', 'SAMAN'],
  },
  blubank: {
    code: 'blubank',
    name: 'بلو بانک (سامان)',
    shortName: 'بلو',
    color: '#06B6D4',
    logoBg: 'bg-cyan-500',
    defaultCardPrefix: '621986',
    keywords: ['بلو بانک', 'بلوبانک', 'blubank', 'blu'],
    smsSenders: ['BLUBANK', 'BluBank', '10006219'],
  },
  pasargad: {
    code: 'pasargad',
    name: 'بانک پاسارگاد',
    shortName: 'پاسارگاد',
    color: '#EAB308',
    logoBg: 'bg-amber-500',
    defaultCardPrefix: '502229',
    keywords: ['بانک پاسارگاد', 'پاسارگاد', 'pasargad', 'bpi'],
    smsSenders: ['10009', '20009', 'PASARGAD'],
  },
  parsian: {
    code: 'parsian',
    name: 'بانک پارسیان',
    shortName: 'پارسیان',
    color: '#DC2626',
    logoBg: 'bg-red-600',
    defaultCardPrefix: '622106',
    keywords: ['بانک پارسیان', 'پارسیان', 'parsian'],
    smsSenders: ['3000940', 'PARSIAN'],
  },
  tejarat: {
    code: 'tejarat',
    name: 'بانک تجارت',
    shortName: 'تجارت',
    color: '#4F46E5',
    logoBg: 'bg-indigo-600',
    defaultCardPrefix: '585983',
    keywords: ['بانک تجارت', 'تجارت', 'tejarat'],
    smsSenders: ['200070', 'TEJARAT'],
  },
  saderat: {
    code: 'saderat',
    name: 'بانک صادرات ایران',
    shortName: 'صادرات',
    color: '#1E293B',
    logoBg: 'bg-slate-800',
    defaultCardPrefix: '603769',
    keywords: ['بانک صادرات', 'صادرات', 'saderat'],
    smsSenders: ['30006000', 'SADERAT'],
  },
  keshavarzi: {
    code: 'keshavarzi',
    name: 'بانک کشاورزی',
    shortName: 'کشاورزی',
    color: '#16A34A',
    logoBg: 'bg-emerald-600',
    defaultCardPrefix: '603770',
    keywords: ['بانک کشاورزی', 'کشاورزی', 'bki'],
    smsSenders: ['20009100', 'KESHAVARZI'],
  },
  resalat: {
    code: 'resalat',
    name: 'بانک قرض‌الحسنه رسالت',
    shortName: 'رسالت',
    color: '#0D9488',
    logoBg: 'bg-teal-600',
    defaultCardPrefix: '504172',
    keywords: ['بانک رسالت', 'رسالت', 'قرض الحسنه رسالت'],
    smsSenders: ['20004747', 'RESALAT'],
  },
  ayandeh: {
    code: 'ayandeh',
    name: 'بانک آینده',
    shortName: 'آینده',
    color: '#9333EA',
    logoBg: 'bg-purple-600',
    defaultCardPrefix: '636214',
    keywords: ['بانک آینده', 'آینده', 'ayandeh'],
    smsSenders: ['200084000', 'AYANDEH'],
  },
  shahr: {
    code: 'shahr',
    name: 'بانک شهر',
    shortName: 'شهر',
    color: '#EA580C',
    logoBg: 'bg-orange-600',
    defaultCardPrefix: '504706',
    keywords: ['بانک شهر', 'شهر', 'shahr'],
    smsSenders: ['20008600', 'SHAHR'],
  },
  sepah: {
    code: 'sepah',
    name: 'بانک سپه',
    shortName: 'سپه',
    color: '#D97706',
    logoBg: 'bg-amber-600',
    defaultCardPrefix: '589210',
    keywords: ['بانک سپه', 'سپه', 'انصار', 'حکمت', 'قوامین', 'مهر اقتصاد'],
    smsSenders: ['200085', 'SEPAH'],
  },
};

export const SAMPLE_SMS_TEMPLATES = [
  {
    bank: 'بانک ملت - خرید پایانه',
    text: `بانک ملت
برداشت مبلغ 4,850,000 ریال
خرید فروشگاه دیجی‌کالا
کارت: 6104********1234
مانده: 82,450,000 ریال
1404/06/04 - 18:25
کد پیگیری: 894521`,
  },
  {
    bank: 'بانک ملی - واریز حقوق / پایا',
    text: `بانک ملی ایران
واریز مبلغ 450,000,000 ریال
حقوق مرداد ماه شرکت رایان پرداز
به حساب: 0104589623001
موجودی: 495,200,000 ریال
1404/06/01 10:15`,
  },
  {
    bank: 'بلو بانک - انتقال کارت به کارت',
    text: `بلو بانک
انتقال کارت به کارت
مبلغ: 3,500,000 تومان
به: علی رضایی
کارت مقصد: 6037********5678
از کارت: ****9876
مانده: 14,200,000 تومان
کد ارجاع: 74125896`,
  },
  {
    bank: 'بانک سامان - خرید اینترنتی',
    text: `بانک سامان
برداشت: 850,000 ریال
بابت: اسنپ تاکسی
کارت: 6219********4321
موجودی: 23,150,000 ریال
1404/06/03 21:40
پیگیری: 563214`,
  },
  {
    bank: 'بانک پاسارگاد - برداشت وجه / خودپرداز',
    text: `بانک پاسارگاد
برداشت وجه نقد از ATM
مبلغ 2,000,000 ریال
کارت: 5022********8765
مانده: 31,400,000 ریال
1404/06/02 16:30`,
  },
  {
    bank: 'بانک تجارت - برگشت وجه / واریز',
    text: `بانک تجارت
واریز مبلغ 12,000,000 ریال
برگشت وجه خرید اسنپ فود
کارت: 5859********1122
موجودی: 76,000,000 ریال
1404/06/04 12:00`,
  },
];

export const SAMPLE_SMS_DATA = SAMPLE_SMS_TEMPLATES;
