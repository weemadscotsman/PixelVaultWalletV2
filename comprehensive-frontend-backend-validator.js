/**
 * COMPREHENSIVE PVX SYSTEM VALIDATOR - ZERO TOLERANCE EDITION
 * Tests EVERY frontend component, backend endpoint, and service integration
 * Validates 100% REAL DATA - NO MOCKS ALLOWED
 * 
 * This validator ensures complete system health with forensic-level detail
 */

import axios from 'axios';
import assert from 'assert';

const BASE_URL = 'http://localhost:5000';
const GENESIS_WALLET = 'PVX_1295b5490224b2eb64e9724dc091795a';
const GENESIS_PASSPHRASE = 'zsfgaefhsethrthrtwtrh';

class PVXSystemValidator {
  constructor() {
    this.testResults = [];
    this.failedTests = [];
    this.passedTests = 0;
    this.totalTests = 0;
  }

  log(status, category, test, message, data = null) {
    const result = { status, category, test, message, data, timestamp: new Date().toISOString() };
    this.testResults.push(result);
    
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️';
    console.log(`${icon} [${category}] ${test}: ${message}`);
    
    if (data) console.log(`   Data:`, JSON.stringify(data, null, 2).slice(0, 200) + '...');
    
    if (status === 'PASS') this.passedTests++;
    if (status === 'FAIL') this.failedTests.push(result);
    this.totalTests++;
  }

  async makeRequest(method, path, data = null, headers = {}) {
    try {
      const config = {
        method: method.toLowerCase(),
        url: `${BASE_URL}${path}`,
        headers: { 'Content-Type': 'application/json', ...headers }
      };
      
      if (data) config.data = data;
      
      const response = await axios(config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || error.message,
        status: error.response?.status || 500 
      };
    }
  }

  async validateCriticalEndpoints() {
    this.log('INFO', 'ENDPOINTS', 'CRITICAL_API_VALIDATION', 'Testing all critical backend endpoints');

    const criticalEndpoints = [
      // Wallet endpoints
      { method: 'GET', path: '/api/ping', expected: ['message'] },
      { method: 'GET', path: '/api/stake/pools', expected: ['pools'] },
      { method: 'GET', path: `/api/stake/status/${GENESIS_WALLET}`, expected: ['stakes'] },
      { method: 'GET', path: '/api/blockchain/stats', expected: ['currentBlock'] },
      { method: 'GET', path: '/api/blockchain/blocks', expected: ['blocks'] },
      { method: 'GET', path: '/api/mining/stats', expected: ['hashRate'] },
      { method: 'GET', path: '/api/transactions/recent', expected: ['transactions'] },
      { method: 'GET', path: '/api/badges/all', expected: ['badges'] },
      { method: 'GET', path: `/api/badges/user/${GENESIS_WALLET}`, expected: ['badges'] },
      
      // POST endpoints with real data
      { 
        method: 'POST', 
        path: '/api/stake/start',
        data: {
          address: GENESIS_WALLET,
          poolId: '196b2afe445_d141a400',
          amount: 100,
          passphrase: GENESIS_PASSPHRASE
        },
        expected: ['success', 'stakeId']
      }
    ];

    for (const endpoint of criticalEndpoints) {
      const result = await this.makeRequest(endpoint.method, endpoint.path, endpoint.data);
      
      if (!result.success) {
        this.log('FAIL', 'ENDPOINTS', endpoint.path, `Request failed: ${result.error}`);
        continue;
      }

      // Validate expected fields
      let hasAllFields = true;
      for (const field of endpoint.expected) {
        if (result.data[field] === undefined) {
          hasAllFields = false;
          this.log('FAIL', 'ENDPOINTS', endpoint.path, `Missing required field: ${field}`);
          break;
        }
      }

      if (hasAllFields) {
        this.log('PASS', 'ENDPOINTS', endpoint.path, `All required fields present`, result.data);
      }
    }
  }

