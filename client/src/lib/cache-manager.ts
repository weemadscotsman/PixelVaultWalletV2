// Cache management utilities for PVX blockchain

export class CacheManager {
  private static readonly CORRUPTED_WALLET = 'PVX_1295b5490224b2eb64e9724dc091795a';
  
  static clearCorruptedData(): void {
    const storedWallet = localStorage.getItem('activeWallet');
    const storedToken = localStorage.getItem('pvx_session_token');
    
    // Clear if we detect the corrupted wallet reference
    if (storedWallet === this.CORRUPTED_WALLET) {
      localStorage.removeItem('activeWallet');
      localStorage.removeItem('pvx_session_token');
      localStorage.removeItem('pvx_token');
      console.log('Cleared corrupted wallet cache');
    }
    
    // Clear invalid tokens
    if (storedToken && storedWallet === this.CORRUPTED_WALLET) {
      localStorage.removeItem('pvx_session_token');
      console.log('Cleared invalid session token');
    }
  }
  
  static initializeCleanState(): void {
    this.clearCorruptedData();
  }
  
  static setWalletConnection(address: string, sessionToken: string): void {
    localStorage.setItem('activeWallet', address);
    localStorage.setItem('pvx_session_token', sessionToken);
    console.log(`Wallet connected: ${address}`);
  }
  
  static clearWalletConnection(): void {
    localStorage.removeItem('activeWallet');
    localStorage.removeItem('pvx_session_token');
    console.log('Wallet disconnected');
  }
}