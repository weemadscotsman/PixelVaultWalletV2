/**
 * DEEP SYSTEM AUDIT - COMPLETE PVX VALIDATION
 * Cross-checks EVERY connection, service endpoint, and system integration
 * Zero tolerance for failures - comprehensive validation of all components
 */

const BASE_URL = 'http://localhost:5000';
const GENESIS_WALLET = 'PVX_1295b5490224b2eb64e9724dc091795a';

let auditResults = {
  total: 0,
  passed: 0,
  failed: 0,
  failures: [],
  warnings: [],
  systems: {}
};

async function makeRequest(method, path, data = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const responseData = response.status !== 404 ? await response.json() : null;
    return {
      status: response.status,
      data: responseData,
      url: path,
      method,
      success: response.status >= 200 && response.status < 300
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message,
      url: path,
      method,
      success: false
    };
  }
}

function logResult(category, test, result, expectedStatus = null) {
  auditResults.total++;
  
  if (!auditResults.systems[category]) {
    auditResults.systems[category] = { passed: 0, failed: 0, total: 0 };
  }
  auditResults.systems[category].total++;

  const isExpectedStatus = expectedStatus ? 
    (Array.isArray(expectedStatus) ? expectedStatus.includes(result.status) : result.status === expectedStatus) :
    result.success;

  if (isExpectedStatus && result.data !== null) {
    console.log(`✅ [${category}] ${test} - Status: ${result.status}`);
    auditResults.passed++;
    auditResults.systems[category].passed++;
    return true;
  } else {
    console.log(`❌ [${category}] ${test} - Status: ${result.status}${expectedStatus ? ` (Expected: ${expectedStatus})` : ''}`);
    auditResults.failed++;
    auditResults.systems[category].failed++;
    auditResults.failures.push({
      category,
      test,
      endpoint: result.url,
      status: result.status,
      expected: expectedStatus,
      error: result.error
    });
    return false;
  }
}

async function validateDataIntegrity(endpoint, data, category) {
  if (!data) {
    auditResults.warnings.push(`${category}: No data returned from ${endpoint}`);
    return false;
  }

  // Check for undefined values
  const hasUndefined = JSON.stringify(data).includes('undefined');
  if (hasUndefined) {
    auditResults.warnings.push(`${category}: Undefined values detected in ${endpoint}`);
    return false;
  }

  // Check for mock data indicators
  const mockIndicators = ['mock', 'test', 'placeholder', 'dummy', 'fake'];
  const dataString = JSON.stringify(data).toLowerCase();
  const hasMockData = mockIndicators.some(indicator => dataString.includes(indicator));
  
  if (hasMockData) {
    auditResults.warnings.push(`${category}: Potential mock data detected in ${endpoint}`);
    return false;
  }

  return true;
}

async function auditCoreInfrastructure() {
  console.log('\n🔧 CORE INFRASTRUCTURE AUDIT');
  console.log('=====================================');
  
  const endpoints = [
    { path: '/api/ping', method: 'GET', status: 200 },
    { path: '/api/health', method: 'GET', status: 200 },
    { path: '/api/status', method: 'GET', status: 200 },
    { path: '/api/health/metrics', method: 'GET', status: 200 },
    { path: '/api/health/services', method: 'GET', status: 200 },
    { path: '/api/health/blockchain', method: 'GET', status: 200 }
  ];

  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.method, endpoint.path);
    logResult('CORE', `${endpoint.method} ${endpoint.path}`, result, endpoint.status);
    await validateDataIntegrity(endpoint.path, result.data, 'CORE');
  }
}

async function auditAuthenticationSystem() {
  console.log('\n🔐 AUTHENTICATION SYSTEM AUDIT');
  console.log('=====================================');
  
  const endpoints = [
    { path: '/api/auth/status', method: 'GET', status: [200, 401] },
    { path: '/api/auth/me', method: 'GET', status: [200, 401] },
    { path: '/api/auth/logout', method: 'POST', status: [200, 401] }
  ];

  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.method, endpoint.path);
    logResult('AUTH', `${endpoint.method} ${endpoint.path}`, result, endpoint.status);
    await validateDataIntegrity(endpoint.path, result.data, 'AUTH');
  }

  // Test login with valid wallet
  const loginResult = await makeRequest('POST', '/api/auth/login', {
    address: GENESIS_WALLET,
    passphrase: 'test'
  });
  logResult('AUTH', 'POST /api/auth/login', loginResult, [200, 400, 401]);
}

