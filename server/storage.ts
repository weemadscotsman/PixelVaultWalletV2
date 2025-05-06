import { db } from "./db";
import { eq, desc, sql, or, and } from "drizzle-orm";
import {
  users, transactions, blocks, mining_stats, mining_rewards,
  stakes, proposals, votes, nfts, wallets,
  type User, type InsertUser, type Transaction, type Block,
  type MiningStats, type MiningReward, type Stake, type Proposal,
  type NFT, type InsertNFT, type Vote, type InsertVote
} from "@shared/schema";
import { TransactionType, type VoteOption, type NetworkStats } from "@shared/types";
import { createId } from "./utils/ids";
import * as sha3 from "js-sha3";

export interface IStorage {
  // User related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Wallet related methods
  getWalletByAddress(address: string): Promise<any | undefined>;
  createWallet(address: string, initialBalance?: number): Promise<any>;
  getWalletBalance(address: string): Promise<number>;
  updateWalletBalance(address: string, newBalance: number): Promise<boolean>;
  
  // Transaction related methods
  createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction>;
  getTransactionsByAddress(address: string, limit?: number): Promise<Transaction[]>;
  
  // Block related methods
  getCurrentBlockHeight(): Promise<number>;
  getRecentBlocks(limit?: number): Promise<Block[]>;
  addBlock(block: Omit<Block, 'id'>): Promise<Block>;
  
  // Mining related methods
  getMiningStats(address: string): Promise<MiningStats | undefined>;
  updateMiningStats(stats: MiningStats): Promise<MiningStats>;
  getMiningRewards(address: string): Promise<MiningReward[]>;
  addMiningReward(reward: Omit<MiningReward, 'id'>): Promise<MiningReward>;
  
  // Staking related methods
  getStakes(address: string): Promise<Stake[]>;
  createStake(stake: Omit<Stake, 'id'>): Promise<Stake>;
  unstake(stakeId: string): Promise<boolean>;
  
  // Governance related methods
  getProposals(): Promise<Proposal[]>;
  getProposal(proposalId: string): Promise<Proposal | undefined>;
  createProposal(proposal: Omit<Proposal, 'id'>): Promise<Proposal>;
  getVotes(address: string): Promise<{proposalId: string, option: VoteOption}[]>;
  vote(address: string, proposalId: string, option: VoteOption): Promise<boolean>;
  
  // NFT related methods
  getNFTs(): Promise<any[]>;
  getNFTsByOwner(ownerAddress: string): Promise<any[]>;
  getNFT(id: string): Promise<any | undefined>;
  mintNFT(nft: any): Promise<any>;
  transferNFT(id: string, fromAddress: string, toAddress: string): Promise<boolean>;
  
