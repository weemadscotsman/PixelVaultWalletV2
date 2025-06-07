// Emergency cache clearing for corrupted wallet data
const CORRUPTED_WALLET = 'PVX_1295b5490224b2eb64e9724dc091795a';

// Execute immediately when this module loads
(function forceClearCorruptedCache() {
  try {
    const activeWallet = localStorage.getItem('activeWallet');
    
    if (activeWallet === CORRUPTED_WALLET) {
      // Nuclear option - clear everything
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear any IndexedDB data
      if ('indexedDB' in window) {
        indexedDB.deleteDatabase('tanstack-query-offline-cache');
      }
      
      // Force reload to ensure clean state
      console.log('Emergency cache cleared - reloading application');
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  } catch (error) {
    console.error('Cache clear error:', error);
  }
})();