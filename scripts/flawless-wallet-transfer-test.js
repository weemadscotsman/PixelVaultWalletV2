/**
 * FLAWLESS WALLET-TO-WALLET TRANSFER TEST
 * Creates two test wallets and performs a perfect transfer between them
 * Zero tolerance for failures - Production-grade transfer validation
 */

const BASE_URL = 'http://localhost:5000';

class FlawlessTransferTester {
  constructor() {
    this.wallet1 = null;
    this.wallet2 = null;
    this.results = {
      walletCreation: { passed: 0, failed: 0 },
      transfers: { passed: 0, failed: 0 },
      balanceChecks: { passed: 0, failed: 0 },
      overall: { status: 'PENDING', errors: [] }
    };
  }

  async makeRequest(method, path, data = null) {
    try {
      const url = `${BASE_URL}${path}`;
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const responseData = await response.text();
      
      let parsedData;
      try {
        parsedData = JSON.parse(responseData);
      } catch (e) {
        parsedData = responseData;
      }

      return {
        status: response.status,
        data: parsedData,
        success: response.ok
      };
    } catch (error) {
      console.error(`❌ Request failed: ${method} ${path}`, error.message);
      return {
        status: 0,
        data: { error: error.message },
        success: false
      };
    }
  }

  async createTestWallet(name, passphrase) {
    console.log(`\n🔧 Creating test wallet: ${name}`);
    
    const result = await this.makeRequest('POST', '/api/wallet/create', {
      passphrase: passphrase
    });

    // Handle both direct response and nested wallet response
    const walletData = result.data.wallet || result.data;
    
    if (result.success && (walletData.address || result.data.address)) {
      const address = walletData.address || result.data.address;
      const publicKey = walletData.publicKey || result.data.pubkey;
      
      console.log(`✅ Wallet ${name} created successfully`);
      console.log(`   Address: ${address}`);
      console.log(`   Public Key: ${publicKey}`);
      this.results.walletCreation.passed++;
      return {
        address: address,
        publicKey: publicKey,
        passphrase: passphrase
      };
    } else {
      console.log(`❌ Failed to create wallet ${name}:`, result.data);
      this.results.walletCreation.failed++;
      this.results.overall.errors.push(`Wallet creation failed for ${name}: ${JSON.stringify(result.data)}`);
      return null;
    }
  }

  async getWalletBalance(address) {
    const result = await this.makeRequest('GET', `/api/wallet/${address}/balance`);
    
    if (result.success) {
      this.results.balanceChecks.passed++;
      return result.data.balance;
    } else {
      this.results.balanceChecks.failed++;
      this.results.overall.errors.push(`Balance check failed for ${address}: ${JSON.stringify(result.data)}`);
      return null;
    }
  }

  async performTransfer(fromWallet, toWallet, amount) {
    console.log(`\n💸 Performing transfer: ${amount} PVX`);
    console.log(`   From: ${fromWallet.address}`);
    console.log(`   To: ${toWallet.address}`);

    // Get initial balances
    const initialFromBalance = await this.getWalletBalance(fromWallet.address);
    const initialToBalance = await this.getWalletBalance(toWallet.address);

    if (initialFromBalance === null || initialToBalance === null) {
      console.log(`❌ Failed to get initial balances`);
      this.results.transfers.failed++;
      return false;
    }

    console.log(`   Initial balances - From: ${initialFromBalance}, To: ${initialToBalance}`);

    // Perform the transfer
    const transferResult = await this.makeRequest('POST', '/api/wallet/send', {
      from: fromWallet.address,
      to: toWallet.address,
      amount: amount,
      passphrase: fromWallet.passphrase,
      note: 'Flawless transfer test'
    });

    if (!transferResult.success) {
      console.log(`❌ Transfer failed:`, transferResult.data);
      this.results.transfers.failed++;
      this.results.overall.errors.push(`Transfer failed: ${JSON.stringify(transferResult.data)}`);
      return false;
    }

    console.log(`✅ Transfer initiated successfully`);
    console.log(`   Transaction Hash: ${transferResult.data.hash}`);
    console.log(`   Status: ${transferResult.data.status}`);

    // Wait a moment for transaction to process
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify final balances
    const finalFromBalance = await this.getWalletBalance(fromWallet.address);
    const finalToBalance = await this.getWalletBalance(toWallet.address);

    if (finalFromBalance === null || finalToBalance === null) {
      console.log(`❌ Failed to get final balances`);
      this.results.transfers.failed++;
      return false;
    }

    console.log(`   Final balances - From: ${finalFromBalance}, To: ${finalToBalance}`);

    // Validate balance changes
    const expectedFromBalance = (BigInt(initialFromBalance) - BigInt(amount) - BigInt(10)).toString(); // 10 is fee
    const expectedToBalance = (BigInt(initialToBalance) + BigInt(amount)).toString();

    if (finalFromBalance === expectedFromBalance && finalToBalance === expectedToBalance) {
      console.log(`✅ Transfer completed successfully - balances verified`);
      this.results.transfers.passed++;
      return true;
    } else {
      console.log(`❌ Balance verification failed`);
      console.log(`   Expected From: ${expectedFromBalance}, Actual: ${finalFromBalance}`);
      console.log(`   Expected To: ${expectedToBalance}, Actual: ${finalToBalance}`);
      this.results.transfers.failed++;
      this.results.overall.errors.push(`Balance mismatch after transfer`);
      return false;
    }
  }

