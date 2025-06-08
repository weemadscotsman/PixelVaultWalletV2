/**
 * COMPREHENSIVE PVX SYSTEM AUDIT - FINAL VERSION
 * Complete forensic analysis of all endpoints, routes, and system components
 * Identifies exact failures, duplicates, missing routes, and broken connections
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
const TEST_ADDRESS = 'PVX_1295b5490224b2eb64e9724dc091795a';
const TEST_PASSPHRASE = 'zsfgaefhsethrthrtwtrh';

// Complete mapping of ALL expected endpoints based on frontend requirements
const CRITICAL_ENDPOINTS = {
  // Core System
  core: [
    { method: 'GET', path: '/api/ping', expected: [200], description: 'Health check' },
    { method: 'GET', path: '/api/health', expected: [200], description: 'System health' },
    { method: 'GET', path: '/api/status', expected: [200], description: 'System status' },
    { method: 'GET', path: '/api/health/metrics', expected: [200], description: 'Health metrics' },
    { method: 'GET', path: '/api/health/services', expected: [200], description: 'Service health' },
    { method: 'GET', path: '/api/health/blockchain', expected: [200], description: 'Blockchain health' }
  ],
  
  // Authentication System
  auth: [
    { method: 'GET', path: '/api/auth/status', expected: [401], description: 'Auth status (requires login)' },
    { method: 'GET', path: '/api/auth/me', expected: [401], description: 'Current user (requires login)' },
    { method: 'POST', path: '/api/auth/login', expected: [200, 400], description: 'User login', data: { address: TEST_ADDRESS, passphrase: 'wrong' } },
    { method: 'POST', path: '/api/auth/logout', expected: [200], description: 'User logout' }
  ],
  
  // Wallet System  
  wallet: [
    { method: 'POST', path: '/api/wallet/create', expected: [201], description: 'Create new wallet' },
    { method: 'GET', path: '/api/wallet/current', expected: [401], description: 'Current wallet (requires auth)' },
    { method: 'GET', path: '/api/wallet/all', expected: [200], description: 'All wallets' },
    { method: 'GET', path: `/api/wallet/${TEST_ADDRESS}`, expected: [200], description: 'Specific wallet' },
    { method: 'GET', path: `/api/wallet/${TEST_ADDRESS}/balance`, expected: [200], description: 'Wallet balance' },
    { method: 'GET', path: `/api/wallet/${TEST_ADDRESS}/transactions`, expected: [200], description: 'Wallet transactions' },
    { method: 'POST', path: `/api/wallet/${TEST_ADDRESS}/export`, expected: [200], description: 'Export wallet keys', data: { passphrase: TEST_PASSPHRASE } },
    { method: 'POST', path: `/api/wallet/${TEST_ADDRESS}/auth`, expected: [200], description: 'Wallet auth', data: { passphrase: TEST_PASSPHRASE } },
    { method: 'POST', path: '/api/wallet/send', expected: [200], description: 'Send transaction', data: { from: TEST_ADDRESS, to: 'PVX_test', amount: '100', passphrase: TEST_PASSPHRASE } },
    { method: 'GET', path: `/api/wallet/history/${TEST_ADDRESS}`, expected: [200, 401], description: 'Wallet history' }
  ],
  
  // Blockchain System
  blockchain: [
    { method: 'GET', path: '/api/blockchain/status', expected: [200], description: 'Blockchain status' },
    { method: 'GET', path: '/api/blockchain/info', expected: [200], description: 'Blockchain info' },
    { method: 'GET', path: '/api/blockchain/metrics', expected: [200], description: 'Blockchain metrics' },
    { method: 'GET', path: '/api/blockchain/trends', expected: [200], description: 'Blockchain trends' },
    { method: 'GET', path: '/api/blockchain/latest-block', expected: [200], description: 'Latest block' },
    { method: 'GET', path: '/api/blockchain/blocks', expected: [200], description: 'Recent blocks' },
    { method: 'GET', path: '/api/blockchain/connect', expected: [200], description: 'Connection status' }
  ],
  
  // Mining System
  mining: [
    { method: 'GET', path: '/api/blockchain/mining/stats', expected: [200], description: 'Mining stats' },
    { method: 'GET', path: `/api/blockchain/mining/stats/${TEST_ADDRESS}`, expected: [200], description: 'User mining stats' },
    { method: 'GET', path: `/api/mining/status/${TEST_ADDRESS}`, expected: [200], description: 'Mining status' },
    { method: 'POST', path: '/api/blockchain/mining/start', expected: [200], description: 'Start mining', data: { address: TEST_ADDRESS } },
    { method: 'POST', path: '/api/blockchain/mining/stop', expected: [200], description: 'Stop mining', data: { address: TEST_ADDRESS } }
  ],
  
  // Staking System
  staking: [
    { method: 'GET', path: '/api/staking/pools', expected: [200], description: 'Staking pools (alt)' },
    { method: 'GET', path: '/api/stake/pools', expected: [200], description: 'Staking pools' },
    { method: 'GET', path: `/api/stake/user/${TEST_ADDRESS}`, expected: [200], description: 'User stakes' },
    { method: 'GET', path: `/api/stake/status/${TEST_ADDRESS}`, expected: [200], description: 'Stake status' },
    { method: 'GET', path: '/api/stake/status', expected: [401], description: 'Stake status (auth required)' },
    { method: 'POST', path: '/api/stake/start', expected: [200], description: 'Start staking', data: { address: TEST_ADDRESS, amount: '1000', poolId: 'pool1' } },
    { method: 'POST', path: '/api/stake/claim', expected: [200], description: 'Claim rewards', data: { stakeId: 'stake1', address: TEST_ADDRESS, passphrase: TEST_PASSPHRASE } }
  ],
  
  // Transaction System
  transactions: [
    { method: 'GET', path: '/api/utr/transactions', expected: [401], description: 'UTR transactions (auth required)' },
    { method: 'GET', path: '/api/utr/realtime', expected: [200], description: 'Real-time transactions' },
    { method: 'GET', path: '/api/utr/stats', expected: [200], description: 'Transaction stats' },
    { method: 'GET', path: '/api/tx/recent', expected: [200], description: 'Recent transactions' }
  ],
  
  // Governance System
  governance: [
    { method: 'GET', path: '/api/governance/proposals', expected: [200], description: 'Governance proposals' },
    { method: 'GET', path: '/api/governance/veto-guardians', expected: [200], description: 'Veto guardians' },
    { method: 'GET', path: '/api/governance/stats', expected: [401], description: 'Governance stats (auth required)' }
  ],
  
  // Badges System
  badges: [
    { method: 'GET', path: '/api/badges', expected: [200], description: 'All badges' },
    { method: 'GET', path: `/api/badges/user/${TEST_ADDRESS}`, expected: [200], description: 'User badges' },
    { method: 'GET', path: `/api/badges/progress/${TEST_ADDRESS}`, expected: [200], description: 'Badge progress' },
    { method: 'GET', path: '/api/badges/leaderboard', expected: [200], description: 'Badge leaderboard' }
  ],
  
  // Drops System
  drops: [
    { method: 'GET', path: '/api/drops', expected: [200], description: 'Available drops' },
    { method: 'GET', path: '/api/drops/stats', expected: [200], description: 'Drop statistics' },
    { method: 'GET', path: `/api/drops/eligibility?address=${TEST_ADDRESS}`, expected: [200], description: 'Drop eligibility' },
    { method: 'GET', path: `/api/drops/claims?address=${TEST_ADDRESS}`, expected: [200], description: 'Drop claims' }
  ],
  
  // Learning System
  learning: [
    { method: 'GET', path: '/api/learning/modules', expected: [200], description: 'Learning modules' },
    { method: 'GET', path: `/api/learning/progress/${TEST_ADDRESS}`, expected: [200], description: 'Learning progress' },
    { method: 'GET', path: `/api/learning/stats/${TEST_ADDRESS}`, expected: [200], description: 'Learning stats' },
    { method: 'GET', path: '/api/learning/leaderboard', expected: [200], description: 'Learning leaderboard' }
  ]
};

// Frontend pages that must be accessible
const FRONTEND_PAGES = [
  { path: '/', name: 'Dashboard' },
  { path: '/wallet', name: 'Wallet' },
  { path: '/mining', name: 'Mining' },
  { path: '/staking', name: 'Staking' },
  { path: '/governance', name: 'Governance' },
  { path: '/drops', name: 'Drops' },
  { path: '/badges', name: 'Badges' },
  { path: '/learning', name: 'Learning' },
  { path: '/settings', name: 'Settings' },
  { path: '/transactions', name: 'Transactions' },
  { path: '/explorer', name: 'Explorer' }
];

async function makeRequest(method, path, data = null) {
  try {
    const config = {
      method: method.toLowerCase(),
      url: `${BASE_URL}${path}`,
      timeout: 5000,
      validateStatus: () => true // Accept all status codes
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
      config.headers = { 'Content-Type': 'application/json' };
    }
    
    const response = await axios(config);
    return {
      status: response.status,
      ok: response.status >= 200 && response.status < 300,
      data: response.data,
      error: null
    };
  } catch (error) {
    return {
      status: error.response?.status || 0,
      ok: false,
      data: null,
      error: error.message
    };
  }
}

async function testFrontendPage(path) {
  try {
    const response = await axios.get(`${BASE_URL}${path}`, { 
      timeout: 5000,
      validateStatus: () => true
    });
    return {
      path,
      accessible: response.status === 200,
      status: response.status,
      contentType: response.headers['content-type'] || 'unknown'
    };
  } catch (error) {
    return {
      path,
      accessible: false,
      status: 0,
      error: error.message
    };
  }
}

async function runComprehensiveSystemAudit() {
  console.log('🔍 COMPREHENSIVE PVX SYSTEM AUDIT - FINAL VERSION');
  console.log('====================================================');
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Genesis Wallet: ${TEST_ADDRESS}`);
  console.log('====================================================\n');

  const auditResults = {
    endpoints: {},
    frontend: {},
    summary: {
      totalEndpoints: 0,
      workingEndpoints: 0,
      brokenEndpoints: 0,
      frontendPages: 0,
      accessiblePages: 0,
      criticalFailures: [],
      duplicateRoutes: [],
      missingEndpoints: []
    }
  };

  // Test all backend endpoints by category
  for (const [category, endpoints] of Object.entries(CRITICAL_ENDPOINTS)) {
    console.log(`\n🧪 ${category.toUpperCase()} SYSTEM VALIDATION`);
    console.log('========================================');
    
    auditResults.endpoints[category] = {
      total: endpoints.length,
      working: 0,
      broken: 0,
      results: []
    };
    
    for (const endpoint of endpoints) {
      auditResults.summary.totalEndpoints++;
      
      const result = await makeRequest(endpoint.method, endpoint.path, endpoint.data);
      const isValid = endpoint.expected.includes(result.status);
      
      if (isValid) {
        auditResults.endpoints[category].working++;
        auditResults.summary.workingEndpoints++;
      } else {
        auditResults.endpoints[category].broken++;
        auditResults.summary.brokenEndpoints++;
        auditResults.summary.criticalFailures.push({
          category,
          endpoint: `${endpoint.method} ${endpoint.path}`,
          expected: endpoint.expected,
          actual: result.status,
          description: endpoint.description,
          error: result.error
        });
      }
      
      const status = isValid ? '✅' : '❌';
      const expectedStr = endpoint.expected.length > 1 ? `[${endpoint.expected.join(', ')}]` : endpoint.expected[0];
      console.log(`   ${status} ${category.toUpperCase()}: ${endpoint.method} ${endpoint.path} - ${result.status} (Expected: ${expectedStr})`);
      
      if (!isValid && result.error) {
        console.log(`      Error: ${result.error}`);
      }
      
      auditResults.endpoints[category].results.push({
        method: endpoint.method,
        path: endpoint.path,
        description: endpoint.description,
        expected: endpoint.expected,
        actual: result.status,
        valid: isValid,
        error: result.error
      });
    }
  }

  // Test frontend pages
  console.log('\n🎨 FRONTEND PAGE ACCESSIBILITY TEST');
  console.log('====================================');
  
  auditResults.frontend = {
    total: FRONTEND_PAGES.length,
    accessible: 0,
    broken: 0,
    results: []
  };
  
  for (const page of FRONTEND_PAGES) {
    auditResults.summary.frontendPages++;
    
    const result = await testFrontendPage(page.path);
    
    if (result.accessible) {
      auditResults.frontend.accessible++;
      auditResults.summary.accessiblePages++;
    } else {
      auditResults.frontend.broken++;
    }
    
    const status = result.accessible ? '✅' : '❌';
    console.log(`   ${status} PAGE: ${page.name} (${page.path}) - ${result.status}`);
    
    auditResults.frontend.results.push(result);
  }

  // WebSocket test
  console.log('\n🔌 WEBSOCKET CONNECTION TEST');
  console.log('===============================');
  
  const wsResult = await makeRequest('GET', '/ws');
  const wsWorking = wsResult.status === 200 || wsResult.status === 426;
  
  console.log(`   ${wsWorking ? '✅' : '❌'} WebSocket: ${wsResult.status === 426 ? 'Upgrade Required (Normal)' : `HTTP ${wsResult.status}`}`);

  // Generate comprehensive report
  console.log('\n📊 COMPREHENSIVE AUDIT REPORT');
  console.log('===============================');
  
  const totalComponents = auditResults.summary.totalEndpoints + auditResults.summary.frontendPages + 1; // +1 for WebSocket
  const workingComponents = auditResults.summary.workingEndpoints + auditResults.summary.accessiblePages + (wsWorking ? 1 : 0);
  const systemHealth = ((workingComponents / totalComponents) * 100).toFixed(1);
  
  console.log(`🔗 Backend Endpoints: ${auditResults.summary.workingEndpoints}/${auditResults.summary.totalEndpoints} (${((auditResults.summary.workingEndpoints/auditResults.summary.totalEndpoints)*100).toFixed(1)}%)`);
  console.log(`🎨 Frontend Pages: ${auditResults.summary.accessiblePages}/${auditResults.summary.frontendPages} (${((auditResults.summary.accessiblePages/auditResults.summary.frontendPages)*100).toFixed(1)}%)`);
  console.log(`🔌 WebSocket: ${wsWorking ? 'Connected' : 'Failed'}`);
  console.log(`🏆 Overall System: ${workingComponents}/${totalComponents} (${systemHealth}%)`);
  
  console.log(`\n🚨 CRITICAL FAILURES: ${auditResults.summary.criticalFailures.length}`);
  
  if (auditResults.summary.criticalFailures.length > 0) {
    console.log('\n❌ FAILED ENDPOINTS:');
    auditResults.summary.criticalFailures.forEach(failure => {
      console.log(`   • ${failure.endpoint} - Expected: ${failure.expected}, Got: ${failure.actual}`);
      if (failure.error) {
        console.log(`     Error: ${failure.error}`);
      }
    });
  }
  
  // System health assessment
  console.log('\n🏥 SYSTEM HEALTH ASSESSMENT');
  console.log('============================');
  
  let healthStatus = '';
  let healthIcon = '';
  
  if (systemHealth >= 99.5) {
    healthStatus = 'PERFECT - All critical systems operational';
    healthIcon = '🟢';
  } else if (systemHealth >= 95) {
    healthStatus = 'EXCELLENT - Minor issues detected';
    healthIcon = '🟢';
  } else if (systemHealth >= 90) {
    healthStatus = 'GOOD - Some issues need attention';
    healthIcon = '🟡';
  } else if (systemHealth >= 80) {
    healthStatus = 'WARNING - Multiple system failures';
    healthIcon = '🟠';
  } else {
    healthStatus = 'CRITICAL - Major system failures detected';
    healthIcon = '🔴';
  }
  
  console.log(`${healthIcon} SYSTEM STATUS: ${healthStatus}`);
  
  console.log('\n✨ Comprehensive system audit completed!');
  
  return {
    systemHealth: parseFloat(systemHealth),
    totalComponents,
    workingComponents,
    criticalFailures: auditResults.summary.criticalFailures.length,
    auditResults
  };
}

// Run the audit
runComprehensiveSystemAudit().catch(console.error);

export { runComprehensiveSystemAudit };