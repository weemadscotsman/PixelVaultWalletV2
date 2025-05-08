import { createHash } from 'crypto';
import { WebSocketServer } from 'ws';
import { Transaction, TransactionType } from '@shared/types';
import { transactionDao } from '../database/transactionDao';
import { walletDao } from '../database/walletDao';

/**
 * Interface for blockchain events
 */
interface BlockchainEvent {
  type: string;
  data: any;
}

/**
 * Transaction Engine handles all transaction operations in the PVX blockchain
 * This centralized approach ensures consistency across all transaction types.
 */
export class TransactionEngine {
  private wss: WebSocketServer | null = null;
  private nextNonce: Map<string, number> = new Map();

  /**
   * Set the WebSocket server for broadcasting transactions
   * @param wss WebSocket server instance
   */
  setWebSocketServer(wss: WebSocketServer) {
    this.wss = wss;
  }

  /**
   * Create a new transaction
   * @param from Sender wallet address
   * @param to Recipient wallet address
   * @param amount Transaction amount (μPVX)
   * @param type Transaction type
   * @param metadata Additional transaction metadata
   * @param fee Optional transaction fee
   * @returns Created transaction
   */
  async createTransaction(
    from: string,
    to: string,
    amount: number,
    type: TransactionType,
    metadata?: any,
    fee?: number
  ): Promise<Transaction> {
    try {
      // Generate nonce
      const nonce = await this.getNextNonce(from);
      
      // Create transaction object
      const transaction: Transaction = {
        hash: '', // Will be set after signing
        type,
        from,
        to,
        amount,
        timestamp: Date.now(),
        nonce,
        signature: '', // Will be set after signing
        status: 'pending',
        fee,
        metadata
      };
      
      // Sign the transaction
      const signedTx = this.signTransaction(transaction);
      
      // Save to database
      await transactionDao.createTransaction(signedTx);
      
      // Update wallet balances (this is a simplification - in a real blockchain, this would happen when the transaction is mined)
      await this.updateWalletBalances(signedTx);
      
      // Broadcast transaction
      this.broadcastTransaction(signedTx);
      
      return signedTx;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new Error('Failed to create transaction');
    }
  }

  /**
   * Sign a transaction (simplified for development - in production would use proper crypto signing)
   * @param transaction Transaction to sign
   * @returns Signed transaction
   */
  private signTransaction(transaction: Transaction): Transaction {
    // Create a hash from the transaction data
    const txData = `${transaction.from}:${transaction.to}:${transaction.amount}:${transaction.timestamp}:${transaction.nonce}:${transaction.type}`;
    const hash = createHash('sha256').update(txData).digest('hex');
    
    // In a real blockchain, we would sign this hash with the sender's private key
    // For development, we'll just use a mock signature
    const signature = `SIG_${hash.substring(0, 10)}`;
    
    return {
      ...transaction,
      hash,
      signature
    };
  }

  /**
   * Get the next nonce for a wallet
   * @param address Wallet address
   * @returns Next nonce value
   */
  private async getNextNonce(address: string): Promise<number> {
    // Check if we have a cached nonce
    let nonce = this.nextNonce.get(address) || 0;
    
    // If not, query the database for the highest nonce for this address
    if (!nonce) {
      try {
        const recentTxs = await transactionDao.getTransactionsByAddress(address, 1);
        if (recentTxs.length > 0) {
          nonce = recentTxs[0].nonce + 1;
        } else {
          nonce = 1; // Start with 1 for new wallets
        }
      } catch (error) {
        console.error('Error getting nonce from database:', error);
        nonce = 1; // Fallback to 1 if there's an error
      }
    } else {
      // Increment the cached nonce
      nonce++;
    }
    
    // Update the cache
    this.nextNonce.set(address, nonce);
    
    return nonce;
  }

  /**
   * Update wallet balances based on transaction
   * @param transaction Transaction to process
   */
  private async updateWalletBalances(transaction: Transaction): Promise<void> {
    try {
      // Get sender wallet
      const sender = await walletDao.getWalletByAddress(transaction.from);
      if (!sender) {
        throw new Error(`Sender wallet not found: ${transaction.from}`);
      }
      
      // Get recipient wallet
      const recipient = await walletDao.getWalletByAddress(transaction.to);
      if (!recipient) {
        throw new Error(`Recipient wallet not found: ${transaction.to}`);
      }
      
      // Calculate fee
      const fee = transaction.fee || 0;
      
      // Update sender balance
      const senderNewBalance = (BigInt(sender.balance) - BigInt(transaction.amount) - BigInt(fee)).toString();
      await walletDao.updateWalletBalance(transaction.from, senderNewBalance);
      
      // Update recipient balance
      const recipientNewBalance = (BigInt(recipient.balance) + BigInt(transaction.amount)).toString();
      await walletDao.updateWalletBalance(transaction.to, recipientNewBalance);
    } catch (error) {
      console.error('Error updating wallet balances:', error);
      throw new Error('Failed to update wallet balances');
    }
  }

