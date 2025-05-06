import { users, type User, type InsertUser } from "@shared/schema";
import { 
  Transaction, 
  Block, 
  MiningStats, 
  MiningReward, 
  Stake, 
  Proposal, 
  VoteOption,
  NFT,
  TransactionType,
  NetworkStats 
} from "@shared/types";

// Storage interface for the PVX blockchain
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
  getNFTs(): Promise<NFT[]>;
  getNFTsByOwner(ownerAddress: string): Promise<NFT[]>;
  getNFT(id: string): Promise<NFT | undefined>;
  mintNFT(nft: Omit<NFT, 'id'>): Promise<NFT>;
  transferNFT(id: string, fromAddress: string, toAddress: string): Promise<boolean>;
  
  // Network stats
  getNetworkStats(): Promise<NetworkStats>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private wallets: Map<string, { address: string, balance: number }>;
  private transactions: Transaction[];
  private blocks: Block[];
  private miningStats: Map<string, MiningStats>;
  private miningRewards: MiningReward[];
  private stakes: Stake[];
  private proposals: Proposal[];
  private votes: Map<string, Map<string, VoteOption>>; // Map<address, Map<proposalId, option>>
  private nfts: NFT[];
  private nextIds: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.wallets = new Map();
    this.transactions = [];
    this.blocks = [];
    this.miningStats = new Map();
    this.miningRewards = [];
    this.stakes = [];
    this.proposals = [];
    this.votes = new Map();
    this.nfts = [];
    this.nextIds = {
      user: 1,
      transaction: 1,
      block: 1,
      miningReward: 1,
      stake: 1,
      proposal: 1,
      nft: 1
    };

    // Initialize blockchain with genesis block
    this.initializeBlockchain();
  }

  // Initialize blockchain with genesis data
  private initializeBlockchain(): void {
    // Create genesis block
    const genesisBlock: Block = {
      height: 0,
      hash: "0000000000000000000000000000000000000000000000000000000000000000",
      previousHash: "",
      timestamp: new Date("2023-01-01T00:00:00Z"),
      nonce: 0,
      difficulty: 1,
      transactions: [],
      miner: "zk_PVX:genesis",
      reward: 0
    };
    this.blocks.push(genesisBlock);

    // Create some mock blocks to establish blockchain
    for (let i = 1; i <= 3421869; i++) {
      const previousBlock = this.blocks[this.blocks.length - 1];
      const mockBlock: Block = {
        height: i,
        hash: `mock_hash_${i}`,
        previousHash: previousBlock.hash,
        timestamp: new Date(previousBlock.timestamp.getTime() + 15000), // 15 second blocks
        nonce: Math.floor(Math.random() * 1000000),
        difficulty: 1 + (i % 10), // Randomize difficulty
        transactions: [],
        miner: `zk_PVX:mock_miner_${i % 100}`,
        reward: this.calculateBlockReward(i)
      };
      this.blocks.push(mockBlock);
    }

    // Create some initial proposals for governance
    const now = new Date();
    const proposal1: Proposal = {
      id: "1",
      title: "PIP-42: Adjust Block Time to 12s",
      description: "Proposal to reduce block time from 15s to 12s to improve transaction throughput.",
      creatorAddress: "zk_PVX:0x1234567890abcdef",
      createTime: new Date(now.getTime() - 86400000 * 2), // 2 days ago
      endTime: new Date(now.getTime() + 86400000 * 3), // 3 days from now
      status: "active",
      yesVotes: 700,
      noVotes: 300,
      abstainVotes: 50,
      quorum: 1500,
      voteCount: 1050,
      ttl: 5
    };

    const proposal2: Proposal = {
      id: "2",
      title: "PIP-43: Add NFT Metadata Standard",
      description: "Proposal to establish unified metadata standard for NFTs on the PixelVault chain.",
      creatorAddress: "zk_PVX:0x0987654321fedcba",
      createTime: new Date(now.getTime() - 86400000 * 1), // 1 day ago
      endTime: new Date(now.getTime() + 86400000 * 5), // 5 days from now
      status: "active",
      yesVotes: 820,
      noVotes: 180,
      abstainVotes: 30,
      quorum: 2500,
      voteCount: 1030,
      ttl: 6
    };

    this.proposals.push(proposal1, proposal2);
  }

  // Calculate block reward based on block height (with halving logic)
  private calculateBlockReward(blockHeight: number): number {
    const initialReward = 150;
    const halvingInterval = 210000;
    
    const halvings = Math.floor(blockHeight / halvingInterval);
    return initialReward / Math.pow(2, halvings);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.nextIds.user++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getWalletByAddress(address: string): Promise<any | undefined> {
    return this.wallets.get(address);
  }

  async createWallet(address: string, initialBalance: number = 0): Promise<any> {
    const wallet = { address, balance: initialBalance };
    this.wallets.set(address, wallet);
    return wallet;
  }

  async getWalletBalance(address: string): Promise<number> {
    const wallet = this.wallets.get(address);
    if (!wallet) {
      // Create new wallet with initial balance for demo purposes
      const newWallet = await this.createWallet(address, 69.42);
      return newWallet.balance;
    }
    return wallet.balance;
  }

  async updateWalletBalance(address: string, newBalance: number): Promise<boolean> {
    const wallet = this.wallets.get(address);
    if (!wallet) {
      return false;
    }
    wallet.balance = newBalance;
    this.wallets.set(address, wallet);
    return true;
  }

  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const id = `tx_${this.nextIds.transaction++}`;
    const hash = `txhash_${Math.random().toString(36).substring(2, 10)}`;
    const newTransaction: Transaction = { 
      ...transaction, 
      id,
      hash,
      timestamp: new Date()
    };
    
    this.transactions.push(newTransaction);
    
    // Update wallet balances
    if (transaction.type === TransactionType.TRANSFER) {
      const senderWallet = this.wallets.get(transaction.fromAddress);
      const receiverWallet = this.wallets.get(transaction.toAddress) || 
                            { address: transaction.toAddress, balance: 0 };
      
      if (senderWallet) {
        senderWallet.balance -= transaction.amount;
        this.wallets.set(transaction.fromAddress, senderWallet);
      }
      
      receiverWallet.balance += transaction.amount;
      this.wallets.set(transaction.toAddress, receiverWallet);
    }
    
    return newTransaction;
  }

  async getTransactionsByAddress(address: string, limit: number = 10): Promise<Transaction[]> {
    // Filter transactions where the address is either sender or receiver
    const filteredTransactions = this.transactions.filter(tx => 
      tx.fromAddress === address || tx.toAddress === address
    );
    
    // Sort by timestamp (newest first)
    filteredTransactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Return limited results
    return filteredTransactions.slice(0, limit);
  }

  async getCurrentBlockHeight(): Promise<number> {
    return this.blocks.length - 1;
  }

  async getRecentBlocks(limit: number = 10): Promise<Block[]> {
    // Sort by height (newest first)
    const sortedBlocks = [...this.blocks].sort((a, b) => b.height - a.height);
    
    // Return limited results
    return sortedBlocks.slice(0, limit);
  }

  async addBlock(block: Omit<Block, 'id'>): Promise<Block> {
    const newBlock = { ...block } as Block;
    this.blocks.push(newBlock);
    return newBlock;
  }

  async getMiningStats(address: string): Promise<MiningStats | undefined> {
    // If stats don't exist, create them
    if (!this.miningStats.has(address)) {
      const stats: MiningStats = {
        address,
        blocksMined: 0,
        totalRewards: 0,
        isCurrentlyMining: false,
        currentHashRate: 0
      };
      this.miningStats.set(address, stats);
    }
    
    return this.miningStats.get(address);
  }

  async updateMiningStats(stats: MiningStats): Promise<MiningStats> {
    this.miningStats.set(stats.address, stats);
    return stats;
  }

  async getMiningRewards(address: string): Promise<MiningReward[]> {
    return this.miningRewards
      .filter(reward => reward.address === address)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async addMiningReward(reward: Omit<MiningReward, 'id'>): Promise<MiningReward> {
    const id = `reward_${this.nextIds.miningReward++}`;
    const newReward: MiningReward = { ...reward, id };
    
    this.miningRewards.push(newReward);
    
    // Update wallet balance
    const wallet = this.wallets.get(reward.address) || 
                  { address: reward.address, balance: 0 };
    
    wallet.balance += reward.amount;
    this.wallets.set(reward.address, wallet);
    
    // Update mining stats
    const stats = await this.getMiningStats(reward.address);
    if (stats) {
      stats.blocksMined += 1;
      stats.totalRewards += reward.amount;
      stats.lastBlockMined = reward.timestamp;
      await this.updateMiningStats(stats);
    }
    
    return newReward;
  }

  async getStakes(address: string): Promise<Stake[]> {
    return this.stakes
      .filter(stake => stake.address === address)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  async createStake(stake: Omit<Stake, 'id'>): Promise<Stake> {
    const id = `stake_${this.nextIds.stake++}`;
    const newStake: Stake = { ...stake, id };
    
    this.stakes.push(newStake);
    
    // Update wallet balance (reduce by staked amount)
    const wallet = this.wallets.get(stake.address);
    if (wallet) {
      wallet.balance -= stake.amount;
      this.wallets.set(stake.address, wallet);
    }
    
    // Create a transaction record for the stake
    await this.createTransaction({
      type: TransactionType.STAKE,
      fromAddress: stake.address,
      toAddress: "zk_PVX:staking_pool",
      amount: stake.amount,
      timestamp: new Date(),
      note: `Staked for ${stake.duration} days`
    });
    
    return newStake;
  }

  async unstake(stakeId: string): Promise<boolean> {
    const stakeIndex = this.stakes.findIndex(stake => stake.id === stakeId);
    
    if (stakeIndex === -1) {
      return false;
    }
    
    const stake = this.stakes[stakeIndex];
    
    // Check if stake is past lock period
    const now = new Date();
    if (now < stake.endTime) {
      // Can't unstake before lock period ends
      return false;
    }
    
    // Return tokens to wallet
    const wallet = this.wallets.get(stake.address) || 
                  { address: stake.address, balance: 0 };
    
    wallet.balance += stake.amount;
    this.wallets.set(stake.address, wallet);
    
    // Create a transaction record for the unstake
    await this.createTransaction({
      type: TransactionType.UNSTAKE,
      fromAddress: "zk_PVX:staking_pool",
      toAddress: stake.address,
      amount: stake.amount,
      timestamp: new Date(),
      note: "Unstaked tokens returned"
    });
    
    // Remove the stake
    this.stakes.splice(stakeIndex, 1);
    
    return true;
  }

  async getProposals(): Promise<Proposal[]> {
    // Sort by createTime (newest first)
    return [...this.proposals].sort(
      (a, b) => b.createTime.getTime() - a.createTime.getTime()
    );
  }

  async getProposal(proposalId: string): Promise<Proposal | undefined> {
    return this.proposals.find(proposal => proposal.id === proposalId);
  }

  async createProposal(proposal: Omit<Proposal, 'id'>): Promise<Proposal> {
    const id = `proposal_${this.nextIds.proposal++}`;
    const newProposal: Proposal = { ...proposal, id };
    
    this.proposals.push(newProposal);
    
    // Create a transaction record for the proposal creation
    await this.createTransaction({
      type: TransactionType.GOVERNANCE_PROPOSAL,
      fromAddress: proposal.creatorAddress,
      toAddress: "zk_PVX:governance",
      amount: 0,
      timestamp: new Date(),
      note: `Created proposal: ${proposal.title}`
    });
    
    return newProposal;
  }

  async getVotes(address: string): Promise<{proposalId: string, option: VoteOption}[]> {
    const userVotes = this.votes.get(address);
    
    if (!userVotes) {
      return [];
    }
    
    const votes: {proposalId: string, option: VoteOption}[] = [];
    
    userVotes.forEach((option, proposalId) => {
      votes.push({ proposalId, option });
    });
    
    return votes;
  }

  async vote(address: string, proposalId: string, option: VoteOption): Promise<boolean> {
    const proposal = await this.getProposal(proposalId);
    
    if (!proposal) {
      return false;
    }
    
    // Check if proposal is still active
    if (proposal.status !== "active" || new Date() > proposal.endTime) {
      return false;
    }
    
    // Check if address has already voted
    let userVotes = this.votes.get(address);
    if (!userVotes) {
      userVotes = new Map();
      this.votes.set(address, userVotes);
    }
    
    const existingVote = userVotes.get(proposalId);
    if (existingVote) {
      // Already voted, can't vote again
      return false;
    }
    
    // Record the vote
    userVotes.set(proposalId, option);
    
    // Update proposal vote counts
    proposal.voteCount += 1;
    
    if (option === VoteOption.YES) {
      proposal.yesVotes += 1;
    } else if (option === VoteOption.NO) {
      proposal.noVotes += 1;
    } else {
      proposal.abstainVotes += 1;
    }
    
    // Create a transaction record for the vote
    await this.createTransaction({
      type: TransactionType.GOVERNANCE_VOTE,
      fromAddress: address,
      toAddress: "zk_PVX:governance",
      amount: 0,
      timestamp: new Date(),
      note: `Voted ${option} on proposal ${proposalId}`
    });
    
    return true;
  }

  async getNFTs(): Promise<NFT[]> {
    return this.nfts;
  }

  async getNFTsByOwner(ownerAddress: string): Promise<NFT[]> {
    return this.nfts.filter(nft => nft.ownerAddress === ownerAddress);
  }

  async getNFT(id: string): Promise<NFT | undefined> {
    return this.nfts.find(nft => nft.id === id);
  }

  async mintNFT(nft: Omit<NFT, 'id'>): Promise<NFT> {
    const id = `nft_${this.nextIds.nft++}`;
    const transactionHash = `nfttx_${Math.random().toString(36).substring(2, 10)}`;
    const newNFT: NFT = { ...nft, id, transactionHash };
    
    this.nfts.push(newNFT);
    
    // Create a transaction record for the NFT minting
    await this.createTransaction({
      type: TransactionType.NFT_MINT,
      fromAddress: "zk_PVX:nft_minter",
      toAddress: nft.ownerAddress,
      amount: 0,
      timestamp: new Date(),
      note: `Minted NFT: ${nft.name}`
    });
    
    return newNFT;
  }

  async transferNFT(id: string, fromAddress: string, toAddress: string): Promise<boolean> {
    const nftIndex = this.nfts.findIndex(nft => nft.id === id);
    
    if (nftIndex === -1) {
      return false;
    }
    
    const nft = this.nfts[nftIndex];
    
    // Check if sender is the owner
    if (nft.ownerAddress !== fromAddress) {
      return false;
    }
    
    // Transfer the NFT
    nft.ownerAddress = toAddress;
    this.nfts[nftIndex] = nft;
    
    // Create a transaction record for the NFT transfer
    await this.createTransaction({
      type: TransactionType.NFT_TRANSFER,
      fromAddress,
      toAddress,
      amount: 0,
      timestamp: new Date(),
      note: `Transferred NFT: ${nft.name}`
    });
    
    return true;
  }

  async getNetworkStats(): Promise<NetworkStats> {
    const blockHeight = await this.getCurrentBlockHeight();
    const recentBlocks = await this.getRecentBlocks(100);
    
    // Calculate average block time
    let avgBlockTime = 15; // Default 15 seconds
    if (recentBlocks.length > 1) {
      let totalTime = 0;
      for (let i = 1; i < recentBlocks.length; i++) {
        totalTime += recentBlocks[i-1].timestamp.getTime() - recentBlocks[i].timestamp.getTime();
      }
      avgBlockTime = Math.abs(totalTime / (recentBlocks.length - 1) / 1000);
    }
    
    // Get latest block
    const latestBlock = recentBlocks[0];
    
    return {
      blockHeight,
      blockTime: `~${Math.round(avgBlockTime)} sec`,
      peers: 24,
      hashRate: "12.4 TH/s",
      lastBlockTimestamp: latestBlock.timestamp,
      difficulty: latestBlock.difficulty,
      circulatingSupply: 5000000000, // 5B out of 6B total
      totalSupply: 6009420000 // Per specs
    };
  }
}

export const storage = new MemStorage();
