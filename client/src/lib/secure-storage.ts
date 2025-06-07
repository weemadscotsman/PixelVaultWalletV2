/**
 * Secure Local Storage Management for PVX Platform
 * Handles encrypted storage of sensitive data like session tokens and wallet keys
 */

import CryptoJS from 'crypto-js';

interface SecureStorageConfig {
  encryptionKey?: string;
  namespace?: string;
  expiration?: number;
}

interface StoredData {
  value: any;
  timestamp: number;
  expiration?: number;
}

class SecureStorage {
  private encryptionKey: string;
  private namespace: string;

  constructor(config: SecureStorageConfig = {}) {
    // Generate or use provided encryption key
    this.encryptionKey = config.encryptionKey || this.generateEncryptionKey();
    this.namespace = config.namespace || 'pvx_secure_';
    
    // Store encryption key securely (in production, this should be derived from user credentials)
    if (!localStorage.getItem(`${this.namespace}key`)) {
      localStorage.setItem(`${this.namespace}key`, this.encryptionKey);
    } else {
      this.encryptionKey = localStorage.getItem(`${this.namespace}key`) || this.encryptionKey;
    }
  }

  private generateEncryptionKey(): string {
    return CryptoJS.lib.WordArray.random(256/8).toString();
  }

  private encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
  }

  private decrypt(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      throw new Error('Failed to decrypt data');
    }
  }

  private getStorageKey(key: string): string {
    return `${this.namespace}${key}`;
  }

  /**
   * Store data securely with optional expiration
   */
  setItem(key: string, value: any, expirationMinutes?: number): void {
    try {
      const storageData: StoredData = {
        value,
        timestamp: Date.now(),
        expiration: expirationMinutes ? Date.now() + (expirationMinutes * 60 * 1000) : undefined
      };

      const serialized = JSON.stringify(storageData);
      const encrypted = this.encrypt(serialized);
      localStorage.setItem(this.getStorageKey(key), encrypted);
    } catch (error) {
      console.error('SecureStorage: Failed to store data', error);
      throw new Error('Failed to store secure data');
    }
  }

  /**
   * Retrieve and decrypt stored data
   */
  getItem(key: string): any {
    try {
      const encrypted = localStorage.getItem(this.getStorageKey(key));
      if (!encrypted) return null;

      const decrypted = this.decrypt(encrypted);
      const storageData: StoredData = JSON.parse(decrypted);

      // Check expiration
      if (storageData.expiration && Date.now() > storageData.expiration) {
        this.removeItem(key);
        return null;
      }

      return storageData.value;
    } catch (error) {
      console.error('SecureStorage: Failed to retrieve data', error);
      this.removeItem(key); // Remove corrupted data
      return null;
    }
  }

  /**
   * Remove stored data
   */
  removeItem(key: string): void {
    localStorage.removeItem(this.getStorageKey(key));
  }

  /**
   * Clear all secure storage for this namespace
   */
  clear(): void {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.namespace));
    keys.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Check if item exists and is not expired
   */
  hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  }

  /**
   * Get all keys in this namespace
   */
  getAllKeys(): string[] {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(this.namespace))
      .map(key => key.replace(this.namespace, ''));
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats(): { totalItems: number; totalSize: number; namespace: string } {
    const keys = this.getAllKeys();
    let totalSize = 0;
    
    keys.forEach(key => {
      const item = localStorage.getItem(this.getStorageKey(key));
      if (item) totalSize += item.length;
    });

    return {
      totalItems: keys.length,
      totalSize,
      namespace: this.namespace
    };
  }
}

// Create secure storage instances for different data types
export const sessionStorage = new SecureStorage({ 
  namespace: 'pvx_session_',
  expiration: 24 * 60 // 24 hours default
});

export const walletStorage = new SecureStorage({ 
  namespace: 'pvx_wallet_' 
});

export const userPreferencesStorage = new SecureStorage({ 
  namespace: 'pvx_prefs_' 
});

// Session token management
export const SessionManager = {
  setToken(token: string, expirationHours: number = 24): void {
    sessionStorage.setItem('token', token, expirationHours * 60);
  },

  getToken(): string | null {
    return sessionStorage.getItem('token');
  },

  clearToken(): void {
    sessionStorage.removeItem('token');
  },

  isValidSession(): boolean {
    return sessionStorage.hasItem('token');
  },

  setUserData(userData: any): void {
    sessionStorage.setItem('user_data', userData, 24 * 60);
  },

  getUserData(): any {
    return sessionStorage.getItem('user_data');
  },

  clearSession(): void {
    sessionStorage.clear();
  }
};

// Wallet key management
export const WalletManager = {
  storeWalletData(address: string, encryptedPrivateKey: string, metadata: any): void {
    walletStorage.setItem(`wallet_${address}`, {
      encryptedPrivateKey,
      metadata,
      createdAt: Date.now()
    });
  },

  getWalletData(address: string): any {
    return walletStorage.getItem(`wallet_${address}`);
  },

  removeWallet(address: string): void {
    walletStorage.removeItem(`wallet_${address}`);
  },

  getAllWallets(): string[] {
    return walletStorage.getAllKeys()
      .filter(key => key.startsWith('wallet_'))
      .map(key => key.replace('wallet_', ''));
  },

  setActiveWallet(address: string): void {
    walletStorage.setItem('active_wallet', address);
  },

  getActiveWallet(): string | null {
    return walletStorage.getItem('active_wallet');
  }
};

// User preferences management
export const PreferencesManager = {
  setTheme(theme: 'dark' | 'light'): void {
    userPreferencesStorage.setItem('theme', theme);
  },

  getTheme(): 'dark' | 'light' {
    return userPreferencesStorage.getItem('theme') || 'dark';
  },

  setLanguage(language: string): void {
    userPreferencesStorage.setItem('language', language);
  },

  getLanguage(): string {
    return userPreferencesStorage.getItem('language') || 'en';
  },

  setNotifications(enabled: boolean): void {
    userPreferencesStorage.setItem('notifications', enabled);
  },

  getNotifications(): boolean {
    return userPreferencesStorage.getItem('notifications') !== false;
  },

  setAutoLock(minutes: number): void {
    userPreferencesStorage.setItem('auto_lock', minutes);
  },

  getAutoLock(): number {
    return userPreferencesStorage.getItem('auto_lock') || 30;
  }
};

export default SecureStorage;