  async runFlawlessTransferTest() {
    console.log('🚀 STARTING FLAWLESS WALLET-TO-WALLET TRANSFER TEST');
    console.log('========================================================');

    try {
      // Create two test wallets
      console.log('\n📝 PHASE 1: WALLET CREATION');
      console.log('============================');

      this.wallet1 = await this.createTestWallet('TestWallet1', 'secure_passphrase_wallet_1_123');
      this.wallet2 = await this.createTestWallet('TestWallet2', 'secure_passphrase_wallet_2_456');

      if (!this.wallet1 || !this.wallet2) {
        throw new Error('Failed to create test wallets');
      }

      // Perform transfers in both directions
      console.log('\n💰 PHASE 2: BIDIRECTIONAL TRANSFERS');
      console.log('====================================');

      // Transfer 1: Wallet1 -> Wallet2 (100,000 PVX)
      const transfer1Success = await this.performTransfer(this.wallet1, this.wallet2, 100000);

      // Transfer 2: Wallet2 -> Wallet1 (50,000 PVX)
      const transfer2Success = await this.performTransfer(this.wallet2, this.wallet1, 50000);

      // Transfer 3: Wallet1 -> Wallet2 (25,000 PVX)
      const transfer3Success = await this.performTransfer(this.wallet1, this.wallet2, 25000);

      // Generate final report
      this.generateFlawlessReport();

      // Determine overall status
      const allTransfersSuccessful = transfer1Success && transfer2Success && transfer3Success;
      const noWalletCreationFailures = this.results.walletCreation.failed === 0;
      const noBalanceCheckFailures = this.results.balanceChecks.failed === 0;

      if (allTransfersSuccessful && noWalletCreationFailures && noBalanceCheckFailures) {
        this.results.overall.status = 'FLAWLESS SUCCESS';
        console.log('\n🎉 FLAWLESS TRANSFER TEST: 100% SUCCESS');
      } else {
        this.results.overall.status = 'FAILED';
        console.log('\n❌ FLAWLESS TRANSFER TEST: FAILED');
      }

    } catch (error) {
      console.error('\n💥 CRITICAL ERROR IN TRANSFER TEST:', error.message);
      this.results.overall.status = 'CRITICAL FAILURE';
      this.results.overall.errors.push(`Critical error: ${error.message}`);
    }
  }

  generateFlawlessReport() {
    console.log('\n📊 FLAWLESS TRANSFER TEST REPORT');
    console.log('=================================');
    console.log(`Wallet Creation: ${this.results.walletCreation.passed} passed, ${this.results.walletCreation.failed} failed`);
    console.log(`Transfers: ${this.results.transfers.passed} passed, ${this.results.transfers.failed} failed`);
    console.log(`Balance Checks: ${this.results.balanceChecks.passed} passed, ${this.results.balanceChecks.failed} failed`);
    console.log(`Overall Status: ${this.results.overall.status}`);
    
    if (this.results.overall.errors.length > 0) {
      console.log('\n🚨 ERRORS DETECTED:');
      this.results.overall.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ NO ERRORS DETECTED - PERFECT EXECUTION');
    }

    // Summary
    const totalTests = this.results.walletCreation.passed + this.results.walletCreation.failed +
                      this.results.transfers.passed + this.results.transfers.failed +
                      this.results.balanceChecks.passed + this.results.balanceChecks.failed;
    const totalPassed = this.results.walletCreation.passed + this.results.transfers.passed + this.results.balanceChecks.passed;
    const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;

    console.log(`\n📈 SUCCESS RATE: ${successRate}% (${totalPassed}/${totalTests} tests passed)`);
    
    if (successRate === '100.0') {
      console.log('🏆 ACHIEVEMENT UNLOCKED: FLAWLESS EXECUTION');
    }
  }
}

// Execute the flawless transfer test
async function runTest() {
  const tester = new FlawlessTransferTester();
  await tester.runFlawlessTransferTest();
}

// Run the test if this file is executed directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
  runTest().catch(console.error);
}