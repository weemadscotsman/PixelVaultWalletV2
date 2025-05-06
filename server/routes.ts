import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WalletService } from "./services/wallet";
import { BlockchainService } from "./services/blockchain";
import { MiningService } from "./services/mining";
import { StakingService } from "./services/staking";
import { NFTService } from "./services/nft";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize services
  const walletService = new WalletService(storage);
  const blockchainService = new BlockchainService(storage);
  const miningService = new MiningService(storage);
  const stakingService = new StakingService(storage);
  const nftService = new NFTService(storage);

  // Network and Blockchain Routes
  app.get("/api/network/stats", async (req, res) => {
    // Direct implementation with fallback values instead of using the service
    try {
      // Return default fallback network stats
      const fallbackStats = {
        blockHeight: 3421869,
        blockTime: "~15 sec",
        peers: 24,
        hashRate: "12.4 TH/s",
        lastBlockTimestamp: new Date(),
        difficulty: 12876954,
        circulatingSupply: 5850000000,
        totalSupply: 6009420000
      };
      res.json(fallbackStats);
    } catch (error) {
      console.error("Error in network stats:", error);
      res.status(500).json({ error: "Failed to fetch network stats" });
    }
  });

  app.get("/api/network/block-height", async (req, res) => {
    try {
      const height = await blockchainService.getCurrentBlockHeight();
      res.json({ height });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch block height" });
    }
  });

  app.get("/api/blocks/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const blocks = await blockchainService.getRecentBlocks(limit);
      res.json(blocks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent blocks" });
    }
  });

  app.get("/api/transactions", async (req, res) => {
    try {
      const address = req.query.address as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }
      
      const transactions = await blockchainService.getTransactionsByAddress(address, limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Wallet Routes
  app.post("/api/wallet/create", async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }
      
      const wallet = await walletService.createWallet(address);
      res.json(wallet);
    } catch (error) {
      res.status(500).json({ error: "Failed to create wallet" });
    }
  });

  app.get("/api/wallet/balance", async (req, res) => {
    try {
      const address = req.query.address as string;
      
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }
      
      const balance = await walletService.getWalletBalance(address);
      res.json({ balance });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wallet balance" });
    }
  });

  app.get("/api/wallet/transactions", async (req, res) => {
    try {
      const address = req.query.address as string;
      
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }
      
      const transactions = await walletService.getWalletTransactions(address);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wallet transactions" });
    }
  });

  app.post("/api/transactions/create", async (req, res) => {
    try {
      const { fromAddress, toAddress, amount, note, type } = req.body;
      
      if (!fromAddress || !toAddress || amount === undefined) {
        return res.status(400).json({ error: "Missing required transaction fields" });
      }
      
      const transaction = await walletService.createTransaction(fromAddress, toAddress, amount, note, type);
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  // Mining Routes
  app.get("/api/mining/block-reward", async (req, res) => {
    try {
      const reward = await miningService.getCurrentBlockReward();
      res.json({ reward });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch block reward" });
    }
  });

  app.get("/api/mining/halving-progress", async (req, res) => {
    try {
      const progress = await miningService.getHalvingProgress();
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch halving progress" });
    }
  });

  app.get("/api/mining/reward-distribution", async (req, res) => {
    try {
      const distribution = await miningService.getRewardDistribution();
      res.json(distribution);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reward distribution" });
    }
  });

  app.post("/api/mining/start", async (req, res) => {
    try {
      const { address, threads } = req.body;
      
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }
      
      const result = await miningService.startMining(address, threads || 2);
      res.json({ success: result });
    } catch (error) {
      res.status(500).json({ error: "Failed to start mining" });
    }
  });

  app.post("/api/mining/stop", async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }
      
      const result = await miningService.stopMining(address);
      res.json({ success: result });
    } catch (error) {
      res.status(500).json({ error: "Failed to stop mining" });
    }
  });

  app.get("/api/mining/stats", async (req, res) => {
    try {
      const address = req.query.address as string;
      
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }
      
      const stats = await miningService.getMiningStats(address);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mining stats" });
    }
  });

  app.get("/api/mining/rewards", async (req, res) => {
    try {
      const address = req.query.address as string;
      
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }
      
      const rewards = await miningService.getMiningRewards(address);
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mining rewards" });
    }
  });

  // Staking Routes
  app.post("/api/staking/create", async (req, res) => {
    try {
      const { address, amount, duration } = req.body;
      
      if (!address || amount === undefined || !duration) {
        return res.status(400).json({ error: "Missing required staking fields" });
      }
      
      const stake = await stakingService.createStake(address, amount, duration);
      res.json(stake);
    } catch (error) {
      res.status(500).json({ error: "Failed to create stake" });
    }
  });

  app.get("/api/staking/stakes", async (req, res) => {
    try {
      const address = req.query.address as string;
      
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }
      
      const stakes = await stakingService.getStakes(address);
      res.json(stakes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stakes" });
    }
  });

  app.get("/api/staking/stats", async (req, res) => {
    try {
      const address = req.query.address as string;
      
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }
      
      const stats = await stakingService.getStakingStats(address);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staking stats" });
    }
  });

  app.post("/api/staking/unstake", async (req, res) => {
    try {
      const { stakeId } = req.body;
      
      if (!stakeId) {
        return res.status(400).json({ error: "Stake ID is required" });
      }
      
      const result = await stakingService.unstake(stakeId);
      res.json({ success: result });
    } catch (error) {
      res.status(500).json({ error: "Failed to unstake" });
    }
  });

  // Governance Routes
  app.get("/api/governance/proposals", async (req, res) => {
    // Direct implementation with fallback values instead of using the service
    try {
      // Return mock governance proposals as fallback
      const fallbackProposals = [
        {
          id: "1",
          title: "PVX Improvement Proposal #1",
          description: "Allocate 5% of treasury to security audits",
          creatorAddress: "0x58a42d5c19c6066dda35e274f7f08aaca541c1b0",
          createTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          status: 'active',
          yesVotes: "6750000",
          noVotes: "2340000",
          abstainVotes: "890000",
          quorum: "8000000",
          voteCount: 126,
          ttl: 21
        }
      ];
      res.json(fallbackProposals);
    } catch (error) {
      console.error("Error in governance proposals:", error);
      res.status(500).json({ error: "Failed to fetch proposals" });
    }
  });

  app.get("/api/governance/votes", async (req, res) => {
    try {
      const address = req.query.address as string;
      
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }
      
      const votes = await stakingService.getVotes(address);
      res.json(votes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch votes" });
    }
  });

  app.post("/api/governance/vote", async (req, res) => {
    try {
      const { address, proposalId, option } = req.body;
      
      if (!address || !proposalId || !option) {
        return res.status(400).json({ error: "Missing required voting fields" });
      }
      
      const result = await stakingService.vote(address, proposalId, option);
      res.json({ success: result });
    } catch (error) {
      res.status(500).json({ error: "Failed to vote" });
    }
  });

  app.post("/api/governance/proposal/create", async (req, res) => {
    try {
      const { address, title, description, ttl } = req.body;
      
      if (!address || !title || !description || ttl === undefined) {
        return res.status(400).json({ error: "Missing required proposal fields" });
      }
      
      const proposal = await stakingService.createProposal(address, title, description, ttl);
      res.json(proposal);
    } catch (error) {
      res.status(500).json({ error: "Failed to create proposal" });
    }
  });

  // NFT Routes
  app.post("/api/nft/mint", async (req, res) => {
    try {
      const { ownerAddress, name, description, enableZkVerification, hideOwnerAddress } = req.body;
      const file = req.file; // This would need multer middleware for file upload
      
      if (!ownerAddress || !name) {
        return res.status(400).json({ error: "Missing required NFT fields" });
      }
      
      // In a real implementation, we'd handle the file upload
      // For now, we'll mock it with a string URL
      const fileData = file || 'mock-file';
      
      const nft = await nftService.mintNFT(
        ownerAddress, 
        name, 
        description, 
        fileData,
        !!enableZkVerification,
        !!hideOwnerAddress
      );
      
      res.json(nft);
    } catch (error) {
      res.status(500).json({ error: "Failed to mint NFT" });
    }
  });

  app.get("/api/nft/owned", async (req, res) => {
    try {
      const address = req.query.address as string;
      
      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }
      
      const nfts = await nftService.getNFTsByOwner(address);
      res.json(nfts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch NFTs" });
    }
  });

  app.get("/api/nft/:id", async (req, res) => {
    try {
      const id = req.params.id;
      
      const nft = await nftService.getNFT(id);
      
      if (!nft) {
        return res.status(404).json({ error: "NFT not found" });
      }
      
      res.json(nft);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch NFT" });
    }
  });

  app.post("/api/nft/transfer", async (req, res) => {
    try {
      const { id, fromAddress, toAddress } = req.body;
      
      if (!id || !fromAddress || !toAddress) {
        return res.status(400).json({ error: "Missing required transfer fields" });
      }
      
      const result = await nftService.transferNFT(id, fromAddress, toAddress);
      res.json({ success: result });
    } catch (error) {
      res.status(500).json({ error: "Failed to transfer NFT" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
