import { Request, Response } from 'express';
import crypto from 'crypto';
import { broadcastTransaction } from '../utils/websocket';
import { PVX_GENESIS_ADDRESS } from '../utils/constants';
import { updateBadgeStatus } from '../services/badge-service';
import { generateRandomHash } from '../utils/crypto';
import { dropDao } from '../database/dropDao';
import { Drop as SharedDrop, Transaction as SharedTransaction, Wallet as SharedWallet, MiningStats as SharedMiningStats } from '@shared/types'; // Assuming a shared type exists
import { walletDao } from '../database/walletDao';
import { stakingService } from '../services/stakingService';
import { minerDao } from '../database/minerDao';
import { transactionDao } from '../database/transactionDao';


// Define TransactionType as string literals since the enum is not available
// Using TransactionType from shared types if possible, otherwise this is fallback
const LocalTransactionType = {
  TRANSFER: 'TRANSFER' as SharedTransaction['type'],
  MINING_REWARD: 'MINING_REWARD' as SharedTransaction['type'],
  STAKING_REWARD: 'STAKING_REWARD' as SharedTransaction['type'],
  AIRDROP: 'AIRDROP' as SharedTransaction['type'],
  NFT_MINT: 'NFT_MINT' as SharedTransaction['type'],
  BADGE_AWARD: 'BADGE_AWARD' as SharedTransaction['type']
};


/**
 * Get all active drops
 */
