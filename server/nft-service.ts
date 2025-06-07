import { nanoid } from 'nanoid';
import { memBlockchainStorage } from './mem-blockchain';
import { Transaction } from '@shared/types';

export interface NFTCollection {
  id: string;
  name: string;
  description: string;
  symbol: string;
  creatorAddress: string;
  imageUrl?: string;
  bannerUrl?: string;
  website?: string;
  royaltyPercentage: number;
  isVerified: boolean;
  totalSupply: number;
  floorPrice: string;
  volume: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NFTToken {
  id: string;
  tokenId: string;
  collectionId: string;
  name: string;
  description?: string;
  imageUrl: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
  ownerAddress: string;
  creatorAddress: string;
  mintTransactionHash: string;
  currentPrice?: string;
  isListed: boolean;
  listingType?: 'fixed' | 'auction';
  auctionEndTime?: number;
  highestBid?: string;
  highestBidder?: string;
  mintedAt: Date;
  updatedAt: Date;
}

export interface NFTListing {
  id: string;
  tokenId: string;
  sellerAddress: string;
  price: string;
  listingType: 'fixed' | 'auction';
  startTime: number;
  endTime?: number;
  isActive: boolean;
  currency: string;
  reservePrice?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NFTBid {
  id: string;
  listingId: string;
  bidderAddress: string;
  amount: string;
  timestamp: number;
  isActive: boolean;
  transactionHash?: string;
  createdAt: Date;
}

export interface NFTSale {
  id: string;
  tokenId: string;
  sellerAddress: string;
  buyerAddress: string;
  price: string;
  currency: string;
  transactionHash: string;
  royaltyPaid: string;
  saleType: 'direct' | 'auction';
  timestamp: number;
  createdAt: Date;
}

class NFTStorage {
  private collections: Map<string, NFTCollection> = new Map();
  private tokens: Map<string, NFTToken> = new Map();
  private listings: Map<string, NFTListing> = new Map();
  private bids: Map<string, NFTBid> = new Map();
  private sales: Map<string, NFTSale> = new Map();

  constructor() {
    this.initializeDefaultCollections();
  }

