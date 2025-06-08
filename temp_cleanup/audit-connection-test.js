// Comprehensive Frontend-Backend Connection Audit
// Tests all API endpoints and service integrations

const baseUrl = 'http://localhost:5000';

// Test session token for authenticated requests
let sessionToken = null;

async function testEndpoint(method, endpoint, data = null, requiresAuth = false) {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (requiresAuth && sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`;
    }
    
    const options = {
      method,
      headers,
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`✅ ${method} ${endpoint}: ${response.status}`);
    if (!response.ok) {
      console.log(`   Error: ${result.error || result.message}`);
    }
    
    return { status: response.status, data: result, ok: response.ok };
  } catch (error) {
    console.log(`❌ ${method} ${endpoint}: FAILED - ${error.message}`);
    return { status: 0, error: error.message, ok: false };
  }
}

async function auditAllConnections() {
  console.log('🔍 STARTING COMPREHENSIVE PVX CHAIN CONNECTION AUDIT\n');
  
  // 1. HEALTH & STATUS ENDPOINTS
  console.log('=== HEALTH & STATUS ===');
  await testEndpoint('GET', '/api/health');
  await testEndpoint('GET', '/api/status');
  await testEndpoint('GET', '/api/ping');
  
  // 2. WALLET SERVICE TESTS
  console.log('\n=== WALLET SERVICE ===');
  const walletResult = await testEndpoint('POST', '/api/wallet/create', {
    passphrase: 'audit-test-wallet-123'
  });
  
  if (walletResult.ok && walletResult.data.wallet) {
    const testAddress = walletResult.data.wallet.address;
    sessionToken = walletResult.data.sessionToken;
    console.log(`   Created test wallet: ${testAddress}`);
    console.log(`   Session token: ${sessionToken ? 'OBTAINED' : 'MISSING'}`);
    
    await testEndpoint('GET', '/api/wallet/all');
    await testEndpoint('GET', `/api/wallet/${testAddress}`);
    await testEndpoint('GET', '/api/wallet/current', null, true);
    await testEndpoint('GET', `/api/wallet/history/${testAddress}`, null, true);
  }
  
  // 3. AUTHENTICATION SYSTEM
  console.log('\n=== AUTHENTICATION SYSTEM ===');
  await testEndpoint('GET', '/api/auth/status', null, true);
  await testEndpoint('GET', '/api/auth/me', null, true);
  
  // 4. BLOCKCHAIN CORE SERVICE
  console.log('\n=== BLOCKCHAIN CORE ===');
  await testEndpoint('GET', '/api/blockchain/status');
  await testEndpoint('GET', '/api/blockchain/info');
  await testEndpoint('GET', '/api/blockchain/metrics');
  await testEndpoint('GET', '/api/blockchain/trends');
  await testEndpoint('GET', '/api/blockchain/latest-block');
  await testEndpoint('GET', '/api/blockchain/blocks');
  await testEndpoint('GET', '/api/blockchain/connect');
  
  // 5. MINING ENGINE
  console.log('\n=== MINING ENGINE ===');
  if (sessionToken) {
    await testEndpoint('GET', `/api/blockchain/mining/stats/test-address`, null, true);
    await testEndpoint('POST', '/api/blockchain/mining/start', {
      address: 'test-address'
    }, true);
  }
  
  // 6. STAKING PROTOCOL
  console.log('\n=== STAKING PROTOCOL ===');
  await testEndpoint('GET', '/api/staking/pools');
  await testEndpoint('GET', '/api/stake/pools');
  if (sessionToken) {
    await testEndpoint('GET', '/api/stake/status', null, true);
    await testEndpoint('POST', '/api/stake/start', {
      poolId: 'pool1',
      amount: '100'
    }, true);
  }
  
  // 7. GOVERNANCE MODULE
  console.log('\n=== GOVERNANCE MODULE ===');
  await testEndpoint('GET', '/api/governance/proposals');
  await testEndpoint('GET', '/api/governance/veto-guardians');
  if (sessionToken) {
    await testEndpoint('GET', '/api/governance/stats', null, true);
  }
  
  // 8. DROPS & BADGES SYSTEM
  console.log('\n=== DROPS & BADGES ===');
  await testEndpoint('GET', '/api/drops');
  await testEndpoint('GET', '/api/drops/stats');
  await testEndpoint('GET', '/api/badges');
  await testEndpoint('GET', '/api/badges/leaderboard');
  if (sessionToken) {
    await testEndpoint('GET', '/api/drops/eligibility', null, true);
    await testEndpoint('GET', '/api/drops/claims', null, true);
    await testEndpoint('GET', '/api/badges/user/test-address', null, true);
    await testEndpoint('GET', '/api/badges/progress/test-address', null, true);
  }
  
  // 9. LEARNING MODULES
  console.log('\n=== LEARNING MODULES ===');
  await testEndpoint('GET', '/api/learning/modules');
  await testEndpoint('GET', '/api/learning/leaderboard');
  if (sessionToken) {
    await testEndpoint('GET', '/api/learning/stats/test-address', null, true);
    await testEndpoint('GET', '/api/learning/progress/test-address', null, true);
  }
  
  // 10. UTR TRANSACTION PROCESSOR
  console.log('\n=== UTR TRANSACTION PROCESSOR ===');
  await testEndpoint('GET', '/api/utr/stats');
  await testEndpoint('GET', '/api/utr/realtime');
  if (sessionToken) {
    await testEndpoint('GET', '/api/utr/transactions', null, true);
  }
  await testEndpoint('GET', '/api/tx/recent');
  
  // 11. DEVELOPER DASHBOARD
  console.log('\n=== DEVELOPER DASHBOARD ===');
  await testEndpoint('GET', '/api/dev/services/status');
  await testEndpoint('GET', '/api/dev/chain/metrics');
  await testEndpoint('POST', '/api/dev/services/test-service/toggle', { enabled: false });
  await testEndpoint('POST', '/api/dev/services/test-service/restart');
  
  // 12. THRINGLET COMPANIONS
  console.log('\n=== THRINGLET COMPANIONS ===');
  if (sessionToken) {
    await testEndpoint('GET', '/api/companions', null, true);
    await testEndpoint('POST', '/api/companions/create', {
      name: 'Test Companion',
      personality: 'friendly'
    }, true);
  }
  
  console.log('\n🔍 AUDIT COMPLETE - Check results above for any failed connections');
}

// Run the audit
auditAllConnections().catch(console.error);