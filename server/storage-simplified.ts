import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '@shared/schema';
import { and, desc, eq, or, sql, count, avg, max } from 'drizzle-orm';

// Use the memory blockchain storage for now to fix UI breakage
import { memBlockchainStorage } from './mem-blockchain';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

// Simple storage interface that delegates to memory blockchain
export class SimplifiedStorage {
  // Direct access to wallets for compatibility
  get wallets() {
    return memBlockchainStorage.wallets;
  }

  // Wallet operations
  async getWalletByAddress(address: string) {
    return await memBlockchainStorage.getWalletByAddress(address);
  }

  async createWallet(walletData: any) {
    return await memBlockchainStorage.createWallet(walletData);
  }

  async updateWallet(walletData: any) {
    return await memBlockchainStorage.updateWallet(walletData);
  }

  // Transaction operations
  async createTransaction(txData: any) {
    return await memBlockchainStorage.createTransaction(txData);
  }

  async getTransactionByHash(hash: string) {
    return await memBlockchainStorage.getTransactionByHash(hash);
  }

  async getTransactionsByAddress(address: string) {
    return await memBlockchainStorage.getTransactionsByAddress(address);
  }

  async getRecentTransactions(limit: number = 10) {
    return await memBlockchainStorage.getRecentTransactions(limit);
  }

  // Block operations
  async createBlock(blockData: any) {
    return await memBlockchainStorage.createBlock(blockData);
  }

  async getLatestBlock() {
    return await memBlockchainStorage.getLatestBlock();
  }

  async getRecentBlocks(limit: number = 10) {
    return await memBlockchainStorage.getRecentBlocks(limit);
  }

  async getBlockchainStatus() {
    return await memBlockchainStorage.getBlockchainStatus();
  }

  // Mining operations
  async createMiner(stats: any) {
    return await memBlockchainStorage.createMiner(stats);
  }

  async getMinerByAddress(address: string) {
    return await memBlockchainStorage.getMinerByAddress(address);
  }

  async updateMiner(stats: any) {
    return await memBlockchainStorage.updateMiner(stats);
  }

  async getAllActiveMiners() {
    return await memBlockchainStorage.getAllActiveMiners();
  }

  // Staking operations
  async createStakeRecord(stake: any) {
    return await memBlockchainStorage.createStakeRecord(stake);
  }

  async getStakeById(id: string) {
    return await memBlockchainStorage.getStakeById(id);
  }

  async getStakesByAddress(address: string) {
    return await memBlockchainStorage.getStakesByAddress(address);
  }

  async getActiveStakesByAddress(address: string) {
    return await memBlockchainStorage.getActiveStakesByAddress(address);
  }

  async updateStakeRecord(stake: any) {
    return await memBlockchainStorage.updateStakeRecord(stake);
  }

  async getStakingPools() {
    return await memBlockchainStorage.getStakingPools();
  }

  async getStakingPoolById(id: string) {
    return await memBlockchainStorage.getStakingPoolById(id);
  }

  // Mining operations
  async startMining(address: string) {
    return await memBlockchainStorage.startMining(address);
  }

  async getMinerByAddress(address: string) {
    return await memBlockchainStorage.getMinerByAddress(address);
  }

  // User operations (simplified)
  async getUser(id: number) {
    return undefined; // Users managed through wallet addresses
  }

  async getUserByUsername(username: string) {
    return undefined; // Users managed through wallet addresses
  }

  async createUser(userData: any) {
    throw new Error('Users managed through wallet addresses');
  }

  // Placeholder methods for missing interface requirements
  async getGameLeaderboards() {
    return [];
  }

  async getLeaderboardsByUser() {
    return [];
  }

  async getLeaderboardsByWalletAddress() {
    return [];
  }

  async addGameScore() {
    return null;
  }

  async updateGameScore() {
    return null;
  }

  async getTopScores() {
    return [];
  }

  async getPlayerStats() {
    return null;
  }

  async getVetoGuardians() {
    return [];
  }

  async addVetoGuardian() {
    return null;
  }

  async removeVetoGuardian() {
    return null;
  }

  async createVetoAction() {
    return null;
  }

  async getVetoActionsByProposal() {
    return [];
  }

  async createUserFeedback() {
    return null;
  }

  async getUserFeedback() {
    return [];
  }

  async updateUserFeedback() {
    return null;
  }

  async deleteUserFeedback() {
    return null;
  }

  async getUserFeedbackStats() {
    return null;
  }

  // Badge operations
  async getAllBadges() {
    try {
      const badges = await db.select().from(schema.badges);
      return badges;
    } catch (error) {
      console.error('Failed to get all badges:', error);
      return [];
    }
  }

  async getUserBadges(address: string) {
    try {
      const userBadges = await db
        .select({
          id: schema.badges.id,
          name: schema.badges.name,
          description: schema.badges.description,
          imageUrl: schema.badges.imageUrl,
          tier: schema.badges.tier,
          category: schema.badges.category,
          dateObtained: schema.userBadges.dateObtained,
          obtained: schema.userBadges.obtained,
          progress: schema.userBadges.progress
        })
        .from(schema.userBadges)
        .innerJoin(schema.badges, eq(schema.badges.id, schema.userBadges.badgeId))
        .where(and(
          eq(schema.userBadges.userId, address),
          eq(schema.userBadges.obtained, true)
        ));
      
      return userBadges;
    } catch (error) {
      console.error('Failed to get user badges:', error);
      return [];
    }
  }

  async awardBadge(userAddress: string, badgeId: string) {
    try {
      const existingBadge = await db
        .select()
        .from(schema.userBadges)
        .where(
          and(
            eq(schema.userBadges.userAddress, userAddress),
            eq(schema.userBadges.badgeId, badgeId)
          )
        );

      if (existingBadge.length === 0) {
        await db.insert(schema.userBadges).values({
          userAddress,
          badgeId,
          earnedAt: new Date()
        });
        console.log(`✅ BADGE AWARDED: ${badgeId} to ${userAddress}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to award badge:', error);
      return false;
    }
  }

  // Drop operations
  async getAllDrops() {
    try {
      const drops = await db.select().from(schema.drops);
      return drops;
    } catch (error) {
      console.error('Failed to get all drops:', error);
      return [];
    }
  }

  async searchUserFeedback() {
    return [];
  }

  async getUserFeedbackAnalytics() {
    return null;
  }

  // Governance operations
  async getGovernanceProposals() {
    try {
      const proposals = await db.select().from(schema.governanceProposals);
      return proposals;
    } catch (error) {
      console.error('Failed to get governance proposals:', error);
      return [];
    }
  }

  // Learning operations
  async getLearningModules() {
    try {
      const modules = await db.select().from(schema.learningModules);
      return modules;
    } catch (error) {
      console.error('Failed to get learning modules:', error);
      return [];
    }
  }
}

export const simplifiedStorage = new SimplifiedStorage();