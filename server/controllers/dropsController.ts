import { Request, Response } from 'express';
import crypto from 'crypto';
import { memBlockchainStorage } from '../mem-blockchain';
import { broadcastTransaction } from '../utils/websocket';
import { PVX_GENESIS_ADDRESS } from '../utils/constants';
import { updateBadgeStatus } from '../services/badge-service';
import { generateRandomHash } from '../utils/crypto';

// Define TransactionType as string literals since the enum is not available
const TransactionType = {
  TRANSFER: 'TRANSFER',
  MINING_REWARD: 'MINING_REWARD',
  STAKING_REWARD: 'STAKING_REWARD',
  AIRDROP: 'AIRDROP',
  NFT_MINT: 'NFT_MINT',
  BADGE_AWARD: 'BADGE_AWARD'
};

interface Drop {
  id: string;
  name: string;
  description: string;
  type: 'NFT' | 'TOKEN' | 'BADGE';
  rarity: 'Common' | 'Rare' | 'Legendary' | 'Mythical';
  imageUrl: string;
  tokenAmount?: number;
  createdAt: Date;
  expiresAt: Date;
  claimedBy: string[];
  claimLimit: number;
  minWalletAge: number; // In days
  minStakingAmount: number; // Minimum amount staked to be eligible
  minMiningBlocks: number; // Minimum blocks mined to be eligible
  securityScore: number; // 0-100, higher is more secure/valuable
}

// In-memory storage for drops until we move to database
const activeDrops: Drop[] = [
  {
    id: 'drop_001',
    name: 'Genesis Supporter',
    description: 'An exclusive badge for early supporters of PixelVault blockchain',
    type: 'BADGE',
    rarity: 'Rare',
    imageUrl: '/assets/drops/genesis_badge.png',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    claimedBy: [],
    claimLimit: 100,
    minWalletAge: 1, // 1 day
    minStakingAmount: 0,
    minMiningBlocks: 0,
    securityScore: 85
  },
  {
    id: 'drop_002',
    name: 'First Mining Reward',
    description: 'A small reward for miners who support the PixelVault network',
    type: 'TOKEN',
    rarity: 'Common',
    imageUrl: '/assets/drops/mining_reward.png',
    tokenAmount: 1000, // μPVX
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    claimedBy: [],
    claimLimit: 200,
    minWalletAge: 0,
    minStakingAmount: 0,
    minMiningBlocks: 5, // Must have mined at least 5 blocks
    securityScore: 70
  },
  {
    id: 'drop_003',
    name: 'Quantum Pioneer NFT',
    description: 'A rare NFT for early adopters of PixelVault\'s quantum features',
    type: 'NFT',
    rarity: 'Legendary',
    imageUrl: '/assets/drops/quantum_nft.png',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    claimedBy: [],
    claimLimit: 50,
    minWalletAge: 3, // 3 days
    minStakingAmount: 5000, // Must have staked at least 5000 μPVX
    minMiningBlocks: 0,
    securityScore: 95
  }
];

/**
 * Get all active drops
 */
export const getActiveDrops = async (req: Request, res: Response): Promise<void> => {
  try {
    // Filter to only show active drops (not expired)
    const now = new Date();
    const activeDrps = activeDrops.filter(drop => drop.expiresAt > now);
    
    // Don't send claimedBy array to client for privacy
    const sanitizedDrops = activeDrps.map(({ claimedBy, ...rest }) => ({
      ...rest,
      claimedCount: claimedBy.length,
      remainingClaims: rest.claimLimit - claimedBy.length
    }));
    
    res.status(200).json(sanitizedDrops);
  } catch (error) {
    console.error('Error getting active drops:', error);
    res.status(500).json({ error: 'Failed to fetch active drops' });
  }
};

/**
 * Get a specific drop by ID
 */
