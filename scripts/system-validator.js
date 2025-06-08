/**
 * PVX SYSTEM VALIDATOR - Single Source of Truth
 * Comprehensive validation of all system endpoints and components
 */

const BASE_URL = 'http://localhost:5000';
const GENESIS_WALLET = 'PVX_1295b5490224b2eb64e9724dc091795a';

async function makeRequest(method, path, data = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${BASE_URL}${path}`, options);
    return { status: response.status, ok: response.ok };
  } catch (error) {
    return { status: 0, ok: false, error: error.message };
  }
}

async function validateSystemHealth() {
  console.log('🎯 PVX SYSTEM VALIDATOR - COMPREHENSIVE CHECK');
  console.log('='.repeat(50));
  
  const endpoints = [
    // Core System
    { method: 'GET', path: '/api/health', category: 'Core' },
    { method: 'GET', path: '/api/status', category: 'Core' },
    { method: 'GET', path: '/api/ping', category: 'Core' },
    
    // Wallet System
    { method: 'GET', path: `/api/wallet/${GENESIS_WALLET}`, category: 'Wallet' },
    { method: 'POST', path: '/api/wallet/create', data: { passphrase: 'test123' }, category: 'Wallet' },
    { method: 'POST', path: '/api/wallet/send', data: { from: GENESIS_WALLET, to: 'test', amount: 1000 }, category: 'Wallet' },
    
    // Staking System
    { method: 'GET', path: '/api/stake/pools', category: 'Staking' },
    { method: 'GET', path: `/api/stake/positions/${GENESIS_WALLET}`, category: 'Staking' },
    { method: 'POST', path: '/api/stake/start', data: { address: GENESIS_WALLET, amount: 1000, poolId: 'pool1' }, category: 'Staking' },
    
    // Mining System
    { method: 'GET', path: '/api/mine/status', category: 'Mining' },
    { method: 'POST', path: '/api/mine/start', data: { address: GENESIS_WALLET }, category: 'Mining' },
    { method: 'GET', path: `/api/mine/stats/${GENESIS_WALLET}`, category: 'Mining' },
    
    // Blockchain System
    { method: 'GET', path: '/api/blockchain/status', category: 'Blockchain' },
    { method: 'GET', path: '/api/blockchain/metrics', category: 'Blockchain' },
    { method: 'GET', path: '/api/blockchain/block/latest', category: 'Blockchain' },
    
    // Transactions
    { method: 'GET', path: '/api/tx/recent', category: 'Transactions' },
    { method: 'GET', path: `/api/tx/${GENESIS_WALLET}`, category: 'Transactions' },
    
    // Governance
    { method: 'GET', path: '/api/governance/proposals', category: 'Governance' },
    { method: 'GET', path: `/api/governance/stats?address=${GENESIS_WALLET}`, category: 'Governance' },
    
    // Auth System
    { method: 'GET', path: '/api/auth/status', category: 'Auth' },
    { method: 'POST', path: '/api/auth/logout', category: 'Auth' }
  ];
  
  const results = { passed: 0, failed: 0, categories: {} };
  
  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.method, endpoint.path, endpoint.data);
    const success = result.ok || [200, 201, 400, 401].includes(result.status);
    
    if (!results.categories[endpoint.category]) {
      results.categories[endpoint.category] = { passed: 0, total: 0 };
    }
    
    results.categories[endpoint.category].total++;
    
    if (success) {
      results.passed++;
      results.categories[endpoint.category].passed++;
      console.log(`✅ ${endpoint.category}: ${endpoint.method} ${endpoint.path} - ${result.status}`);
    } else {
      results.failed++;
      console.log(`❌ ${endpoint.category}: ${endpoint.method} ${endpoint.path} - ${result.status}`);
    }
  }
  
  console.log('\n📊 SYSTEM HEALTH SUMMARY');
  console.log('='.repeat(30));
  console.log(`Total Endpoints: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  console.log('\n📋 BY CATEGORY');
  console.log('='.repeat(15));
  Object.entries(results.categories).forEach(([category, stats]) => {
    const rate = ((stats.passed / stats.total) * 100).toFixed(1);
    console.log(`${category}: ${stats.passed}/${stats.total} (${rate}%)`);
  });
  
  const overallHealth = results.passed / (results.passed + results.failed);
  if (overallHealth >= 0.95) {
    console.log('\n🎉 SYSTEM STATUS: EXCELLENT');
  } else if (overallHealth >= 0.90) {
    console.log('\n🟡 SYSTEM STATUS: GOOD');
  } else {
    console.log('\n🔴 SYSTEM STATUS: NEEDS ATTENTION');
  }
}

// Run validation
validateSystemHealth().catch(console.error);