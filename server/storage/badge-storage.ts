import { Badge, BadgeType, BadgeRarity, UserBadge } from '@shared/types';
import * as fs from 'fs';
import * as path from 'path';

// Serializable storage state
interface StorageState {
  badges: [string, Badge][];
  userBadges: [string, UserBadge][];
}

// Path for persisting badge data
const DATA_FILE_PATH = './data/badge-data.json';

// In-memory badge data storage with file persistence
export class BadgeStorage {
  private badges: Map<string, Badge> = new Map();
  private userBadges: Map<string, UserBadge> = new Map();
  
  constructor() {
    // Load data from file
    this.loadFromFile();
    this.addDefaultBadges();
  }
  
  // Add default badges if none exist
  private addDefaultBadges() {
    if (this.badges.size === 0) {
      // Transaction badges
      const firstTransaction: Badge = {
        id: "tx-first",
        name: "First Transaction",
        description: "Completed your first PVX transaction",
        type: BadgeType.TRANSACTION,
        rarity: BadgeRarity.COMMON,
        icon: "transaction-first",
        requirement: "Send your first transaction on the PVX network",
        secret: false
      };
      
      const bigSpender: Badge = {
        id: "tx-big-spender",
        name: "Big Spender",
        description: "Sent over 1000 PVX in a single transaction",
        type: BadgeType.TRANSACTION,
        rarity: BadgeRarity.UNCOMMON,
        icon: "transaction-big",
        requirement: "Send more than 1000 PVX in a single transaction",
        secret: false
      };
      
      // Mining badges
      const firstBlock: Badge = {
        id: "mining-first",
        name: "Block Pioneer",
        description: "Mined your first block on the PVX blockchain",
        type: BadgeType.MINING,
        rarity: BadgeRarity.COMMON,
        icon: "mining-first",
        requirement: "Mine your first block on the PVX network",
        secret: false
      };
      
      const miningMaster: Badge = {
        id: "mining-master",
        name: "Mining Master",
        description: "Mined over 100 blocks on the PVX blockchain",
        type: BadgeType.MINING,
        rarity: BadgeRarity.RARE,
        icon: "mining-master",
        requirement: "Mine 100 blocks on the PVX network",
        secret: false
      };
      
      // Staking badges
      const firstStake: Badge = {
        id: "stake-first",
        name: "Stake Initiate",
        description: "Made your first stake in the PVX network",
        type: BadgeType.STAKING,
        rarity: BadgeRarity.COMMON,
        icon: "stake-first",
        requirement: "Stake any amount of PVX for the first time",
        secret: false
      };
      
      const whaleStaker: Badge = {
        id: "stake-whale",
        name: "Whale Staker",
        description: "Staked more than 10,000 PVX in a single pool",
        type: BadgeType.STAKING,
        rarity: BadgeRarity.EPIC,
        icon: "stake-whale",
        requirement: "Stake 10,000+ PVX in a single pool",
        secret: false
      };
      
      // Governance badges
      const firstVote: Badge = {
        id: "gov-first",
        name: "Governance Participant",
        description: "Cast your first vote in the PVX governance system",
        type: BadgeType.GOVERNANCE,
        rarity: BadgeRarity.COMMON,
        icon: "gov-first",
        requirement: "Vote on any governance proposal",
        secret: false
      };
      
      // Thringlet badges
      const thringletParent: Badge = {
        id: "thringlet-first",
        name: "Thringlet Parent",
        description: "Created your first Thringlet",
        type: BadgeType.THRINGLET,
        rarity: BadgeRarity.COMMON,
        icon: "thringlet-first",
        requirement: "Create your first Thringlet",
        secret: false
      };
      
      const thringletWhisperer: Badge = {
        id: "thringlet-whisperer",
        name: "Thringlet Whisperer",
        description: "Interact with your Thringlet 100 times",
        type: BadgeType.THRINGLET,
        rarity: BadgeRarity.RARE,
        icon: "thringlet-whisperer",
        requirement: "Have 100 total interactions with your Thringlets",
        secret: false
      };
      
      // Special badges
      const earlyAdopter: Badge = {
        id: "special-early",
        name: "PVX Pioneer",
        description: "One of the first 100 users on the PVX network",
        type: BadgeType.SPECIAL,
        rarity: BadgeRarity.MYTHIC,
        icon: "special-pioneer",
        requirement: "Be among the first 100 wallet addresses on the network",
        secret: true
      };
      
      // Add badges to storage
      this.badges.set(firstTransaction.id, firstTransaction);
      this.badges.set(bigSpender.id, bigSpender);
      this.badges.set(firstBlock.id, firstBlock);
      this.badges.set(miningMaster.id, miningMaster);
      this.badges.set(firstStake.id, firstStake);
      this.badges.set(whaleStaker.id, whaleStaker);
      this.badges.set(firstVote.id, firstVote);
      this.badges.set(thringletParent.id, thringletParent);
      this.badges.set(thringletWhisperer.id, thringletWhisperer);
      this.badges.set(earlyAdopter.id, earlyAdopter);
      
      // Add some example user badges for testing
      const userBadge1: UserBadge = {
        badgeId: "tx-first",
        userId: "PVX_1e1ee32c2770a6af3ca119759c539907",
        earnedAt: Date.now() - 86400000 * 3 // 3 days ago
      };
      
      const userBadge2: UserBadge = {
        badgeId: "mining-first",
        userId: "PVX_1e1ee32c2770a6af3ca119759c539907",
        earnedAt: Date.now() - 86400000 * 2 // 2 days ago
      };
      
      const userBadge3: UserBadge = {
        badgeId: "stake-first",
        userId: "PVX_f5ba480b7db6010eecb453eca8e67ff0",
        earnedAt: Date.now() - 86400000, // 1 day ago
        progress: 100
      };
      
      const userBadgeId1 = `${userBadge1.userId}-${userBadge1.badgeId}`;
      const userBadgeId2 = `${userBadge2.userId}-${userBadge2.badgeId}`;
      const userBadgeId3 = `${userBadge3.userId}-${userBadge3.badgeId}`;
      
      this.userBadges.set(userBadgeId1, userBadge1);
      this.userBadges.set(userBadgeId2, userBadge2);
      this.userBadges.set(userBadgeId3, userBadge3);
      
      // Save the test data
      this.saveToFile();
    }
  }
  
