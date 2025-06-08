/**
 * FINAL PVX SYSTEM CONNECTIVITY AUDIT
 * Tests all 65 endpoints to verify exact system health status
 * Focuses on achieving 100% connectivity with zero tolerance for failures
 */

const endpoints = [
  // Core system endpoints
  { method: 'GET', path: '/api/health', category: 'Core' },
  { method: 'GET', path: '/api/status', category: 'Core' },
  { method: 'GET', path: '/api/ping', category: 'Core' },
  
  // Wallet endpoints
  { method: 'GET', path: '/api/wallet/PVX_1295b5490224b2eb64e9724dc091795a', category: 'Wallet' },
  { method: 'POST', path: '/api/wallet/create', category: 'Wallet', data: { passphrase: 'test123' } },
  { method: 'POST', path: '/api/wallet/send', category: 'Wallet', data: { fromAddress: 'PVX_1295b5490224b2eb64e9724dc091795a', toAddress: 'PVX_test', amount: 10 } },
  { method: 'GET', path: '/api/wallet/PVX_1295b5490224b2eb64e9724dc091795a/export', category: 'Wallet' },
  
  // Staking endpoints
  { method: 'GET', path: '/api/stake/pools', category: 'Staking' },
  { method: 'GET', path: '/api/stake/positions/PVX_1295b5490224b2eb64e9724dc091795a', category: 'Staking' },
  { method: 'POST', path: '/api/stake/start', category: 'Staking', data: { walletAddress: 'PVX_1295b5490224b2eb64e9724dc091795a', poolId: 'pool1', amount: '100' } },
  { method: 'POST', path: '/api/stake/claim', category: 'Staking', data: { walletAddress: 'PVX_1295b5490224b2eb64e9724dc091795a', stakeId: 'stake1' } },
  { method: 'GET', path: '/api/stake/rewards/PVX_1295b5490224b2eb64e9724dc091795a', category: 'Staking' },
  
  // Mining endpoints
  { method: 'GET', path: '/api/mine/status', category: 'Mining' },
  { method: 'POST', path: '/api/mine/start', category: 'Mining', data: { walletAddress: 'PVX_1295b5490224b2eb64e9724dc091795a' } },
  { method: 'POST', path: '/api/mine/stop', category: 'Mining', data: { walletAddress: 'PVX_1295b5490224b2eb64e9724dc091795a' } },
  { method: 'GET', path: '/api/mine/stats/PVX_1295b5490224b2eb64e9724dc091795a', category: 'Mining' },
  
  // Blockchain endpoints
  { method: 'GET', path: '/api/blockchain/status', category: 'Blockchain' },
  { method: 'GET', path: '/api/blockchain/metrics', category: 'Blockchain' },
  { method: 'GET', path: '/api/blockchain/trends', category: 'Blockchain' },
  { method: 'GET', path: '/api/blockchain/blocks', category: 'Blockchain' },
  { method: 'GET', path: '/api/blockchain/block/latest', category: 'Blockchain' },
  
  // Transaction endpoints
  { method: 'GET', path: '/api/tx/recent', category: 'Transactions' },
  { method: 'GET', path: '/api/tx/PVX_1295b5490224b2eb64e9724dc091795a', category: 'Transactions' },
  { method: 'GET', path: '/api/transactions/recent', category: 'Transactions' },
  
  // Governance endpoints
  { method: 'GET', path: '/api/governance/proposals', category: 'Governance' },
  { method: 'GET', path: '/api/governance/stats?address=PVX_1295b5490224b2eb64e9724dc091795a', category: 'Governance' },
  { method: 'GET', path: '/api/governance/veto-guardians', category: 'Governance' },
  { method: 'POST', path: '/api/governance/propose', category: 'Governance', data: { title: 'Test', description: 'Test', proposer: 'PVX_1295b5490224b2eb64e9724dc091795a' } },
  { method: 'POST', path: '/api/governance/vote', category: 'Governance', data: { proposalId: '1', vote: 'yes', voter: 'PVX_1295b5490224b2eb64e9724dc091795a' } },
  
  // Badges endpoints
  { method: 'GET', path: '/api/badges', category: 'Badges' },
  { method: 'GET', path: '/api/badges/user/PVX_1295b5490224b2eb64e9724dc091795a', category: 'Badges' },
  { method: 'GET', path: '/api/badges/progress/PVX_1295b5490224b2eb64e9724dc091795a', category: 'Badges' },
  { method: 'GET', path: '/api/badges/leaderboard', category: 'Badges' },
  
  // Drops endpoints
  { method: 'GET', path: '/api/drops', category: 'Drops' },
  { method: 'GET', path: '/api/drops/eligibility?address=PVX_1295b5490224b2eb64e9724dc091795a', category: 'Drops' },
  { method: 'GET', path: '/api/drops/claims?address=PVX_1295b5490224b2eb64e9724dc091795a', category: 'Drops' },
  { method: 'GET', path: '/api/drops/stats', category: 'Drops' },
  { method: 'POST', path: '/api/drops/claim', category: 'Drops', data: { address: 'PVX_1295b5490224b2eb64e9724dc091795a', dropId: 'drop1' } },
  
  // UTR endpoints
  { method: 'GET', path: '/api/utr/transactions?userAddress=PVX_1295b5490224b2eb64e9724dc091795a', category: 'UTR' },
  { method: 'GET', path: '/api/utr/stats', category: 'UTR' },
  { method: 'GET', path: '/api/utr/realtime', category: 'UTR' },
  
  // Learning endpoints
  { method: 'GET', path: '/api/learning/modules', category: 'Learning' },
  { method: 'GET', path: '/api/learning/progress/PVX_1295b5490224b2eb64e9724dc091795a', category: 'Learning' },
  { method: 'GET', path: '/api/learning/stats/PVX_1295b5490224b2eb64e9724dc091795a', category: 'Learning' },
  { method: 'GET', path: '/api/learning/leaderboard', category: 'Learning' },
  { method: 'POST', path: '/api/learning/complete', category: 'Learning', data: { moduleId: 'mod1', userId: 'PVX_1295b5490224b2eb64e9724dc091795a' } },
  
  // Dev endpoints (CRITICAL - these are failing)
  { method: 'GET', path: '/api/dev/', category: 'Dev' },
  { method: 'GET', path: '/api/dev/services/status', category: 'Dev' },
  { method: 'GET', path: '/api/dev/chain/metrics', category: 'Dev' },
  
  // Auth endpoints
  { method: 'POST', path: '/api/auth/login', category: 'Auth', data: { address: 'PVX_1295b5490224b2eb64e9724dc091795a', passphrase: 'test123' } },
  { method: 'POST', path: '/api/auth/logout', category: 'Auth' },
  { method: 'GET', path: '/api/auth/status', category: 'Auth' }
];

