/**
 * FRONTEND PANEL COMMUNICATION VALIDATOR
 * Tests every UI panel, button, form, and component for proper backend integration
 * Forensic-level validation of frontend-to-backend data flow
 */

import http from 'http';
import { URL } from 'url';

const BASE_URL = 'http://localhost:5000';
const GENESIS_WALLET = 'PVX_1295b5490224b2eb64e9724dc091795a';

class FrontendPanelValidator {
  constructor() {
    this.results = {
      walletPanels: [],
      miningPanels: [],
      stakingPanels: [],
      governancePanels: [],
      transactionPanels: [],
      componentTests: [],
      totalTests: 0,
      passed: 0,
      failed: 0
    };
  }

  async makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, BASE_URL);
      const options = {
        method,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FrontendPanelValidator/1.0'
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
              body: jsonBody,
              rawBody: body
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
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

  validatePanelOperation(result, expectedData, panelName, operation, category) {
    this.results.totalTests++;
    const passed = result.status === 200 || result.status === 201;
    
    if (passed) {
      this.results.passed++;
      console.log(`✅ ${category} PANEL: ${panelName} - ${operation} SUCCESS`);
      
      // Validate data structure
      if (expectedData && result.body) {
        for (const key of expectedData) {
          if (result.body[key] === undefined) {
            console.log(`   ⚠️  Missing expected field: ${key}`);
          } else {
            console.log(`   ✓ Field present: ${key}`);
          }
        }
      }
    } else {
      this.results.failed++;
      console.log(`❌ ${category} PANEL: ${panelName} - ${operation} FAILED (${result.status})`);
      if (result.body?.error) {
        console.log(`   Error: ${result.body.error}`);
      }
    }

    const categoryKey = category.toLowerCase() + 'Panels';
    if (!this.results[categoryKey]) {
      this.results[categoryKey] = [];
    }
    
    this.results[categoryKey].push({
      panelName,
      operation,
      passed,
      status: result.status,
      response: result.body
    });

    return passed;
  }

  async testWalletPanels() {
    console.log('\n💰 WALLET PANEL COMMUNICATION TESTS');
    console.log('===================================');

    // Test wallet creation panel
    const createResult = await this.makeRequest('POST', '/api/wallet/create', {
      passphrase: 'test_wallet_panel_123'
    });
    this.validatePanelOperation(
      createResult, 
      ['wallet', 'sessionToken'], 
      'CreateWalletForm', 
      'Wallet Creation', 
      'WALLET'
    );

    // Test wallet connection panel
    const connectResult = await this.makeRequest('GET', `/api/wallet/${GENESIS_WALLET}`);
    this.validatePanelOperation(
      connectResult,
      ['address', 'balance', 'publicKey'],
      'ConnectWalletButton',
      'Wallet Connection',
      'WALLET'
    );

    // Test wallet balance display
    const balanceResult = await this.makeRequest('GET', `/api/wallet/${GENESIS_WALLET}/balance`);
    this.validatePanelOperation(
      balanceResult,
      ['balance'],
      'WalletBalance',
      'Balance Display',
      'WALLET'
    );

    // Test transaction history panel
    const historyResult = await this.makeRequest('GET', `/api/wallet/${GENESIS_WALLET}/transactions`);
    this.validatePanelOperation(
      historyResult,
      ['transactions'],
      'TransactionHistory',
      'Transaction History',
      'WALLET'
    );

    // Test send transaction panel
    const sendResult = await this.makeRequest('POST', '/api/wallet/send', {
      from: GENESIS_WALLET,
      to: 'PVX_test_recipient',
      amount: '5',
      passphrase: 'test'
    });
    this.validatePanelOperation(
      sendResult,
      ['transactionHash', 'status'],
      'SendTransactionForm',
      'Send Transaction',
      'WALLET'
    );

    // Test wallet export panel
    const exportResult = await this.makeRequest('POST', `/api/wallet/${GENESIS_WALLET}/export`, {
      passphrase: 'test'
    });
    this.validatePanelOperation(
      exportResult,
      ['exportData'],
      'ExportWalletPanel',
      'Wallet Export',
      'WALLET'
    );
  }

  async testMiningPanels() {
    console.log('\n⛏️  MINING PANEL COMMUNICATION TESTS');
    console.log('===================================');

    // Test mining status panel
    const statusResult = await this.makeRequest('GET', '/api/mine/status');
    this.validatePanelOperation(
      statusResult,
      ['status', 'activeMiners', 'networkHashRate'],
      'MiningStatusPanel',
      'Mining Status Display',
      'MINING'
    );

    // Test start mining panel
    const startResult = await this.makeRequest('POST', '/api/mine/start', {
      address: GENESIS_WALLET
    });
    this.validatePanelOperation(
      startResult,
      ['success', 'message'],
      'StartMiningButton',
      'Start Mining Action',
      'MINING'
    );

    // Test mining stats panel
    const statsResult = await this.makeRequest('GET', `/api/mine/stats/${GENESIS_WALLET}`);
    this.validatePanelOperation(
      statsResult,
      ['hashRate', 'blocksFound'],
      'MiningStatsPanel',
      'Mining Statistics',
      'MINING'
    );

    // Test stop mining panel
    const stopResult = await this.makeRequest('POST', '/api/mine/stop', {
      address: GENESIS_WALLET
    });
    this.validatePanelOperation(
      stopResult,
      ['success', 'message'],
      'StopMiningButton',
      'Stop Mining Action',
      'MINING'
    );
  }

  async testStakingPanels() {
    console.log('\n🏦 STAKING PANEL COMMUNICATION TESTS');
    console.log('===================================');

    // Get valid pool for testing
    const poolsResult = await this.makeRequest('GET', '/api/staking/pools');
    let validPoolId = null;
    if (poolsResult.body.pools && poolsResult.body.pools.length > 0) {
      validPoolId = poolsResult.body.pools[0].id;
    }

    // Test staking pools panel
    this.validatePanelOperation(
      poolsResult,
      ['pools'],
      'StakingPoolsList',
      'Pools Display',
      'STAKING'
    );

    // Test user stakes panel
    const userStakesResult = await this.makeRequest('GET', `/api/stake/user/${GENESIS_WALLET}`);
    this.validatePanelOperation(
      userStakesResult,
      ['stakes'],
      'UserStakesPanel',
      'User Stakes Display',
      'STAKING'
    );

    // Test stake positions panel
    const positionsResult = await this.makeRequest('GET', `/api/stake/positions/${GENESIS_WALLET}`);
    this.validatePanelOperation(
      positionsResult,
      ['positions'],
      'StakePositionsPanel',
      'Stake Positions',
      'STAKING'
    );

    // Test stake rewards panel
    const rewardsResult = await this.makeRequest('GET', `/api/stake/rewards/${GENESIS_WALLET}`);
    this.validatePanelOperation(
      rewardsResult,
      ['rewards'],
      'StakeRewardsPanel',
      'Stake Rewards',
      'STAKING'
    );

    if (validPoolId) {
      // Test start staking panel
      const startStakeResult = await this.makeRequest('POST', '/api/stake/start', {
        address: GENESIS_WALLET,
        amount: '50',
        poolId: validPoolId
      });
      this.validatePanelOperation(
        startStakeResult,
        ['stakeId', 'status'],
        'StartStakingForm',
        'Start Staking',
        'STAKING'
      );
    }
  }

  async testGovernancePanels() {
    console.log('\n🏛️  GOVERNANCE PANEL COMMUNICATION TESTS');
    console.log('=========================================');

    // Test proposals list panel
    const proposalsResult = await this.makeRequest('GET', '/api/governance/proposals');
    this.validatePanelOperation(
      proposalsResult,
      ['proposals'],
      'ProposalsListPanel',
      'Proposals Display',
      'GOVERNANCE'
    );

    // Test governance stats panel
    const statsResult = await this.makeRequest('GET', '/api/governance/stats');
    this.validatePanelOperation(
      statsResult,
      ['totalProposals', 'activeProposals'],
      'GovernanceStatsPanel',
      'Governance Statistics',
      'GOVERNANCE'
    );

    // Test create proposal panel
    const createProposalResult = await this.makeRequest('POST', '/api/governance/propose', {
      title: 'Test Frontend Panel Proposal',
      description: 'Testing frontend panel communication',
      proposer: GENESIS_WALLET
    });
    this.validatePanelOperation(
      createProposalResult,
      ['success', 'proposal'],
      'CreateProposalForm',
      'Create Proposal',
      'GOVERNANCE'
    );

    // Test vote panel
    const voteResult = await this.makeRequest('POST', '/api/governance/vote', {
      proposalId: 'test_proposal_123',
      voter: GENESIS_WALLET,
      support: true
    });
    this.validatePanelOperation(
      voteResult,
      ['success', 'vote'],
      'VotePanel',
      'Cast Vote',
      'GOVERNANCE'
    );

    // Test user votes panel
    const userVotesResult = await this.makeRequest('GET', `/api/governance/votes/${GENESIS_WALLET}`);
    this.validatePanelOperation(
      userVotesResult,
      ['votes'],
      'UserVotesPanel',
      'User Votes Display',
      'GOVERNANCE'
    );
  }

  async testTransactionPanels() {
    console.log('\n💸 TRANSACTION PANEL COMMUNICATION TESTS');
    console.log('=======================================');

    // Test recent transactions panel
    const recentResult = await this.makeRequest('GET', '/api/transactions/recent');
    this.validatePanelOperation(
      recentResult,
      ['transactions'],
      'RecentTransactionsPanel',
      'Recent Transactions',
      'TRANSACTION'
    );

    // Test user transactions panel
    const userTxResult = await this.makeRequest('GET', `/api/transactions/user/${GENESIS_WALLET}`);
    this.validatePanelOperation(
      userTxResult,
      ['transactions'],
      'UserTransactionsPanel',
      'User Transactions',
      'TRANSACTION'
    );

    // Test UTR transactions panel
    const utrResult = await this.makeRequest('GET', '/api/utr/transactions');
    this.validatePanelOperation(
      utrResult,
      ['transactions'],
      'UTRTransactionsPanel',
      'UTR Transactions',
      'TRANSACTION'
    );

    // Test real-time UTR panel
    const realtimeResult = await this.makeRequest('GET', '/api/utr/realtime');
    this.validatePanelOperation(
      realtimeResult,
      ['transactions'],
      'RealtimeUTRPanel',
      'Realtime UTR',
      'TRANSACTION'
    );

    // Test transaction stats panel
    const statsResult = await this.makeRequest('GET', '/api/utr/stats');
    this.validatePanelOperation(
      statsResult,
      ['totalTransactions', 'volume'],
      'TransactionStatsPanel',
      'Transaction Statistics',
      'TRANSACTION'
    );
  }

  async testComponentIntegrations() {
    console.log('\n🔧 COMPONENT INTEGRATION TESTS');
    console.log('==============================');

    // Test blockchain status component
    const blockchainResult = await this.makeRequest('GET', '/api/blockchain/status');
    this.validatePanelOperation(
      blockchainResult,
      ['status', 'blockHeight'],
      'BlockchainStatusComponent',
      'Blockchain Status',
      'COMPONENT'
    );

    // Test badges component
    const badgesResult = await this.makeRequest('GET', `/api/badges/user/${GENESIS_WALLET}`);
    this.validatePanelOperation(
      badgesResult,
      ['badges'],
      'BadgesComponent',
      'User Badges',
      'COMPONENT'
    );

    // Test drops component
    const dropsResult = await this.makeRequest('GET', `/api/drops/user/${GENESIS_WALLET}`);
    this.validatePanelOperation(
      dropsResult,
      ['drops'],
      'DropsComponent',
      'User Drops',
      'COMPONENT'
    );

    // Test learning component
    const learningResult = await this.makeRequest('GET', `/api/learning/progress/${GENESIS_WALLET}`);
    this.validatePanelOperation(
      learningResult,
      ['progress'],
      'LearningComponent',
      'Learning Progress',
      'COMPONENT'
    );

    // Test companions component
    const companionsResult = await this.makeRequest('GET', '/api/companions');
    this.validatePanelOperation(
      companionsResult,
      ['companions'],
      'CompanionsComponent',
      'Companions System',
      'COMPONENT'
    );
  }

  async runFrontendValidation() {
    console.log('🎯 FRONTEND PANEL VALIDATION INITIATED');
    console.log('=====================================');
    console.log(`Testing frontend-backend communication`);
    console.log(`Target: ${BASE_URL}`);
    console.log(`Genesis Wallet: ${GENESIS_WALLET}`);
    console.log('=====================================\n');

    await this.testWalletPanels();
    await this.testMiningPanels();
    await this.testStakingPanels();
    await this.testGovernancePanels();
    await this.testTransactionPanels();
    await this.testComponentIntegrations();

    this.generatePanelReport();
  }

  generatePanelReport() {
    console.log('\n📊 FRONTEND PANEL VALIDATION REPORT');
    console.log('===================================');
    console.log(`🔗 Total Panel Tests: ${this.results.totalTests}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    
    const successRate = ((this.results.passed / this.results.totalTests) * 100).toFixed(1);
    console.log(`🏆 Panel Success Rate: ${successRate}%`);

    if (this.results.failed > 0) {
      console.log('\n❌ PANEL COMMUNICATION FAILURES');
      console.log('================================');
      
      Object.keys(this.results).forEach(category => {
        if (Array.isArray(this.results[category])) {
          this.results[category].forEach(test => {
            if (!test.passed) {
              console.log(`   ${category.toUpperCase()}: ${test.panelName} - ${test.operation} (${test.status})`);
            }
          });
        }
      });
    }

    const status = this.results.failed === 0 ? 'OPERATIONAL' : 'DEGRADED';
    console.log(`\n🎯 FRONTEND PANEL STATUS: ${status}`);
    console.log('\n✨ Frontend panel validation completed!');
  }
}

// Execute frontend panel validation
const validator = new FrontendPanelValidator();
validator.runFrontendValidation().catch(console.error);