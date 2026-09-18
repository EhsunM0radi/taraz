import { ParsedSmsResult, TransactionType } from '../types';
import { CryptoEngine } from '../crypto/encryption';
import { toEnglishDigits, formatJalaliDate } from '../utils/persianDate';
import { IRANIAN_BANKS } from './bankRules';

export type { ParsedSmsResult } from '../types';

export class SmsParserEngine {
  /**
   * Parse an Iranian Bank SMS into a normalized ParsedSmsResult
   */
  public static async parse(rawSms: string, senderAddress?: string): Promise<ParsedSmsResult> {
    const cleanText = toEnglishDigits(rawSms).replace(/\r\n/g, '\n').trim();
    const reasons: string[] = [];
    let confidence = 0.25;

    // 1. Identify Bank
    const bank = this.detectBank(cleanText, senderAddress);
    if (bank) {
      confidence += 0.20;
      reasons.push(`بانک شناسایی شد: ${bank.name}`);
    } else {
      reasons.push('بانک صادرکننده با قطعیت شناسایی نشد (پیش‌فرض)');
    }

    const bankCode = bank ? bank.code : 'mellat';
    const bankName = bank ? bank.name : 'بانک پیش‌فرض';

    // 2. Identify Transaction Type
    const typeInfo = this.detectTransactionType(cleanText);
    const type = typeInfo.type;
    confidence += typeInfo.confidence;
    reasons.push(`نوع تراکنش: ${typeInfo.label}`);

    // 3. Extract Amount and Currency Unit (Rial vs Toman)
    const amountInfo = this.extractAmount(cleanText);
    if (amountInfo.amount > 0) {
      confidence += 0.25;
      reasons.push(`مبلغ استخراج شد: ${amountInfo.amount.toLocaleString()} تومان (${amountInfo.rawUnit === 'IRR' ? 'مبنای ریال' : 'مبنای تومان'})`);
    } else {
      reasons.push('هشدار: مبلغ مشخصی در متن یافت نشد');
    }

    // 4. Extract Card Number (Masked or last 4 digits)
    const cardLast4 = this.extractCardLast4(cleanText);
    if (cardLast4) {
      confidence += 0.15;
      reasons.push(`شماره کارت استخراج شد: ****${cardLast4}`);
    }

    // 5. Extract Account Number
    const accountNumber = this.extractAccountNumber(cleanText);
    if (accountNumber && !cardLast4) {
      confidence += 0.10;
      reasons.push(`شماره حساب: ${accountNumber}`);
    }

    // 6. Extract Balance After
    const balanceAfter = this.extractBalance(cleanText);
    if (balanceAfter !== undefined) {
      confidence += 0.15;
      reasons.push(`مانده حساب: ${balanceAfter.toLocaleString()} تومان`);
    }

    // 7. Extract Counterparty or Merchant
    const counterpartyInfo = this.extractCounterparty(cleanText);
    if (counterpartyInfo.name) {
      confidence += 0.10;
      reasons.push(`${counterpartyInfo.isMerchant ? 'پذیرنده / فروشگاه' : 'طرف معامله'}: ${counterpartyInfo.name}`);
    }

    // 8. Extract Tracking Code
    const trackingCode = this.extractTrackingCode(cleanText);

    // 9. Extract Date & Time or fallback to current
    const dateInfo = this.extractDate(cleanText);

    // Bound confidence
    const finalConfidence = Math.min(1.0, Math.max(0.1, Number(confidence.toFixed(2))));

    // Generate Dedup Hash
    const dedupHash = await CryptoEngine.generateSmsDedupHash(
      bankCode,
      amountInfo.amount,
      cardLast4,
      balanceAfter,
      dateInfo.jalaliDate
    );

    return {
      bankCode,
      bankName,
      type,
      amount: amountInfo.amount,
      rawAmount: amountInfo.rawAmount,
      rawUnit: amountInfo.rawUnit,
      cardLast4,
      accountNumber,
      balanceAfter,
      timestamp: dateInfo.timestamp,
      jalaliDate: dateInfo.jalaliDate,
      counterpartyName: !counterpartyInfo.isMerchant ? counterpartyInfo.name : undefined,
      merchantName: counterpartyInfo.isMerchant ? counterpartyInfo.name : undefined,
      confidence: finalConfidence,
      confidenceReasons: reasons,
      trackingCode,
      dedupHash,
      rawSms,
    };
  }