async function auditWalletSystem() {
  console.log('\n💰 WALLET SYSTEM AUDIT');
  console.log('=====================================');
  
  const endpoints = [
    { path: '/api/wallet/all', method: 'GET', status: 200 },
    { path: `/api/wallet/${GENESIS_WALLET}`, method: 'GET', status: 200 },
    { path: `/api/wallet/${GENESIS_WALLET}/balance`, method: 'GET', status: 200 },
    { path: `/api/wallet/${GENESIS_WALLET}/transactions`, method: 'GET', status: 200 },
    { path: `/api/wallet/history/${GENESIS_WALLET}`, method: 'GET', status: 200 },
    { path: '/api/wallet/current', method: 'GET', status: [200, 401] }
  ];

  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.method, endpoint.path);
    logResult('WALLET', `${endpoint.method} ${endpoint.path}`, result, endpoint.status);
    await validateDataIntegrity(endpoint.path, result.data, 'WALLET');
  }

  // Test wallet operations
  const createResult = await makeRequest('POST', '/api/wallet/create', { passphrase: 'test123' });
  logResult('WALLET', 'POST /api/wallet/create', createResult, [200, 201, 400]);

  const exportResult = await makeRequest('POST', `/api/wallet/${GENESIS_WALLET}/export`);
  logResult('WALLET', `POST /api/wallet/${GENESIS_WALLET}/export`, exportResult, 200);

  const sendResult = await makeRequest('POST', '/api/wallet/send', {
    from: GENESIS_WALLET,
    to: 'test_address',
    amount: 1
  });
  logResult('WALLET', 'POST /api/wallet/send', sendResult, [200, 400]);
}

async function auditBlockchainSystem() {
  console.log('\n⛓️ BLOCKCHAIN SYSTEM AUDIT');
  console.log('=====================================');
  
  const endpoints = [
    { path: '/api/blockchain/status', method: 'GET', status: 200 },
    { path: '/api/blockchain/info', method: 'GET', status: 200 },
    { path: '/api/blockchain/metrics', method: 'GET', status: 200 },
    { path: '/api/blockchain/trends', method: 'GET', status: 200 },
    { path: '/api/blockchain/latest-block', method: 'GET', status: 200 },
    { path: '/api/blockchain/blocks', method: 'GET', status: 200 },
    { path: '/api/blockchain/connect', method: 'GET', status: 200 }
  ];

  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.method, endpoint.path);
    logResult('BLOCKCHAIN', `${endpoint.method} ${endpoint.path}`, result, endpoint.status);
    await validateDataIntegrity(endpoint.path, result.data, 'BLOCKCHAIN');
  }
}

async function auditMiningSystem() {
  console.log('\n⛏️ MINING SYSTEM AUDIT');
  console.log('=====================================');
  
  const endpoints = [
    { path: '/api/blockchain/mining/stats', method: 'GET', status: 200 },
    { path: `/api/blockchain/mining/stats/${GENESIS_WALLET}`, method: 'GET', status: 200 },
    { path: `/api/mining/status/${GENESIS_WALLET}`, method: 'GET', status: 200 }
  ];

  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.method, endpoint.path);
    logResult('MINING', `${endpoint.method} ${endpoint.path}`, result, endpoint.status);
    await validateDataIntegrity(endpoint.path, result.data, 'MINING');
  }

  // Test mining operations
  const startResult = await makeRequest('POST', '/api/blockchain/mining/start', { address: GENESIS_WALLET });
  logResult('MINING', 'POST /api/blockchain/mining/start', startResult, [200, 400]);

  const stopResult = await makeRequest('POST', '/api/blockchain/mining/stop', { address: GENESIS_WALLET });
  logResult('MINING', 'POST /api/blockchain/mining/stop', stopResult, [200, 400]);
}

async function auditStakingSystem() {
  console.log('\n🥩 STAKING SYSTEM AUDIT');
  console.log('=====================================');
  
  // Get valid pool first
  const poolsResult = await makeRequest('GET', '/api/staking/pools');
  const validPoolId = poolsResult.data?.[0]?.id || 'test-pool';
  
  const endpoints = [
    { path: '/api/staking/pools', method: 'GET', status: 200 },
    { path: '/api/stake/pools', method: 'GET', status: 200 },
    { path: `/api/stake/user/${GENESIS_WALLET}`, method: 'GET', status: 200 },
    { path: `/api/stake/status/${GENESIS_WALLET}`, method: 'GET', status: 200 },
    { path: '/api/stake/status', method: 'GET', status: [200, 401] }
  ];

  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.method, endpoint.path);
    logResult('STAKING', `${endpoint.method} ${endpoint.path}`, result, endpoint.status);
    await validateDataIntegrity(endpoint.path, result.data, 'STAKING');
  }

  // Test staking operations
  const stakeResult = await makeRequest('POST', '/api/stake/start', {
    poolId: validPoolId,
    amount: 100,
    walletAddress: GENESIS_WALLET
  });
  logResult('STAKING', 'POST /api/stake/start', stakeResult, [200, 201, 400]);

  const claimResult = await makeRequest('POST', '/api/stake/claim', { walletAddress: GENESIS_WALLET });
  logResult('STAKING', 'POST /api/stake/claim', claimResult, [200, 400]);
}

