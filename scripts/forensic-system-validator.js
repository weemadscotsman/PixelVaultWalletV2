/**
 * FORENSIC-LEVEL SYSTEM VALIDATOR
 * Systematic testing of every panel, button, endpoint, middleware, and service
 * ZERO TOLERANCE for failures - Production-grade validation
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';

const BASE_URL = 'http://localhost:5000';
const GENESIS_WALLET = 'PVX_1295b5490224b2eb64e9724dc091795a';

class ForensicValidator {
  constructor() {
    this.results = {
      endpoints: [],
      frontendPanels: [],
      middleware: [],
      services: [],
      totalTests: 0,
      passed: 0,
      failed: 0,
      critical: 0
    };
  }

  async makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, BASE_URL);
      const options = {
        method,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ForensicValidator/1.0',
          ...headers
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const jsonBody = body ? JSON.parse(body) : {};
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: jsonBody,
              rawBody: body
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: {},
              rawBody: body
            });
          }
        });
      });

      req.on('error', reject);

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  validateResult(result, expectedStatuses, description, category, isCritical = false) {
    this.results.totalTests++;
    const passed = expectedStatuses.includes(result.status);
    
    if (passed) {
      this.results.passed++;
      console.log(`✅ ${category}: ${description} - ${result.status}`);
    } else {
      this.results.failed++;
      if (isCritical) this.results.critical++;
      console.log(`❌ ${category}: ${description} - Expected: ${expectedStatuses.join(' or ')}, Got: ${result.status}`);
      if (result.body?.error) {
        console.log(`   Error: ${result.body.error}`);
      }
    }

    const categoryKey = category.toLowerCase();
    if (!this.results[categoryKey]) {
      this.results[categoryKey] = [];
    }
    
    this.results[categoryKey].push({
      description,
      passed,
      status: result.status,
      expectedStatuses,
      isCritical,
      response: result.body
    });

    return passed;
  }

  async testCoreEndpoints() {
    console.log('\n🔍 FORENSIC CORE ENDPOINT VALIDATION');
    console.log('=====================================');

    const coreTests = [
      { method: 'GET', path: '/api/ping', expected: [200], desc: 'System Ping', critical: true },
      { method: 'GET', path: '/api/health', expected: [200], desc: 'Health Check', critical: true },
      { method: 'GET', path: '/api/status', expected: [200], desc: 'System Status', critical: true },
      { method: 'GET', path: '/api/health/metrics', expected: [200], desc: 'Health Metrics', critical: false },
      { method: 'GET', path: '/api/health/services', expected: [200], desc: 'Service Health', critical: true },
      { method: 'GET', path: '/api/health/blockchain', expected: [200], desc: 'Blockchain Health', critical: true }
    ];

    for (const test of coreTests) {
      try {
        const result = await this.makeRequest(test.method, test.path);
        this.validateResult(result, test.expected, test.desc, 'CORE', test.critical);
      } catch (error) {
        console.log(`❌ CORE: ${test.desc} - NETWORK ERROR: ${error.message}`);
        this.results.failed++;
        if (test.critical) this.results.critical++;
      }
    }
  }

  async testWalletOperations() {
    console.log('\n💰 FORENSIC WALLET OPERATION VALIDATION');
    console.log('=======================================');

    // Test wallet creation with proper data
    const createData = { passphrase: 'test_passphrase_123' };
    let newWallet = null;

    try {
      const createResult = await this.makeRequest('POST', '/api/wallet/create', createData);
      const createPassed = this.validateResult(createResult, [200, 201], 'Wallet Creation', 'WALLET', true);
      
      if (createPassed && createResult.body.wallet) {
        newWallet = createResult.body.wallet;
        console.log(`   Created Wallet: ${newWallet.address}`);
      }
    } catch (error) {
      console.log(`❌ WALLET: Wallet Creation - NETWORK ERROR: ${error.message}`);
    }

    const walletTests = [
      { method: 'GET', path: '/api/wallet/all', expected: [200], desc: 'List All Wallets' },
      { method: 'GET', path: `/api/wallet/${GENESIS_WALLET}`, expected: [200], desc: 'Genesis Wallet Fetch' },
      { method: 'GET', path: `/api/wallet/${GENESIS_WALLET}/balance`, expected: [200], desc: 'Genesis Balance' },
      { method: 'GET', path: `/api/wallet/${GENESIS_WALLET}/transactions`, expected: [200], desc: 'Genesis Transactions' },
      { method: 'POST', path: `/api/wallet/${GENESIS_WALLET}/export`, data: { passphrase: 'test' }, expected: [200], desc: 'Wallet Export' },
      { method: 'POST', path: `/api/wallet/${GENESIS_WALLET}/auth`, data: { passphrase: 'test' }, expected: [200, 400, 401], desc: 'Wallet Auth' },
      { method: 'POST', path: '/api/wallet/send', data: { from: GENESIS_WALLET, to: 'PVX_test', amount: '1', passphrase: 'test' }, expected: [200], desc: 'Send Transaction' }
    ];

    for (const test of walletTests) {
      try {
        const result = await this.makeRequest(test.method, test.path, test.data);
        this.validateResult(result, test.expected, test.desc, 'WALLET', false);
      } catch (error) {
        console.log(`❌ WALLET: ${test.desc} - NETWORK ERROR: ${error.message}`);
      }
    }
  }

  async testBlockchainOperations() {
    console.log('\n⛓️  FORENSIC BLOCKCHAIN OPERATION VALIDATION');
    console.log('============================================');

    const blockchainTests = [
      { method: 'GET', path: '/api/blockchain/status', expected: [200], desc: 'Blockchain Status', critical: true },
      { method: 'GET', path: '/api/blockchain/info', expected: [200], desc: 'Blockchain Info', critical: true },
      { method: 'GET', path: '/api/blockchain/metrics', expected: [200], desc: 'Blockchain Metrics' },
      { method: 'GET', path: '/api/blockchain/trends', expected: [200], desc: 'Blockchain Trends' },
      { method: 'GET', path: '/api/blockchain/latest-block', expected: [200], desc: 'Latest Block', critical: true },
      { method: 'GET', path: '/api/blockchain/blocks', expected: [200], desc: 'Block List' },
      { method: 'GET', path: '/api/blockchain/connect', expected: [200], desc: 'Blockchain Connect' }
    ];

    for (const test of blockchainTests) {
      try {
        const result = await this.makeRequest(test.method, test.path);
        this.validateResult(result, test.expected, test.desc, 'BLOCKCHAIN', test.critical);
      } catch (error) {
        console.log(`❌ BLOCKCHAIN: ${test.desc} - NETWORK ERROR: ${error.message}`);
      }
    }
  }

  async testMiningOperations() {
    console.log('\n⛏️  FORENSIC MINING OPERATION VALIDATION');
    console.log('=======================================');

    const miningTests = [
      { method: 'GET', path: '/api/mine/status', expected: [200], desc: 'Mining Status Overview' },
      { method: 'GET', path: '/api/blockchain/mining/stats', expected: [200], desc: 'Global Mining Stats' },
      { method: 'GET', path: `/api/blockchain/mining/stats/${GENESIS_WALLET}`, expected: [200], desc: 'Wallet Mining Stats' },
      { method: 'GET', path: `/api/mining/status/${GENESIS_WALLET}`, expected: [200], desc: 'Individual Mining Status' },
      { method: 'POST', path: '/api/mine/start', data: { address: GENESIS_WALLET }, expected: [200], desc: 'Start Mining' },
      { method: 'POST', path: '/api/mine/stop', data: { address: GENESIS_WALLET }, expected: [200], desc: 'Stop Mining' },
      { method: 'GET', path: `/api/mine/stats/${GENESIS_WALLET}`, expected: [200], desc: 'Mining Statistics' }
    ];

    for (const test of miningTests) {
      try {
        const result = await this.makeRequest(test.method, test.path, test.data);
        this.validateResult(result, test.expected, test.desc, 'MINING', false);
      } catch (error) {
        console.log(`❌ MINING: ${test.desc} - NETWORK ERROR: ${error.message}`);
      }
    }
  }

  async testStakingOperations() {
    console.log('\n🏦 FORENSIC STAKING OPERATION VALIDATION');
    console.log('=======================================');

    // Get valid pool first
    let validPoolId = null;
    try {
      const poolsResult = await this.makeRequest('GET', '/api/staking/pools');
      if (poolsResult.body.pools && poolsResult.body.pools.length > 0) {
        validPoolId = poolsResult.body.pools[0].id;
        console.log(`   Using Pool ID: ${validPoolId}`);
      }
    } catch (error) {
      console.log(`   Failed to get pool ID: ${error.message}`);
    }

    const stakingTests = [
      { method: 'GET', path: '/api/staking/pools', expected: [200], desc: 'Staking Pools List' },
      { method: 'GET', path: '/api/stake/pools', expected: [200], desc: 'Stake Pools Alt' },
      { method: 'GET', path: `/api/stake/user/${GENESIS_WALLET}`, expected: [200], desc: 'User Stakes' },
      { method: 'GET', path: `/api/stake/status/${GENESIS_WALLET}`, expected: [200], desc: 'Stake Status' },
      { method: 'GET', path: '/api/stake/status', expected: [200], desc: 'Global Stake Status' },
      { method: 'GET', path: `/api/stake/positions/${GENESIS_WALLET}`, expected: [200], desc: 'Stake Positions' },
      { method: 'GET', path: `/api/stake/rewards/${GENESIS_WALLET}`, expected: [200], desc: 'Stake Rewards' }
    ];

    if (validPoolId) {
      stakingTests.push(
        { method: 'POST', path: '/api/stake/start', data: { address: GENESIS_WALLET, amount: '100', poolId: validPoolId }, expected: [200, 201], desc: 'Start Staking' },
        { method: 'POST', path: '/api/stake/claim', data: { address: GENESIS_WALLET, poolId: validPoolId }, expected: [200, 400], desc: 'Claim Stakes' }
      );
    }

    for (const test of stakingTests) {
      try {
        const result = await this.makeRequest(test.method, test.path, test.data);
        this.validateResult(result, test.expected, test.desc, 'STAKING', false);
      } catch (error) {
        console.log(`❌ STAKING: ${test.desc} - NETWORK ERROR: ${error.message}`);
      }
    }
  }

  async testGovernanceOperations() {
    console.log('\n🏛️  FORENSIC GOVERNANCE OPERATION VALIDATION');
    console.log('===========================================');

    const governanceTests = [
      { method: 'GET', path: '/api/governance/proposals', expected: [200], desc: 'Proposals List' },
      { method: 'GET', path: '/api/governance/veto-guardians', expected: [200], desc: 'Veto Guardians' },
      { method: 'GET', path: '/api/governance/stats', expected: [200], desc: 'Governance Stats' },
      { method: 'GET', path: `/api/governance/votes/${GENESIS_WALLET}`, expected: [200], desc: 'User Votes' },
      { method: 'POST', path: '/api/governance/propose', data: { title: 'Test Proposal', description: 'Test', proposer: GENESIS_WALLET }, expected: [200, 201], desc: 'Create Proposal' },
      { method: 'POST', path: '/api/governance/vote', data: { proposalId: 'test_prop', voter: GENESIS_WALLET, support: true }, expected: [200], desc: 'Cast Vote' }
    ];

    for (const test of governanceTests) {
      try {
        const result = await this.makeRequest(test.method, test.path, test.data);
        this.validateResult(result, test.expected, test.desc, 'GOVERNANCE', false);
      } catch (error) {
        console.log(`❌ GOVERNANCE: ${test.desc} - NETWORK ERROR: ${error.message}`);
      }
    }
  }

  async testTransactionOperations() {
    console.log('\n💸 FORENSIC TRANSACTION OPERATION VALIDATION');
    console.log('===========================================');

    const transactionTests = [
      { method: 'GET', path: '/api/transactions/recent', expected: [200], desc: 'Recent Transactions' },
      { method: 'GET', path: '/api/tx/recent', expected: [200], desc: 'Recent TX Alt' },
      { method: 'GET', path: `/api/tx/${GENESIS_WALLET}`, expected: [200], desc: 'Wallet Transactions' },
      { method: 'GET', path: `/api/transactions/user/${GENESIS_WALLET}`, expected: [200], desc: 'User Transactions' },
      { method: 'GET', path: '/api/utr/transactions', expected: [200], desc: 'UTR Transactions' },
      { method: 'GET', path: '/api/utr/realtime', expected: [200], desc: 'Realtime UTR' },
      { method: 'GET', path: '/api/utr/stats', expected: [200], desc: 'UTR Statistics' }
    ];

    for (const test of transactionTests) {
      try {
        const result = await this.makeRequest(test.method, test.path);
        this.validateResult(result, test.expected, test.desc, 'TRANSACTIONS', false);
      } catch (error) {
        console.log(`❌ TRANSACTIONS: ${test.desc} - NETWORK ERROR: ${error.message}`);
      }
    }
  }

  async testServiceOperations() {
    console.log('\n🔧 FORENSIC SERVICE OPERATION VALIDATION');
    console.log('=======================================');

    const serviceTests = [
      { method: 'GET', path: '/api/badges', expected: [200], desc: 'Badges System' },
      { method: 'GET', path: `/api/badges/user/${GENESIS_WALLET}`, expected: [200], desc: 'User Badges' },
      { method: 'GET', path: '/api/badges/leaderboard', expected: [200], desc: 'Badges Leaderboard' },
      { method: 'GET', path: '/api/drops', expected: [200], desc: 'Drops System' },
      { method: 'GET', path: `/api/drops/user/${GENESIS_WALLET}`, expected: [200], desc: 'User Drops' },
      { method: 'GET', path: '/api/drops/active', expected: [200], desc: 'Active Drops' },
      { method: 'GET', path: '/api/learning/modules', expected: [200], desc: 'Learning Modules' },
      { method: 'GET', path: `/api/learning/progress/${GENESIS_WALLET}`, expected: [200], desc: 'Learning Progress' },
      { method: 'GET', path: '/api/thringlets', expected: [200], desc: 'Thringlets Service' },
      { method: 'GET', path: '/api/bridge/status', expected: [200], desc: 'Bridge Status' },
      { method: 'GET', path: '/api/companions', expected: [200], desc: 'Companions System' }
    ];

    for (const test of serviceTests) {
      try {
        const result = await this.makeRequest(test.method, test.path);
        this.validateResult(result, test.expected, test.desc, 'SERVICES', false);
      } catch (error) {
        console.log(`❌ SERVICES: ${test.desc} - NETWORK ERROR: ${error.message}`);
      }
    }
  }

  async testAuthMiddleware() {
    console.log('\n🔐 FORENSIC AUTH MIDDLEWARE VALIDATION');
    console.log('=====================================');

    const authTests = [
      { method: 'GET', path: '/api/auth/status', expected: [200], desc: 'Auth Status Check', critical: true },
      { method: 'GET', path: '/api/auth/me', expected: [200, 401], desc: 'Current User Check' },
      { method: 'POST', path: '/api/auth/login', data: { username: 'test', password: 'test' }, expected: [200, 400, 401], desc: 'Login Attempt' },
      { method: 'POST', path: '/api/auth/logout', expected: [200], desc: 'Logout Process' }
    ];

    for (const test of authTests) {
      try {
        const result = await this.makeRequest(test.method, test.path, test.data);
        this.validateResult(result, test.expected, test.desc, 'MIDDLEWARE', test.critical);
      } catch (error) {
        console.log(`❌ MIDDLEWARE: ${test.desc} - NETWORK ERROR: ${error.message}`);
      }
    }
  }

  async runForensicValidation() {
    console.log('🔬 FORENSIC SYSTEM VALIDATION INITIATED');
    console.log('======================================');
    console.log(`Testing against: ${BASE_URL}`);
    console.log(`Genesis Wallet: ${GENESIS_WALLET}`);
    console.log('======================================\n');

    await this.testCoreEndpoints();
    await this.testAuthMiddleware();
    await this.testWalletOperations();
    await this.testBlockchainOperations();
    await this.testMiningOperations();
    await this.testStakingOperations();
    await this.testGovernanceOperations();
    await this.testTransactionOperations();
    await this.testServiceOperations();

    this.generateForensicReport();
  }

  generateForensicReport() {
    console.log('\n📊 FORENSIC VALIDATION REPORT');
    console.log('============================');
    console.log(`🔗 Total Tests Executed: ${this.results.totalTests}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`🚨 Critical Failures: ${this.results.critical}`);
    
    const successRate = ((this.results.passed / this.results.totalTests) * 100).toFixed(1);
    console.log(`🏆 Success Rate: ${successRate}%`);

    if (this.results.critical > 0) {
      console.log('\n🚨 CRITICAL SYSTEM FAILURES DETECTED');
      console.log('===================================');
      Object.keys(this.results).forEach(category => {
        if (Array.isArray(this.results[category])) {
          this.results[category].forEach(test => {
            if (!test.passed && test.isCritical) {
              console.log(`❌ ${category.toUpperCase()}: ${test.description}`);
            }
          });
        }
      });
    }

    if (this.results.failed > 0) {
      console.log('\n❌ ALL SYSTEM FAILURES');
      console.log('======================');
      Object.keys(this.results).forEach(category => {
        if (Array.isArray(this.results[category])) {
          this.results[category].forEach(test => {
            if (!test.passed) {
              console.log(`   ${category.toUpperCase()}: ${test.description} - Expected: ${test.expectedStatuses.join(' or ')}, Got: ${test.status}`);
            }
          });
        }
      });
    }

    const status = this.results.critical > 0 ? 'CRITICAL' : 
                  this.results.failed > 0 ? 'DEGRADED' : 'OPERATIONAL';
    
    console.log(`\n🏥 SYSTEM STATUS: ${status}`);
    console.log('\n✨ Forensic validation completed!');
  }
}

// Execute forensic validation
const validator = new ForensicValidator();
validator.runForensicValidation().catch(console.error);