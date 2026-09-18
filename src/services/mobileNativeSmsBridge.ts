import { LocalDatabaseService } from './localDatabase';
import { SmsParserEngine } from '../parser/smsParserEngine';
import { Transaction } from '../types';

export interface MobileNativeSmsEvent {
  sender: string;
  body: string;
  timestamp: number;
}

type NativeSmsListener = (event: MobileNativeSmsEvent, parsedResult: any) => void;

/**
 * MobileNativeSmsBridge:
 * Bridges native Android SMS BroadcastReceiver events to the parsing engine & local database
 */
export class MobileNativeSmsBridge {
  private static listeners: NativeSmsListener[] = [];
  private static isListening = false;

  /**
   * Initialize bridge listener
   */
  public static init(): void {
    if (this.isListening) return;
    this.isListening = true;

    // In React Native environment, native events are dispatched via DeviceEventEmitter or window messages
    if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
      window.addEventListener('message', async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ON_BANK_SMS_RECEIVED') {
            await this.handleIncomingSms(data.payload);
          }
        } catch {}
      });
    }

    // Support standard React Native DeviceEventEmitter or custom window event
    if (typeof window !== 'undefined') {
      window.addEventListener('taraz_native_sms' as any, async (event: CustomEvent<MobileNativeSmsEvent>) => {
        if (event.detail) {
          await this.handleIncomingSms(event.detail);
        }
      });
    }
  }

  /**
   * Process incoming SMS immediately
   */
  public static async handleIncomingSms(sms: MobileNativeSmsEvent): Promise<{ success: boolean; transactionId?: string }> {
    console.log(`📱 [Native SMS Received] From: ${sms.sender}`);
    
    // Parse using our SMS Parser Engine
    const parsed = await SmsParserEngine.parse(sms.body, sms.sender);
    const accounts = LocalDatabaseService.getAccounts();
    const cards = LocalDatabaseService.getCards();

    if (parsed.amount > 0) {
      // Find matching card by last 4 digits
      const matchingCard = cards.find(
        (c) => parsed.cardLast4 && c.last4Digits === parsed.cardLast4
      );
      const targetAccountId = matchingCard?.accountId || accounts[0]?.id;

      if (targetAccountId) {
        const now = Date.now();
        const txId = `tx_${now}_${Math.random().toString(36).substring(2, 7)}`;
        
        const newTx: Transaction = {
          id: txId,
          accountId: targetAccountId,
          cardId: matchingCard?.id,
          cardLast4: parsed.cardLast4,
          type: parsed.type,
          amount: parsed.amount,
          currency: 'TOMAN',
          balanceAfter: parsed.balanceAfter || 0,
          categoryId: parsed.type === 'income' ? 'cat_salary' : 'cat_other_exp',
          timestamp: sms.timestamp || now,
          jalaliDate: parsed.jalaliDate || '',
          description: parsed.counterpartyName ? `تراکنش: ${parsed.counterpartyName}` : (parsed.type === 'income' ? 'واریز بانکی' : 'برداشت بانکی'),
          source: 'sms',
          confidence: parsed.confidence,
          isVerified: true,
          createdAt: now,
          updatedAt: now,
        };

        LocalDatabaseService.saveTransaction(newTx);

        // Notify subscribers
        this.listeners.forEach((listener) => listener(sms, parsed));
        return { success: true, transactionId: txId };
      }
    }

    return { success: false };
  }

  public static subscribe(listener: NativeSmsListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Check if running on mobile device wrapper
   */
  public static isNativeMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).ReactNativeWebView || (window as any).__REACT_NATIVE_BRIDGE__);
  }
}