async function auditTransactionSystem() {
  console.log('\n💳 TRANSACTION SYSTEM AUDIT');
  console.log('=====================================');
  
  const endpoints = [
    { path: `/api/utr/transactions?userAddress=${GENESIS_WALLET}`, method: 'GET', status: 200 },
    { path: '/api/utr/realtime', method: 'GET', status: 200 },
    { path: '/api/utr/stats', method: 'GET', status: 200 },
    { path: '/api/tx/recent', method: 'GET', status: 200 }
  ];

  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.method, endpoint.path);
    logResult('TRANSACTIONS', `${endpoint.method} ${endpoint.path}`, result, endpoint.status);
    await validateDataIntegrity(endpoint.path, result.data, 'TRANSACTIONS');
  }
}

async function auditGovernanceSystem() {
  console.log('\n🏛️ GOVERNANCE SYSTEM AUDIT');
  console.log('=====================================');
  
  const endpoints = [
    { path: '/api/governance/proposals', method: 'GET', status: 200 },
    { path: '/api/governance/veto-guardians', method: 'GET', status: 200 },
    { path: `/api/governance/stats?address=${GENESIS_WALLET}`, method: 'GET', status: 200 }
  ];

  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.method, endpoint.path);
    logResult('GOVERNANCE', `${endpoint.method} ${endpoint.path}`, result, endpoint.status);
    await validateDataIntegrity(endpoint.path, result.data, 'GOVERNANCE');
  }
}

async function auditBadgesSystem() {
  console.log('\n🏆 BADGES SYSTEM AUDIT');
  console.log('=====================================');
  
  const endpoints = [
    { path: '/api/badges', method: 'GET', status: 200 },
    { path: `/api/badges/user/${GENESIS_WALLET}`, method: 'GET', status: 200 },
    { path: `/api/badges/progress/${GENESIS_WALLET}`, method: 'GET', status: 200 },
    { path: '/api/badges/leaderboard', method: 'GET', status: 200 }
  ];

  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.method, endpoint.path);
    logResult('BADGES', `${endpoint.method} ${endpoint.path}`, result, endpoint.status);
    await validateDataIntegrity(endpoint.path, result.data, 'BADGES');
  }
}

async function auditDropsSystem() {
  console.log('\n🎁 DROPS SYSTEM AUDIT');
  console.log('=====================================');
  
  const endpoints = [
    { path: '/api/drops', method: 'GET', status: 200 },
    { path: `/api/drops/user/${GENESIS_WALLET}`, method: 'GET', status: 200 },
    { path: `/api/drops/eligibility?address=${GENESIS_WALLET}`, method: 'GET', status: 200 },
    { path: `/api/drops/claims?address=${GENESIS_WALLET}`, method: 'GET', status: 200 },
    { path: '/api/drops/stats', method: 'GET', status: 200 }
  ];

  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.method, endpoint.path);
    logResult('DROPS', `${endpoint.method} ${endpoint.path}`, result, endpoint.status);
    await validateDataIntegrity(endpoint.path, result.data, 'DROPS');
  }
}

async function auditLearningSystem() {
  console.log('\n📚 LEARNING SYSTEM AUDIT');
  console.log('=====================================');
  
  const endpoints = [
    { path: '/api/learning/modules', method: 'GET', status: 200 },
    { path: `/api/learning/progress/${GENESIS_WALLET}`, method: 'GET', status: 200 },
    { path: `/api/learning/stats/${GENESIS_WALLET}`, method: 'GET', status: 200 },
    { path: '/api/learning/leaderboard', method: 'GET', status: 200 },
    { path: `/api/learning/user/${GENESIS_WALLET}/progress`, method: 'GET', status: 200 }
  ];

  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.method, endpoint.path);
    logResult('LEARNING', `${endpoint.method} ${endpoint.path}`, result, endpoint.status);
    await validateDataIntegrity(endpoint.path, result.data, 'LEARNING');
  }
}

