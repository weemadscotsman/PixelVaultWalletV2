import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';
import { createId, formatCurrency } from '@shared/utils';
import { memBlockchainStorage } from '../mem-blockchain';

/**
 * Initialize the database with required data
 */
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable not set');
    }
    
    // Create client instance
    const client = postgres(process.env.DATABASE_URL);
    
    // Create drizzle instance with the client
    const db = drizzle(client, { schema });
    
    // Check if staking pools are already initialized
    const existingPools = await db.select().from(schema.stakingPools);
    
    if (existingPools.length === 0) {
      console.log('Initializing default staking pools...');
      
      // Add default staking pools
      await db.insert(schema.stakingPools).values([
        {
          id: createId(),
          name: 'Secure Vault',
          description: 'Low risk, steady returns with a short lockup period.',
          apr: 5,
          minStakeAmount: 100,
          lockupPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
          totalStaked: '0',
          activeStakers: 0
        },
        {
          id: createId(),
          name: 'Balanced Node',
          description: 'Balanced risk and reward with a moderate lockup period.',
          apr: 12,
          minStakeAmount: 500,
          lockupPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
          totalStaked: '0',
          activeStakers: 0
        },
        {
          id: createId(),
          name: 'Quantum Yield',
          description: 'Higher potential returns for a longer commitment.',
          apr: 25,
          minStakeAmount: 1000,
          lockupPeriod: 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds
          totalStaked: '0',
          activeStakers: 0
        },
        {
          id: createId(),
          name: 'Genesis Core',
          description: 'Maximum returns for early network supporters with the longest lockup.',
          apr: 42,
          minStakeAmount: 5000,
          lockupPeriod: 180 * 24 * 60 * 60 * 1000, // 180 days in milliseconds
          totalStaked: '0',
          activeStakers: 0
        }
      ]);
      
      console.log('Default staking pools initialized successfully');
    }
    
    // Check if badges are already initialized
    const existingBadges = await db.select().from(schema.badges);
    
    if (existingBadges.length === 0) {
      console.log('Initializing badges...');
      
      // Add default badges
      await db.insert(schema.badges).values([
        {
          id: createId(),
          name: 'Blockchain Pioneer',
          description: 'Awarded to early chain explorers who mined at least one block.',
          imageUrl: '/assets/badges/pioneer.svg',
          tier: 'bronze',
          category: 'mining',
          requirements: { blocksRequired: 1 },
          dateAdded: Date.now()
        },
        {
          id: createId(),
          name: 'Mining Veteran',
          description: 'Awarded to dedicated miners who have mined at least 100 blocks.',
          imageUrl: '/assets/badges/veteran.svg',
          tier: 'silver',
          category: 'mining',
          requirements: { blocksRequired: 100 },
          dateAdded: Date.now()
        },
        {
          id: createId(),
          name: 'Staking Enthusiast',
          description: 'Awarded to users who stake at least 1000 μPVX.',
          imageUrl: '/assets/badges/staker.svg',
          tier: 'bronze',
          category: 'staking',
          requirements: { amountRequired: 1000 },
          dateAdded: Date.now()
        },
        {
          id: createId(),
          name: 'Governance Participant',
          description: 'Awarded to users who have participated in at least one proposal vote.',
          imageUrl: '/assets/badges/governance.svg',
          tier: 'bronze',
          category: 'governance',
          requirements: { votesRequired: 1 },
          dateAdded: Date.now()
        },
        {
          id: createId(),
          name: 'Thringlet Master',
          description: 'Awarded to users who have interacted with their Thringlet more than 50 times.',
          imageUrl: '/assets/badges/thringlet.svg',
          tier: 'gold',
          category: 'thringlet',
          requirements: { interactionsRequired: 50 },
          dateAdded: Date.now()
        }
      ]);
      
      console.log('Badges initialized successfully');
    }
    
    // Check if learning modules are already initialized
    const existingModules = await db.select().from(schema.learningModules);
    
    if (existingModules.length === 0) {
      console.log('Initializing learning modules...');
      
      // Add default learning modules
      const moduleId = createId();
      await db.insert(schema.learningModules).values([
        {
          id: moduleId,
          title: 'Blockchain Basics',
          description: 'Learn the fundamental concepts of blockchain technology.',
          difficulty: 'beginner',
          type: 'quiz',
          xpReward: 100,
          tokenReward: 50,
          completionCriteria: { minScore: 70 }
        }
      ]);
      
      // Add questions for the module
      await db.insert(schema.learningQuestions).values([
        {
          id: createId(),
          moduleId: moduleId,
          text: 'What is a blockchain?',
          options: ['A type of cryptocurrency', 'A distributed ledger technology', 'A programming language', 'A cloud storage solution'],
          correctOption: 1,
          explanation: 'A blockchain is a distributed ledger technology that maintains a continuously growing list of records called blocks that are linked and secured using cryptography.'
        },
        {
          id: createId(),
          moduleId: moduleId,
          text: 'What is the purpose of mining in a blockchain?',
          options: ['To create new cryptocurrencies', 'To validate and add transactions to the blockchain', 'To hack into user accounts', 'To encrypt messages'],
          correctOption: 1,
          explanation: 'Mining is the process by which new transactions are verified and added to the blockchain. Miners solve complex puzzles to validate transactions and secure the network.'
        },
        {
          id: createId(),
          moduleId: moduleId,
          text: 'What is a private key in blockchain?',
          options: ['A password to access your email', 'A secret code used to sign transactions and prove ownership', 'A public identifier shared with others', 'The blockchain network ID'],
          correctOption: 1,
          explanation: 'A private key is a secret, alphanumeric password that allows users to sign transactions and access their cryptocurrency. It should never be shared with others.'
        }
      ]);
      
      console.log('Learning modules initialized successfully');
    }
    
    // Check if we need to migrate data from in-memory storage
    const walletCount = await db.select().from(schema.wallets).limit(1);
    
    if (walletCount.length === 0 && memBlockchainStorage) {
      console.log('Migrating existing in-memory data to database...');
      
      try {
        // Migrate wallets
        const wallets = Array.from(memBlockchainStorage.wallets.values());
        if (wallets.length > 0) {
          for (const wallet of wallets) {
            await db.insert(schema.wallets).values({
              address: wallet.address,
              publicKey: wallet.publicKey,
              balance: wallet.balance,
              createdAt: wallet.createdAt,
              lastSynced: wallet.lastSynced,
              passphraseSalt: wallet.passphraseSalt,
              passphraseHash: wallet.passphraseHash
            });
          }
          console.log(`Migrated ${wallets.length} wallets`);
        }
        
        // Migrate mining stats
        const minerStats = await memBlockchainStorage.getAllActiveMiners();
        if (minerStats.length > 0) {
          for (const stats of minerStats) {
            await db.insert(schema.minerStats).values({
              address: stats.address,
              blocksMined: stats.blocksMined,
              totalRewards: stats.totalRewards,
              lastBlockMined: stats.lastBlockMined,
              isCurrentlyMining: stats.isCurrentlyMining,
              hardware: stats.hardware,
              joinedAt: stats.joinedAt,
              currentHashRate: stats.currentHashRate
            });
          }
          console.log(`Migrated ${minerStats.length} miner stats`);
        }
        
        // Migrate blocks - last 100 for performance reasons
        const blocks = await memBlockchainStorage.getRecentBlocks(100);
        if (blocks.length > 0) {
          for (const block of blocks) {
            await db.insert(schema.blocks).values({
              height: block.height,
              hash: block.hash,
              previousHash: block.previousHash,
              timestamp: block.timestamp,
              nonce: block.nonce,
              difficulty: block.difficulty,
              miner: block.miner,
              merkleRoot: block.merkleRoot,
              totalTransactions: block.totalTransactions,
              size: block.size
            });
          }
          console.log(`Migrated ${blocks.length} blocks`);
        }
        
        // Migrate transactions - last 200 for performance reasons
        const transactions = await memBlockchainStorage.getRecentTransactions(200);
        if (transactions.length > 0) {
          for (const tx of transactions) {
            await db.insert(schema.transactions).values({
              hash: tx.hash,
              type: tx.type,
              fromAddress: tx.from,
              toAddress: tx.to,
              amount: tx.amount,
              timestamp: tx.timestamp,
              nonce: tx.nonce,
              signature: tx.signature,
              status: tx.status,
              blockHeight: tx.blockHeight,
              fee: tx.fee ? tx.fee : 0,
              metadata: tx.metadata
            });
          }
          console.log(`Migrated ${transactions.length} transactions`);
        }
        
        // Migrate staking records
        const stakePools = await memBlockchainStorage.getStakingPools();
        for (const pool of stakePools) {
          const stakeRecords = await memBlockchainStorage.getActiveStakesByPoolId(pool.id);
          if (stakeRecords.length > 0) {
            for (const stake of stakeRecords) {
              await db.insert(schema.stakeRecords).values({
                id: stake.id,
                walletAddress: stake.walletAddress,
                poolId: stake.poolId,
                amount: stake.amount,
                startTime: stake.startTime,
                endTime: stake.endTime,
                isActive: stake.isActive,
                rewards: stake.rewards,
                lastRewardClaim: stake.lastRewardClaim,
                autoCompound: stake.autoCompound
              });
            }
            console.log(`Migrated ${stakeRecords.length} stake records for pool ${pool.id}`);
          }
        }
      } catch (err) {
        console.error('Error during migration:', err);
      }
    }
    
    // Close connection
    await client.end();
    
    console.log('Database initialization completed');
    
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

// Export both as default and named
export default initializeDatabase;

// Export the dbInit object that server/index.ts is expecting
export const dbInit = {
  initDatabaseWithMigration: initializeDatabase,
  seedDefaultData: async () => {
    // This function is called after initialization to seed any additional data
    console.log('No additional seeding required - done during initialization');
    return true;
  }
};