  // Save data to file
  private async saveToFile() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(DATA_FILE_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Prepare data for serialization
      const data: StorageState = {
        badges: Array.from(this.badges.entries()),
        userBadges: Array.from(this.userBadges.entries())
      };
      
      // Write to file
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
      console.log("Badge data saved to file");
    } catch (error) {
      console.error("Failed to save badge data:", error);
    }
  }
  
  // Load data from file
  private loadFromFile() {
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const data = JSON.parse(fs.readFileSync(DATA_FILE_PATH, 'utf8')) as StorageState;
        
        // Restore badges
        this.badges = new Map(data.badges || []);
        
        // Restore user badges
        this.userBadges = new Map(data.userBadges || []);
        
        console.log("Badge data loaded from file");
      } else {
        console.log("No badge data file found, starting with empty state");
      }
    } catch (error) {
      console.error("Failed to load badge data:", error);
    }
  }
  
  // Badge methods
  async getBadge(id: string): Promise<Badge | undefined> {
    return this.badges.get(id);
  }
  
  async getAllBadges(): Promise<Badge[]> {
    return Array.from(this.badges.values());
  }
  
  async getVisibleBadges(): Promise<Badge[]> {
    return Array.from(this.badges.values()).filter(b => !b.secret);
  }
  
  async getBadgesByType(type: BadgeType): Promise<Badge[]> {
    return Array.from(this.badges.values()).filter(b => b.type === type);
  }
  
  async createBadge(badge: Badge): Promise<Badge> {
    this.badges.set(badge.id, badge);
    await this.saveToFile();
    return badge;
  }
  
  async updateBadge(id: string, updates: Partial<Badge>): Promise<Badge | undefined> {
    const badge = this.badges.get(id);
    if (!badge) return undefined;
    
    const updatedBadge = { ...badge, ...updates };
    this.badges.set(id, updatedBadge);
    await this.saveToFile();
    return updatedBadge;
  }
  
  async deleteBadge(id: string): Promise<boolean> {
    const success = this.badges.delete(id);
    if (success) {
      // Also delete any user badges for this badge
      const userBadgeIdsToDelete = Array.from(this.userBadges.entries())
        .filter(([_, userBadge]) => userBadge.badgeId === id)
        .map(([id, _]) => id);
      
      userBadgeIdsToDelete.forEach(id => this.userBadges.delete(id));
      
      await this.saveToFile();
    }
    return success;
  }
  
  // User Badge methods
  async getUserBadge(userId: string, badgeId: string): Promise<UserBadge | undefined> {
    const id = `${userId}-${badgeId}`;
    return this.userBadges.get(id);
  }
  
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return Array.from(this.userBadges.values())
      .filter(ub => ub.userId === userId);
  }
  
  // Get complete badge details for a user
  async getUserBadgesWithDetails(userId: string): Promise<(UserBadge & { badge: Badge })[]> {
    const userBadges = await this.getUserBadges(userId);
    return userBadges
      .map(ub => {
        const badge = this.badges.get(ub.badgeId);
        if (!badge) return null;
        return { ...ub, badge };
      })
      .filter((item): item is (UserBadge & { badge: Badge }) => item !== null);
  }
  
  async awardBadge(userId: string, badgeId: string): Promise<UserBadge | undefined> {
    // Check if badge exists
    const badge = await this.getBadge(badgeId);
    if (!badge) return undefined;
    
    // Check if user already has this badge
    const existingBadge = await this.getUserBadge(userId, badgeId);
    if (existingBadge) return existingBadge;
    
    // Create new user badge
    const userBadge: UserBadge = {
      badgeId,
      userId,
      earnedAt: Date.now(),
      progress: 100 // Fully completed
    };
    
    const id = `${userId}-${badgeId}`;
    this.userBadges.set(id, userBadge);
    await this.saveToFile();
    return userBadge;
  }
  
  async updateUserBadgeProgress(userId: string, badgeId: string, progress: number): Promise<UserBadge | undefined> {
    const id = `${userId}-${badgeId}`;
    const userBadge = this.userBadges.get(id);
    
    // If user doesn't have this badge yet, create with progress
    if (!userBadge) {
      // Check if badge exists
      const badge = await this.getBadge(badgeId);
      if (!badge) return undefined;
      
      const newUserBadge: UserBadge = {
        badgeId,
        userId,
        earnedAt: progress >= 100 ? Date.now() : 0, // Only set earnedAt if completed
        progress
      };
      
      this.userBadges.set(id, newUserBadge);
      await this.saveToFile();
      return newUserBadge;
    }
    
    // Update existing badge progress
    const updatedUserBadge: UserBadge = { 
      ...userBadge,
      progress,
      // Update earnedAt if newly completed
      earnedAt: progress >= 100 && (!userBadge.earnedAt || userBadge.earnedAt === 0) 
        ? Date.now() 
        : userBadge.earnedAt
    };
    
    this.userBadges.set(id, updatedUserBadge);
    await this.saveToFile();
    return updatedUserBadge;
  }
  
  async revokeUserBadge(userId: string, badgeId: string): Promise<boolean> {
    const id = `${userId}-${badgeId}`;
    const success = this.userBadges.delete(id);
    if (success) {
      await this.saveToFile();
    }
    return success;
  }
}

// Export singleton instance
export const badgeStorage = new BadgeStorage();