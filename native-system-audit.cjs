/**
 * NATIVE NODE.JS SYSTEM AUDIT - NO EXTERNAL DEPENDENCIES
 * Complete forensic analysis using only built-in Node.js modules
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:5000';
const TEST_ADDRESS = 'PVX_1295b5490224b2eb64e9724dc091795a';
const TEST_PASSPHRASE = 'zsfgaefhsethrthrtwtrh';

// All expected endpoints from frontend requirements
const CRITICAL_ENDPOINTS = [
  // Core System
  { method: 'GET', path: '/api/ping', expected: [200], description: 'Health check' },
  { method: 'GET', path: '/api/health', expected: [200], description: 'System health' },
  { method: 'GET', path: '/api/status', expected: [200], description: 'System status' },
  { method: 'GET', path: '/api/health/metrics', expected: [200], description: 'Health metrics' },
  { method: 'GET', path: '/api/health/services', expected: [200], description: 'Service health' },
  { method: 'GET', path: '/api/health/blockchain', expected: [200], description: 'Blockchain health' },
  
  // Authentication
  { method: 'GET', path: '/api/auth/status', expected: [401], description: 'Auth status' },
  { method: 'GET', path: '/api/auth/me', expected: [401], description: 'Current user' },
  { method: 'POST', path: '/api/auth/login', expected: [200, 400], description: 'Login', data: { address: TEST_ADDRESS, passphrase: 'wrong' } },
  { method: 'POST', path: '/api/auth/logout', expected: [200], description: 'Logout' },
  
  // Wallet System
  { method: 'POST', path: '/api/wallet/create', expected: [201], description: 'Create wallet' },
  { method: 'GET', path: '/api/wallet/current', expected: [401], description: 'Current wallet' },
  { method: 'GET', path: '/api/wallet/all', expected: [200], description: 'All wallets' },
  { method: 'GET', path: `/api/wallet/${TEST_ADDRESS}`, expected: [200], description: 'Specific wallet' },
  { method: 'GET', path: `/api/wallet/${TEST_ADDRESS}/balance`, expected: [200], description: 'Wallet balance' },
  { method: 'GET', path: `/api/wallet/${TEST_ADDRESS}/transactions`, expected: [200], description: 'Wallet transactions' },
  { method: 'POST', path: `/api/wallet/${TEST_ADDRESS}/export`, expected: [200], description: 'Export keys', data: { passphrase: TEST_PASSPHRASE } },
  { method: 'POST', path: `/api/wallet/${TEST_ADDRESS}/auth`, expected: [200], description: 'Wallet auth', data: { passphrase: TEST_PASSPHRASE } },
  { method: 'POST', path: '/api/wallet/send', expected: [200], description: 'Send transaction', data: { from: TEST_ADDRESS, to: 'PVX_test', amount: '100', passphrase: TEST_PASSPHRASE } },
  { method: 'GET', path: `/api/wallet/history/${TEST_ADDRESS}`, expected: [200, 401], description: 'Wallet history' },
  
  // Blockchain
  { method: 'GET', path: '/api/blockchain/status', expected: [200], description: 'Blockchain status' },
  { method: 'GET', path: '/api/blockchain/info', expected: [200], description: 'Blockchain info' },
  { method: 'GET', path: '/api/blockchain/metrics', expected: [200], description: 'Blockchain metrics' },
  { method: 'GET', path: '/api/blockchain/trends', expected: [200], description: 'Blockchain trends' },
  { method: 'GET', path: '/api/blockchain/latest-block', expected: [200], description: 'Latest block' },
  { method: 'GET', path: '/api/blockchain/blocks', expected: [200], description: 'Recent blocks' },
  { method: 'GET', path: '/api/blockchain/connect', expected: [200], description: 'Connection status' },
  
  // Mining
  { method: 'GET', path: '/api/blockchain/mining/stats', expected: [200], description: 'Mining stats' },
  { method: 'GET', path: `/api/blockchain/mining/stats/${TEST_ADDRESS}`, expected: [200], description: 'User mining stats' },
  { method: 'GET', path: `/api/mining/status/${TEST_ADDRESS}`, expected: [200], description: 'Mining status' },
  { method: 'POST', path: '/api/blockchain/mining/start', expected: [200], description: 'Start mining', data: { address: TEST_ADDRESS } },
  { method: 'POST', path: '/api/blockchain/mining/stop', expected: [200], description: 'Stop mining', data: { address: TEST_ADDRESS } },
  
  // Staking
  { method: 'GET', path: '/api/staking/pools', expected: [200], description: 'Staking pools alt' },
  { method: 'GET', path: '/api/stake/pools', expected: [200], description: 'Staking pools' },
  { method: 'GET', path: `/api/stake/user/${TEST_ADDRESS}`, expected: [200], description: 'User stakes' },
  { method: 'GET', path: `/api/stake/status/${TEST_ADDRESS}`, expected: [200], description: 'Stake status' },
  { method: 'GET', path: '/api/stake/status', expected: [401], description: 'Stake status auth' },
  { method: 'POST', path: '/api/stake/start', expected: [200], description: 'Start staking', data: { address: TEST_ADDRESS, amount: '1000', poolId: 'pool1' } },
  { method: 'POST', path: '/api/stake/claim', expected: [200], description: 'Claim rewards', data: { stakeId: 'stake1', address: TEST_ADDRESS, passphrase: TEST_PASSPHRASE } },
  
  // Transactions
  { method: 'GET', path: '/api/utr/transactions', expected: [401], description: 'UTR transactions' },
  { method: 'GET', path: '/api/utr/realtime', expected: [200], description: 'Real-time transactions' },
  { method: 'GET', path: '/api/utr/stats', expected: [200], description: 'Transaction stats' },
  { method: 'GET', path: '/api/tx/recent', expected: [200], description: 'Recent transactions' },
  
  // Governance
  { method: 'GET', path: '/api/governance/proposals', expected: [200], description: 'Proposals' },
  { method: 'GET', path: '/api/governance/veto-guardians', expected: [200], description: 'Veto guardians' },
  { method: 'GET', path: '/api/governance/stats', expected: [401], description: 'Governance stats' },
  
  // Badges
  { method: 'GET', path: '/api/badges', expected: [200], description: 'All badges' },
  { method: 'GET', path: `/api/badges/user/${TEST_ADDRESS}`, expected: [200], description: 'User badges' },
  { method: 'GET', path: `/api/badges/progress/${TEST_ADDRESS}`, expected: [200], description: 'Badge progress' },
  { method: 'GET', path: '/api/badges/leaderboard', expected: [200], description: 'Badge leaderboard' },
  
  // Drops
  { method: 'GET', path: '/api/drops', expected: [200], description: 'Available drops' },
  { method: 'GET', path: '/api/drops/stats', expected: [200], description: 'Drop stats' },
  { method: 'GET', path: `/api/drops/eligibility?address=${TEST_ADDRESS}`, expected: [200], description: 'Drop eligibility' },
  { method: 'GET', path: `/api/drops/claims?address=${TEST_ADDRESS}`, expected: [200], description: 'Drop claims' },
  
  // Learning
  { method: 'GET', path: '/api/learning/modules', expected: [200], description: 'Learning modules' },
  { method: 'GET', path: `/api/learning/progress/${TEST_ADDRESS}`, expected: [200], description: 'Learning progress' },
  { method: 'GET', path: `/api/learning/stats/${TEST_ADDRESS}`, expected: [200], description: 'Learning stats' },
  { method: 'GET', path: '/api/learning/leaderboard', expected: [200], description: 'Learning leaderboard' }
];

function makeRequest(method, path, data = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname + url.search,
      method: method,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PVX-System-Audit/1.0'
      }
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : null;
          resolve({
            status: res.statusCode,
            ok: res.statusCode >= 200 && res.statusCode < 300,
            data: parsedBody,
            error: null
          });
        } catch {
          resolve({
            status: res.statusCode,
            ok: res.statusCode >= 200 && res.statusCode < 300,
            data: body,
            error: null
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        status: 0,
        ok: false,
        data: null,
        error: error.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 0,
        ok: false,
        data: null,
        error: 'Request timeout'
      });
    });
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runSystemAudit() {
  console.log('🔍 COMPREHENSIVE PVX SYSTEM AUDIT - NATIVE VERSION');
  console.log('===================================================');
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Genesis Wallet: ${TEST_ADDRESS}`);
  console.log('===================================================\n');

  const results = {
    totalEndpoints: 0,
    workingEndpoints: 0,
    brokenEndpoints: 0,
    criticalFailures: []
  };

  // Test all endpoints
  for (const endpoint of CRITICAL_ENDPOINTS) {
    results.totalEndpoints++;
    
    const result = await makeRequest(endpoint.method, endpoint.path, endpoint.data);
    const isValid = endpoint.expected.includes(result.status);
    
    if (isValid) {
      results.workingEndpoints++;
    } else {
      results.brokenEndpoints++;
      results.criticalFailures.push({
        endpoint: `${endpoint.method} ${endpoint.path}`,
        expected: endpoint.expected,
        actual: result.status,
        description: endpoint.description,
        error: result.error
      });
    }
    
    const status = isValid ? '✅' : '❌';
    const expectedStr = endpoint.expected.length > 1 ? `[${endpoint.expected.join(', ')}]` : endpoint.expected[0];
    console.log(`${status} ${endpoint.method} ${endpoint.path} - ${result.status} (Expected: ${expectedStr})`);
    
    if (!isValid && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  // Test WebSocket
  console.log('\n🔌 WEBSOCKET TEST');
  const wsResult = await makeRequest('GET', '/ws');
  const wsWorking = wsResult.status === 200 || wsResult.status === 426;
  console.log(`${wsWorking ? '✅' : '❌'} WebSocket: HTTP ${wsResult.status}`);

  // Generate report
  console.log('\n📊 AUDIT REPORT');
  console.log('===============');
  
  const totalComponents = results.totalEndpoints + 1; // +1 for WebSocket
  const workingComponents = results.workingEndpoints + (wsWorking ? 1 : 0);
  const systemHealth = ((workingComponents / totalComponents) * 100).toFixed(1);
  
  console.log(`🔗 Backend Endpoints: ${results.workingEndpoints}/${results.totalEndpoints} (${((results.workingEndpoints/results.totalEndpoints)*100).toFixed(1)}%)`);
  console.log(`🔌 WebSocket: ${wsWorking ? 'Connected' : 'Failed'}`);
  console.log(`🏆 Overall System: ${workingComponents}/${totalComponents} (${systemHealth}%)`);
  
  console.log(`\n🚨 CRITICAL FAILURES: ${results.criticalFailures.length}`);
  
  if (results.criticalFailures.length > 0) {
    console.log('\n❌ FAILED ENDPOINTS:');
    results.criticalFailures.forEach(failure => {
      console.log(`   • ${failure.endpoint} - Expected: ${failure.expected}, Got: ${failure.actual}`);
      if (failure.error) {
        console.log(`     Error: ${failure.error}`);
      }
    });
  }
  
  // Health assessment
  console.log('\n🏥 SYSTEM HEALTH ASSESSMENT');
  console.log('============================');
  
  let healthStatus = '';
  if (systemHealth >= 99.5) {
    healthStatus = '🟢 PERFECT - All systems operational';
  } else if (systemHealth >= 95) {
    healthStatus = '🟢 EXCELLENT - Minor issues detected';
  } else if (systemHealth >= 90) {
    healthStatus = '🟡 GOOD - Some issues need attention';
  } else if (systemHealth >= 80) {
    healthStatus = '🟠 WARNING - Multiple failures';
  } else {
    healthStatus = '🔴 CRITICAL - Major system failures';
  }
  
  console.log(`${healthStatus}`);
  console.log('\n✨ System audit completed!');
  
  return {
    systemHealth: parseFloat(systemHealth),
    totalComponents,
    workingComponents,
    criticalFailures: results.criticalFailures.length
  };
}

// Run the audit
runSystemAudit().catch(console.error);

module.exports = { runSystemAudit };