export const getActiveDrops = async (req: Request, res: Response): Promise<void> => {
  try {
    const activeDbDrops: SharedDrop[] = await dropDao.getActiveDrops();
    
    const responseDrops = await Promise.all(activeDbDrops.map(async (drop) => {
      const claimedCount = await dropDao.getDropClaimCount(drop.id);
      const remainingClaims = drop.claimLimit - claimedCount;
      return {
        ...drop, // Spread fields from the DAO's Drop type
        claimedCount,
        remainingClaims,
        // Ensure date fields are in the expected format if necessary (e.g., toISOString)
        createdAt: new Date(drop.createdAt).toISOString(),
        expiresAt: new Date(drop.expiresAt).toISOString(),
      };
    }));
    
    res.status(200).json(responseDrops);
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
    const drop = await dropDao.getDropById(dropId);
    
    if (!drop) {
      res.status(404).json({ error: 'Drop not found' });
      return;
    }
    
    const claimedCount = await dropDao.getDropClaimCount(drop.id);
    const remainingClaims = drop.claimLimit - claimedCount;

    const responseDrop = {
      ...drop, // Spread fields from the DAO's Drop type
      claimedCount,
      remainingClaims,
      // Ensure date fields are in the expected format if necessary
      createdAt: new Date(drop.createdAt).toISOString(),
      expiresAt: new Date(drop.expiresAt).toISOString(),
    };
    
    res.status(200).json(responseDrop);
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
    
    const drop = await dropDao.getDropById(dropId);
    if (!drop) {
      res.status(404).json({ error: 'Drop not found' });
      return;
    }
    
    const wallet = await walletDao.getWalletByAddress(walletAddress);
    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }
    
    const alreadyClaimed = await dropDao.hasDropBeenClaimed(dropId, walletAddress);
    if (alreadyClaimed) {
      res.status(400).json({ 
        eligible: false,
        reason: 'This drop has already been claimed by this wallet'
      });
      return;
    }
    
    const claimCount = await dropDao.getDropClaimCount(dropId);
    if (claimCount >= drop.claimLimit) {
      res.status(400).json({ 
        eligible: false,
        reason: 'Claim limit for this drop has been reached'
      });
      return;
    }
    
    const now = new Date();
    if (new Date(drop.expiresAt) < now) {
      res.status(400).json({ 
        eligible: false,
        reason: 'This drop has expired'
      });
      return;
    }
    
    const walletAgeInDays = (now.getTime() - new Date(wallet.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (walletAgeInDays < drop.minWalletAge) {
      res.status(400).json({ 
        eligible: false,
        reason: `Wallet must be at least ${drop.minWalletAge} days old`
      });
      return;
    }
    
    if (drop.minStakingAmount > 0) {
      const activeStakes = await stakingService.getActiveStakes(walletAddress);
      const totalStaked = activeStakes.reduce((sum, stake) => sum + parseFloat(stake.amount), 0);
      if (totalStaked < drop.minStakingAmount) {
        res.status(400).json({ 
          eligible: false,
          reason: `Minimum staking amount of ${drop.minStakingAmount} μPVX required`
        });
        return;
      }
    }
    
    if (drop.minMiningBlocks > 0) {
      const minerStats = await minerDao.getMinerStatsByAddress(walletAddress);
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
    
    const drop = await dropDao.getDropById(dropId);
    if (!drop) {
      res.status(404).json({ error: 'Drop not found' });
      return;
    }
    
    const wallet = await walletDao.getWalletByAddress(walletAddress);
    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }
    
    const alreadyClaimed = await dropDao.hasDropBeenClaimed(dropId, walletAddress);
    if (alreadyClaimed) {
      res.status(400).json({ error: 'This drop has already been claimed by this wallet' });
      return;
    }
    
    const claimCount = await dropDao.getDropClaimCount(dropId);
    if (claimCount >= drop.claimLimit) {
      res.status(400).json({ error: 'Claim limit for this drop has been reached' });
      return;
    }
    
    const now = new Date();
    if (new Date(drop.expiresAt) < now) {
      res.status(400).json({ error: 'This drop has expired' });
      return;
    }
    
    const walletAgeInDays = (now.getTime() - new Date(wallet.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (walletAgeInDays < drop.minWalletAge) {
      res.status(400).json({ error: `Wallet must be at least ${drop.minWalletAge} days old` });
      return;
    }
    
    if (drop.minStakingAmount > 0) {
      const activeStakes = await stakingService.getActiveStakes(walletAddress);
      const totalStaked = activeStakes.reduce((sum, stake) => sum + parseFloat(stake.amount), 0);
      if (totalStaked < drop.minStakingAmount) {
        res.status(400).json({ error: `Minimum staking amount of ${drop.minStakingAmount} μPVX required` });
        return;
      }
    }
    
    if (drop.minMiningBlocks > 0) {
      const minerStats = await minerDao.getMinerStatsByAddress(walletAddress);
      if (!minerStats || minerStats.blocksMined < drop.minMiningBlocks) {
        res.status(400).json({ error: `Must have mined at least ${drop.minMiningBlocks} blocks` });
        return;
      }
    }
    
    let claimResult;
    let generatedTxHash: string | undefined = undefined;

    switch (drop.type) {
      case 'TOKEN':
        claimResult = await processTokenDrop(drop, wallet); // Pass fetched wallet
        generatedTxHash = claimResult.transactionHash;
        break;
      case 'NFT':
        claimResult = await processNftDrop(drop, walletAddress);
        generatedTxHash = claimResult.transactionHash;
        break;
      case 'BADGE':
        claimResult = await processBadgeDrop(drop, walletAddress);
        generatedTxHash = claimResult.transactionHash;
        break;
      default:
        res.status(400).json({ error: 'Invalid drop type' });
        return;
    }
    
    // Record the claim in the database
    await dropDao.claimDrop(dropId, walletAddress, generatedTxHash);
    
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
async function processTokenDrop(drop: SharedDrop, wallet: SharedWallet) { // Use SharedWallet
  if (!drop.tokenAmount) {
    throw new Error('Token amount is not defined for this drop');
  }
  // Wallet is already fetched and passed in
  
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
  
  // Add transaction to the blockchain via DAO
  await transactionDao.createTransaction(transaction as any); // Cast if local type mismatches shared
  
  // Update wallet balance via DAO
  const newBalance = BigInt(wallet.balance) + BigInt(drop.tokenAmount);
  await walletDao.updateWallet({ ...wallet, balance: newBalance.toString(), lastUpdated: new Date(timestamp) });
  
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
    type: LocalTransactionType.NFT_MINT as SharedTransaction['type'],
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
  
  // Add transaction to the blockchain via DAO
  await transactionDao.createTransaction(transaction as any); // Cast if local type mismatches shared
  
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
    type: LocalTransactionType.BADGE_AWARD as SharedTransaction['type'],
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
  
  // Add transaction to the blockchain via DAO
  await transactionDao.createTransaction(transaction as any); // Cast if local type mismatches shared
  
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
    
    const wallet = await walletDao.getWalletByAddress(walletAddress);
    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }
    
    const claims = await dropDao.getDropClaimsByWallet(walletAddress);
    const claimedDropDetails = await Promise.all(
      claims.map(async (claim) => {
        const dropDetail = await dropDao.getDropById(claim.dropId);
        if (!dropDetail) return null;
        return {
          ...dropDetail,
          claimedAt: new Date(claim.claimedAt).toISOString(),
          transactionHash: claim.transactionHash,
          // Add claimCount and remainingClaims if needed for consistency, though they are claimed.
          // For simplicity, returning the core drop details + claim info.
        };
      })
    );
    
    res.status(200).json(claimedDropDetails.filter(Boolean));
  } catch (error) {
    console.error('Error getting user claimed drops:', error);
    res.status(500).json({ error: 'Failed to fetch claimed drops' });
  }
};