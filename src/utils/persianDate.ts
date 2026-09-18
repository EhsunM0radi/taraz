/**
 * Persian (Jalali / Solar Hijri) Date & Number Utility Engine
 * Exact algorithmic conversions between Gregorian & Jalali calendars
 */

export const JALALI_MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند'
];

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function toPersianDigits(input: string | number): string {
  if (input === null || input === undefined) return '';
  return String(input).replace(/[0-9]/g, (w) => PERSIAN_DIGITS[+w]);
}

export function toEnglishDigits(input: string): string {
  if (!input) return '';
  let result = input;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(PERSIAN_DIGITS[i], 'g'), String(i));
    result = result.replace(new RegExp(ARABIC_DIGITS[i], 'g'), String(i));
  }
  return result;
}

export function formatMoney(amountInToman: number, targetCurrency: 'TOMAN' | 'IRR' = 'TOMAN'): string {
  const value = targetCurrency === 'IRR' ? amountInToman * 10 : amountInToman;
  const formattedNumber = Math.round(value).toLocaleString('en-US');
  const unit = targetCurrency === 'IRR' ? 'ریال' : 'تومان';
  return `${toPersianDigits(formattedNumber)} ${unit}`;
}

export function formatCompactMoney(amountInToman: number): string {
  const abs = Math.abs(amountInToman);
  if (abs >= 1_000_000_000) {
    const b = (amountInToman / 1_000_000_000).toFixed(1);
    return `${toPersianDigits(b)} میلیارد تومان`;
  }
  if (abs >= 1_000_000) {
    const m = (amountInToman / 1_000_000).toFixed(1);
    return `${toPersianDigits(m)} میلیون تومان`;
  }
  if (abs >= 1_000) {
    const k = (amountInToman / 1_000).toFixed(0);
    return `${toPersianDigits(k)} هزار تومان`;
  }
  return `${toPersianDigits(amountInToman.toLocaleString('en-US'))} تومان`;
}

/**
 * Convert Gregorian Date to Jalali (Year, Month, Day)
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  let jy = -1595 + (33 * Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return { jy, jm, jd };
}

/**
 * Convert Jalali Date to Gregorian (Year, Month, Day)
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  let jy2 = jy + 1595;
  let days = -355668 + (365 * jy2) + (Math.floor(jy2 / 33) * 8) + Math.floor(((jy2 % 33) + 3) / 4) + jd + ((jm < 7) ? ((jm - 1) * 31) : (((jm - 7) * 30) + 186));
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 13 && gd > sal_a[gm]) {
    gd -= sal_a[gm];
    gm++;
  }
  return { gy, gm, gd };
}

/**
 * Format timestamp into standard Jalali string: "1404/06/04"
 */
export function formatJalaliDate(timestamp: number | Date = Date.now()): string {
  const d = new Date(timestamp);
  const { jy, jm, jd } = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const monthStr = String(jm).padStart(2, '0');
  const dayStr = String(jd).padStart(2, '0');
  return `${jy}/${monthStr}/${dayStr}`;
}

/**
 * Format timestamp into friendly Persian display string: "۴ شهریور ۱۴۰۴ - ۱۴:۳۰"
 */
export function formatJalaliFull(timestamp: number | Date = Date.now(), includeTime = true): string {
  const d = new Date(timestamp);
  const { jy, jm, jd } = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const monthName = JALALI_MONTH_NAMES[jm - 1];
  const dateStr = `${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;
  if (!includeTime) return dateStr;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${dateStr} - ${toPersianDigits(hours)}:${toPersianDigits(minutes)}`;
}

/**
 * Relative Persian time (e.g. امروز، دیروز، ۲ روز پیش)
 */
export function formatPersianRelative(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'همین حالا';
  if (diffMin < 60) return `${toPersianDigits(diffMin)} دقیقه پیش`;
  if (diffHours < 24) return `${toPersianDigits(diffHours)} ساعت پیش`;
  if (diffDays === 1) return 'دیروز';
  if (diffDays === 2) return 'پریروز';
  if (diffDays < 30) return `${toPersianDigits(diffDays)} روز پیش`;
  return formatJalaliFull(timestamp, false);
}

export function getCurrentJalaliYearMonth(): { year: number; month: number; monthName: string } {
  const d = new Date();
  const { jy, jm } = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return {
    year: jy,
    month: jm,
    monthName: JALALI_MONTH_NAMES[jm - 1],
  };
}

export function formatJalaliDayMonth(timestamp: number | Date = Date.now()): string {
  const d = new Date(timestamp);
  const { jm, jd } = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const monthName = JALALI_MONTH_NAMES[jm - 1];
  return `${toPersianDigits(jd)} ${monthName}`;
}

export function getJalaliMonthName(monthNumber: number): string {
  return JALALI_MONTH_NAMES[Math.max(0, Math.min(11, monthNumber - 1))] || '';
}

export const PERSIAN_WEEKDAY_NAMES = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
];