async function makeRequest(method, path, data = null) {
  const url = `http://localhost:5000${path}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    return {
      status: response.status,
      ok: response.ok,
      data: await response.json().catch(() => null)
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

async function runFinalConnectivityAudit() {
  console.log('\n🔍 FINAL PVX SYSTEM CONNECTIVITY AUDIT');
  console.log('======================================\n');
  
  const results = {
    total: endpoints.length,
    passed: 0,
    failed: 0,
    categories: {}
  };
  
  const failures = [];
  
  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.method, endpoint.path, endpoint.data);
    
    if (!results.categories[endpoint.category]) {
      results.categories[endpoint.category] = { passed: 0, failed: 0, total: 0 };
    }
    results.categories[endpoint.category].total++;
    
    if (result.ok && result.status >= 200 && result.status < 300) {
      results.passed++;
      results.categories[endpoint.category].passed++;
      console.log(`✅ ${endpoint.method} ${endpoint.path} - ${result.status}`);
    } else {
      results.failed++;
      results.categories[endpoint.category].failed++;
      failures.push({
        method: endpoint.method,
        path: endpoint.path,
        status: result.status,
        error: result.data?.error || result.error || 'Unknown error',
        category: endpoint.category
      });
      console.log(`❌ ${endpoint.method} ${endpoint.path} - ${result.status} - ${result.data?.error || result.error || 'Failed'}`);
    }
  }
  
  console.log('\n📊 AUDIT SUMMARY');
  console.log('================');
  console.log(`Total Endpoints: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  console.log('\n📋 BY CATEGORY');
  console.log('===============');
  Object.entries(results.categories).forEach(([category, stats]) => {
    const rate = ((stats.passed / stats.total) * 100).toFixed(1);
    console.log(`${category}: ${stats.passed}/${stats.total} (${rate}%)`);
  });
  
  if (failures.length > 0) {
    console.log('\n🚨 FAILURES TO ADDRESS');
    console.log('======================');
    failures.forEach(failure => {
      console.log(`❌ [${failure.category}] ${failure.method} ${failure.path}`);
      console.log(`   Status: ${failure.status} | Error: ${failure.error}\n`);
    });
  }
  
  if (results.passed === results.total) {
    console.log('\n🎉 100% SYSTEM CONNECTIVITY ACHIEVED!');
    console.log('All endpoints are operational and responding correctly.');
  } else {
    console.log(`\n⚠️  System is at ${((results.passed / results.total) * 100).toFixed(1)}% connectivity`);
    console.log(`${failures.length} endpoints require fixes to achieve 100% connectivity.`);
  }
  
  return { results, failures };
}

// Run the audit
runFinalConnectivityAudit().catch(console.error);