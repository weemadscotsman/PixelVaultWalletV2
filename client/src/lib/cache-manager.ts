// Cache management utilities for PVX blockchain

export class CacheManager {
  private static readonly CORRUPTED_WALLET = 'PVX_1295b5490224b2eb64e9724dc091795a';
  
  static clearCorruptedData(): void {
    const storedWallet = localStorage.getItem('activeWallet');
    const storedToken = localStorage.getItem('pvx_session_token');
    
    // Clear if we detect the corrupted wallet reference
    if (storedWallet === this.CORRUPTED_WALLET) {
      localStorage.clear();
      sessionStorage.clear();
      console.log('Cleared all corrupted cache data');
      return;
    }
    
    // Also clear any tokens associated with corrupted wallet
    if (storedToken && storedWallet === this.CORRUPTED_WALLET) {
      localStorage.clear();
      sessionStorage.clear();
      console.log('Cleared invalid session data');
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