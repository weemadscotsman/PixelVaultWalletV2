import { Badge, BadgeType, BadgeRarity, UserBadge } from '@shared/types';
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
    const defaultBadges: Badge[] = [
      // Transaction badges
      {
        id: 'tx-first',
        name: 'First Transaction',
        description: 'Completed your first PVX transaction',
        type: BadgeType.TRANSACTION,
        rarity: BadgeRarity.COMMON,
        requirement: 'Complete 1 transaction'
      },
      {
        id: 'tx-10',
        name: 'Transaction Adept',
        description: 'Completed 10 PVX transactions',
        type: BadgeType.TRANSACTION,
        rarity: BadgeRarity.UNCOMMON,
        requirement: 'Complete 10 transactions'
      },
      {
        id: 'tx-100',
        name: 'Transaction Master',
        description: 'Completed 100 PVX transactions',
        type: BadgeType.TRANSACTION,
        rarity: BadgeRarity.RARE,
        requirement: 'Complete 100 transactions'
      },
      
      // Mining badges
      {
        id: 'mining-first-block',
        name: 'Block Miner',
        description: 'Successfully mined your first block',
        type: BadgeType.MINING,
        rarity: BadgeRarity.COMMON,
        requirement: 'Mine 1 block'
      },
      {
        id: 'mining-10-blocks',
        name: 'Mining Enthusiast',
        description: 'Successfully mined 10 blocks',
        type: BadgeType.MINING,
        rarity: BadgeRarity.UNCOMMON,
        requirement: 'Mine 10 blocks'
      },
      {
        id: 'mining-50-blocks',
        name: 'Mining Expert',
        description: 'Successfully mined 50 blocks',
        type: BadgeType.MINING,
        rarity: BadgeRarity.RARE,
        requirement: 'Mine 50 blocks'
      },
      {
        id: 'mining-hash-king',
        name: 'Hash King',
        description: 'Mine 10 blocks in succession',
        type: BadgeType.MINING,
        rarity: BadgeRarity.EPIC,
        requirement: 'Mine 10 consecutive blocks'
      },
      
      // Staking badges
      {
        id: 'staking-first',
        name: 'Stake Novice',
        description: 'Staked PVX tokens for the first time',
        type: BadgeType.STAKING,
        rarity: BadgeRarity.COMMON,
        requirement: 'Stake tokens once'
      },
      {
        id: 'staking-30days',
        name: 'Stake Holder',
        description: 'Maintained a stake for 30 days',
        type: BadgeType.STAKING,
        rarity: BadgeRarity.UNCOMMON,
        requirement: 'Keep a stake active for 30 days'
      },
      {
        id: 'staking-1000pvx',
        name: 'Whale Staker',
        description: 'Staked over 1000 PVX at once',
        type: BadgeType.STAKING,
        rarity: BadgeRarity.RARE,
        requirement: 'Stake 1000 PVX in a single stake'
      },
      
      // Governance badges
      {
        id: 'gov-first-vote',
        name: 'Governance Voter',
        description: 'Participated in a network governance vote',
        type: BadgeType.GOVERNANCE,
        rarity: BadgeRarity.COMMON,
        requirement: 'Vote in 1 governance proposal'
      },
      {
        id: 'gov-proposal',
        name: 'Proposal Creator',
        description: 'Created a governance proposal',
        type: BadgeType.GOVERNANCE,
        rarity: BadgeRarity.RARE,
        requirement: 'Create a governance proposal'
      },
      {
        id: 'gov-winning-proposal',
        name: 'Proposal Winner',
        description: 'Had a governance proposal passed by the network',
        type: BadgeType.GOVERNANCE,
        rarity: BadgeRarity.EPIC,
        requirement: 'Have a proposal pass with majority vote'
      },
      
      // Thringlet badges
      {
        id: 'thringlet-first',
        name: 'Thringlet Owner',
        description: 'Acquired your first Thringlet',
        type: BadgeType.THRINGLET,
        rarity: BadgeRarity.COMMON,
        requirement: 'Own 1 Thringlet'
      },
      {
        id: 'thringlet-evolved',
        name: 'Thringlet Evolved',
        description: 'Evolved a Thringlet to its next stage',
        type: BadgeType.THRINGLET,
        rarity: BadgeRarity.UNCOMMON,
        requirement: 'Evolve a Thringlet once'
      },
      {
        id: 'thringlet-max-level',
        name: 'Thringlet Maximalist',
        description: 'Evolved a Thringlet to maximum level',
        type: BadgeType.THRINGLET,
        rarity: BadgeRarity.LEGENDARY,
        requirement: 'Max out a Thringlet\'s level'
      },
      
      // Special badges
      {
        id: 'special-early-adopter',
        name: 'Early Adopter',
        description: 'Joined PVX during the alpha phase',
        type: BadgeType.SPECIAL,
        rarity: BadgeRarity.EPIC,
        requirement: 'Created a wallet before official launch'
      },
      {
        id: 'special-night-owl',
        name: 'Night Owl',
        description: 'Performed transactions at 3 AM',
        type: BadgeType.SPECIAL,
        rarity: BadgeRarity.RARE,
        requirement: 'Complete a transaction between 2-4 AM',
        secret: true
      },
      {
        id: 'special-pvx-visionary',
        name: 'PVX Visionary',
        description: 'Contributed to the PVX ecosystem in a significant way',
        type: BadgeType.SPECIAL,
        rarity: BadgeRarity.MYTHIC,
        requirement: 'Special award from PVX team'
      }
    ];
    
    fs.writeFileSync(BADGES_DATA_FILE, JSON.stringify(defaultBadges, null, 2));
    console.log('Badge data loaded from file');
  }
  
  // Create user badge file if it doesn't exist
  if (!fs.existsSync(USER_BADGES_DATA_FILE)) {
    fs.writeFileSync(USER_BADGES_DATA_FILE, JSON.stringify([], null, 2));
  }
}

// Initialize data files
ensureBadgeDataFiles();

// Load badges from file
export function loadBadges(): Badge[] {
  try {
    if (fs.existsSync(BADGES_DATA_FILE)) {
      const data = fs.readFileSync(BADGES_DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading badge data:', error);
  }
  return [];
}

// Save badges to file
export function saveBadges(badges: Badge[]): void {
  try {
    fs.writeFileSync(BADGES_DATA_FILE, JSON.stringify(badges, null, 2));
  } catch (error) {
    console.error('Error saving badge data:', error);
  }
}

// Load user badges from file
export function loadUserBadges(): UserBadge[] {
  try {
    if (fs.existsSync(USER_BADGES_DATA_FILE)) {
      const data = fs.readFileSync(USER_BADGES_DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading user badge data:', error);
  }
  return [];
}

// Save user badges to file
export function saveUserBadges(userBadges: UserBadge[]): void {
  try {
    fs.writeFileSync(USER_BADGES_DATA_FILE, JSON.stringify(userBadges, null, 2));
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