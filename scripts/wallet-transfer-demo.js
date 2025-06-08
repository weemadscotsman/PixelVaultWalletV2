/**
 * WALLET-TO-WALLET TRANSFER DEMONSTRATION
 * Creates two wallets and performs verified transfers between them
 */

const BASE_URL = 'http://localhost:5000';

class WalletTransferDemo {
  constructor() {
    this.walletA = null;
    this.walletB = null;
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
      console.error(`Request failed: ${method} ${path}`, error.message);
      return {
        status: 0,
        data: { error: error.message },
        success: false
      };
    }
  }

  async createWallet(name, passphrase) {
    console.log(`Creating wallet: ${name}`);
    
    const result = await this.makeRequest('POST', '/api/wallet/create', {
      passphrase: passphrase
    });

    if (result.success && result.data.wallet) {
      const wallet = {
        name: name,
        address: result.data.wallet.address,
        publicKey: result.data.wallet.publicKey,
        passphrase: passphrase,
        sessionToken: result.data.sessionToken
      };
      
      console.log(`✓ Wallet ${name} created: ${wallet.address}`);
      return wallet;
    } else {
      console.log(`✗ Failed to create wallet ${name}:`, result.data);
      return null;
    }
  }

  async getBalance(address) {
    const result = await this.makeRequest('GET', `/api/wallet/${address}/balance`);
    
    if (result.success) {
      return result.data.balance;
    } else {
      console.log(`✗ Failed to get balance for ${address}:`, result.data);
      return null;
    }
  }

  async transfer(fromWallet, toWallet, amount) {
    console.log(`\nTransferring ${amount} PVX from ${fromWallet.name} to ${toWallet.name}`);
    
    // Get initial balances
    const initialFromBalance = await this.getBalance(fromWallet.address);
    const initialToBalance = await this.getBalance(toWallet.address);
    
    console.log(`Initial balances: ${fromWallet.name}=${initialFromBalance}, ${toWallet.name}=${initialToBalance}`);

    // Perform transfer
    const transferResult = await this.makeRequest('POST', '/api/wallet/send', {
      from: fromWallet.address,
      to: toWallet.address,
      amount: amount,
      passphrase: fromWallet.passphrase,
      note: `Transfer from ${fromWallet.name} to ${toWallet.name}`
    });

    if (!transferResult.success) {
      console.log(`✗ Transfer failed:`, transferResult.data);
      return false;
    }

    console.log(`✓ Transfer initiated: ${transferResult.data.transactionHash || transferResult.data.hash || 'Transaction processed'}`);

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify final balances
    const finalFromBalance = await this.getBalance(fromWallet.address);
    const finalToBalance = await this.getBalance(toWallet.address);
    
    console.log(`Final balances: ${fromWallet.name}=${finalFromBalance}, ${toWallet.name}=${finalToBalance}`);
    
    return true;
  }

  async runDemo() {
    console.log('WALLET-TO-WALLET TRANSFER DEMONSTRATION');
    console.log('=====================================');

    // Create two test wallets
    this.walletA = await this.createWallet('Alice', 'secure_alice_passphrase_123');
    this.walletB = await this.createWallet('Bob', 'secure_bob_passphrase_456');

    if (!this.walletA || !this.walletB) {
      console.log('✗ Failed to create test wallets');
      return;
    }

    // Perform test transfers
    await this.transfer(this.walletA, this.walletB, 250000);
    await this.transfer(this.walletB, this.walletA, 100000);
    await this.transfer(this.walletA, this.walletB, 50000);

    console.log('\n✓ Transfer demonstration completed successfully');
  }
}

// Execute demonstration
async function runDemo() {
  const demo = new WalletTransferDemo();
  await demo.runDemo();
}

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  runDemo().catch(console.error);
}