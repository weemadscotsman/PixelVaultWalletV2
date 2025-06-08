/**
 * ACCURATE ENDPOINT TESTING - PVX SYSTEM
 * Tests all critical endpoints with proper verification
 */

const BASE_URL = 'http://localhost:5000';
const TEST_ADDRESS = 'PVX_1295b5490224b2eb64e9724dc091795a';

const endpoints = [
  // Core System
  { name: 'Health Check', path: '/api/ping', method: 'GET' },
  { name: 'System Health', path: '/api/health/services', method: 'GET' },
  { name: 'System Status', path: '/api/status', method: 'GET' },
  
  // Authentication (Expected 401 without session)
  { name: 'Auth Status', path: '/api/auth/status', method: 'GET', expectAuth: true },
  { name: 'User Profile', path: '/api/auth/me', method: 'GET', expectAuth: true },
  
  // Wallet Operations
  { name: 'Get Wallet', path: `/api/wallet/${TEST_ADDRESS}`, method: 'GET' },
  { name: 'Wallet Balance', path: `/api/wallet/${TEST_ADDRESS}/balance`, method: 'GET' },
  { name: 'Wallet Transactions', path: `/api/wallet/${TEST_ADDRESS}/transactions`, method: 'GET' },
  { name: 'All Wallets', path: '/api/wallet/all', method: 'GET' },
  
  // Blockchain Data
  { name: 'Blockchain Status', path: '/api/blockchain/status', method: 'GET' },
  { name: 'Blockchain Info', path: '/api/blockchain/info', method: 'GET' },
  { name: 'Blockchain Metrics', path: '/api/blockchain/metrics', method: 'GET' },
  { name: 'Blockchain Trends', path: '/api/blockchain/trends', method: 'GET' },
  { name: 'Latest Block', path: '/api/blockchain/latest-block', method: 'GET' },
  { name: 'Recent Blocks', path: '/api/blockchain/blocks', method: 'GET' },
  
  // Mining
  { name: 'Mining Stats', path: '/api/blockchain/mining/stats', method: 'GET' },
  { name: 'User Mining Stats', path: `/api/blockchain/mining/stats/${TEST_ADDRESS}`, method: 'GET' },
  
  // UTR/Transactions
  { name: 'UTR Transactions', path: '/api/utr/transactions', method: 'GET', expectAuth: true },
  { name: 'UTR Stats', path: '/api/utr/stats', method: 'GET' },
  
  // Staking
  { name: 'Staking Pools', path: '/api/staking/pools', method: 'GET' },
  { name: 'User Staking', path: `/api/stake/user/${TEST_ADDRESS}`, method: 'GET' },
  
  // Governance
  { name: 'Governance Proposals', path: '/api/governance/proposals', method: 'GET' },
  
  // Badges
  { name: 'Badges System', path: '/api/badges', method: 'GET' },
  { name: 'User Badges', path: `/api/badges/user/${TEST_ADDRESS}`, method: 'GET' },
  
  // Drops
  { name: 'Available Drops', path: '/api/drops', method: 'GET' },
  { name: 'User Drops', path: `/api/drops/user/${TEST_ADDRESS}`, method: 'GET' },
  
  // Learning
  { name: 'Learning Modules', path: '/api/learning/modules', method: 'GET' },
  { name: 'Learning Progress', path: `/api/learning/user/${TEST_ADDRESS}/progress`, method: 'GET' },
  
  // System Services
  { name: 'Thringlets', path: '/api/thringlets', method: 'GET' },
  { name: 'Companions', path: '/api/companions', method: 'GET', expectAuth: true },
  { name: 'Health Metrics', path: '/api/health/metrics', method: 'GET' },
  { name: 'Service Health', path: '/api/health/services', method: 'GET' },
  { name: 'Blockchain Health', path: '/api/health/blockchain', method: 'GET' }
];

async function testEndpoint(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint.path}`, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const status = response.status;
    
    // Check if this is an expected auth failure
    if (endpoint.expectAuth && status === 401) {
      return { success: true, status, note: 'Expected auth required' };
    }
    
    // Success for 200 status
    if (status === 200) {
      const data = await response.text();
      return { success: true, status, dataLength: data.length };
    }
    
    // Any other status is a failure
    return { success: false, status, error: `HTTP ${status}` };
    
  } catch (error) {
    return { success: false, status: 'ERROR', error: error.message };
  }
}

async function runAccurateTest() {
  console.log('🎯 ACCURATE ENDPOINT TESTING - PVX SYSTEM');
  console.log('==========================================');
  
  let passed = 0;
  let failed = 0;
  const failures = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    
    if (result.success) {
      console.log(`✅ ${endpoint.name} - ${result.status}${result.note ? ` (${result.note})` : ''}`);
      passed++;
    } else {
      console.log(`❌ ${endpoint.name} - ${result.status} - Failed`);
      failures.push(`   ${endpoint.name}: ${endpoint.path} - ${result.status}`);
      failed++;
    }
  }
  
  console.log('\n📊 ACCURATE RESULTS SUMMARY');
  console.log('============================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failures.length > 0) {
    console.log('\n❌ FAILED ENDPOINTS:');
    failures.forEach(failure => console.log(failure));
  }
}

runAccurateTest().catch(console.error);