import { IRANIAN_BANKS, BankDefinition } from '../parser/bankRules';

export interface DetectedCardResult {
  cardNumber: string; // 16 digits (e.g. "6037991234567890")
  formattedCardNumber: string; // "6037 9912 3456 7890"
  last4Digits: string; // "7890"
  bankCode: string;
  bankName: string;
  bankShortName: string;
  confidence: number;
}

// Map 6-digit prefixes to bank codes
export const CARD_BIN_MAP: Record<string, { code: string; name: string; shortName: string }> = {
  '603799': { code: 'melli', name: 'بانک ملی ایران', shortName: 'ملی' },
  '610433': { code: 'mellat', name: 'بانک ملت', shortName: 'ملت' },
  '621986': { code: 'saman', name: 'بانک سامان / بلو بانک', shortName: 'سامان' },
  '502229': { code: 'pasargad', name: 'بانک پاسارگاد', shortName: 'پاسارگاد' },
  '639347': { code: 'pasargad', name: 'بانک پاسارگاد', shortName: 'پاسارگاد' },
  '622106': { code: 'parsian', name: 'بانک پارسیان', shortName: 'پارسیان' },
  '585983': { code: 'tejarat', name: 'بانک تجارت', shortName: 'تجارت' },
  '603769': { code: 'saderat', name: 'بانک صادرات ایران', shortName: 'صادرات' },
  '603770': { code: 'keshavarzi', name: 'بانک کشاورزی', shortName: 'کشاورزی' },
  '504172': { code: 'resalat', name: 'بانک قرض‌الحسنه رسالت', shortName: 'رسالت' },
  '636214': { code: 'ayandeh', name: 'بانک آینده', shortName: 'آینده' },
  '504706': { code: 'shahr', name: 'بانک شهر', shortName: 'شهر' },
  '589210': { code: 'sepah', name: 'بانک سپه', shortName: 'سپه' },
  '627381': { code: 'sepah', name: 'بانک انصار (سپه)', shortName: 'انصار' },
  '639599': { code: 'sepah', name: 'بانک قوامین (سپه)', shortName: 'قوامین' },
  '627412': { code: 'en', name: 'بانک اقتصاد نوین', shortName: 'اقتصاد نوین' },
  '627760': { code: 'post', name: 'پست بانک ایران', shortName: 'پست بانک' },
  '627961': { code: 'sanat', name: 'بانک صنعت و معدن', shortName: 'صنعت و معدن' },
  '502908': { code: 'tt', name: 'بانک توسعه تعاون', shortName: 'توسعه تعاون' },
  '502938': { code: 'dey', name: 'بانک دی', shortName: 'دی' },
  '505785': { code: 'iz', name: 'بانک ایران زمین', shortName: 'ایران زمین' },
  '606373': { code: 'mehr', name: 'بانک قرض‌الحسنه مهر ایران', shortName: 'مهر ایران' },
  '639607': { code: 'sarmayeh', name: 'بانک سرمایه', shortName: 'سرمایه' },
  '628023': { code: 'maskan', name: 'بانک مسکن', shortName: 'مسکن' },
};

/**
 * Clean string and convert Persian/Arabic numerals to standard ASCII digits
 */
export function normalizeCardDigits(str: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  let normalized = str;
  for (let i = 0; i < 10; i++) {
    normalized = normalized
      .replace(new RegExp(persianDigits[i], 'g'), String(i))
      .replace(new RegExp(arabicDigits[i], 'g'), String(i));
  }
  return normalized;
}

/**
 * Format 16 digits into 4 groups of 4: "6037 9912 3456 7890"
 */
export function formatCardNumberDisplay(digits: string): string {
  const clean = digits.replace(/\D/g, '').slice(0, 16);
  const parts: string[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    parts.push(clean.substring(i, i + 4));
  }
  return parts.join(' ');
}

/**
 * Identify Iranian Bank details from 16-digit card number or 6-digit prefix
 */
export function detectBankFromCardNumber(cardNumber: string): { bankCode: string; bankName: string; bankShortName: string } {
  const clean = normalizeCardDigits(cardNumber).replace(/\D/g, '');
  const prefix6 = clean.substring(0, 6);

  if (CARD_BIN_MAP[prefix6]) {
    const info = CARD_BIN_MAP[prefix6];
    return {
      bankCode: info.code,
      bankName: info.name,
      bankShortName: info.shortName,
    };
  }

  // Fallback check against IRANIAN_BANKS
  for (const [code, bank] of Object.entries(IRANIAN_BANKS)) {
    if (bank.defaultCardPrefix && clean.startsWith(bank.defaultCardPrefix)) {
      return {
        bankCode: code,
        bankName: bank.name,
        bankShortName: bank.shortName,
      };
    }
  }

  return {
    bankCode: 'unknown',
    bankName: 'بانک عضو شتاب',
    bankShortName: 'بانک',
  };
}

/**
 * Extract 16-digit card numbers from scanned OCR text or patterns
 */
export function parseCardFromText(text: string): DetectedCardResult | null {
  const cleanText = normalizeCardDigits(text);

  // Match 16 continuous digits or 4 groups of 4 digits
  const regex16 = /\b(\d{4})[\s\-–—]?(\d{4})[\s\-–—]?(\d{4})[\s\-–—]?(\d{4})\b/;
  const match = cleanText.match(regex16);

  if (match) {
    const full16 = `${match[1]}${match[2]}${match[3]}${match[4]}`;
    const bank = detectBankFromCardNumber(full16);
    return {
      cardNumber: full16,
      formattedCardNumber: `${match[1]} ${match[2]} ${match[3]} ${match[4]}`,
      last4Digits: match[4],
      bankCode: bank.bankCode,
      bankName: bank.bankName,
      bankShortName: bank.bankShortName,
      confidence: bank.bankCode !== 'unknown' ? 0.95 : 0.85,
    };
  }

  // Fallback: look for 16 consecutive digits anywhere
  const allDigits = cleanText.replace(/\D/g, '');
  if (allDigits.length >= 16) {
    // Search for known BIN prefix in the digits
    for (let i = 0; i <= allDigits.length - 16; i++) {
      const candidate = allDigits.substring(i, i + 16);
      const prefix6 = candidate.substring(0, 6);
      if (CARD_BIN_MAP[prefix6]) {
        const bank = CARD_BIN_MAP[prefix6];
        return {
          cardNumber: candidate,
          formattedCardNumber: formatCardNumberDisplay(candidate),
          last4Digits: candidate.substring(12, 16),
          bankCode: bank.code,
          bankName: bank.name,
          bankShortName: bank.shortName,
          confidence: 0.92,
        };
      }
    }

    // Default first 16 digits
    const candidate = allDigits.substring(0, 16);
    const bank = detectBankFromCardNumber(candidate);
    return {
      cardNumber: candidate,
      formattedCardNumber: formatCardNumberDisplay(candidate),
      last4Digits: candidate.substring(12, 16),
      bankCode: bank.bankCode,
      bankName: bank.bankName,
      bankShortName: bank.bankShortName,
      confidence: 0.8,
    };
  }

  return null;
}