export const getDropById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dropId } = req.params;
    const drop = activeDrops.find(d => d.id === dropId);
    
    if (!drop) {
      res.status(404).json({ error: 'Drop not found' });
      return;
    }
    
    // Don't send claimedBy array to client for privacy
    const { claimedBy, ...rest } = drop;
    const sanitizedDrop = {
      ...rest,
      claimedCount: claimedBy.length,
      remainingClaims: rest.claimLimit - claimedBy.length
    };
    
    res.status(200).json(sanitizedDrop);
  } catch (error) {
    console.error('Error getting drop by ID:', error);
    res.status(500).json({ error: 'Failed to fetch drop' });
  }
};

/**
 * Check eligibility for a drop without claiming
 */
export const checkDropEligibility = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dropId, walletAddress } = req.params;
    
    // Find the drop
    const drop = activeDrops.find(d => d.id === dropId);
    if (!drop) {
      res.status(404).json({ error: 'Drop not found' });
      return;
    }
    
    // Check if wallet exists
    const wallet = await memBlockchainStorage.getWalletByAddress(walletAddress);
    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }
    
    // Check if already claimed
    if (drop.claimedBy.includes(walletAddress)) {
      res.status(400).json({ 
        eligible: false,
        reason: 'This drop has already been claimed by this wallet'
      });
      return;
    }
    
    // Check if claim limit reached
    if (drop.claimedBy.length >= drop.claimLimit) {
      res.status(400).json({ 
        eligible: false,
        reason: 'Claim limit for this drop has been reached'
      });
      return;
    }
    
    // Check if expired
    const now = new Date();
    if (drop.expiresAt < now) {
      res.status(400).json({ 
        eligible: false,
        reason: 'This drop has expired'
      });
      return;
    }
    
    // Check minimum wallet age
    const walletAgeInDays = (now.getTime() - wallet.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (walletAgeInDays < drop.minWalletAge) {
      res.status(400).json({ 
        eligible: false,
        reason: `Wallet must be at least ${drop.minWalletAge} days old`
      });
      return;
    }
    
    // Check minimum staking amount if required
    if (drop.minStakingAmount > 0) {
      const activeStakes = await memBlockchainStorage.getActiveStakesByAddress(walletAddress);
      const totalStaked = activeStakes.reduce((sum, stake) => sum + parseFloat(stake.amount), 0);
      
      if (totalStaked < drop.minStakingAmount) {
        res.status(400).json({ 
          eligible: false,
          reason: `Minimum staking amount of ${drop.minStakingAmount} μPVX required`
        });
        return;
      }
    }
    
    // Check minimum mining blocks if required
    if (drop.minMiningBlocks > 0) {
      const minerStats = await memBlockchainStorage.getMinerByAddress(walletAddress);
      
      if (!minerStats || minerStats.blocksMined < drop.minMiningBlocks) {
        res.status(400).json({ 
          eligible: false,
          reason: `Must have mined at least ${drop.minMiningBlocks} blocks`
        });
        return;
      }
    }
    
    // If we made it here, the wallet is eligible
    res.status(200).json({ 
      eligible: true,
      drop: {
        id: drop.id,
        name: drop.name,
        type: drop.type,
        rarity: drop.rarity,
        expiresAt: drop.expiresAt
      }
    });
    
  } catch (error) {
    console.error('Error checking drop eligibility:', error);
    res.status(500).json({ error: 'Failed to check eligibility' });
  }
};

/**
 * Claim a drop - process eligibility and reward the user
 */
