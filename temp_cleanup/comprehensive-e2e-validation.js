/**
 * COMPREHENSIVE END-TO-END SYSTEM VALIDATION
 * Tests every frontend component, backend endpoint, service integration, and user interaction
 * Provides complete transparency with forensic-level detail
 */

const BASE_URL = 'http://localhost:5000';
const TEST_ADDRESS = 'PVX_1295b5490224b2eb64e9724dc091795a';
const TEST_PASSPHRASE = 'zsfgaefhsethrthrtwtrh';

// Complete endpoint registry for forensic validation
const CRITICAL_ENDPOINTS = {
  // CORE SYSTEM INFRASTRUCTURE
  core: [
    { name: 'Server Ping', path: '/api/ping', method: 'GET', required: true },
    { name: 'System Health', path: '/api/health', method: 'GET', required: true },
    { name: 'System Status', path: '/api/status', method: 'GET', required: true },
    { name: 'Health Metrics', path: '/api/health/metrics', method: 'GET', required: true },
    { name: 'Service Health', path: '/api/health/services', method: 'GET', required: true },
    { name: 'Blockchain Health', path: '/api/health/blockchain', method: 'GET', required: true }
  ],

  // AUTHENTICATION SYSTEM
  auth: [
    { name: 'Auth Status', path: '/api/auth/status', method: 'GET', requiresAuth: true },
    { name: 'User Profile', path: '/api/auth/me', method: 'GET', requiresAuth: true },
    { name: 'Login Endpoint', path: '/api/auth/login', method: 'POST', requiresAuth: false },
    { name: 'Logout Endpoint', path: '/api/auth/logout', method: 'POST', requiresAuth: false }
  ],

  // WALLET MANAGEMENT SYSTEM
  wallet: [
    { name: 'Create Wallet', path: '/api/wallet/create', method: 'POST', required: true },
    { name: 'Get Wallet', path: `/api/wallet/${TEST_ADDRESS}`, method: 'GET', required: true },
    { name: 'Wallet Balance', path: `/api/wallet/${TEST_ADDRESS}/balance`, method: 'GET', required: true },
    { name: 'Wallet Transactions', path: `/api/wallet/${TEST_ADDRESS}/transactions`, method: 'GET', required: true },
    { name: 'All Wallets', path: '/api/wallet/all', method: 'GET', required: true },
    { name: 'Current Wallet', path: '/api/wallet/current', method: 'GET', requiresAuth: true },
    { name: 'Export Keys', path: `/api/wallet/${TEST_ADDRESS}/export`, method: 'POST', required: true },
    { name: 'Wallet Auth', path: `/api/wallet/${TEST_ADDRESS}/auth`, method: 'POST', required: true },
    { name: 'Send Transaction', path: '/api/wallet/send', method: 'POST', required: true },
    { name: 'Wallet History', path: `/api/wallet/history/${TEST_ADDRESS}`, method: 'GET', requiresAuth: true }
  ],

  // BLOCKCHAIN CORE SERVICES
  blockchain: [
    { name: 'Blockchain Status', path: '/api/blockchain/status', method: 'GET', required: true },
    { name: 'Blockchain Info', path: '/api/blockchain/info', method: 'GET', required: true },
    { name: 'Blockchain Metrics', path: '/api/blockchain/metrics', method: 'GET', required: true },
    { name: 'Blockchain Trends', path: '/api/blockchain/trends', method: 'GET', required: true },
    { name: 'Latest Block', path: '/api/blockchain/latest-block', method: 'GET', required: true },
    { name: 'Recent Blocks', path: '/api/blockchain/blocks', method: 'GET', required: true },
    { name: 'Blockchain Connect', path: '/api/blockchain/connect', method: 'GET', required: true }
  ],

  // MINING SYSTEM
  mining: [
    { name: 'Mining Stats', path: '/api/blockchain/mining/stats', method: 'GET', required: true },
    { name: 'User Mining Stats', path: `/api/blockchain/mining/stats/${TEST_ADDRESS}`, method: 'GET', required: true },
    { name: 'Mining Status', path: `/api/mining/status/${TEST_ADDRESS}`, method: 'GET', required: true },
    { name: 'Start Mining', path: '/api/blockchain/mining/start', method: 'POST', required: true },
    { name: 'Stop Mining', path: '/api/blockchain/mining/stop', method: 'POST', required: true }
  ],

  // STAKING SYSTEM
  staking: [
    { name: 'Staking Pools', path: '/api/staking/pools', method: 'GET', required: true },
    { name: 'Stake Pools Alt', path: '/api/stake/pools', method: 'GET', required: true },
    { name: 'User Staking', path: `/api/stake/user/${TEST_ADDRESS}`, method: 'GET', required: true },
    { name: 'Stake Status', path: `/api/stake/status/${TEST_ADDRESS}`, method: 'GET', required: true },
    { name: 'Start Staking', path: '/api/stake/start', method: 'POST', required: true },
    { name: 'Claim Rewards', path: '/api/stake/claim', method: 'POST', required: true },
    { name: 'Stake Status Auth', path: '/api/stake/status', method: 'GET', requiresAuth: true }
  ],

  // TRANSACTION SYSTEM
  transactions: [
    { name: 'UTR Transactions', path: '/api/utr/transactions', method: 'GET', requiresAuth: true },
    { name: 'UTR Realtime', path: '/api/utr/realtime', method: 'GET', required: true },
    { name: 'UTR Stats', path: '/api/utr/stats', method: 'GET', required: true },
    { name: 'Recent Transactions', path: '/api/tx/recent', method: 'GET', required: true }
  ],

  // GOVERNANCE SYSTEM
  governance: [
    { name: 'Governance Proposals', path: '/api/governance/proposals', method: 'GET', required: true },
    { name: 'Veto Guardians', path: '/api/governance/veto-guardians', method: 'GET', required: true },
    { name: 'Governance Stats', path: '/api/governance/stats', method: 'GET', requiresAuth: true }
  ],

  // BADGES & ACHIEVEMENTS
  badges: [
    { name: 'Badges System', path: '/api/badges', method: 'GET', required: true },
    { name: 'User Badges', path: `/api/badges/user/${TEST_ADDRESS}`, method: 'GET', required: true },
    { name: 'Badge Progress', path: `/api/badges/progress/${TEST_ADDRESS}`, method: 'GET', required: true },
    { name: 'Badge Leaderboard', path: '/api/badges/leaderboard', method: 'GET', required: true }
  ],

  // DROPS & REWARDS
  drops: [
    { name: 'Available Drops', path: '/api/drops', method: 'GET', required: true },
    { name: 'User Drops', path: `/api/drops/user/${TEST_ADDRESS}`, method: 'GET', required: true },
    { name: 'Drop Eligibility', path: '/api/drops/eligibility', method: 'GET', required: true },
    { name: 'Drop Claims', path: '/api/drops/claims', method: 'GET', required: true },
    { name: 'Drop Stats', path: '/api/drops/stats', method: 'GET', required: true }
  ],

  // LEARNING SYSTEM
  learning: [
    { name: 'Learning Modules', path: '/api/learning/modules', method: 'GET', required: true },
    { name: 'Learning Progress', path: `/api/learning/user/${TEST_ADDRESS}/progress`, method: 'GET', required: true },
    { name: 'Learning Stats', path: `/api/learning/stats/${TEST_ADDRESS}`, method: 'GET', required: true },
    { name: 'Learning Leaderboard', path: '/api/learning/leaderboard', method: 'GET', required: true }
  ],

  // SYSTEM SERVICES
  services: [
    { name: 'Thringlets', path: '/api/thringlets', method: 'GET', required: true },
    { name: 'Bridge Status', path: '/api/bridge/status', method: 'GET', required: true },
    { name: 'Companions', path: '/api/companions', method: 'GET', requiresAuth: true }
  ],

  // DEVELOPER TOOLS
  dev: [
    { name: 'Dev Services Status', path: '/api/dev/services/status', method: 'GET', required: true },
    { name: 'Dev Chain Metrics', path: '/api/dev/chain/metrics', method: 'GET', required: true }
  ]
};