  private static detectBank(text: string, sender?: string) {
    if (sender) {
      for (const key of Object.keys(IRANIAN_BANKS)) {
        const b = IRANIAN_BANKS[key];
        if (b.smsSenders.some(s => sender.toLowerCase().includes(s.toLowerCase()))) {
          return b;
        }
      }
    }

    const lowerText = text.toLowerCase();
    for (const key of Object.keys(IRANIAN_BANKS)) {
      const b = IRANIAN_BANKS[key];
      if (b.keywords.some(k => lowerText.includes(k.toLowerCase()))) {
        return b;
      }
    }
    return null;
  }

  private static detectTransactionType(text: string): { type: TransactionType; label: string; confidence: number } {
    if (/برگشت|استرداد|ابطال خرید/i.test(text)) {
      return { type: 'refund', label: 'برگشت وجه', confidence: 0.15 };
    }
    if (/واریز|دریافت|پایا واریز|ساتنا واریز|انتقال از|حقوق|سود/i.test(text)) {
      return { type: 'income', label: 'واریز / درآمد', confidence: 0.15 };
    }
    if (/کارمزد|کارمزد انتقال|کارمزد پیامک/i.test(text)) {
      return { type: 'fee', label: 'کارمزد بانکی', confidence: 0.15 };
    }
    if (/برداشت وجه نقد|خودپرداز|atm/i.test(text)) {
      return { type: 'withdrawal', label: 'برداشت وجه نقد', confidence: 0.15 };
    }
    if (/انتقال به|کارت به کارت به|پایا به|ساتنا به/i.test(text)) {
      return { type: 'expense', label: 'انتقال وجه / پرداخت', confidence: 0.15 };
    }
    if (/برداشت|خرید|کسر|پرداخت|خرید اینترنتی|پایانه/i.test(text)) {
      return { type: 'expense', label: 'برداشت / خرید', confidence: 0.15 };
    }
    return { type: 'expense', label: 'هزینه (پیش‌فرض)', confidence: 0.05 };
  }

  private static extractAmount(text: string): { amount: number; rawAmount: number; rawUnit: 'IRR' | 'TOMAN' } {
    // Look for patterns like: مبلغ: 4,850,000 ریال or برداشت 350,000 تومان or 4850000 ریال
    const amountRegex = /(?:مبلغ|واریز|برداشت|خرید|پرداخت|انتقال)?[:\s]*([0-9,._]{4,15})\s*(ریال|تومان|ت)/i;
    const match = text.match(amountRegex);

    if (match) {
      const rawNumStr = match[1].replace(/[,._]/g, '');
      const rawVal = parseInt(rawNumStr, 10);
      const unit = match[2].includes('ریال') ? 'IRR' : 'TOMAN';
      if (!isNaN(rawVal) && rawVal > 0) {
        const tomanVal = unit === 'IRR' ? Math.round(rawVal / 10) : rawVal;
        return { amount: tomanVal, rawAmount: rawVal, rawUnit: unit };
      }
    }

    // Secondary fallback: Any number with commas that is likely currency
    const fallbackMatches = text.match(/([0-9]{1,3}(?:,[0-9]{3})+)/g);
    if (fallbackMatches && fallbackMatches.length > 0) {
      const val = parseInt(fallbackMatches[0].replace(/,/g, ''), 10);
      const isRial = text.includes('ریال') || val >= 100000;
      const tomanVal = isRial ? Math.round(val / 10) : val;
      return { amount: tomanVal, rawAmount: val, rawUnit: isRial ? 'IRR' : 'TOMAN' };
    }

    return { amount: 0, rawAmount: 0, rawUnit: 'TOMAN' };
  }

  private static extractCardLast4(text: string): string | undefined {
    // Match patterns like: کارت: 6104********1234 or کارت 1234 or ****9876 or کارت: 9876
    const maskedCardRegex = /(?:کارت|card)?[:\s]*[0-9*]{4,12}\*{2,8}([0-9]{4})/i;
    const maskedMatch = text.match(maskedCardRegex);
    if (maskedMatch && maskedMatch[1]) {
      return maskedMatch[1];
    }

    const shortCardRegex = /(?:کارت|از کارت|به کارت)[:\s]*\*?([0-9]{4})\b/i;
    const shortMatch = text.match(shortCardRegex);
    if (shortMatch && shortMatch[1]) {
      return shortMatch[1];
    }

    return undefined;
  }

