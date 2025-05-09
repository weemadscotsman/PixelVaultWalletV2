import { Badge, BadgeType, BadgeRarity, UserBadge } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to badges data file
const BADGES_DATA_FILE = path.join(__dirname, '../../data/badges.json');
const USER_BADGES_DATA_FILE = path.join(__dirname, '../../data/user-badges.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Created data directory at ${dataDir}`);
  }
}

// Ensure badge data files exist with default data
function ensureBadgeDataFiles() {
  ensureDataDir();
  
  // Create badge definitions file if it doesn't exist
  if (!fs.existsSync(BADGES_DATA_FILE)) {
    // Following the exact blueprint data structure with Map entries
    const defaultBadges = {
      badges: [
        [
          "tx-first",
          {
            id: "tx-first",
            name: "First Transaction",
            description: "Completed your first PVX transaction",
            type: "transaction",
            rarity: "common",
            icon: "transaction-first",
            requirement: "Send your first transaction on the PVX network",
            secret: false
          }
        ],
        [
          "tx-big-spender",
          {
            id: "tx-big-spender",
            name: "Big Spender",
            description: "Sent over 1000 PVX in a single transaction",
            type: "transaction",
            rarity: "uncommon",
            icon: "transaction-big",
            requirement: "Send more than 1000 PVX in a single transaction",
            secret: false
          }
        ],
        [
          "mining-first",
          {
            id: "mining-first",
            name: "Block Pioneer",
            description: "Mined your first block on the PVX blockchain",
            type: "mining",
            rarity: "common",
            icon: "mining-first",
            requirement: "Mine your first block on the PVX network",
            secret: false
          }
        ],
        [
          "mining-master",
          {
            id: "mining-master",
            name: "Mining Master",
            description: "Mined over 100 blocks on the PVX blockchain",
            type: "mining",
            rarity: "rare",
            icon: "mining-master",
            requirement: "Mine 100 blocks on the PVX network",
            secret: false
          }
        ],
        [
          "stake-first",
          {
            id: "stake-first",
            name: "Stake Initiate",
            description: "Made your first stake in the PVX network",
            type: "staking",
            rarity: "common",
            icon: "stake-first",
            requirement: "Stake any amount of PVX for the first time",
            secret: false
          }
        ],
        [
          "stake-whale",
          {
            id: "stake-whale",
            name: "Whale Staker",
            description: "Staked more than 10,000 PVX in a single pool",
            type: "staking",
            rarity: "epic",
            icon: "stake-whale",
            requirement: "Stake 10,000+ PVX in a single pool",
            secret: false
          }
        ],
        [
          "gov-first",
          {
            id: "gov-first",
            name: "Governance Participant",
            description: "Cast your first vote in the PVX governance system",
            type: "governance",
            rarity: "common",
            icon: "gov-first",
            requirement: "Vote on any governance proposal",
            secret: false
          }
        ],
        [
          "thringlet-first",
          {
            id: "thringlet-first",
            name: "Thringlet Parent",
            description: "Created your first Thringlet",
            type: "thringlet",
            rarity: "common",
            icon: "thringlet-first",
            requirement: "Create your first Thringlet",
            secret: false
          }
        ],
        [
          "thringlet-whisperer",
          {
            id: "thringlet-whisperer",
            name: "Thringlet Whisperer",
            description: "Interact with your Thringlet 100 times",
            type: "thringlet",
            rarity: "rare",
            icon: "thringlet-whisperer",
            requirement: "Have 100 total interactions with your Thringlets",
            secret: false
          }
        ],
        [
          "special-early",
          {
            id: "special-early",
            name: "PVX Pioneer",
            description: "One of the first 100 users on the PVX network",
            type: "special",
            rarity: "mythic",
            icon: "special-pioneer",
            requirement: "Be among the first 100 wallet addresses on the network",
            secret: true
          }
        ]
      ],
      userBadges: []
    };
    
    fs.writeFileSync(BADGES_DATA_FILE, JSON.stringify(defaultBadges, null, 2));
    console.log('Badge data saved to file according to blueprint format');
  }
  
  // Create user badge file if it doesn't exist
  if (!fs.existsSync(USER_BADGES_DATA_FILE)) {
    fs.writeFileSync(USER_BADGES_DATA_FILE, JSON.stringify({userBadges: []}, null, 2));
  }
}

// Initialize data files
ensureBadgeDataFiles();

// Load badges from file following blueprint format
export function loadBadges(): Badge[] {
  try {
    if (fs.existsSync(BADGES_DATA_FILE)) {
      const data = fs.readFileSync(BADGES_DATA_FILE, 'utf8');
      const parsed = JSON.parse(data);
      
      // Convert from blueprint format to array of badges
      if (parsed.badges && Array.isArray(parsed.badges)) {
        // Extract badge objects from the map entries
        return parsed.badges.map((entry: [string, Badge]) => entry[1]);
      }
      return [];
    }
  } catch (error) {
    console.error('Error loading badge data:', error);
  }
  return [];
}