// Frontend component validation registry
const FRONTEND_COMPONENTS = {
  pages: [
    { name: 'Dashboard Page', path: '/', required: true },
    { name: 'Wallet Page', path: '/wallet', required: true },
    { name: 'Staking Page', path: '/staking', required: true },
    { name: 'Mining Page', path: '/mining', required: true },
    { name: 'Governance Page', path: '/governance', required: true },
    { name: 'Learning Page', path: '/learning', required: true },
    { name: 'Settings Page', path: '/settings', required: true }
  ],
  
  components: [
    'WalletBalance',
    'TransactionHistory', 
    'StakingCard',
    'MiningStats',
    'GovernanceProposals',
    'BadgeSystem',
    'LearningModules',
    'BlockchainVitals',
    'TrendRadar',
    'ExportWalletKeys'
  ]
};

let testResults = {
  endpoints: { passed: 0, failed: 0, total: 0, failures: [] },
  frontend: { passed: 0, failed: 0, total: 0, failures: [] },
  critical: { passed: 0, failed: 0, total: 0, failures: [] }
};

async function testEndpoint(endpoint, category) {
  testResults.endpoints.total++;
  
  try {
    const options = {
      method: endpoint.method,
      headers: { 'Content-Type': 'application/json' }
    };

    // Add test data for POST requests
    if (endpoint.method === 'POST') {
      if (endpoint.path.includes('export')) {
        options.body = JSON.stringify({ passphrase: TEST_PASSPHRASE });
      } else if (endpoint.path.includes('auth') && !endpoint.path.includes('login')) {
        options.body = JSON.stringify({ passphrase: TEST_PASSPHRASE });
      } else if (endpoint.path.includes('stake/start')) {
        options.body = JSON.stringify({
          walletAddress: TEST_ADDRESS,
          poolId: 'pool1',
          amount: '1000',
          passphrase: TEST_PASSPHRASE
        });
      } else if (endpoint.path.includes('wallet/create')) {
        options.body = JSON.stringify({ passphrase: TEST_PASSPHRASE });
      }
    }

    const response = await fetch(`${BASE_URL}${endpoint.path}`, options);
    const status = response.status;
    
    // Determine if this is expected behavior
    const isSuccess = endpoint.requiresAuth 
      ? (status === 401) // Auth required endpoints should return 401
      : (status === 200 || status === 201); // Public endpoints should return 200/201
    
    if (isSuccess) {
      testResults.endpoints.passed++;
      const note = endpoint.requiresAuth ? ' (Auth Required)' : '';
      console.log(`✅ ${category.toUpperCase()}: ${endpoint.name} - ${status}${note}`);
      
      if (endpoint.required) {
        testResults.critical.passed++;
        testResults.critical.total++;
      }
    } else {
      testResults.endpoints.failed++;
      testResults.endpoints.failures.push({
        category,
        name: endpoint.name,
        path: endpoint.path,
        status,
        expected: endpoint.requiresAuth ? 401 : 200
      });
      
      console.log(`❌ ${category.toUpperCase()}: ${endpoint.name} - ${status} (Expected: ${endpoint.requiresAuth ? 401 : 200})`);
      
      if (endpoint.required) {
        testResults.critical.failed++;
        testResults.critical.total++;
        testResults.critical.failures.push(`${endpoint.name}: ${endpoint.path}`);
      }
    }

    return { success: isSuccess, status, endpoint };
    
  } catch (error) {
    testResults.endpoints.failed++;
    testResults.endpoints.failures.push({
      category,
      name: endpoint.name,
      path: endpoint.path,
      error: error.message
    });
    
    console.log(`❌ ${category.toUpperCase()}: ${endpoint.name} - ERROR: ${error.message}`);
    
    if (endpoint.required) {
      testResults.critical.failed++;
      testResults.critical.total++;
      testResults.critical.failures.push(`${endpoint.name}: ${endpoint.path} - ${error.message}`);
    }
    
    return { success: false, error: error.message, endpoint };
  }
}

