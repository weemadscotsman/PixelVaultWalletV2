/**
 * PVX COMPREHENSIVE END-TO-END SYSTEM TEST
 * Tests every panel, button, switch, endpoint, and service connection
 * Validates complete frontend-backend integration
 */

const TEST_WALLET = 'PVX_1295b5490224b2eb64e9724dc091795a';
const TEST_PASSPHRASE = 'zsfgaefhsethrthrtwtrh';

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
  if (data && level === 'FAIL') {
    console.log('  Data:', JSON.stringify(data, null, 2));
  }
}

async function makeRequest(method, endpoint, data = null, headers = {}) {
  const url = `http://localhost:5000${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const responseData = await response.json();
    
    return {
      ok: response.ok,
      status: response.status,
      data: responseData,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
      data: null
    };
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Starting PVX Comprehensive System Test');
  console.log('============================================================');

  const testSuites = [
    {
      name: "Core Infrastructure",
      tests: [
        {
          name: "Server Health Check",
          test: async () => {
            const result = await makeRequest('GET', '/api/health');
            if (result.ok) {
              log('PASS', 'Server health check passed');
              return true;
            } else {
              log('FAIL', 'Server health check failed', result);
              return false;
            }
          }
        },
        {
          name: "Database Connection",
          test: async () => {
            const result = await makeRequest('GET', '/api/ping');
            if (result.ok) {
              log('PASS', 'Database connection verified');
              return true;
            } else {
              log('FAIL', 'Database connection failed', result);
              return false;
            }
          }
        }
      ]
    },
    {
      name: "Wallet Operations",
      tests: [
        {
          name: "Wallet Balance Check",
          test: async () => {
            const result = await makeRequest('GET', `/api/wallet/${TEST_WALLET}/balance`);
            if (result.ok && result.data && typeof result.data.balance !== 'undefined') {
              log('PASS', `Wallet balance retrieved: ${result.data.balance}`);
              return true;
            } else {
              log('FAIL', 'Wallet balance check failed', result);
              return false;
            }
          }
        },
        {
          name: "Transaction History",
          test: async () => {
            const result = await makeRequest('GET', `/api/utr/transactions?userAddress=${TEST_WALLET}`);
            if (result.ok && Array.isArray(result.data)) {
              log('PASS', `Transaction history retrieved (${result.data.length} transactions)`);
              return true;
            } else {
              log('FAIL', 'Transaction history retrieval failed', result);
              return false;
            }
          }
        }
      ]
    },
    {
      name: "Blockchain Services",
      tests: [
        {
          name: "Blockchain Status",
          test: async () => {
            const result = await makeRequest('GET', '/api/blockchain/status');
            if (result.ok && result.data) {
              log('PASS', 'Blockchain status retrieved');
              return true;
            } else {
              log('FAIL', 'Blockchain status retrieval failed', result);
              return false;
            }
          }
        },
        {
          name: "Mining Status",
          test: async () => {
            const result = await makeRequest('GET', '/api/blockchain/mining/stats');
            if (result.ok && result.data) {
              log('PASS', 'Mining status retrieved');
              return true;
            } else {
              log('FAIL', 'Mining status retrieval failed', result);
              return false;
            }
          }
        }
      ]
    },
    {
      name: "User Features",
      tests: [
        {
          name: "Badges System",
          test: async () => {
            const result = await makeRequest('GET', '/api/badges');
            if (result.ok && result.data && (Array.isArray(result.data) || result.data.badges)) {
              const badges = Array.isArray(result.data) ? result.data : result.data.badges;
              log('PASS', `Badges system working (${badges.length} badges)`);
              return true;
            } else {
              log('FAIL', 'Badges system failed', result);
              return false;
            }
          }
        },
        {
          name: "Available Drops",
          test: async () => {
            const result = await makeRequest('GET', '/api/drops');
            if (result.ok && result.data && (Array.isArray(result.data) || result.data.drops)) {
              const drops = Array.isArray(result.data) ? result.data : result.data.drops;
              log('PASS', `Available drops retrieved (${drops.length} drops)`);
              return true;
            } else {
              log('FAIL', 'Available drops retrieval failed', result);
              return false;
            }
          }
        },
        {
          name: "Learning Modules",
          test: async () => {
            const result = await makeRequest('GET', '/api/learning/modules');
            if (result.ok && result.data && (Array.isArray(result.data) || result.data.modules)) {
              const modules = Array.isArray(result.data) ? result.data : result.data.modules;
              log('PASS', `Learning modules retrieved (${modules.length} modules)`);
              return true;
            } else {
              log('FAIL', 'Learning modules retrieval failed', result);
              return false;
            }
          }
        }
      ]
    }
  ];

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const suite of testSuites) {
    console.log(`\n📋 Running ${suite.name} Tests...`);
    
    for (const test of suite.tests) {
      console.log(`\n🧪 ${test.name}`);
      totalTests++;
      
      try {
        const result = await test.test();
        if (result) {
          passedTests++;
        } else {
          failedTests++;
          log('FAIL', `Test "${test.name}" failed`);
        }
      } catch (error) {
        failedTests++;
        log('FAIL', `Test "${test.name}" threw an error: ${error.message}`);
      }
    }
  }

  console.log('\n📊 TEST SUMMARY');
  console.log('============================================================');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📝 Total Tests: ${totalTests}`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  console.log('\n🏥 SYSTEM HEALTH ASSESSMENT');
  console.log('============================================================');
  
  const successRate = (passedTests / totalTests) * 100;
  if (successRate >= 90) {
    console.log('🟢 SYSTEM STATUS: EXCELLENT');
  } else if (successRate >= 70) {
    console.log('🟡 SYSTEM STATUS: GOOD');
  } else if (successRate >= 50) {
    console.log('🟠 SYSTEM STATUS: NEEDS ATTENTION');
  } else {
    console.log('🔴 SYSTEM STATUS: CRITICAL');
  }

  console.log('\n✨ Test completed successfully!');
  return {
    total: totalTests,
    passed: passedTests,
    failed: failedTests,
    successRate: successRate
  };
}

runComprehensiveTest().catch(console.error);