/**
 * Returns Persian day-of-week index (0=شنبه to 6=جمعه) for a specific Jalali date
 */
export function getJalaliDayOfWeek(jy: number, jm: number, jd: number): number {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
  const d = new Date(gy, gm - 1, gd);
  const day = d.getDay(); // 0 is Sunday, 6 is Saturday
  return (day + 1) % 7;
}

export function getJalaliDayOfWeekName(jy: number, jm: number, jd: number): string {
  const idx = getJalaliDayOfWeek(jy, jm, jd);
  return PERSIAN_WEEKDAY_NAMES[idx] || '';
}

export function formatFullPersianDate(jy: number, jm: number, jd: number): string {
  const dayName = getJalaliDayOfWeekName(jy, jm, jd);
  const monthName = getJalaliMonthName(jm);
  return `${dayName} ${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;
}

export function formatShortPersianDate(jy: number, jm: number, jd: number): string {
  const monthName = getJalaliMonthName(jm);
  return `${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;
}

export function isJalaliLeapYear(jy: number): boolean {
  const r = (jy - (jy > 0 ? 474 : 473)) % 2820;
  return (((r + 38) * 682) % 2816) < 682;
}

export function getJalaliMonthDays(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeapYear(jy) ? 30 : 29;
}

/**
 * Returns Persian day-of-week index for the 1st day of a Jalali month:
 * 0 = شنبه (Saturday), 1 = یکشنبه, 2 = دوشنبه, 3 = سه‌شنبه, 4 = چهارشنبه, 5 = پنج‌شنبه, 6 = جمعه
 */
export function getJalaliFirstDayOfWeek(jy: number, jm: number): number {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, 1);
  const d = new Date(gy, gm - 1, gd);
  const day = d.getDay(); // 0 is Sunday, 6 is Saturday
  return (day + 1) % 7;
}

export function formatJalaliDateStr(jy: number, jm: number, jd: number): string {
  const m = String(jm).padStart(2, '0');
  const d = String(jd).padStart(2, '0');
  return `${jy}/${m}/${d}`;
}

export function compareJalaliDates(
  a: { jy: number; jm: number; jd: number },
  b: { jy: number; jm: number; jd: number }
): number {
  if (a.jy !== b.jy) return a.jy - b.jy;
  if (a.jm !== b.jm) return a.jm - b.jm;
  return a.jd - b.jd;
}

export function jalaliToTimestamp(jy: number, jm: number, jd: number, endOfDay = false): number {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
  const d = new Date(gy, gm - 1, gd, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return d.getTime();
}

export function parseJalaliDate(dateStr: string): { jy: number; jm: number; jd: number } | null {
  if (!dateStr) return null;
  const clean = toEnglishDigits(dateStr.trim()).replace(/[\\.-]/g, '/');
  const parts = clean.split('/').map((p) => parseInt(p, 10));
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    const [jy, jm, jd] = parts;
    if (jy >= 1300 && jy <= 1500 && jm >= 1 && jm <= 12 && jd >= 1 && jd <= 31) {
      return { jy, jm, jd };
    }
  }
  return null;
}

export function getCurrentJalaliDate(): { jy: number; jm: number; jd: number; dateStr: string } {
  const d = new Date();
  const { jy, jm, jd } = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const monthStr = String(jm).padStart(2, '0');
  const dayStr = String(jd).padStart(2, '0');
  return {
    jy,
    jm,
    jd,
    dateStr: `${jy}/${monthStr}/${dayStr}`,
  };
}

/**
 * Convert number into fluent Persian word representation
 * Example: 1500000 -> "یک میلیون و پانصد هزار"
 */
export function numberToPersianWords(num: number): string {
  if (num === 0) return 'صفر';
  if (!num || isNaN(num)) return '';

  const units = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
  const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
  const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
  const hundreds = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
  const scales = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

  function convertThreeDigits(n: number): string {
    const parts: string[] = [];
    const h = Math.floor(n / 100);
    const rem = n % 100;
    const t = Math.floor(rem / 10);
    const u = rem % 10;

    if (h > 0) parts.push(hundreds[h]);

    if (rem >= 10 && rem < 20) {
      parts.push(teens[rem - 10]);
    } else {
      if (t > 0) parts.push(tens[t]);
      if (u > 0) parts.push(units[u]);
    }

    return parts.join(' و ');
  }

  let absVal = Math.floor(Math.abs(num));
  const chunks: string[] = [];
  let scaleIndex = 0;

  while (absVal > 0) {
    const threeDigits = absVal % 1000;
    if (threeDigits > 0) {
      const chunkStr = convertThreeDigits(threeDigits);
      const scaleStr = scales[scaleIndex];
      chunks.unshift(scaleStr ? `${chunkStr} ${scaleStr}` : chunkStr);
    }
    absVal = Math.floor(absVal / 1000);
    scaleIndex++;
  }

  const prefix = num < 0 ? 'منفی ' : '';
  return prefix + chunks.join(' و ');
}