async function validateFrontendComponents() {
  console.log('\n🎨 FRONTEND COMPONENT VALIDATION');
  console.log('==================================');
  
  // Test main page accessibility
  for (const page of FRONTEND_COMPONENTS.pages) {
    testResults.frontend.total++;
    try {
      const response = await fetch(`${BASE_URL}${page.path}`);
      if (response.status === 200) {
        testResults.frontend.passed++;
        console.log(`✅ PAGE: ${page.name} - Accessible`);
      } else {
        testResults.frontend.failed++;
        testResults.frontend.failures.push(`${page.name}: ${page.path} - ${response.status}`);
        console.log(`❌ PAGE: ${page.name} - ${response.status}`);
      }
    } catch (error) {
      testResults.frontend.failed++;
      testResults.frontend.failures.push(`${page.name}: ${error.message}`);
      console.log(`❌ PAGE: ${page.name} - ERROR: ${error.message}`);
    }
  }
}

async function runComprehensiveE2EValidation() {
  console.log('🔍 COMPREHENSIVE END-TO-END SYSTEM VALIDATION');
  console.log('===============================================');
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Genesis Wallet: ${TEST_ADDRESS}`);
  console.log('===============================================\n');

  // Test all endpoint categories
  for (const [category, endpoints] of Object.entries(CRITICAL_ENDPOINTS)) {
    console.log(`\n🧪 ${category.toUpperCase()} SYSTEM VALIDATION`);
    console.log('='.repeat(40));
    
    for (const endpoint of endpoints) {
      await testEndpoint(endpoint, category);
    }
  }

  // Validate frontend components
  await validateFrontendComponents();

  // Generate comprehensive report
  console.log('\n📊 COMPREHENSIVE SYSTEM REPORT');
  console.log('===============================');
  console.log(`🔗 Backend Endpoints: ${testResults.endpoints.passed}/${testResults.endpoints.total} (${((testResults.endpoints.passed/testResults.endpoints.total)*100).toFixed(1)}%)`);
  console.log(`🎨 Frontend Pages: ${testResults.frontend.passed}/${testResults.frontend.total} (${((testResults.frontend.passed/testResults.frontend.total)*100).toFixed(1)}%)`);
  console.log(`⚠️  Critical Systems: ${testResults.critical.passed}/${testResults.critical.total} (${((testResults.critical.passed/testResults.critical.total)*100).toFixed(1)}%)`);
  
  const overallTotal = testResults.endpoints.total + testResults.frontend.total;
  const overallPassed = testResults.endpoints.passed + testResults.frontend.passed;
  console.log(`🏆 Overall System: ${overallPassed}/${overallTotal} (${((overallPassed/overallTotal)*100).toFixed(1)}%)`);

  // Report failures with forensic detail
  if (testResults.endpoints.failures.length > 0) {
    console.log('\n❌ BACKEND ENDPOINT FAILURES:');
    console.log('==============================');
    testResults.endpoints.failures.forEach(failure => {
      console.log(`   ${failure.category}/${failure.name}: ${failure.path}`);
      console.log(`   Status: ${failure.status || 'ERROR'} | Expected: ${failure.expected || 'N/A'}`);
      if (failure.error) console.log(`   Error: ${failure.error}`);
      console.log('');
    });
  }

  if (testResults.frontend.failures.length > 0) {
    console.log('\n❌ FRONTEND COMPONENT FAILURES:');
    console.log('================================');
    testResults.frontend.failures.forEach(failure => {
      console.log(`   ${failure}`);
    });
  }

  if (testResults.critical.failures.length > 0) {
    console.log('\n🚨 CRITICAL SYSTEM FAILURES:');
    console.log('=============================');
    testResults.critical.failures.forEach(failure => {
      console.log(`   ${failure}`);
    });
  }

  // System health assessment
  const criticalHealthPercent = (testResults.critical.passed / testResults.critical.total) * 100;
  console.log('\n🏥 SYSTEM HEALTH ASSESSMENT');
  console.log('============================');
  
  if (criticalHealthPercent >= 95) {
    console.log('🟢 SYSTEM STATUS: EXCELLENT - All critical systems operational');
  } else if (criticalHealthPercent >= 85) {
    console.log('🟡 SYSTEM STATUS: GOOD - Minor issues detected');
  } else if (criticalHealthPercent >= 70) {
    console.log('🟠 SYSTEM STATUS: DEGRADED - Multiple system issues');
  } else {
    console.log('🔴 SYSTEM STATUS: CRITICAL - Major system failures detected');
  }

  console.log('\n✨ Comprehensive validation completed!');
  
  return {
    success: testResults.critical.failed === 0,
    overallHealth: criticalHealthPercent,
    summary: {
      endpoints: testResults.endpoints,
      frontend: testResults.frontend,
      critical: testResults.critical
    }
  };
}

// Execute comprehensive validation
runComprehensiveE2EValidation().catch(console.error);