// Save badges to file in blueprint format
export function saveBadges(badges: Badge[]): void {
  try {
    // Convert badges to blueprint format
    const badgesMap = badges.map(badge => [badge.id, badge]);
    const data = {
      badges: badgesMap,
      userBadges: [] // This will be populated from the user badges file
    };
    
    fs.writeFileSync(BADGES_DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving badge data:', error);
  }
}

// Load user badges from file following blueprint format
export function loadUserBadges(): UserBadge[] {
  try {
    if (fs.existsSync(USER_BADGES_DATA_FILE)) {
      const data = fs.readFileSync(USER_BADGES_DATA_FILE, 'utf8');
      const parsed = JSON.parse(data);
      
      // If using shared file format with badges
      if (parsed.userBadges && Array.isArray(parsed.userBadges)) {
        // Extract user badge objects from the map entries
        return parsed.userBadges.map((entry: [string, UserBadge]) => entry[1]);
      }
      
      // If using separate user badges file
      if (Array.isArray(parsed)) {
        return parsed;
      }
      
      return [];
    }
  } catch (error) {
    console.error('Error loading user badge data:', error);
  }
  return [];
}

// Save user badges to file in blueprint format
export function saveUserBadges(userBadges: UserBadge[]): void {
  try {
    // Convert to blueprint format - array of [key, value] pairs
    // Where key is userId-badgeId and value is the badge data
    const userBadgesMap = userBadges.map(ub => {
      const key = `${ub.userId}-${ub.badgeId}`;
      return [key, ub];
    });
    
    // Using the separate user badges file format
    const data = {
      userBadges: userBadgesMap
    };
    
    fs.writeFileSync(USER_BADGES_DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving user badge data:', error);
  }
}

// Badge storage class
export class BadgeStorage {
  private badges: Badge[] = [];
  private userBadges: UserBadge[] = [];
  
  constructor() {
    this.badges = loadBadges();
    this.userBadges = loadUserBadges();
  }
  
  // Get all visible badges (excludes secret badges)
  getAllVisibleBadges(): Badge[] {
    return this.badges.filter(badge => !badge.secret);
  }
  
  // Get all badges (including secret ones)
  getAllBadges(): Badge[] {
    return [...this.badges];
  }
  
  // Get badge by ID
  getBadgeById(id: string): Badge | undefined {
    return this.badges.find(badge => badge.id === id);
  }
  
  // Get badges by type
  getBadgesByType(type: BadgeType): Badge[] {
    return this.badges.filter(badge => badge.type === type && !badge.secret);
  }
  
  // Create a new badge
  createBadge(badge: Omit<Badge, 'id'>): Badge {
    const newBadge: Badge = {
      ...badge,
      id: uuidv4()
    };
    
    this.badges.push(newBadge);
    saveBadges(this.badges);
    
    return newBadge;
  }
  
  // Update an existing badge
  updateBadge(id: string, badge: Partial<Badge>): Badge | undefined {
    const index = this.badges.findIndex(b => b.id === id);
    if (index === -1) return undefined;
    
    this.badges[index] = { ...this.badges[index], ...badge };
    saveBadges(this.badges);
    
    return this.badges[index];
  }
  
  // Delete a badge
  deleteBadge(id: string): boolean {
    const index = this.badges.findIndex(b => b.id === id);
    if (index === -1) return false;
    
    this.badges.splice(index, 1);
    saveBadges(this.badges);
    
    // Also remove any user badges for this badge
    this.userBadges = this.userBadges.filter(ub => ub.badgeId !== id);
    saveUserBadges(this.userBadges);
    
    return true;
  }
  
  // Get user badges
  getUserBadges(userId: string): UserBadge[] {
    return this.userBadges.filter(ub => ub.userId === userId);
  }
  
  // Check if user has badge
  hasUserBadge(userId: string, badgeId: string): boolean {
    return this.userBadges.some(ub => ub.userId === userId && ub.badgeId === badgeId);
  }
  
  // Award badge to user
  awardBadgeToUser(userId: string, badgeId: string): UserBadge | undefined {
    // Check if badge exists
    const badge = this.getBadgeById(badgeId);
    if (!badge) return undefined;
    
    // Check if user already has this badge
    if (this.hasUserBadge(userId, badgeId)) {
      return this.userBadges.find(ub => ub.userId === userId && ub.badgeId === badgeId);
    }
    
    // Award badge
    const userBadge: UserBadge = {
      userId,
      badgeId,
      earnedAt: Date.now()
    };
    
    this.userBadges.push(userBadge);
    saveUserBadges(this.userBadges);
    
    return userBadge;
  }
  
  // Update badge progress
  updateBadgeProgress(userId: string, badgeId: string, progress: number): { userBadge: UserBadge, newlyEarned: boolean } {
    // Check if badge exists
    const badge = this.getBadgeById(badgeId);
    if (!badge) throw new Error('Badge not found');
    
    // Check if already earned
    const existingBadge = this.userBadges.find(ub => ub.userId === userId && ub.badgeId === badgeId);
    if (existingBadge && existingBadge.earnedAt) {
      return { userBadge: existingBadge, newlyEarned: false };
    }
    
    // Update progress or create new progress entry
    let newlyEarned = false;
    let userBadge: UserBadge;
    
    if (existingBadge) {
      // Update existing record
      existingBadge.progress = Math.min(100, progress);
      
      // Award badge if progress is 100%
      if (progress >= 100 && !existingBadge.earnedAt) {
        existingBadge.earnedAt = Date.now();
        newlyEarned = true;
      }
      
      userBadge = existingBadge;
    } else {
      // Create new progress record
      userBadge = {
        userId,
        badgeId,
        progress: Math.min(100, progress),
        earnedAt: progress >= 100 ? Date.now() : 0
      };
      
      newlyEarned = progress >= 100;
      this.userBadges.push(userBadge);
    }
    
    saveUserBadges(this.userBadges);
    return { userBadge, newlyEarned };
  }
  
  // Get user badges with full badge details
  getUserBadgesWithDetails(userId: string): (UserBadge & { badge: Badge })[] {
    const userBadges = this.getUserBadges(userId);
    return userBadges.map(ub => {
      const badge = this.getBadgeById(ub.badgeId);
      return {
        ...ub,
        badge: badge!
      };
    });
  }
}

// Singleton instance
export const badgeStorage = new BadgeStorage();