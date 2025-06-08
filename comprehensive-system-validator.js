/**
 * COMPREHENSIVE PVX SYSTEM VALIDATOR
 * Tests every frontend component, backend endpoint, and service integration
 * Provides forensic-level detail with zero tolerance for failures
 */

const BASE_URL = 'http://localhost:5000';
const TEST_ADDRESS = 'PVX_1295b5490224b2eb64e9724dc091795a';
const TEST_PASSPHRASE = 'zsfgaefhsethrthrtwtrh';

// Complete endpoint registry - every single endpoint that should exist
const COMPLETE_ENDPOINT_REGISTRY = {
  core: [
    { method: 'GET', path: '/api/ping', expected: 200 },
    { method: 'GET', path: '/api/health', expected: 200 },
    { method: 'GET', path: '/api/status', expected: 200 },
    { method: 'GET', path: '/api/health/metrics', expected: 200 },
    { method: 'GET', path: '/api/health/services', expected: 200 },
    { method: 'GET', path: '/api/health/blockchain', expected: 200 }
  ],
  auth: [
    { method: 'GET', path: '/api/auth/status', expected: 401 },
    { method: 'GET', path: '/api/auth/me', expected: 401 },
    { method: 'POST', path: '/api/auth/login', data: { username: 'test', password: 'test' }, expected: [200, 400] },
    { method: 'POST', path: '/api/auth/logout', expected: 200 }
  ],
  wallet: [
    { method: 'POST', path: '/api/wallet/create', expected: 201 },
    { method: 'GET', path: '/api/wallet/current', expected: 401 },
    { method: 'GET', path: '/api/wallet/all', expected: 200 },
    { method: 'GET', path: `/api/wallet/${TEST_ADDRESS}`, expected: 200 },
    { method: 'GET', path: `/api/wallet/${TEST_ADDRESS}/balance`, expected: 200 },
    { method: 'GET', path: `/api/wallet/${TEST_ADDRESS}/transactions`, expected: 200 },
    { method: 'POST', path: `/api/wallet/${TEST_ADDRESS}/export`, data: { passphrase: TEST_PASSPHRASE }, expected: 200 },
    { method: 'POST', path: `/api/wallet/${TEST_ADDRESS}/auth`, data: { passphrase: TEST_PASSPHRASE }, expected: 200 },
    { method: 'POST', path: '/api/wallet/send', data: { from: TEST_ADDRESS, to: 'PVX_test', amount: '100', passphrase: TEST_PASSPHRASE }, expected: 200 },
    { method: 'GET', path: `/api/wallet/history/${TEST_ADDRESS}`, expected: [200, 401] }
  ],
  blockchain: [
    { method: 'GET', path: '/api/blockchain/status', expected: 200 },
    { method: 'GET', path: '/api/blockchain/info', expected: 200 },
    { method: 'GET', path: '/api/blockchain/metrics', expected: 200 },
    { method: 'GET', path: '/api/blockchain/trends', expected: 200 },
    { method: 'GET', path: '/api/blockchain/latest-block', expected: 200 },
    { method: 'GET', path: '/api/blockchain/blocks', expected: 200 },
    { method: 'GET', path: '/api/blockchain/connect', expected: 200 }
  ],
  mining: [
    { method: 'GET', path: '/api/blockchain/mining/stats', expected: 200 },
    { method: 'GET', path: `/api/blockchain/mining/stats/${TEST_ADDRESS}`, expected: 200 },
    { method: 'GET', path: `/api/mining/status/${TEST_ADDRESS}`, expected: 200 },
    { method: 'POST', path: '/api/blockchain/mining/start', data: { address: TEST_ADDRESS }, expected: 200 },
    { method: 'POST', path: '/api/blockchain/mining/stop', data: { address: TEST_ADDRESS }, expected: 200 }
  ],
  staking: [
    { method: 'GET', path: '/api/staking/pools', expected: 200 },
    { method: 'GET', path: '/api/stake/pools', expected: 200 },
    { method: 'GET', path: `/api/stake/user/${TEST_ADDRESS}`, expected: 200 },
    { method: 'GET', path: `/api/stake/status/${TEST_ADDRESS}`, expected: 200 },
    { method: 'GET', path: '/api/stake/status', expected: 401 },
    { method: 'POST', path: '/api/stake/start', data: { address: TEST_ADDRESS, amount: '1000', poolId: 'pool1' }, expected: 200 },
    { method: 'POST', path: '/api/stake/claim', data: { stakeId: 'stake1', address: TEST_ADDRESS, passphrase: TEST_PASSPHRASE }, expected: 200 }
  ],
  transactions: [
    { method: 'GET', path: '/api/utr/transactions', expected: 401 },
    { method: 'GET', path: '/api/utr/realtime', expected: 200 },
    { method: 'GET', path: '/api/utr/stats', expected: 200 },
    { method: 'GET', path: '/api/tx/recent', expected: 200 }
  ],
  governance: [
    { method: 'GET', path: '/api/governance/proposals', expected: 200 },
    { method: 'GET', path: '/api/governance/veto-guardians', expected: 200 },
    { method: 'GET', path: '/api/governance/stats', expected: 401 }
  ],
  badges: [
    { method: 'GET', path: '/api/badges', expected: 200 },
    { method: 'GET', path: `/api/badges/user/${TEST_ADDRESS}`, expected: 200 },
    { method: 'GET', path: `/api/badges/progress/${TEST_ADDRESS}`, expected: 200 },
    { method: 'GET', path: '/api/badges/leaderboard', expected: 200 }
  ],
  drops: [
    { method: 'GET', path: '/api/drops', expected: 200 },
    { method: 'GET', path: `/api/drops/user/${TEST_ADDRESS}`, expected: 200 },
    { method: 'GET', path: '/api/drops/eligibility', expected: 200 },
    { method: 'GET', path: '/api/drops/claims', expected: 200 },
    { method: 'GET', path: '/api/drops/stats', expected: 200 }
  ],
  learning: [
    { method: 'GET', path: '/api/learning/modules', expected: 200 },
    { method: 'GET', path: `/api/learning/progress/${TEST_ADDRESS}`, expected: 200 },
    { method: 'GET', path: `/api/learning/stats/${TEST_ADDRESS}`, expected: 200 },
    { method: 'GET', path: '/api/learning/leaderboard', expected: 200 },
    { method: 'GET', path: `/api/learning/user/${TEST_ADDRESS}/progress`, expected: 200 }
  ],
  services: [
    { method: 'GET', path: '/api/thringlets', expected: 200 },
    { method: 'GET', path: '/api/bridge/status', expected: 200 },
    { method: 'GET', path: '/api/companions', expected: 401 }
  ],
  dev: [
    { method: 'GET', path: '/api/dev/services/status', expected: 200 },
    { method: 'GET', path: '/api/dev/chain/metrics', expected: 200 }
  ]
};