  // Network stats
  getNetworkStats(): Promise<NetworkStats>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async getWalletByAddress(address: string): Promise<any | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.address, address));
    return wallet;
  }
  
  async createWallet(address: string, initialBalance: number = 0): Promise<any> {
    const [wallet] = await db
      .insert(wallets)
      .values({ 
        address, 
        balance: initialBalance.toString(),
        created_at: new Date(),
        last_updated: new Date()
      })
      .returning();
    return wallet;
  }
  
  async getWalletBalance(address: string): Promise<number> {
    const wallet = await this.getWalletByAddress(address);
    return wallet ? Number(wallet.balance) : 0;
  }
  
  async updateWalletBalance(address: string, newBalance: number): Promise<boolean> {
    const wallet = await this.getWalletByAddress(address);
    if (!wallet) return false;
    
    await db
      .update(wallets)
      .set({ 
        balance: newBalance.toString(),
        last_updated: new Date()
      })
      .where(eq(wallets.address, address));
    return true;
  }
  
  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    // Fill in any missing fields
    const txData = {
      ...transaction,
      hash: transaction.hash || sha3.sha3_256(JSON.stringify(transaction) + Date.now()),
      timestamp: transaction.timestamp || new Date()
    };
    
    const [newTransaction] = await db
      .insert(transactions)
      .values(txData)
      .returning();
    return newTransaction;
  }
  
  async getTransactionsByAddress(address: string, limit: number = 10): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(
        or(
          eq(transactions.from_address, address),
          eq(transactions.to_address, address)
        )
      )
      .limit(limit);
  }
  
  async getCurrentBlockHeight(): Promise<number> {
    const [result] = await db
      .select({ max: sql<number>`max(${blocks.height})` })
      .from(blocks);
    return result?.max || 0;
  }
  
  async getRecentBlocks(limit: number = 10): Promise<Block[]> {
    return await db
      .select()
      .from(blocks)
      .orderBy(desc(blocks.height))
      .limit(limit);
  }
  
  async addBlock(block: Omit<Block, 'id'>): Promise<Block> {
    const [newBlock] = await db
      .insert(blocks)
      .values(block)
      .returning();
    return newBlock;
  }
  
  async getMiningStats(address: string): Promise<MiningStats | undefined> {
    const [stats] = await db
      .select()
      .from(mining_stats)
      .where(eq(mining_stats.address, address));
    return stats;
  }
  
  async updateMiningStats(stats: MiningStats): Promise<MiningStats> {
    const existingStats = await this.getMiningStats(stats.address);
    
    if (existingStats) {
      const [updatedStats] = await db
        .update(mining_stats)
        .set(stats)
        .where(eq(mining_stats.address, stats.address))
        .returning();
      return updatedStats;
    } else {
      const [newStats] = await db
        .insert(mining_stats)
        .values(stats)
        .returning();
      return newStats;
    }
  }
  
  async getMiningRewards(address: string): Promise<MiningReward[]> {
    return await db
      .select()
      .from(mining_rewards)
      .where(eq(mining_rewards.address, address))
      .orderBy(desc(mining_rewards.timestamp));
  }
  
  async addMiningReward(reward: Omit<MiningReward, 'id'>): Promise<MiningReward> {
    const [newReward] = await db
      .insert(mining_rewards)
      .values(reward)
      .returning();
    return newReward;
  }
  
  async getStakes(address: string): Promise<Stake[]> {
    return await db
      .select()
      .from(stakes)
      .where(eq(stakes.address, address));
  }
  
  async createStake(stake: Omit<Stake, 'id'>): Promise<Stake> {
    const [newStake] = await db
      .insert(stakes)
      .values(stake)
      .returning();
    return newStake;
  }
  
  async unstake(stakeId: string): Promise<boolean> {
    const numId = parseInt(stakeId, 10);
    const result = await db
      .update(stakes)
      .set({ is_active: false })
      .where(eq(stakes.id, numId));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  async getProposals(): Promise<Proposal[]> {
    return await db
      .select()
      .from(proposals);
  }
  
  async getProposal(proposalId: string): Promise<Proposal | undefined> {
    const numId = parseInt(proposalId, 10);
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, numId));
    return proposal;
  }
  
  async createProposal(proposal: Omit<Proposal, 'id'>): Promise<Proposal> {
    const [newProposal] = await db
      .insert(proposals)
      .values(proposal)
      .returning();
    return newProposal;
  }
  
  async getVotes(address: string): Promise<{proposalId: string, option: VoteOption}[]> {
    const voteRecords = await db
      .select()
      .from(votes)
      .where(eq(votes.address, address));
    
    return voteRecords.map(vote => ({
      proposalId: vote.proposal_id.toString(),
      option: vote.option as VoteOption
    }));
  }
  
  async vote(address: string, proposalId: string, option: VoteOption): Promise<boolean> {
    const numProposalId = parseInt(proposalId, 10);
    const [existingVote] = await db
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.address, address),
          eq(votes.proposal_id, numProposalId)
        )
      );
    
    if (existingVote) {
      const result = await db
        .update(votes)
        .set({ option })
        .where(eq(votes.id, existingVote.id));
      return result.rowCount ? result.rowCount > 0 : false;
    } else {
      await db
        .insert(votes)
        .values({
          proposal_id: numProposalId,
          address,
          option,
          timestamp: new Date()
        });
      return true;
    }
  }
  
  async getNFTs(): Promise<any[]> {
    const nftRecords = await db
      .select()
      .from(nfts);
      
    // Convert from database schema to application schema
    return nftRecords.map(nft => ({
      id: nft.id.toString(),
      name: nft.name,
      description: nft.description || '',
      ownerAddress: nft.owner_address,
      createdAt: nft.created_at,
      imageUrl: nft.image_url || undefined,
      metadata: nft.metadata as Record<string, any> || {},
      enableZkVerification: nft.enable_zk_verification,
      hideOwnerAddress: nft.hide_owner_address,
      transactionHash: nft.transaction_hash
    }));
  }
  
  async getNFTsByOwner(ownerAddress: string): Promise<any[]> {
    const nftRecords = await db
      .select()
      .from(nfts)
      .where(eq(nfts.owner_address, ownerAddress));
      
    // Convert from database schema to application schema  
    return nftRecords.map(nft => ({
      id: nft.id.toString(),
      name: nft.name,
      description: nft.description || '',
      ownerAddress: nft.owner_address,
      createdAt: nft.created_at,
      imageUrl: nft.image_url || undefined,
      metadata: nft.metadata as Record<string, any> || {},
      enableZkVerification: nft.enable_zk_verification,
      hideOwnerAddress: nft.hide_owner_address,
      transactionHash: nft.transaction_hash
    }));
  }
  
  async getNFT(id: string): Promise<any | undefined> {
    const numId = parseInt(id, 10);
    const [nft] = await db
      .select()
      .from(nfts)
      .where(eq(nfts.id, numId));
      
    if (!nft) return undefined;
    
    // Convert from database schema to application schema
    return {
      id: nft.id.toString(),
      name: nft.name,
      description: nft.description || '',
      ownerAddress: nft.owner_address,
      createdAt: nft.created_at,
      imageUrl: nft.image_url || undefined,
      metadata: nft.metadata as Record<string, any> || {},
      enableZkVerification: nft.enable_zk_verification,
      hideOwnerAddress: nft.hide_owner_address,
      transactionHash: nft.transaction_hash
    };
  }
  
  async mintNFT(nftData: any): Promise<any> {
    // Convert from application schema to database schema
    const dbNft = {
      name: nftData.name,
      description: nftData.description,
      owner_address: nftData.ownerAddress,
      created_at: nftData.createdAt,
      image_url: nftData.imageUrl,
      metadata: nftData.metadata || {},
      enable_zk_verification: nftData.enableZkVerification,
      hide_owner_address: nftData.hideOwnerAddress,
      transaction_hash: nftData.transactionHash
    };
    
    const [newNft] = await db
      .insert(nfts)
      .values(dbNft)
      .returning();
      
    // Convert back to application schema
    return {
      id: newNft.id.toString(),
      name: newNft.name,
      description: newNft.description || '',
      ownerAddress: newNft.owner_address,
      createdAt: newNft.created_at,
      imageUrl: newNft.image_url || undefined,
      metadata: newNft.metadata as Record<string, any> || {},
      enableZkVerification: newNft.enable_zk_verification,
      hideOwnerAddress: newNft.hide_owner_address,
      transactionHash: newNft.transaction_hash
    };
  }
  
  async transferNFT(id: string, fromAddress: string, toAddress: string): Promise<boolean> {
    const numId = parseInt(id, 10);
    const result = await db
      .update(nfts)
      .set({ owner_address: toAddress })
      .where(
        and(
          eq(nfts.id, numId),
          eq(nfts.owner_address, fromAddress)
        )
      );
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  async getNetworkStats(): Promise<NetworkStats> {
    // Get current block height
    const blockHeight = await this.getCurrentBlockHeight();
    
    // Get difficulty from the latest block
    let difficulty = 1243.45; // Default value
    let lastBlockTimestamp = new Date();
    
    if (blockHeight > 0) {
      const [latestBlock] = await db
        .select()
        .from(blocks)
        .orderBy(desc(blocks.height))
        .limit(1);
        
      if (latestBlock) {
        difficulty = latestBlock.difficulty;
        lastBlockTimestamp = latestBlock.timestamp;
      }
    }
    
    // Get count of miners (approximation of "peers")
    const [minersResult] = await db
      .select({ count: sql<number>`count(distinct ${mining_stats.address})` })
      .from(mining_stats)
      .where(eq(mining_stats.is_currently_mining, true));
    const peers = minersResult?.count || 0;
    
    // Get total supply from sum of all wallet balances
    const [supplyResult] = await db
      .select({ sum: sql<string>`sum(${wallets.balance})` })
      .from(wallets);
    const circulatingSupply = Number(supplyResult?.sum || "0");
    
    // Total supply is set to 6,009,420,000,000,000 μPVX per user's requirements
    const totalSupply = 6009420000000000;
    
    // Calculate hash rate based on mining stats
    const [hashRateResult] = await db
      .select({ sum: sql<string>`sum(${mining_stats.current_hash_rate})` })
      .from(mining_stats)
      .where(eq(mining_stats.is_currently_mining, true));
    const totalHashRate = Number(hashRateResult?.sum || "0");
    
    // Format hash rate with appropriate unit
    let hashRate = "0 H/s";
    if (totalHashRate > 0) {
      if (totalHashRate >= 1000000000000) {
        hashRate = `${(totalHashRate / 1000000000000).toFixed(1)} TH/s`;
      } else if (totalHashRate >= 1000000000) {
        hashRate = `${(totalHashRate / 1000000000).toFixed(1)} GH/s`;
      } else if (totalHashRate >= 1000000) {
        hashRate = `${(totalHashRate / 1000000).toFixed(1)} MH/s`;
      } else if (totalHashRate >= 1000) {
        hashRate = `${(totalHashRate / 1000).toFixed(1)} KH/s`;
      } else {
        hashRate = `${totalHashRate.toFixed(1)} H/s`;
      }
    }
    
    return {
      blockHeight,
      blockTime: "~15 sec",
      peers,
      hashRate,
      lastBlockTimestamp,
      difficulty,
      circulatingSupply,
      totalSupply
    };
  }
}

export const storage = new DatabaseStorage();