  private initializeDefaultCollections() {
    // Create PVX Genesis Collection
    const genesisCollection: NFTCollection = {
      id: 'pvx-genesis',
      name: 'PVX Genesis',
      description: 'The first NFT collection on the PVX blockchain, featuring unique digital art pieces.',
      symbol: 'PVXG',
      creatorAddress: 'SYSTEM',
      imageUrl: '/api/placeholder/collection/pvx-genesis.jpg',
      bannerUrl: '/api/placeholder/collection/pvx-genesis-banner.jpg',
      royaltyPercentage: 250, // 2.5%
      isVerified: true,
      totalSupply: 0,
      floorPrice: '0',
      volume: '0',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.collections.set(genesisCollection.id, genesisCollection);
  }

  // Collections
  async createCollection(collection: Omit<NFTCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<NFTCollection> {
    const newCollection: NFTCollection = {
      id: nanoid(),
      ...collection,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.collections.set(newCollection.id, newCollection);
    return newCollection;
  }

  async getCollection(id: string): Promise<NFTCollection | undefined> {
    return this.collections.get(id);
  }

  async getCollections(): Promise<NFTCollection[]> {
    return Array.from(this.collections.values());
  }

  async getCollectionsByCreator(creatorAddress: string): Promise<NFTCollection[]> {
    return Array.from(this.collections.values()).filter(c => c.creatorAddress === creatorAddress);
  }

  // Tokens
  async createToken(token: Omit<NFTToken, 'id' | 'mintedAt' | 'updatedAt'>): Promise<NFTToken> {
    const newToken: NFTToken = {
      id: nanoid(),
      ...token,
      mintedAt: new Date(),
      updatedAt: new Date(),
    };
    this.tokens.set(newToken.id, newToken);
    
    // Update collection supply
    const collection = this.collections.get(token.collectionId);
    if (collection) {
      collection.totalSupply += 1;
      collection.updatedAt = new Date();
      this.collections.set(collection.id, collection);
    }
    
    return newToken;
  }

  async getToken(id: string): Promise<NFTToken | undefined> {
    return this.tokens.get(id);
  }

  async getTokenByTokenId(tokenId: string, collectionId: string): Promise<NFTToken | undefined> {
    return Array.from(this.tokens.values()).find(t => t.tokenId === tokenId && t.collectionId === collectionId);
  }

  async getTokensByCollection(collectionId: string): Promise<NFTToken[]> {
    return Array.from(this.tokens.values()).filter(t => t.collectionId === collectionId);
  }

  async getTokensByOwner(ownerAddress: string): Promise<NFTToken[]> {
    return Array.from(this.tokens.values()).filter(t => t.ownerAddress === ownerAddress);
  }

  async updateToken(token: NFTToken): Promise<NFTToken> {
    token.updatedAt = new Date();
    this.tokens.set(token.id, token);
    return token;
  }

  // Listings
  async createListing(listing: Omit<NFTListing, 'id' | 'createdAt' | 'updatedAt'>): Promise<NFTListing> {
    const newListing: NFTListing = {
      id: nanoid(),
      ...listing,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.listings.set(newListing.id, newListing);
    
    // Update token listing status
    const token = Array.from(this.tokens.values()).find(t => t.id === listing.tokenId);
    if (token) {
      token.isListed = true;
      token.currentPrice = listing.price;
      token.listingType = listing.listingType;
      if (listing.listingType === 'auction' && listing.endTime) {
        token.auctionEndTime = listing.endTime;
      }
      this.tokens.set(token.id, token);
    }
    
    return newListing;
  }

  async getListing(id: string): Promise<NFTListing | undefined> {
    return this.listings.get(id);
  }

  async getActiveListings(): Promise<NFTListing[]> {
    return Array.from(this.listings.values()).filter(l => l.isActive);
  }

  async getListingsByToken(tokenId: string): Promise<NFTListing[]> {
    return Array.from(this.listings.values()).filter(l => l.tokenId === tokenId);
  }

  async updateListing(listing: NFTListing): Promise<NFTListing> {
    listing.updatedAt = new Date();
    this.listings.set(listing.id, listing);
    return listing;
  }

  // Bids
  async createBid(bid: Omit<NFTBid, 'id' | 'createdAt'>): Promise<NFTBid> {
    const newBid: NFTBid = {
      id: nanoid(),
      ...bid,
      createdAt: new Date(),
    };
    this.bids.set(newBid.id, newBid);
    
    // Update token highest bid if this is higher
    const listing = this.listings.get(bid.listingId);
    if (listing) {
      const token = Array.from(this.tokens.values()).find(t => t.id === listing.tokenId);
      if (token) {
        const currentHighest = token.highestBid ? parseInt(token.highestBid) : 0;
        const newBidAmount = parseInt(bid.amount);
        if (newBidAmount > currentHighest) {
          token.highestBid = bid.amount;
          token.highestBidder = bid.bidderAddress;
          this.tokens.set(token.id, token);
        }
      }
    }
    
    return newBid;
  }

  async getBidsByListing(listingId: string): Promise<NFTBid[]> {
    return Array.from(this.bids.values())
      .filter(b => b.listingId === listingId && b.isActive)
      .sort((a, b) => parseInt(b.amount) - parseInt(a.amount));
  }

  // Sales
  async createSale(sale: Omit<NFTSale, 'id' | 'createdAt'>): Promise<NFTSale> {
    const newSale: NFTSale = {
      id: nanoid(),
      ...sale,
      createdAt: new Date(),
    };
    this.sales.set(newSale.id, newSale);
    
    // Update token ownership and listing status
    const token = Array.from(this.tokens.values()).find(t => t.id === sale.tokenId);
    if (token) {
      token.ownerAddress = sale.buyerAddress;
      token.isListed = false;
      token.currentPrice = undefined;
      token.listingType = undefined;
      token.auctionEndTime = undefined;
      token.highestBid = undefined;
      token.highestBidder = undefined;
      this.tokens.set(token.id, token);
    }
    
    // Deactivate listing
    const listing = Array.from(this.listings.values()).find(l => l.tokenId === sale.tokenId && l.isActive);
    if (listing) {
      listing.isActive = false;
      this.listings.set(listing.id, listing);
    }
    
    // Update collection volume and floor price
    const collection = token ? this.collections.get(token.collectionId) : undefined;
    if (collection) {
      const currentVolume = parseInt(collection.volume);
      const salePrice = parseInt(sale.price);
      collection.volume = (currentVolume + salePrice).toString();
      
      // Recalculate floor price
      const activeListings = Array.from(this.listings.values())
        .filter(l => l.isActive && Array.from(this.tokens.values())
          .find(t => t.id === l.tokenId)?.collectionId === collection.id);
      
      if (activeListings.length > 0) {
        const prices = activeListings.map(l => parseInt(l.price));
        collection.floorPrice = Math.min(...prices).toString();
      }
      
      this.collections.set(collection.id, collection);
    }
    
    return newSale;
  }

  async getSalesByToken(tokenId: string): Promise<NFTSale[]> {
    return Array.from(this.sales.values())
      .filter(s => s.tokenId === tokenId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  async getRecentSales(limit: number = 10): Promise<NFTSale[]> {
    return Array.from(this.sales.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
}

export const nftStorage = new NFTStorage();

export class NFTService {
  // Create new collection
  async createCollection(params: {
    name: string;
    description: string;
    symbol: string;
    creatorAddress: string;
    imageUrl?: string;
    bannerUrl?: string;
    website?: string;
    royaltyPercentage?: number;
  }): Promise<NFTCollection> {
    return await nftStorage.createCollection({
      ...params,
      royaltyPercentage: params.royaltyPercentage || 250, // Default 2.5%
      isVerified: false,
      totalSupply: 0,
      floorPrice: '0',
      volume: '0',
    });
  }

  // Mint new NFT
  async mintNFT(params: {
    collectionId: string;
    name: string;
    description?: string;
    imageUrl: string;
    attributes?: Array<{ trait_type: string; value: string | number }>;
    ownerAddress: string;
    creatorAddress: string;
  }): Promise<{ token: NFTToken; transaction: Transaction }> {
    const collection = await nftStorage.getCollection(params.collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }

    // Generate unique token ID
    const tokenId = (collection.totalSupply + 1).toString();

    // Create mint transaction
    const mintTx: Transaction = {
      hash: nanoid(),
      type: 'nft_mint',
      from: 'SYSTEM',
      to: params.ownerAddress,
      fromAddress: 'SYSTEM',
      toAddress: params.ownerAddress,
      amount: 0,
      timestamp: Date.now(),
      nonce: 0,
      signature: nanoid(),
      status: 'confirmed',
      fee: 1000000, // 1 PVX fee
      metadata: {
        type: 'nft_mint',
        collectionId: params.collectionId,
        tokenId,
        name: params.name,
        imageUrl: params.imageUrl,
      },
    };

    // Add transaction to blockchain
    await memBlockchainStorage.createTransaction(mintTx);

    // Create NFT token
    const token = await nftStorage.createToken({
      tokenId,
      collectionId: params.collectionId,
      name: params.name,
      description: params.description,
      imageUrl: params.imageUrl,
      attributes: params.attributes,
      ownerAddress: params.ownerAddress,
      creatorAddress: params.creatorAddress,
      mintTransactionHash: mintTx.hash,
      isListed: false,
    });

    return { token, transaction: mintTx };
  }

  // List NFT for sale
  async listNFT(params: {
    tokenId: string;
    sellerAddress: string;
    price: string;
    listingType: 'fixed' | 'auction';
    duration?: number; // hours
    reservePrice?: string;
  }): Promise<NFTListing> {
    const token = await nftStorage.getToken(params.tokenId);
    if (!token) {
      throw new Error('NFT not found');
    }

    if (token.ownerAddress !== params.sellerAddress) {
      throw new Error('Only the owner can list this NFT');
    }

    if (token.isListed) {
      throw new Error('NFT is already listed');
    }

    const startTime = Date.now();
    const endTime = params.duration ? startTime + (params.duration * 60 * 60 * 1000) : undefined;

    const listing = await nftStorage.createListing({
      tokenId: params.tokenId,
      sellerAddress: params.sellerAddress,
      price: params.price,
      listingType: params.listingType,
      startTime,
      endTime,
      isActive: true,
      currency: 'PVX',
      reservePrice: params.reservePrice,
    });

    return listing;
  }

  // Buy NFT directly
  async buyNFT(params: {
    tokenId: string;
    buyerAddress: string;
    price: string;
  }): Promise<{ sale: NFTSale; transaction: Transaction }> {
    const token = await nftStorage.getToken(params.tokenId);
    if (!token) {
      throw new Error('NFT not found');
    }

    const activeListing = Array.from(await nftStorage.getListingsByToken(params.tokenId))
      .find(l => l.isActive);
    
    if (!activeListing) {
      throw new Error('NFT is not listed for sale');
    }

    if (activeListing.listingType !== 'fixed') {
      throw new Error('NFT is listed for auction, not direct sale');
    }

    if (activeListing.price !== params.price) {
      throw new Error('Price mismatch');
    }

    // Calculate royalty
    const collection = await nftStorage.getCollection(token.collectionId);
    const royaltyAmount = collection ? 
      Math.floor(parseInt(params.price) * collection.royaltyPercentage / 1000) : 0;

    // Create sale transaction
    const saleTx: Transaction = {
      hash: nanoid(),
      type: 'nft_sale',
      fromAddress: params.buyerAddress,
      toAddress: activeListing.sellerAddress,
      amount: parseInt(params.price) - royaltyAmount,
      timestamp: Date.now(),
      nonce: 0,
      signature: nanoid(),
      status: 'confirmed',
      fee: 500000, // 0.5 PVX fee
      metadata: {
        type: 'nft_sale',
        tokenId: params.tokenId,
        royaltyAmount,
        creatorAddress: token.creatorAddress,
      },
    };

    await memBlockchainStorage.createTransaction(saleTx);

    // Create sale record
    const sale = await nftStorage.createSale({
      tokenId: params.tokenId,
      sellerAddress: activeListing.sellerAddress,
      buyerAddress: params.buyerAddress,
      price: params.price,
      currency: 'PVX',
      transactionHash: saleTx.hash,
      royaltyPaid: royaltyAmount.toString(),
      saleType: 'direct',
      timestamp: Date.now(),
    });

    return { sale, transaction: saleTx };
  }

  // Place bid on auction
  async placeBid(params: {
    listingId: string;
    bidderAddress: string;
    amount: string;
  }): Promise<NFTBid> {
    const listing = await nftStorage.getListing(params.listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    if (!listing.isActive) {
      throw new Error('Listing is not active');
    }

    if (listing.listingType !== 'auction') {
      throw new Error('This is not an auction listing');
    }

    if (listing.endTime && Date.now() > listing.endTime) {
      throw new Error('Auction has ended');
    }

    const currentBids = await nftStorage.getBidsByListing(params.listingId);
    const highestBid = currentBids.length > 0 ? parseInt(currentBids[0].amount) : 0;
    const reservePrice = listing.reservePrice ? parseInt(listing.reservePrice) : 0;
    const minBid = Math.max(highestBid, reservePrice, parseInt(listing.price));

    if (parseInt(params.amount) <= minBid) {
      throw new Error(`Bid must be higher than ${minBid} μPVX`);
    }

    const bid = await nftStorage.createBid({
      listingId: params.listingId,
      bidderAddress: params.bidderAddress,
      amount: params.amount,
      timestamp: Date.now(),
      isActive: true,
    });

    return bid;
  }

  // Get marketplace stats
  async getMarketplaceStats(): Promise<{
    totalCollections: number;
    totalNFTs: number;
    totalVolume: string;
    activeListings: number;
    floorPrice: string;
  }> {
    const collections = await nftStorage.getCollections();
    const activeListings = await nftStorage.getActiveListings();
    
    const totalVolume = collections.reduce((sum, col) => sum + parseInt(col.volume), 0);
    const prices = activeListings.map(l => parseInt(l.price)).filter(p => p > 0);
    const floorPrice = prices.length > 0 ? Math.min(...prices).toString() : '0';

    return {
      totalCollections: collections.length,
      totalNFTs: collections.reduce((sum, col) => sum + col.totalSupply, 0),
      totalVolume: totalVolume.toString(),
      activeListings: activeListings.length,
      floorPrice,
    };
  }
}

export const nftService = new NFTService();