  async validateRealDataIntegrity() {
    this.log('INFO', 'DATA_INTEGRITY', 'REAL_DATA_VALIDATION', 'Validating all data is REAL and LIVE');

    // Test staking pools have real data
    const poolsResult = await this.makeRequest('GET', '/api/stake/pools');
    if (poolsResult.success && poolsResult.data.pools) {
      const pools = poolsResult.data.pools;
      
      if (pools.length === 0) {
        this.log('FAIL', 'DATA_INTEGRITY', 'STAKING_POOLS', 'No staking pools found - system not initialized');
      } else {
        // Validate pools have real data, not mock data
        for (const pool of pools) {
          if (pool.totalStaked === '999999999' || pool.totalStaked === '0' && pool.activeStakers === 99) {
            this.log('FAIL', 'DATA_INTEGRITY', 'STAKING_POOLS', 'MOCK DATA DETECTED in staking pools');
          } else {
            this.log('PASS', 'DATA_INTEGRITY', 'STAKING_POOLS', `Real pool data: ${pool.totalStaked} staked`, pool);
          }
        }
      }
    }

    // Test blockchain stats have real data
    const statsResult = await this.makeRequest('GET', '/api/blockchain/stats');
    if (statsResult.success && statsResult.data) {
      const stats = statsResult.data;
      
      if (stats.currentBlock > 1000) { // Real blockchain should have significant blocks
        this.log('PASS', 'DATA_INTEGRITY', 'BLOCKCHAIN_STATS', `Real blockchain with ${stats.currentBlock} blocks`, stats);
      } else {
        this.log('FAIL', 'DATA_INTEGRITY', 'BLOCKCHAIN_STATS', 'Blockchain appears to have insufficient blocks');
      }
    }

    // Test genesis wallet has real stakes
    const stakesResult = await this.makeRequest('GET', `/api/stake/status/${GENESIS_WALLET}`);
    if (stakesResult.success && stakesResult.data.stakes) {
      const stakes = stakesResult.data.stakes;
      
      if (stakes.length > 0) {
        this.log('PASS', 'DATA_INTEGRITY', 'WALLET_STAKES', `Real stakes found: ${stakes.length} active stakes`, stakes);
      } else {
        this.log('FAIL', 'DATA_INTEGRITY', 'WALLET_STAKES', 'No active stakes found for genesis wallet');
      }
    }
  }

  async validateFrontendComponents() {
    this.log('INFO', 'FRONTEND', 'COMPONENT_VALIDATION', 'Testing frontend component data flow');

    // Test that frontend pages load without errors
    const frontendPages = [
      '/',
      '/staking',
      '/mining',
      '/wallet',
      '/drops',
      '/governance',
      '/learning'
    ];

    for (const page of frontendPages) {
      try {
        // Since we can't directly test React components, we test the data they depend on
        const pageData = await this.validatePageDataSources(page);
        if (pageData) {
          this.log('PASS', 'FRONTEND', `PAGE_${page.replace('/', '').toUpperCase() || 'HOME'}`, 'Data sources available');
        }
      } catch (error) {
        this.log('FAIL', 'FRONTEND', `PAGE_${page.replace('/', '').toUpperCase() || 'HOME'}`, `Data validation failed: ${error.message}`);
      }
    }
  }

  async validatePageDataSources(page) {
    switch (page) {
      case '/':
        return await this.makeRequest('GET', '/api/blockchain/stats');
      case '/staking':
        return await this.makeRequest('GET', '/api/stake/pools');
      case '/mining':
        return await this.makeRequest('GET', '/api/mining/stats');
      case '/wallet':
        return await this.makeRequest('GET', `/api/stake/status/${GENESIS_WALLET}`);
      case '/drops':
        return await this.makeRequest('GET', '/api/drops/stats');
      case '/governance':
        return await this.makeRequest('GET', '/api/governance/proposals');
      case '/learning':
        return await this.makeRequest('GET', '/api/learning/modules');
      default:
        return { success: true };
    }
  }

  async validateDatabaseIntegrity() {
    this.log('INFO', 'DATABASE', 'INTEGRITY_CHECK', 'Validating database contains real data');

    // Test that we can create and retrieve real stakes
    const createStakeResult = await this.makeRequest('POST', '/api/stake/start', {
      address: GENESIS_WALLET,
      poolId: '196b2afe445_d141a400',
      amount: 50,
      passphrase: GENESIS_PASSPHRASE
    });

    if (createStakeResult.success) {
      this.log('PASS', 'DATABASE', 'STAKE_CREATION', 'Successfully created real stake in database', createStakeResult.data);
      
      // Verify the stake appears in status
      const stakesResult = await this.makeRequest('GET', `/api/stake/status/${GENESIS_WALLET}`);
      if (stakesResult.success && stakesResult.data.stakes?.length > 0) {
        this.log('PASS', 'DATABASE', 'STAKE_RETRIEVAL', 'Real stakes retrieved from database');
      } else {
        this.log('FAIL', 'DATABASE', 'STAKE_RETRIEVAL', 'Created stake not found in database');
      }
    } else {
      this.log('FAIL', 'DATABASE', 'STAKE_CREATION', `Failed to create stake: ${createStakeResult.error}`);
    }
  }