  /**
   * Broadcast transaction via WebSocket
   * @param transaction Transaction to broadcast
   */
  private broadcastTransaction(transaction: Transaction): void {
    if (!this.wss) {
      console.warn('WebSocket server not set - transaction not broadcasted');
      return;
    }
    
    // Create blockchain event
    const event: BlockchainEvent = {
      type: 'transaction',
      data: transaction
    };
    
    // Broadcast to all connected clients
    this.wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(event));
      }
    });
    
    console.log(`Transaction broadcasted: ${transaction.hash} (${transaction.type})`);
  }

  /**
   * Confirm a transaction by including it in a block
   * @param txHash Transaction hash
   * @param blockHeight Block height
   * @returns Updated transaction
   */
  async confirmTransaction(txHash: string, blockHeight: number): Promise<Transaction | null> {
    try {
      return await transactionDao.updateTransactionStatus(txHash, 'confirmed', blockHeight);
    } catch (error) {
      console.error('Error confirming transaction:', error);
      throw new Error('Failed to confirm transaction');
    }
  }

  /**
   * Mark a transaction as failed
   * @param txHash Transaction hash
   * @returns Updated transaction
   */
  async failTransaction(txHash: string): Promise<Transaction | null> {
    try {
      return await transactionDao.updateTransactionStatus(txHash, 'failed');
    } catch (error) {
      console.error('Error failing transaction:', error);
      throw new Error('Failed to update transaction status');
    }
  }

  /**
   * Create a mining reward transaction
   * @param minerAddress Miner address
   * @param reward Reward amount (μPVX)
   * @param blockHeight Block height
   * @returns Created transaction
   */
  async createMiningRewardTransaction(
    minerAddress: string,
    reward: number,
    blockHeight: number
  ): Promise<Transaction> {
    const transaction = await this.createTransaction(
      'PVX_NETWORK',
      minerAddress,
      reward,
      'MINING_REWARD',
      { blockHeight }
    );
    
    // Mining rewards are automatically confirmed
    await this.confirmTransaction(transaction.hash, blockHeight);
    
    return transaction;
  }

  /**
   * Create a staking reward transaction
   * @param walletAddress Staker's wallet address
   * @param poolId Staking pool ID
   * @param reward Reward amount (μPVX)
   * @returns Created transaction
   */
  async createStakingRewardTransaction(
    walletAddress: string,
    poolId: string,
    reward: number
  ): Promise<Transaction> {
    return await this.createTransaction(
      'PVX_NETWORK',
      walletAddress,
      reward,
      'STAKING_REWARD',
      { poolId }
    );
  }

  /**
   * Create a transaction for starting a stake
   * @param walletAddress Staker's wallet address
   * @param poolId Staking pool ID
   * @param amount Stake amount (μPVX)
   * @returns Created transaction
   */
  async createStakeStartTransaction(
    walletAddress: string,
    poolId: string,
    amount: number
  ): Promise<Transaction> {
    return await this.createTransaction(
      walletAddress,
      'PVX_STAKE_POOL',
      amount,
      'STAKE_START',
      { poolId }
    );
  }

  /**
   * Create a transaction for ending a stake
   * @param walletAddress Staker's wallet address
   * @param poolId Staking pool ID
   * @param amount Stake amount (μPVX)
   * @param stakeId Stake ID
   * @returns Created transaction
   */
  async createStakeEndTransaction(
    walletAddress: string,
    poolId: string,
    amount: number,
    stakeId: string
  ): Promise<Transaction> {
    return await this.createTransaction(
      'PVX_STAKE_POOL',
      walletAddress,
      amount,
      'STAKE_END',
      { poolId, stakeId }
    );
  }

  /**
   * Create a drop claim transaction
   * @param walletAddress Claimer's wallet address
   * @param dropId Drop ID
   * @param amount Token amount (μPVX)
   * @returns Created transaction
   */
  async createDropClaimTransaction(
    walletAddress: string,
    dropId: string,
    amount: number
  ): Promise<Transaction> {
    return await this.createTransaction(
      'PVX_DROPS',
      walletAddress,
      amount,
      'DROP_CLAIM',
      { dropId }
    );
  }

  /**
   * Create a governance proposal transaction
   * @param proposerAddress Proposer's wallet address
   * @param proposalId Proposal ID
   * @param deposit Deposit amount (μPVX)
   * @returns Created transaction
   */
  async createGovernanceProposalTransaction(
    proposerAddress: string,
    proposalId: string,
    deposit: number
  ): Promise<Transaction> {
    return await this.createTransaction(
      proposerAddress,
      'PVX_GOVERNANCE',
      deposit,
      'GOVERNANCE_PROPOSAL',
      { proposalId }
    );
  }

  /**
   * Create a governance vote transaction
   * @param voterAddress Voter's wallet address
   * @param proposalId Proposal ID
   * @param voteType Vote type (for, against, abstain)
   * @param votingPower Voting power
   * @returns Created transaction
   */
  async createGovernanceVoteTransaction(
    voterAddress: string,
    proposalId: string,
    voteType: 'for' | 'against' | 'abstain',
    votingPower: number
  ): Promise<Transaction> {
    return await this.createTransaction(
      voterAddress,
      'PVX_GOVERNANCE',
      0, // No tokens transferred in a vote
      'GOVERNANCE_VOTE',
      { proposalId, voteType, votingPower }
    );
  }

  /**
   * Create a learning reward transaction
   * @param walletAddress Learner's wallet address
   * @param moduleId Learning module ID
   * @param reward Reward amount (μPVX)
   * @returns Created transaction
   */
  async createLearningRewardTransaction(
    walletAddress: string,
    moduleId: string,
    reward: number
  ): Promise<Transaction> {
    return await this.createTransaction(
      'PVX_LEARNING',
      walletAddress,
      reward,
      'LEARNING_REWARD',
      { moduleId }
    );
  }

  /**
   * Create a standard transfer transaction
   * @param fromAddress Sender's wallet address
   * @param toAddress Recipient's wallet address
   * @param amount Transfer amount (μPVX)
   * @param memo Optional memo
   * @returns Created transaction
   */
  async createTransferTransaction(
    fromAddress: string,
    toAddress: string,
    amount: number,
    memo?: string
  ): Promise<Transaction> {
    return await this.createTransaction(
      fromAddress,
      toAddress,
      amount,
      'TRANSFER',
      { memo }
    );
  }
}

// Create a singleton instance
export const transactionEngine = new TransactionEngine();