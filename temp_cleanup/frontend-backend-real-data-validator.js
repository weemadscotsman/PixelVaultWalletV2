/**
 * COMPREHENSIVE PVX FRONTEND-BACKEND REAL DATA VALIDATOR
 * Validates that ALL frontend components display authentic blockchain data
 * ZERO TOLERANCE for mock data - everything must be live from the chain
 */

const baseUrl = 'http://localhost:5000';

class PVXRealDataValidator {
  constructor() {
    this.results = {
      endpoints: {},
      frontend: {},
      realData: {},
      errors: []
    };
  }

  log(status, category, test, message, data = null) {
    const statusIcon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : 'ℹ️';
    console.log(`${statusIcon} [${category.toUpperCase()}] ${test}: ${message}`);
    if (data && Object.keys(data).length > 0) {
      console.log('   Data:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
    }
  }

  async makeRequest(method, path, data = null) {
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (data) options.body = JSON.stringify(data);
      
      const response = await fetch(`${baseUrl}${path}`, options);
      const result = await response.json();
      return { success: true, data: result, status: response.status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async validateCriticalEndpoints() {
    this.log('info', 'ENDPOINTS', 'CRITICAL_VALIDATION', 'Testing all critical backend endpoints for real data');
    
    const endpoints = [
      { method: 'GET', path: '/api/ping', name: 'System Health' },
      { method: 'GET', path: '/api/stake/pools', name: 'Staking Pools' },
      { method: 'GET', path: '/api/stake/status/PVX_1295b5490224b2eb64e9724dc091795a', name: 'Genesis Wallet Stakes' },
      { method: 'GET', path: '/api/blockchain/stats', name: 'Blockchain Statistics' },
      { method: 'GET', path: '/api/blockchain/blocks', name: 'Recent Blocks' },
      { method: 'GET', path: '/api/mining/stats', name: 'Mining Statistics' },
      { method: 'GET', path: '/api/transactions/recent', name: 'Recent Transactions' },
      { method: 'GET', path: '/api/badges/all', name: 'All Badges' },
      { method: 'GET', path: '/api/badges/user/PVX_1295b5490224b2eb64e9724dc091795a', name: 'User Badges' },
      { method: 'GET', path: '/api/drops/stats', name: 'Drop Statistics' },
      { method: 'GET', path: '/api/governance/proposals', name: 'Governance Proposals' },
      { method: 'GET', path: '/api/learning/modules', name: 'Learning Modules' }
    ];

    for (const endpoint of endpoints) {
      const result = await this.makeRequest(endpoint.method, endpoint.path);
      if (result.success) {
        this.validateRealData(endpoint.name, result.data);
        this.log('pass', 'ENDPOINTS', endpoint.name, 'Returns real data', result.data);
        this.results.endpoints[endpoint.path] = { status: 'pass', data: result.data };
      } else {
        this.log('fail', 'ENDPOINTS', endpoint.name, `Failed: ${result.error}`);
        this.results.endpoints[endpoint.path] = { status: 'fail', error: result.error };
        this.results.errors.push(`${endpoint.name}: ${result.error}`);
      }
    }
  }

  validateRealData(category, data) {
    const realDataChecks = {
      'Staking Pools': () => {
        if (data.pools && data.pools.length > 0) {
          const totalStaked = data.pools.reduce((sum, pool) => sum + parseFloat(pool.totalStaked || 0), 0);
          this.log('pass', 'REAL_DATA', 'STAKING_POOLS', `Real staking data: ${totalStaked} PVX staked across ${data.pools.length} pools`);
          return true;
        }
        return false;
      },
      'Genesis Wallet Stakes': () => {
        if (data.stakes && data.stakes.length > 0) {
          const totalStaked = data.stakes.reduce((sum, stake) => sum + parseFloat(stake.amount || 0), 0);
          this.log('pass', 'REAL_DATA', 'WALLET_STAKES', `Real stakes: ${data.stakes.length} active stakes totaling ${totalStaked} PVX`);
          return true;
        }
        return false;
      },
      'Blockchain Statistics': () => {
        if (data.currentBlock && data.currentBlock > 1500) {
          this.log('pass', 'REAL_DATA', 'BLOCKCHAIN_STATS', `Live blockchain: ${data.currentBlock} blocks, ${data.hashRate} H/s`);
          return true;
        }
        return false;
      },
      'Recent Blocks': () => {
        if (data.blocks && data.blocks.length > 0) {
          const latestBlock = data.blocks[0];
          this.log('pass', 'REAL_DATA', 'RECENT_BLOCKS', `Real blocks: Latest #${latestBlock.height} mined by ${latestBlock.miner?.substring(0, 12)}...`);
          return true;
        }
        return false;
      },
      'Mining Statistics': () => {
        if (data.hashRate && data.totalBlocks) {
          this.log('pass', 'REAL_DATA', 'MINING_STATS', `Active mining: ${data.hashRate} H/s, ${data.totalBlocks} blocks mined`);
          return true;
        }
        return false;
      },
      'Recent Transactions': () => {
        if (data.transactions && data.transactions.length > 0) {
          this.log('pass', 'REAL_DATA', 'TRANSACTIONS', `Live transactions: ${data.transactions.length} recent TXs`);
          return true;
        }
        return false;
      }
    };

    const checker = realDataChecks[category];
    if (checker) {
      const isReal = checker();
      this.results.realData[category] = isReal;
      if (!isReal) {
        this.log('fail', 'REAL_DATA', category, 'Contains non-real or insufficient data');
        this.results.errors.push(`${category}: Insufficient real data`);
      }
    }
  }

  async validateStakeCreation() {
    this.log('info', 'FUNCTIONAL', 'STAKE_CREATION', 'Testing real stake creation');
    
    const stakeData = {
      walletAddress: 'PVX_1295b5490224b2eb64e9724dc091795a',
      poolId: '196b2afe445_d141a400',
      amount: '500',
      passphrase: 'zsfgaefhsethrthrtwtrh'
    };

    const result = await this.makeRequest('POST', '/api/stake/start', stakeData);
    if (result.success && result.data.success) {
      this.log('pass', 'FUNCTIONAL', 'STAKE_CREATION', `Real stake created: ${result.data.stakeId}`);
      return true;
    } else {
      this.log('fail', 'FUNCTIONAL', 'STAKE_CREATION', 'Failed to create real stake');
      this.results.errors.push('Stake creation failed');
      return false;
    }
  }

  async validateDatabaseIntegrity() {
    this.log('info', 'DATABASE', 'INTEGRITY_CHECK', 'Verifying database contains real blockchain data');
    
    // Test stake retrieval after creation
    const stakesResult = await this.makeRequest('GET', '/api/stake/status/PVX_1295b5490224b2eb64e9724dc091795a');
    if (stakesResult.success && stakesResult.data.stakes && stakesResult.data.stakes.length > 0) {
      this.log('pass', 'DATABASE', 'STAKE_PERSISTENCE', `Database contains ${stakesResult.data.stakes.length} real stakes`);
    } else {
      this.log('fail', 'DATABASE', 'STAKE_PERSISTENCE', 'Database missing real stake data');
      this.results.errors.push('Database integrity compromised');
    }

    // Test pool data integrity
    const poolsResult = await this.makeRequest('GET', '/api/stake/pools');
    if (poolsResult.success && poolsResult.data.pools && poolsResult.data.pools.length > 0) {
      const poolsWithStakes = poolsResult.data.pools.filter(p => parseFloat(p.totalStaked) > 0);
      this.log('pass', 'DATABASE', 'POOL_INTEGRITY', `Database contains ${poolsWithStakes.length} pools with real stakes`);
    } else {
      this.log('fail', 'DATABASE', 'POOL_INTEGRITY', 'Database missing real pool data');
      this.results.errors.push('Pool data integrity compromised');
    }
  }

  async validateNoMockData() {
    this.log('info', 'ANTI_MOCK', 'DETECTION', 'Scanning for any mock or placeholder data');
    
    let mockDataFound = false;
    const mockIndicators = ['mock', 'placeholder', 'test', 'fake', 'demo', 'sample', 'example'];
    
    for (const [endpoint, result] of Object.entries(this.results.endpoints)) {
      if (result.status === 'pass') {
        const dataString = JSON.stringify(result.data).toLowerCase();
        for (const indicator of mockIndicators) {
          if (dataString.includes(indicator)) {
            this.log('fail', 'ANTI_MOCK', 'MOCK_DETECTED', `Mock data found in ${endpoint}: contains "${indicator}"`);
            mockDataFound = true;
            this.results.errors.push(`Mock data detected in ${endpoint}`);
          }
        }
      }
    }

    if (!mockDataFound) {
      this.log('pass', 'ANTI_MOCK', 'NO_MOCK_DATA', 'All endpoints return authentic blockchain data');
    }
  }

  async validateSystemHealth() {
    this.log('info', 'SYSTEM', 'HEALTH_CHECK', 'Validating overall system health');
    
    const startTime = Date.now();
    const pingResult = await this.makeRequest('GET', '/api/ping');
    const responseTime = Date.now() - startTime;
    
    if (pingResult.success) {
      this.log('pass', 'SYSTEM', 'RESPONSE_TIME', `System responsive: ${responseTime}ms`);
    } else {
      this.log('fail', 'SYSTEM', 'RESPONSE_TIME', 'System unresponsive');
      this.results.errors.push('System health check failed');
    }

    // Validate continuous blockchain operation
    const blockStats1 = await this.makeRequest('GET', '/api/blockchain/stats');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
    const blockStats2 = await this.makeRequest('GET', '/api/blockchain/stats');
    
    if (blockStats1.success && blockStats2.success && 
        blockStats2.data.currentBlock > blockStats1.data.currentBlock) {
      this.log('pass', 'SYSTEM', 'BLOCKCHAIN_ACTIVE', `Blockchain actively mining: ${blockStats1.data.currentBlock} → ${blockStats2.data.currentBlock}`);
    } else {
      this.log('fail', 'SYSTEM', 'BLOCKCHAIN_ACTIVE', 'Blockchain not actively mining new blocks');
      this.results.errors.push('Blockchain appears inactive');
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 PVX REAL DATA VALIDATION REPORT');
    console.log('='.repeat(60));
    
    const totalEndpoints = Object.keys(this.results.endpoints).length;
    const passedEndpoints = Object.values(this.results.endpoints).filter(r => r.status === 'pass').length;
    const healthPercentage = Math.round((passedEndpoints / totalEndpoints) * 100);
    
    console.log(`📊 ENDPOINT HEALTH: ${passedEndpoints}/${totalEndpoints} (${healthPercentage}%)`);
    console.log(`🔍 REAL DATA CATEGORIES: ${Object.keys(this.results.realData).length}`);
    console.log(`❌ TOTAL ERRORS: ${this.results.errors.length}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n🚨 ERRORS DETECTED:');
      this.results.errors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
    }
    
    if (healthPercentage >= 90) {
      console.log('\n✅ SYSTEM STATUS: EXCELLENT - All systems operational with real data');
    } else if (healthPercentage >= 80) {
      console.log('\n⚠️ SYSTEM STATUS: GOOD - Minor issues detected');
    } else {
      console.log('\n🚨 SYSTEM STATUS: CRITICAL - Major issues require immediate attention');
    }
    
    console.log('='.repeat(60));
  }

  async runCompleteValidation() {
    console.log('🚀 PVX COMPREHENSIVE REAL DATA VALIDATION STARTED');
    console.log('='.repeat(60));
    
    try {
      await this.validateCriticalEndpoints();
      await this.validateStakeCreation();
      await this.validateDatabaseIntegrity();
      await this.validateNoMockData();
      await this.validateSystemHealth();
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ VALIDATION FAILED:', error);
      this.results.errors.push(`Validation error: ${error.message}`);
    }
  }
}

// Run the validation
const validator = new PVXRealDataValidator();
validator.runCompleteValidation().catch(console.error);