export const claimDrop = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dropId, walletAddress } = req.params;
    
    // Find the drop
    const drop = activeDrops.find(d => d.id === dropId);
    if (!drop) {
      res.status(404).json({ error: 'Drop not found' });
      return;
    }
    
    // Check if wallet exists
    const wallet = await memBlockchainStorage.getWalletByAddress(walletAddress);
    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }
    
    // Check if already claimed
    if (drop.claimedBy.includes(walletAddress)) {
      res.status(400).json({ error: 'This drop has already been claimed by this wallet' });
      return;
    }
    
    // Check if claim limit reached
    if (drop.claimedBy.length >= drop.claimLimit) {
      res.status(400).json({ error: 'Claim limit for this drop has been reached' });
      return;
    }
    
    // Check if expired
    const now = new Date();
    if (drop.expiresAt < now) {
      res.status(400).json({ error: 'This drop has expired' });
      return;
    }
    
    // Check minimum wallet age
    const walletAgeInDays = (now.getTime() - wallet.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (walletAgeInDays < drop.minWalletAge) {
      res.status(400).json({ error: `Wallet must be at least ${drop.minWalletAge} days old` });
      return;
    }
    
    // Check minimum staking amount if required
    if (drop.minStakingAmount > 0) {
      const activeStakes = await memBlockchainStorage.getActiveStakesByAddress(walletAddress);
      const totalStaked = activeStakes.reduce((sum, stake) => sum + parseFloat(stake.amount), 0);
      
      if (totalStaked < drop.minStakingAmount) {
        res.status(400).json({ error: `Minimum staking amount of ${drop.minStakingAmount} μPVX required` });
        return;
      }
    }
    
    // Check minimum mining blocks if required
    if (drop.minMiningBlocks > 0) {
      const minerStats = await memBlockchainStorage.getMinerByAddress(walletAddress);
      
      if (!minerStats || minerStats.blocksMined < drop.minMiningBlocks) {
        res.status(400).json({ error: `Must have mined at least ${drop.minMiningBlocks} blocks` });
        return;
      }
    }
    
    // Process the claim based on drop type
    let claimResult;
    switch (drop.type) {
      case 'TOKEN':
        claimResult = await processTokenDrop(drop, walletAddress);
        break;
      case 'NFT':
        claimResult = await processNftDrop(drop, walletAddress);
        break;
      case 'BADGE':
        claimResult = await processBadgeDrop(drop, walletAddress);
        break;
      default:
        res.status(400).json({ error: 'Invalid drop type' });
        return;
    }
    
    // Mark as claimed
    drop.claimedBy.push(walletAddress);
    
    res.status(200).json({
      success: true,
      message: `Successfully claimed ${drop.name}`,
      claimResult
    });
    
  } catch (error) {
    console.error('Error claiming drop:', error);
    res.status(500).json({ error: 'Failed to claim drop' });
  }
};

/**
 * Process a token drop - send tokens to the user
 */
async function processTokenDrop(drop: Drop, walletAddress: string) {
  if (!drop.tokenAmount) {
    throw new Error('Token amount is not defined for this drop');
  }
  
  // Get the wallet
  const wallet = await memBlockchainStorage.getWalletByAddress(walletAddress);
  if (!wallet) {
    throw new Error('Wallet not found');
  }
  
  // Create a transaction for the token transfer
  const timestamp = Date.now();
  const txHash = crypto.createHash('sha256')
    .update(`drop_${drop.id}_${walletAddress}_${timestamp}`)
    .digest('hex');
  
  const transaction = {
    hash: txHash,
    type: TransactionType.AIRDROP,
    from: PVX_GENESIS_ADDRESS,
    to: walletAddress,
    amount: drop.tokenAmount,
    timestamp: timestamp,
    nonce: Math.floor(Math.random() * 100000),
    signature: generateRandomHash(),
    status: 'confirmed'
  };
  
  // Add transaction to the blockchain
  await memBlockchainStorage.createTransaction(transaction);
  
  // Update wallet balance
  const newBalance = BigInt(wallet.balance) + BigInt(drop.tokenAmount);
  wallet.balance = newBalance.toString();
  wallet.lastSynced = new Date(timestamp);
  await memBlockchainStorage.updateWallet(wallet);
  
  // Broadcast transaction via WebSocket
  try {
    broadcastTransaction(transaction);
  } catch (err) {
    console.error('Error broadcasting airdrop transaction:', err);
    // Continue even if broadcast fails
  }
  
  return {
    type: 'TOKEN',
    amount: drop.tokenAmount,
    transactionHash: txHash
  };
}

