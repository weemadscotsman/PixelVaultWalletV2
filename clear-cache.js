// Clear all cached wallet and session data
console.log("Clearing all cached wallet and session data...");

// Clear localStorage
if (typeof localStorage !== 'undefined') {
  localStorage.removeItem('pvx_session_token');
  localStorage.removeItem('activeWallet');
  localStorage.removeItem('pvx_token');
  localStorage.clear();
  console.log("LocalStorage cleared");
}

// Clear sessionStorage
if (typeof sessionStorage !== 'undefined') {
  sessionStorage.clear();
  console.log("SessionStorage cleared");
}

console.log("Cache cleared successfully");