// Frontend component registry
const FRONTEND_COMPONENTS = [
  { name: 'Dashboard', path: '/', critical: true },
  { name: 'Wallet', path: '/wallet', critical: true },
  { name: 'Staking', path: '/staking', critical: true },
  { name: 'Mining', path: '/mining', critical: true },
  { name: 'Governance', path: '/governance', critical: true },
  { name: 'Learning', path: '/learning', critical: true },
  { name: 'Settings', path: '/settings', critical: true },
  { name: 'Transactions', path: '/transactions', critical: false },
  { name: 'Explorer', path: '/explorer', critical: false }
];

async function makeRequest(method, path, data = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${BASE_URL}${path}`, options);
    return {
      status: response.status,
      ok: response.ok,
      data: await response.json().catch(() => ({}))
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

function validateEndpoint(result, expected, method, path) {
  const isExpectedArray = Array.isArray(expected);
  const isValid = isExpectedArray ? expected.includes(result.status) : result.status === expected;
  
  return {
    valid: isValid,
    method,
    path,
    status: result.status,
    expected,
    data: result.data,
    error: result.error
  };
}

async function testEndpointCategory(categoryName, endpoints) {
  console.log(`\n🧪 ${categoryName.toUpperCase()} SYSTEM VALIDATION`);
  console.log('========================================');
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.method, endpoint.path, endpoint.data);
    const validation = validateEndpoint(result, endpoint.expected, endpoint.method, endpoint.path);
    
    const status = validation.valid ? '✅' : '❌';
    const expectedText = Array.isArray(endpoint.expected) 
      ? `[${endpoint.expected.join(', ')}]` 
      : endpoint.expected;
    
    console.log(`${status} ${categoryName.toUpperCase()}: ${endpoint.method} ${endpoint.path} - ${result.status} (Expected: ${expectedText})`);
    
    if (!validation.valid) {
      console.log(`   ⚠️  Error: Expected ${expectedText}, got ${result.status}`);
      if (result.error) {
        console.log(`   ⚠️  Details: ${result.error}`);
      }
    }
    
    results.push(validation);
  }
  
  return results;
}

async function testFrontendComponents() {
  console.log('\n🎨 FRONTEND COMPONENT VALIDATION');
  console.log('==================================');
  
  const results = [];
  
  for (const component of FRONTEND_COMPONENTS) {
    try {
      // Test if component route exists by checking for 404
      const response = await fetch(`${BASE_URL}${component.path}`);
      const accessible = response.status !== 404;
      
      console.log(`${accessible ? '✅' : '❌'} PAGE: ${component.name} - ${accessible ? 'Accessible' : 'Not Found'}`);
      
      results.push({
        name: component.name,
        path: component.path,
        accessible,
        critical: component.critical
      });
    } catch (error) {
      console.log(`❌ PAGE: ${component.name} - Error: ${error.message}`);
      results.push({
        name: component.name,
        path: component.path,
        accessible: false,
        critical: component.critical,
        error: error.message
      });
    }
  }
  
  return results;
}

async function runComprehensiveValidation() {
  console.log('🔍 COMPREHENSIVE PVX SYSTEM VALIDATOR');
  console.log('===============================================');
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Genesis Wallet: ${TEST_ADDRESS}`);
  console.log('===============================================\n');

  let allResults = [];
  let totalEndpoints = 0;
  let validEndpoints = 0;
  let criticalFailures = [];

  // Test all endpoint categories
  for (const [categoryName, endpoints] of Object.entries(COMPLETE_ENDPOINT_REGISTRY)) {
    const categoryResults = await testEndpointCategory(categoryName, endpoints);
    allResults = allResults.concat(categoryResults);
    
    totalEndpoints += endpoints.length;
    validEndpoints += categoryResults.filter(r => r.valid).length;
    
    // Track critical failures
    const failures = categoryResults.filter(r => !r.valid);
    criticalFailures = criticalFailures.concat(failures);
  }

  // Test frontend components
  const frontendResults = await testFrontendComponents();
  const accessibleComponents = frontendResults.filter(r => r.accessible).length;
  const totalComponents = frontendResults.length;

  // Generate comprehensive report
  console.log('\n📊 COMPREHENSIVE SYSTEM REPORT');
  console.log('===============================');
  console.log(`🔗 Backend Endpoints: ${validEndpoints}/${totalEndpoints} (${((validEndpoints/totalEndpoints)*100).toFixed(1)}%)`);
  console.log(`🎨 Frontend Pages: ${accessibleComponents}/${totalComponents} (${((accessibleComponents/totalComponents)*100).toFixed(1)}%)`);
  
  const criticalEndpoints = totalEndpoints - criticalFailures.length;
  console.log(`⚠️  Critical Systems: ${criticalEndpoints}/${totalEndpoints} (${((criticalEndpoints/totalEndpoints)*100).toFixed(1)}%)`);
  
  const overallHealth = ((validEndpoints + accessibleComponents) / (totalEndpoints + totalComponents)) * 100;
  console.log(`🏆 Overall System: ${validEndpoints + accessibleComponents}/${totalEndpoints + totalComponents} (${overallHealth.toFixed(1)}%)`);

  // Detail all failures
  if (criticalFailures.length > 0) {
    console.log('\n❌ BACKEND ENDPOINT FAILURES:');
    console.log('==============================');
    criticalFailures.forEach(failure => {
      console.log(`   ${failure.method} ${failure.path}`);
      console.log(`   Status: ${failure.status} | Expected: ${Array.isArray(failure.expected) ? failure.expected.join(', ') : failure.expected}`);
      if (failure.error) {
        console.log(`   Error: ${failure.error}`);
      }
      console.log('');
    });
  }

  // Detail frontend failures
  const frontendFailures = frontendResults.filter(r => !r.accessible);
  if (frontendFailures.length > 0) {
    console.log('\n❌ FRONTEND COMPONENT FAILURES:');
    console.log('================================');
    frontendFailures.forEach(failure => {
      console.log(`   ${failure.name}: ${failure.path}`);
      if (failure.error) {
        console.log(`   Error: ${failure.error}`);
      }
      console.log('');
    });
  }

  // System health assessment
  console.log('\n🏥 SYSTEM HEALTH ASSESSMENT');
  console.log('============================');
  if (overallHealth >= 95) {
    console.log('🟢 SYSTEM STATUS: EXCELLENT - All systems operational');
  } else if (overallHealth >= 85) {
    console.log('🟡 SYSTEM STATUS: GOOD - Minor issues detected');
  } else if (overallHealth >= 70) {
    console.log('🟠 SYSTEM STATUS: WARNING - Multiple issues require attention');
  } else {
    console.log('🔴 SYSTEM STATUS: CRITICAL - Major system failures detected');
  }

  console.log('\n✨ Comprehensive validation completed!');
  
  return {
    overallHealth,
    totalEndpoints,
    validEndpoints,
    totalComponents,
    accessibleComponents,
    criticalFailures,
    frontendFailures,
    allResults
  };
}

// Run the comprehensive validation
runComprehensiveValidation().catch(console.error);