  private static extractAccountNumber(text: string): string | undefined {
    const accRegex = /(?:حساب|به حساب|از حساب)[:\s]*([0-9\-]{8,18})/i;
    const match = text.match(accRegex);
    return match ? match[1] : undefined;
  }

  private static extractBalance(text: string): number | undefined {
    const balanceRegex = /(?:مانده|موجودی|مانده حساب|موجودی حساب)[:\s]*([0-9,._]{4,16})\s*(ریال|تومان|ت)?/i;
    const match = text.match(balanceRegex);
    if (match) {
      const rawNumStr = match[1].replace(/[,._]/g, '');
      const rawVal = parseInt(rawNumStr, 10);
      const unit = (match[2] && match[2].includes('تومان')) ? 'TOMAN' : 'IRR';
      if (!isNaN(rawVal)) {
        return unit === 'IRR' ? Math.round(rawVal / 10) : rawVal;
      }
    }
    return undefined;
  }

  private static extractCounterparty(text: string): { name?: string; isMerchant: boolean } {
    // Known popular merchants
    const knownMerchants = [
      { key: 'دیجی‌کالا', name: 'دیجی‌کالا' },
      { key: 'دیجیکالا', name: 'دیجی‌کالا' },
      { key: 'اسنپ فود', name: 'اسنپ فود' },
      { key: 'اسنپ مارکت', name: 'اسنپ مارکت' },
      { key: 'اسنپ', name: 'اسنپ' },
      { key: 'تپسی', name: 'تپسی' },
      { key: 'کافه‌بازار', name: 'کافه‌بازار' },
      { key: 'ایرانسل', name: 'ایرانسل' },
      { key: 'همراه اول', name: 'همراه اول' },
      { key: 'رایتل', name: 'رایتل' },
      { key: 'هایپراستار', name: 'هایپراستار' },
      { key: 'کوروش', name: 'فروشگاه کوروش' },
      { key: 'جانبو', name: 'فروشگاه جانبو' },
    ];

    for (const m of knownMerchants) {
      if (text.includes(m.key)) {
        return { name: m.name, isMerchant: true };
      }
    }

    // Match patterns like: خرید از فروشگاه X, پذیرنده: X, به نام: X, به: X, از: X
    const merchantRegex = /(?:خرید|پذیرنده|فروشگاه|بابت)[:\s]+([^\n\r,0-9]{3,28})/i;
    const mMatch = text.match(merchantRegex);
    if (mMatch && mMatch[1]) {
      const clean = mMatch[1].trim();
      if (!clean.includes('کارت') && !clean.includes('مانده') && clean.length > 2) {
        return { name: clean, isMerchant: true };
      }
    }

    const personRegex = /(?:به نام|به|از|انتقال به)[:\s]+([^\n\r,0-9]{3,25})/i;
    const pMatch = text.match(personRegex);
    if (pMatch && pMatch[1]) {
      const clean = pMatch[1].trim();
      if (!clean.includes('کارت') && !clean.includes('مانده') && clean.length > 2) {
        return { name: clean, isMerchant: false };
      }
    }

    return { isMerchant: false };
  }

  private static extractTrackingCode(text: string): string | undefined {
    const trackRegex = /(?:پیگیری|ارجاع|کد پیگیری|شماره ارجاع|ref)[:\s]*([0-9]{5,12})/i;
    const match = text.match(trackRegex);
    return match ? match[1] : undefined;
  }

  private static extractDate(text: string): { timestamp: number; jalaliDate: string } {
    // Match Jalali date pattern: 1403/06/04 or 1404/06/01
    const dateRegex = /(140[0-9])[\/\-](0[1-9]|1[0-2])[\/\-](0[1-9]|[12][0-9]|3[01])/;
    const match = text.match(dateRegex);

    if (match) {
      const jalaliDate = `${match[1]}/${match[2]}/${match[3]}`;
      return {
        timestamp: Date.now(),
        jalaliDate,
      };
    }

    return {
      timestamp: Date.now(),
      jalaliDate: formatJalaliDate(Date.now()),
    };
  }
}