/**
 * Process an NFT drop - mint NFT for the user
 */
async function processNftDrop(drop: Drop, walletAddress: string) {
  // Generate a unique identifier for the NFT
  const nftId = `${drop.id}_${crypto.randomBytes(8).toString('hex')}`;
  
  // Create a transaction for the NFT mint
  const timestamp = Date.now();
  const txHash = crypto.createHash('sha256')
    .update(`nft_mint_${nftId}_${walletAddress}_${timestamp}`)
    .digest('hex');
  
  const transaction = {
    hash: txHash,
    type: TransactionType.NFT_MINT,
    from: PVX_GENESIS_ADDRESS,
    to: walletAddress,
    amount: 0, // NFTs don't have a token amount
    timestamp: timestamp,
    nonce: Math.floor(Math.random() * 100000),
    signature: generateRandomHash(),
    status: 'confirmed',
    metadata: {
      nftId,
      name: drop.name,
      description: drop.description,
      imageUrl: drop.imageUrl,
      rarity: drop.rarity
    }
  };
  
  // Add transaction to the blockchain
  await memBlockchainStorage.createTransaction(transaction);
  
  // Broadcast transaction via WebSocket
  try {
    broadcastTransaction(transaction);
  } catch (err) {
    console.error('Error broadcasting NFT mint transaction:', err);
    // Continue even if broadcast fails
  }
  
  return {
    type: 'NFT',
    nftId,
    rarity: drop.rarity,
    transactionHash: txHash
  };
}

/**
 * Process a badge drop - award badge to the user
 */
async function processBadgeDrop(drop: Drop, walletAddress: string) {
  // Generate badge ID from drop name
  const badgeId = drop.name.toLowerCase().replace(/\s+/g, '_');
  
  // Update badge in badge service
  await updateBadgeStatus(walletAddress, badgeId, true);
  
  // Create a transaction for the badge award
  const timestamp = Date.now();
  const txHash = crypto.createHash('sha256')
    .update(`badge_${badgeId}_${walletAddress}_${timestamp}`)
    .digest('hex');
  
  const transaction = {
    hash: txHash,
    type: TransactionType.BADGE_AWARD,
    from: PVX_GENESIS_ADDRESS,
    to: walletAddress,
    amount: 0, // Badges don't have a token amount
    timestamp: timestamp,
    nonce: Math.floor(Math.random() * 100000),
    signature: generateRandomHash(),
    status: 'confirmed',
    metadata: {
      badgeId,
      name: drop.name,
      description: drop.description,
      rarity: drop.rarity
    }
  };
  
  // Add transaction to the blockchain
  await memBlockchainStorage.createTransaction(transaction);
  
  // Broadcast transaction via WebSocket
  try {
    broadcastTransaction(transaction);
  } catch (err) {
    console.error('Error broadcasting badge award transaction:', err);
    // Continue even if broadcast fails
  }
  
  return {
    type: 'BADGE',
    badgeId,
    rarity: drop.rarity,
    transactionHash: txHash
  };
}

/**
 * Get user's claimed drops
 */
export const getUserClaimedDrops = async (req: Request, res: Response): Promise<void> => {
  try {
    const { walletAddress } = req.params;
    
    // Check if wallet exists
    const wallet = await memBlockchainStorage.getWalletByAddress(walletAddress);
    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }
    
    // Find all drops claimed by this wallet
    const claimedDrops = activeDrops.filter(drop => drop.claimedBy.includes(walletAddress))
      .map(({ claimedBy, ...rest }) => rest);
    
    res.status(200).json(claimedDrops);
  } catch (error) {
    console.error('Error getting user claimed drops:', error);
    res.status(500).json({ error: 'Failed to fetch claimed drops' });
  }
};