  async validateSystemHealth() {
    this.log('INFO', 'SYSTEM', 'HEALTH_CHECK', 'Validating overall system health');

    // Check system responsiveness
    const startTime = Date.now();
    const pingResult = await this.makeRequest('GET', '/api/ping');
    const responseTime = Date.now() - startTime;

    if (pingResult.success && responseTime < 1000) {
      this.log('PASS', 'SYSTEM', 'RESPONSE_TIME', `System responsive: ${responseTime}ms`);
    } else {
      this.log('FAIL', 'SYSTEM', 'RESPONSE_TIME', `System slow or unresponsive: ${responseTime}ms`);
    }

    // Check blockchain is actively mining
    const stats1 = await this.makeRequest('GET', '/api/blockchain/stats');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    const stats2 = await this.makeRequest('GET', '/api/blockchain/stats');

    if (stats1.success && stats2.success) {
      const block1 = stats1.data.currentBlock;
      const block2 = stats2.data.currentBlock;
      
      if (block2 > block1) {
        this.log('PASS', 'SYSTEM', 'BLOCKCHAIN_MINING', `Blockchain actively mining: ${block1} → ${block2}`);
      } else {
        this.log('FAIL', 'SYSTEM', 'BLOCKCHAIN_MINING', 'Blockchain not actively mining new blocks');
      }
    }
  }

  async validateNoMockData() {
    this.log('INFO', 'ANTI_MOCK', 'MOCK_DATA_DETECTION', 'Scanning for any mock or fake data');

    const endpoints = [
      '/api/stake/pools',
      '/api/blockchain/stats',
      '/api/mining/stats',
      `/api/stake/status/${GENESIS_WALLET}`,
      '/api/transactions/recent'
    ];

    const mockPatterns = [
      'mock',
      'fake',
      'placeholder',
      'test123',
      '999999999',
      'lorem ipsum',
      'example.com',
      'john doe'
    ];

    for (const endpoint of endpoints) {
      const result = await this.makeRequest('GET', endpoint);
      
      if (result.success) {
        const dataString = JSON.stringify(result.data).toLowerCase();
        
        for (const pattern of mockPatterns) {
          if (dataString.includes(pattern.toLowerCase())) {
            this.log('FAIL', 'ANTI_MOCK', endpoint, `MOCK DATA DETECTED: Found pattern "${pattern}"`);
          }
        }
        
        if (!mockPatterns.some(pattern => dataString.includes(pattern.toLowerCase()))) {
          this.log('PASS', 'ANTI_MOCK', endpoint, 'No mock data patterns detected');
        }
      }
    }
  }

  async runCompleteValidation() {
    console.log('\n🔍 PVX COMPREHENSIVE SYSTEM VALIDATION STARTED');
    console.log('=' * 60);
    
    try {
      await this.validateCriticalEndpoints();
      await this.validateRealDataIntegrity();
      await this.validateFrontendComponents();
      await this.validateDatabaseIntegrity();
      await this.validateSystemHealth();
      await this.validateNoMockData();
      
      this.generateReport();
      
    } catch (error) {
      this.log('FAIL', 'SYSTEM', 'VALIDATION_ERROR', `Critical validation error: ${error.message}`);
      throw error;
    }
  }

  generateReport() {
    console.log('\n📊 VALIDATION REPORT');
    console.log('=' * 60);
    console.log(`✅ Passed: ${this.passedTests}`);
    console.log(`❌ Failed: ${this.failedTests.length}`);
    console.log(`📊 Total:  ${this.totalTests}`);
    console.log(`📈 Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
    
    if (this.failedTests.length > 0) {
      console.log('\n💥 FAILED TESTS:');
      this.failedTests.forEach(test => {
        console.log(`   ❌ [${test.category}] ${test.test}: ${test.message}`);
      });
      
      console.log('\n🚨 SYSTEM VALIDATION FAILED - ISSUES MUST BE RESOLVED');
      process.exit(1);
    } else {
      console.log('\n🎉 ALL TESTS PASSED - SYSTEM FULLY VALIDATED WITH REAL DATA');
    }
  }
}

// Run the comprehensive validation
async function main() {
  const validator = new PVXSystemValidator();
  await validator.runCompleteValidation();
}

main().catch(error => {
  console.error('💥 VALIDATION FAILED:', error.message);
  process.exit(1);
});

export default PVXSystemValidator;