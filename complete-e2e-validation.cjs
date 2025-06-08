/**
 * COMPREHENSIVE END-TO-END SYSTEM VALIDATION
 * Tests every frontend component, backend endpoint, service integration, and user interaction
 * Provides complete transparency with forensic-level detail
 */

const http = require('http');
const baseUrl = 'http://localhost:5000';

class ComprehensiveSystemValidator {
  constructor() {
    this.results = {
      endpoints: {},
      frontend: {},
      interactions: {},
      errors: [],
      passed: 0,
      failed: 0
    };
  }

  log(status, category, test, message, data = null) {
    const statusIcon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : 'ℹ️';
    console.log(`${statusIcon} [${category.toUpperCase()}] ${test}: ${message}`);
    if (data && typeof data === 'object') {
      const preview = JSON.stringify(data, null, 2).substring(0, 150);
      console.log(`   Data: ${preview}${preview.length >= 150 ? '...' : ''}`);
    }
    
    if (status === 'pass') this.results.passed++;
    if (status === 'fail') this.results.failed++;
  }

  async makeRequest(method, path, data = null) {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 5000,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer session_test_token',
          'session-token': 'session_test_token'
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const parsedBody = body ? JSON.parse(body) : {};
            resolve({
              success: res.statusCode >= 200 && res.statusCode < 400,
              status: res.statusCode,
              data: parsedBody
            });
          } catch (e) {
            resolve({
              success: res.statusCode >= 200 && res.statusCode < 400,
              status: res.statusCode,
              data: { rawBody: body }
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  async validateEndpoint(endpoint, category) {
    const { method, path, name, testData, expectedFields } = endpoint;
    
    try {
      const result = await this.makeRequest(method, path, testData);
      
      if (result.success) {
        // Check for expected fields if specified
        if (expectedFields && result.data) {
          const missingFields = expectedFields.filter(field => {
            const keys = field.split('.');
            let current = result.data;
            for (const key of keys) {
              if (current && typeof current === 'object' && key in current) {
                current = current[key];
              } else {
                return true; // Field is missing
              }
            }
            return false;
          });
          
          if (missingFields.length > 0) {
            this.log('fail', category, name, `Missing fields: ${missingFields.join(', ')}`, result.data);
            this.results.endpoints[path] = { status: 'fail', error: `Missing fields: ${missingFields.join(', ')}` };
            this.results.errors.push(`${name}: Missing required fields`);
            return false;
          }
        }
        
        this.log('pass', category, name, `${method} ${path} working`, result.data);
        this.results.endpoints[path] = { status: 'pass', data: result.data };
        return true;
      } else {
        this.log('fail', category, name, `${method} ${path} failed: ${result.status}`, result.data);
        this.results.endpoints[path] = { status: 'fail', error: `HTTP ${result.status}` };
        this.results.errors.push(`${name}: HTTP ${result.status}`);
        return false;
      }
    } catch (error) {
      this.log('fail', category, name, `${method} ${path} error: ${error.message}`);
      this.results.endpoints[path] = { status: 'fail', error: error.message };
      this.results.errors.push(`${name}: ${error.message}`);
      return false;
    }
  }

  async testEndpointCategory(categoryName, endpoints) {
    this.log('info', 'TESTING', categoryName, `Testing ${endpoints.length} endpoints`);
    
    for (const endpoint of endpoints) {
      await this.validateEndpoint(endpoint, categoryName);
      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async testFrontendComponents() {
    this.log('info', 'FRONTEND', 'COMPONENT_VALIDATION', 'Testing frontend component data sources');
    
    // Test that critical endpoints provide data for frontend components
    const componentDataSources = [
      { component: 'Dashboard', endpoint: '/api/ping', fields: ['status', 'message'] },
      { component: 'WalletSection', endpoint: '/api/wallet/PVX_1295b5490224b2eb64e9724dc091795a', fields: [] },
      { component: 'StakingSection', endpoint: '/api/stake/pools', fields: ['pools'] },
      { component: 'MiningSection', endpoint: '/api/mining/stats', fields: ['hashRate', 'difficulty'] },
      { component: 'BlockchainStats', endpoint: '/api/blockchain/stats', fields: ['currentBlock', 'networkStatus'] },
      { component: 'TransactionHistory', endpoint: '/api/transactions/recent', fields: ['transactions'] },
      { component: 'BadgeSystem', endpoint: '/api/badges/all', fields: ['badges'] }
    ];

    for (const source of componentDataSources) {
      const result = await this.makeRequest('GET', source.endpoint);
      if (result.success && result.data) {
        const missingFields = source.fields.filter(field => !(field in result.data));
        if (missingFields.length === 0) {
          this.log('pass', 'FRONTEND', source.component, 'Has real data source');
        } else {
          this.log('fail', 'FRONTEND', source.component, `Missing data fields: ${missingFields.join(', ')}`);
          this.results.errors.push(`${source.component}: Missing data fields`);
        }
      } else {
        this.log('fail', 'FRONTEND', source.component, 'No data source available');
        this.results.errors.push(`${source.component}: No data source`);
      }
    }
  }

  async testUIInteractions() {
    this.log('info', 'INTERACTIONS', 'USER_FLOWS', 'Testing critical user interaction flows');
    
    // Test authentication flow
    const loginResult = await this.makeRequest('POST', '/api/auth/login', {
      address: 'PVX_1295b5490224b2eb64e9724dc091795a',
      passphrase: 'zsfgaefhsethrthrtwtrh'
    });
    
    if (loginResult.success) {
      this.log('pass', 'INTERACTIONS', 'LOGIN_FLOW', 'Authentication working');
      
      // Test authenticated user endpoint
      const meResult = await this.makeRequest('GET', '/api/auth/me');
      if (meResult.success) {
        this.log('pass', 'INTERACTIONS', 'USER_SESSION', 'Session validation working');
      } else {
        this.log('fail', 'INTERACTIONS', 'USER_SESSION', 'Session validation failed');
        this.results.errors.push('User session validation failed');
      }
    } else {
      this.log('fail', 'INTERACTIONS', 'LOGIN_FLOW', 'Authentication failed');
      this.results.errors.push('Authentication flow broken');
    }

    // Test staking interaction
    const stakeResult = await this.makeRequest('POST', '/api/stake/start', {
      walletAddress: 'PVX_1295b5490224b2eb64e9724dc091795a',
      poolId: '196b2afe445_d141a400',
      amount: '100',
      passphrase: 'zsfgaefhsethrthrtwtrh'
    });
    
    if (stakeResult.success) {
      this.log('pass', 'INTERACTIONS', 'STAKE_CREATION', 'Staking interaction working');
    } else {
      this.log('fail', 'INTERACTIONS', 'STAKE_CREATION', 'Staking interaction failed');
      this.results.errors.push('Staking interaction broken');
    }
  }

  async testWebSocketConnection() {
    this.log('info', 'WEBSOCKET', 'CONNECTION_TEST', 'Testing WebSocket connectivity');
    
    // Note: WebSocket testing would require more complex setup
    // For now, we'll mark this as a known limitation
    this.log('info', 'WEBSOCKET', 'STATUS', 'WebSocket server not initialized (as seen in logs)');
  }

  async runComprehensiveE2EValidation() {
    console.log('🚀 COMPREHENSIVE END-TO-END SYSTEM VALIDATION STARTED');
    console.log('='.repeat(80));
    
    // Core system endpoints
    await this.testEndpointCategory('CORE_SYSTEM', [
      { method: 'GET', path: '/api/ping', name: 'System Health Check', expectedFields: ['status', 'message'] }
    ]);

    // Authentication endpoints
    await this.testEndpointCategory('AUTHENTICATION', [
      { 
        method: 'POST', 
        path: '/api/auth/login', 
        name: 'User Login',
        testData: { address: 'PVX_1295b5490224b2eb64e9724dc091795a', passphrase: 'zsfgaefhsethrthrtwtrh' },
        expectedFields: ['success', 'address', 'sessionToken']
      },
      { method: 'GET', path: '/api/auth/me', name: 'Get Current User', expectedFields: ['success', 'user'] }
    ]);

    // Wallet endpoints
    await this.testEndpointCategory('WALLET_SYSTEM', [
      { method: 'GET', path: '/api/wallet/PVX_1295b5490224b2eb64e9724dc091795a', name: 'Get Wallet Info' },
      { method: 'GET', path: '/api/wallet/all', name: 'List All Wallets' },
      { 
        method: 'POST', 
        path: '/api/wallet/create', 
        name: 'Create New Wallet',
        testData: { passphrase: 'test_passphrase_' + Date.now() }
      }
    ]);

    // Staking endpoints
    await this.testEndpointCategory('STAKING_SYSTEM', [
      { method: 'GET', path: '/api/stake/pools', name: 'Get Staking Pools', expectedFields: ['pools'] },
      { method: 'GET', path: '/api/stake/status/PVX_1295b5490224b2eb64e9724dc091795a', name: 'Get User Stakes', expectedFields: ['stakes'] },
      { 
        method: 'POST', 
        path: '/api/stake/start', 
        name: 'Start Staking',
        testData: {
          walletAddress: 'PVX_1295b5490224b2eb64e9724dc091795a',
          poolId: '196b2afe445_d141a400',
          amount: '100',
          passphrase: 'zsfgaefhsethrthrtwtrh'
        },
        expectedFields: ['success', 'stakeId']
      }
    ]);

    // Blockchain endpoints
    await this.testEndpointCategory('BLOCKCHAIN_SYSTEM', [
      { method: 'GET', path: '/api/blockchain/stats', name: 'Blockchain Statistics', expectedFields: ['currentBlock', 'networkStatus'] },
      { method: 'GET', path: '/api/blockchain/blocks', name: 'Recent Blocks', expectedFields: ['blocks'] },
      { method: 'GET', path: '/api/blockchain/trends', name: 'Blockchain Trends' }
    ]);

    // Mining endpoints
    await this.testEndpointCategory('MINING_SYSTEM', [
      { method: 'GET', path: '/api/mining/stats', name: 'Mining Statistics', expectedFields: ['hashRate', 'difficulty'] },
      { method: 'GET', path: '/api/mining/rewards/PVX_1295b5490224b2eb64e9724dc091795a', name: 'Mining Rewards' }
    ]);

    // Transaction endpoints
    await this.testEndpointCategory('TRANSACTION_SYSTEM', [
      { method: 'GET', path: '/api/transactions/recent', name: 'Recent Transactions', expectedFields: ['transactions'] },
      { method: 'GET', path: '/api/transactions/user/PVX_1295b5490224b2eb64e9724dc091795a', name: 'User Transactions' }
    ]);

    // Badge endpoints
    await this.testEndpointCategory('BADGE_SYSTEM', [
      { method: 'GET', path: '/api/badges/all', name: 'All Badges', expectedFields: ['badges'] },
      { method: 'GET', path: '/api/badges/user/PVX_1295b5490224b2eb64e9724dc091795a', name: 'User Badges', expectedFields: ['badges'] }
    ]);

    // Governance endpoints
    await this.testEndpointCategory('GOVERNANCE_SYSTEM', [
      { method: 'GET', path: '/api/governance/proposals', name: 'Governance Proposals' },
      { method: 'GET', path: '/api/governance/votes/PVX_1295b5490224b2eb64e9724dc091795a', name: 'User Votes' }
    ]);

    // Drop endpoints
    await this.testEndpointCategory('DROP_SYSTEM', [
      { method: 'GET', path: '/api/drops/stats', name: 'Drop Statistics' },
      { method: 'GET', path: '/api/drops/active', name: 'Active Drops' }
    ]);

    // Learning endpoints
    await this.testEndpointCategory('LEARNING_SYSTEM', [
      { method: 'GET', path: '/api/learning/modules', name: 'Learning Modules' },
      { method: 'GET', path: '/api/learning/progress/PVX_1295b5490224b2eb64e9724dc091795a', name: 'Learning Progress' }
    ]);

    // Test frontend component integration
    await this.testFrontendComponents();

    // Test user interaction flows
    await this.testUIInteractions();

    // Test WebSocket connection
    await this.testWebSocketConnection();

    this.generateReport();
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 COMPREHENSIVE SYSTEM VALIDATION REPORT');
    console.log('='.repeat(80));
    
    const totalTests = this.results.passed + this.results.failed;
    const passRate = totalTests > 0 ? Math.round((this.results.passed / totalTests) * 100) : 0;
    
    console.log(`📊 OVERALL RESULTS: ${this.results.passed}/${totalTests} tests passed (${passRate}%)`);
    console.log(`✅ PASSED: ${this.results.passed}`);
    console.log(`❌ FAILED: ${this.results.failed}`);
    console.log(`🔍 TOTAL ENDPOINTS TESTED: ${Object.keys(this.results.endpoints).length}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION:');
      this.results.errors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
    }
    
    console.log('\n📈 ENDPOINT STATUS BREAKDOWN:');
    const statusCounts = { pass: 0, fail: 0 };
    Object.values(this.results.endpoints).forEach(result => statusCounts[result.status]++);
    console.log(`   ✅ Working endpoints: ${statusCounts.pass}`);
    console.log(`   ❌ Broken endpoints: ${statusCounts.fail}`);
    
    if (passRate >= 95) {
      console.log('\n🎉 SYSTEM STATUS: EXCELLENT - Production ready');
    } else if (passRate >= 85) {
      console.log('\n⚠️ SYSTEM STATUS: GOOD - Minor issues need attention');
    } else if (passRate >= 70) {
      console.log('\n🔧 SYSTEM STATUS: NEEDS WORK - Several issues require fixing');
    } else {
      console.log('\n🚨 SYSTEM STATUS: CRITICAL - Major overhaul required');
    }
    
    console.log('='.repeat(80));
  }
}

// Run the comprehensive validation
const validator = new ComprehensiveSystemValidator();
validator.runComprehensiveE2EValidation().catch(console.error);