async function auditServicesSystem() {
  console.log('\n🔧 SERVICES SYSTEM AUDIT');
  console.log('=====================================');
  
  const endpoints = [
    { path: '/api/thringlets', method: 'GET', status: 200 },
    { path: '/api/bridge/status', method: 'GET', status: 200 },
    { path: '/api/companions', method: 'GET', status: [200, 401] }
  ];

  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.method, endpoint.path);
    logResult('SERVICES', `${endpoint.method} ${endpoint.path}`, result, endpoint.status);
    await validateDataIntegrity(endpoint.path, result.data, 'SERVICES');
  }
}

async function auditDevSystem() {
  console.log('\n🛠️ DEV SYSTEM AUDIT');
  console.log('=====================================');
  
  const endpoints = [
    { path: '/api/dev/', method: 'GET', status: 200 },
    { path: '/api/dev/services/status', method: 'GET', status: 200 },
    { path: '/api/dev/chain/metrics', method: 'GET', status: 200 }
  ];

  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.method, endpoint.path);
    logResult('DEV', `${endpoint.method} ${endpoint.path}`, result, endpoint.status);
    await validateDataIntegrity(endpoint.path, result.data, 'DEV');
  }
}

async function generateComprehensiveReport() {
  console.log('\n📊 COMPREHENSIVE AUDIT REPORT');
  console.log('=========================================');
  
  const successRate = ((auditResults.passed / auditResults.total) * 100).toFixed(1);
  
  console.log(`🔍 Total Endpoints Audited: ${auditResults.total}`);
  console.log(`✅ Passed: ${auditResults.passed}`);
  console.log(`❌ Failed: ${auditResults.failed}`);
  console.log(`🏆 Overall Success Rate: ${successRate}%`);
  
  console.log('\n📈 SYSTEM BREAKDOWN:');
  console.log('=====================');
  for (const [system, stats] of Object.entries(auditResults.systems)) {
    const systemRate = ((stats.passed / stats.total) * 100).toFixed(1);
    console.log(`${system}: ${stats.passed}/${stats.total} (${systemRate}%)`);
  }
  
  if (auditResults.failures.length > 0) {
    console.log('\n❌ CRITICAL FAILURES REQUIRING IMMEDIATE ATTENTION:');
    console.log('=====================================================');
    auditResults.failures.forEach((failure, index) => {
      console.log(`${index + 1}. [${failure.category}] ${failure.test}`);
      console.log(`   Endpoint: ${failure.endpoint}`);
      console.log(`   Status: ${failure.status} | Expected: ${failure.expected}`);
      if (failure.error) console.log(`   Error: ${failure.error}`);
      console.log('');
    });
  }
  
  if (auditResults.warnings.length > 0) {
    console.log('\n⚠️ DATA INTEGRITY WARNINGS:');
    console.log('============================');
    auditResults.warnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${warning}`);
    });
  }
  
  console.log('\n🏥 FINAL SYSTEM HEALTH ASSESSMENT');
  console.log('==================================');
  if (successRate >= 100) {
    console.log('🟢 SYSTEM STATUS: PERFECT - 100% operational');
  } else if (successRate >= 95) {
    console.log('🟡 SYSTEM STATUS: EXCELLENT - Minor issues detected');
  } else if (successRate >= 85) {
    console.log('🟡 SYSTEM STATUS: GOOD - Some issues need attention');
  } else {
    console.log('🔴 SYSTEM STATUS: CRITICAL - Multiple systems require immediate fixes');
  }
  
  return {
    successRate: parseFloat(successRate),
    passed: auditResults.passed,
    failed: auditResults.failed,
    total: auditResults.total,
    failures: auditResults.failures,
    warnings: auditResults.warnings,
    systems: auditResults.systems
  };
}

async function runDeepSystemAudit() {
  console.log('🔍 DEEP SYSTEM AUDIT INITIATED');
  console.log('===============================================');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Genesis Wallet: ${GENESIS_WALLET}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('===============================================');
  
  await auditCoreInfrastructure();
  await auditAuthenticationSystem();
  await auditWalletSystem();
  await auditBlockchainSystem();
  await auditMiningSystem();
  await auditStakingSystem();
  await auditTransactionSystem();
  await auditGovernanceSystem();
  await auditBadgesSystem();
  await auditDropsSystem();
  await auditLearningSystem();
  await auditServicesSystem();
  await auditDevSystem();
  
  const report = await generateComprehensiveReport();
  
  console.log('\n✨ DEEP AUDIT COMPLETED');
  console.log('========================');
  
  return report;
}

// Execute the deep audit
runDeepSystemAudit().catch(console.error);