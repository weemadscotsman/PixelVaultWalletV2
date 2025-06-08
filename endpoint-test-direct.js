/**
 * DIRECT ENDPOINT TESTING - PVX SYSTEM
 * Tests all critical endpoints that the frontend expects
 */

const TEST_WALLET = 'PVX_1295b5490224b2eb64e9724dc091795a';

const CRITICAL_ENDPOINTS = [
  // Core System
  { method: 'GET', path: '/api/ping', name: 'Health Check' },
  { method: 'GET', path: '/api/health', name: 'System Health' },
  { method: 'GET', path: '/api/status', name: 'System Status' },
  
  // Authentication
  { method: 'GET', path: '/api/auth/status', name: 'Auth Status', auth: true },
  { method: 'GET', path: '/api/auth/me', name: 'User Profile', auth: true },
  
  // Wallet Operations
  { method: 'GET', path: `/api/wallet/${TEST_WALLET}`, name: 'Get Wallet' },
  { method: 'GET', path: `/api/wallet/${TEST_WALLET}/balance`, name: 'Wallet Balance' },
  { method: 'GET', path: `/api/wallet/${TEST_WALLET}/transactions`, name: 'Wallet Transactions' },
  { method: 'GET', path: '/api/wallet/all', name: 'All Wallets' },
  
  // Blockchain Core
  { method: 'GET', path: '/api/blockchain/status', name: 'Blockchain Status' },
  { method: 'GET', path: '/api/blockchain/info', name: 'Blockchain Info' },
  { method: 'GET', path: '/api/blockchain/metrics', name: 'Blockchain Metrics' },
  { method: 'GET', path: '/api/blockchain/trends', name: 'Blockchain Trends' },
  { method: 'GET', path: '/api/blockchain/latest-block', name: 'Latest Block' },
  { method: 'GET', path: '/api/blockchain/blocks', name: 'Recent Blocks' },
  
  // Mining Operations
  { method: 'GET', path: '/api/blockchain/mining/stats', name: 'Mining Stats' },
  { method: 'GET', path: `/api/blockchain/mining/stats/${TEST_WALLET}`, name: 'User Mining Stats' },
  
  // Transaction System
  { method: 'GET', path: '/api/utr/transactions', name: 'UTR Transactions' },
  { method: 'GET', path: '/api/utr/stats', name: 'UTR Stats' },
  
  // Staking System
  { method: 'GET', path: '/api/stake/pools', name: 'Staking Pools' },
  { method: 'GET', path: `/api/stake/user/${TEST_WALLET}`, name: 'User Staking' },
  
  // Governance
  { method: 'GET', path: '/api/governance/proposals', name: 'Governance Proposals' },
  
  // User Features
  { method: 'GET', path: '/api/badges', name: 'Badges System' },
  { method: 'GET', path: `/api/badges/user/${TEST_WALLET}`, name: 'User Badges' },
  { method: 'GET', path: '/api/drops', name: 'Available Drops' },
  { method: 'GET', path: `/api/drops/user/${TEST_WALLET}`, name: 'User Drops' },
  
  // Learning System
  { method: 'GET', path: '/api/learning/modules', name: 'Learning Modules' },
  { method: 'GET', path: `/api/learning/user/${TEST_WALLET}/progress`, name: 'Learning Progress' },
  
  // Thringlets/Companions
  { method: 'GET', path: '/api/thringlets', name: 'Thringlets' },
  { method: 'GET', path: '/api/companions', name: 'Companions', auth: true },
  
  // Health & Monitoring
  { method: 'GET', path: '/api/health/metrics', name: 'Health Metrics' },
  { method: 'GET', path: '/api/health/services', name: 'Service Health' },
  { method: 'GET', path: '/api/health/blockchain', name: 'Blockchain Health' }
];

async function testEndpoint(endpoint) {
  const url = `http://localhost:5000${endpoint.path}`;
  
  try {
    const options = {
      method: endpoint.method,
      headers: { 'Content-Type': 'application/json' }
    };

    const response = await fetch(url, options);
    const data = await response.text();
    
    return {
      name: endpoint.name,
      path: endpoint.path,
      success: response.ok,
      status: response.status,
      hasData: data.length > 0,
      dataPreview: data.substring(0, 100)
    };
  } catch (error) {
    return {
      name: endpoint.name,
      path: endpoint.path,
      success: false,
      status: 0,
      error: error.message
    };
  }
}

async function runDirectTest() {
  console.log('🔍 DIRECT ENDPOINT TESTING - PVX SYSTEM');
  console.log('========================================');
  
  const results = [];
  let passed = 0;
  let failed = 0;
  
  for (const endpoint of CRITICAL_ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${result.name} - ${result.status}`);
      passed++;
    } else {
      console.log(`❌ ${result.name} - ${result.status || 'ERROR'} - ${result.error || 'Failed'}`);
      failed++;
    }
  }
  
  console.log('\n📊 RESULTS SUMMARY');
  console.log('==================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ FAILED ENDPOINTS:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   ${r.name}: ${r.path} - ${r.error || r.status}`);
    });
  }
  
  return results;
}

runDirectTest().catch(console.error);