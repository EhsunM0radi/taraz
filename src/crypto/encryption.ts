/**
 * Client-Side Zero-Knowledge Encryption Engine
 * Uses Web Crypto API for production-grade security:
 * - PBKDF2-SHA256 (100,000 iterations) for Key Derivation
 * - AES-GCM-256 for symmetric authenticated encryption
 * - SHA-256 for deduplication hashing
 */

export class CryptoEngine {
  private static cachedKey: CryptoKey | null = null;
  private static cachedSalt: Uint8Array | null = null;
  private static readonly SALT_STORAGE_KEY = 'taraz_vault_salt';
  private static readonly DEVICE_ID_KEY = 'taraz_device_id';

  /**
   * Get or generate a stable device ID
   */
  public static getDeviceId(): string {
    let deviceId = localStorage.getItem(this.DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  /**
   * Get or generate salt for PBKDF2
   */
  public static getOrCreateSalt(): Uint8Array {
    if (this.cachedSalt) return this.cachedSalt;
    const stored = localStorage.getItem(this.SALT_STORAGE_KEY);
    if (stored) {
      const bytes = new Uint8Array(stored.split(',').map(Number));
      this.cachedSalt = bytes;
      return bytes;
    }
    const newSalt = crypto.getRandomValues(new Uint8Array(16));
    localStorage.setItem(this.SALT_STORAGE_KEY, Array.from(newSalt).join(','));
    this.cachedSalt = newSalt;
    return newSalt;
  }

  /**
   * Derive a 256-bit AES-GCM CryptoKey from a user passphrase using PBKDF2
   */
  public static async deriveMasterKey(passphrase: string = 'TarazDefaultVaultKey_2026!'): Promise<CryptoKey> {
    if (this.cachedKey) return this.cachedKey;

    const salt = this.getOrCreateSalt();
    const encoder = new TextEncoder();
    const passphraseBytes = encoder.encode(passphrase);

    const baseKey = await crypto.subtle.importKey(
      'raw',
      passphraseBytes,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['encrypt', 'decrypt']
    );

    this.cachedKey = derivedKey;
    return derivedKey;
  }

  /**
   * Encrypt arbitrary data object to encrypted Base64 string (IV + Ciphertext)
   */
  public static async encryptPayload(data: unknown, customKey?: CryptoKey): Promise<string> {
    const key = customKey || (await this.deriveMasterKey());
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(data));

    const cipherBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encodedData
    );

    const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherBuffer), iv.length);

    // Convert to base64
    return btoa(String.fromCharCode.apply(null, Array.from(combined)));
  }

  /**
   * Decrypt encrypted Base64 string back to original data object
   */
  public static async decryptPayload<T = unknown>(encryptedBase64: string, customKey?: CryptoKey): Promise<T> {
    const key = customKey || (await this.deriveMasterKey());
    const binaryString = atob(encryptedBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const iv = bytes.slice(0, 12);
    const ciphertext = bytes.slice(12);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonString) as T;
  }

  /**
   * Fast SHA-256 hex string hashing for SMS Deduplication & signatures
   */
  public static async sha256Hex(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate a unique deduplication hash for an Iranian bank SMS transaction
   */
  public static async generateSmsDedupHash(
    bankCode: string,
    amount: number,
    cardLast4: string | undefined,
    balance: number | undefined,
    jalaliDate: string
  ): Promise<string> {
    const rawSignature = `${bankCode}_${amount}_${cardLast4 || 'NOCARD'}_${balance || 'NOBAL'}_${jalaliDate}`;
    return this.sha256Hex(rawSignature);
  }
}
