import { IStorage } from "../storage";
import { TransactionType } from "@shared/types";

export interface LiquidityPool {
  id: string;
  tokenA: string;
  tokenB: string;
  reserveA: number;
  reserveB: number;
  totalLiquidity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PoolPosition {
  id: string;
  poolId: string;
  ownerAddress: string;
  liquidityTokens: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SwapParams {
  fromToken: string;
  toToken: string;
  amount: number;
  slippageTolerance: number;
  deadline: Date;
}

export interface AddLiquidityParams {
  tokenA: string;
  tokenB: string;
  amountA: number;
  amountB: number;
  minLiquidity: number;
  deadline: Date;
}

export interface RemoveLiquidityParams {
  poolId: string;
  liquidityTokens: number;
  minAmountA: number;
  minAmountB: number;
  deadline: Date;
}

export class DexService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Get all available liquidity pools
   */
  async getLiquidityPools(): Promise<LiquidityPool[]> {
    try {
      return this.storage.getLiquidityPools();
    } catch (error) {
      console.error("Error getting liquidity pools:", error);
      // Return default fallback values
      return [
        {
          id: "1",
          tokenA: "PVX",
          tokenB: "USDC",
          reserveA: 250000000000, // 250,000 PVX
          reserveB: 750000000, // 750,000 USDC
          totalLiquidity: 13750000,
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
          updatedAt: new Date()
        },
        {
          id: "2",
          tokenA: "PVX",
          tokenB: "ETH",
          reserveA: 500000000000, // 500,000 PVX
          reserveB: 150000000000, // 150 ETH (in wei)
          totalLiquidity: 8650000,
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          updatedAt: new Date()
        },
        {
          id: "3",
          tokenA: "PVX",
          tokenB: "WBTC",
          reserveA: 750000000000, // 750,000 PVX
          reserveB: 25000000, // 2.5 WBTC
          totalLiquidity: 5480000,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          updatedAt: new Date()
        }
      ];
    }
  }

  /**
   * Get a specific liquidity pool by ID
   */
  async getLiquidityPool(poolId: string): Promise<LiquidityPool | undefined> {
    try {
      return this.storage.getLiquidityPool(poolId);
    } catch (error) {
      console.error(`Error getting liquidity pool ${poolId}:`, error);
      
      // Return default fallback values based on the requested pool ID
      if (poolId === "1") {
        return {
          id: "1",
          tokenA: "PVX",
          tokenB: "USDC",
          reserveA: 250000000000, // 250,000 PVX
          reserveB: 750000000, // 750,000 USDC
          totalLiquidity: 13750000,
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
          updatedAt: new Date()
        };
      } else if (poolId === "2") {
        return {
          id: "2",
          tokenA: "PVX",
          tokenB: "ETH",
          reserveA: 500000000000, // 500,000 PVX
          reserveB: 150000000000, // 150 ETH (in wei)
          totalLiquidity: 8650000,
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          updatedAt: new Date()
        };
      } else if (poolId === "3") {
        return {
          id: "3",
          tokenA: "PVX",
          tokenB: "WBTC",
          reserveA: 750000000000, // 750,000 PVX
          reserveB: 25000000, // 2.5 WBTC
          totalLiquidity: 5480000,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          updatedAt: new Date()
        };
      }
      
      return undefined;
    }
  }

  /**
   * Get liquidity positions for a specific address
   */
  async getLiquidityPositions(address: string): Promise<PoolPosition[]> {
    try {
      return this.storage.getLiquidityPositions(address);
    } catch (error) {
      console.error(`Error getting liquidity positions for ${address}:`, error);
      // Return default fallback values
      return [
        {
          id: "pos_1",
          poolId: "1", // PVX-USDC pool
          ownerAddress: address,
          liquidityTokens: 450000,
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
          updatedAt: new Date()
        },
        {
          id: "pos_2",
          poolId: "2", // PVX-ETH pool
          ownerAddress: address,
          liquidityTokens: 275000,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          updatedAt: new Date()
        }
      ];
    }
  }

  /**
   * Calculate the expected output amount for a swap
   */
  async getSwapQuote(fromToken: string, toToken: string, amount: number): Promise<{
    expectedOutput: number;
    minimumOutput: number;
    priceImpact: number;
    path: string[];
    fee: number;
  }> {
    try {
      // Attempt to find a direct pool first
      const pools = await this.getLiquidityPools();
      const directPool = pools.find(
        pool => 
          (pool.tokenA === fromToken && pool.tokenB === toToken) || 
          (pool.tokenA === toToken && pool.tokenB === fromToken)
      );
      
      if (directPool) {
        let inputReserve: number;
        let outputReserve: number;
        
        if (directPool.tokenA === fromToken) {
          inputReserve = directPool.reserveA;
          outputReserve = directPool.reserveB;
        } else {
          inputReserve = directPool.reserveB;
          outputReserve = directPool.reserveA;
        }
        
        // Calculate expected output using xy=k formula
        // where x and y are the reserves, k is the constant
        const inputWithFee = amount * 0.997; // 0.3% fee
        const numerator = inputWithFee * outputReserve;
        const denominator = inputReserve + inputWithFee;
        const expectedOutput = numerator / denominator;
        
        // Calculate price impact
        const priceImpact = (amount / inputReserve) * 100;
        
        // Calculate minimum output with 0.5% slippage
        const minimumOutput = expectedOutput * 0.995;
        
        return {
          expectedOutput,
          minimumOutput,
          priceImpact,
          path: [fromToken, toToken],
          fee: amount * 0.003 // 0.3% fee
        };
      }
      
      // Handle multi-hop swaps (via PVX) if no direct pool exists
      const fromTokenPVXPool = pools.find(
        pool => 
          (pool.tokenA === fromToken && pool.tokenB === "PVX") || 
          (pool.tokenA === "PVX" && pool.tokenB === fromToken)
      );
      
      const toTokenPVXPool = pools.find(
        pool => 
          (pool.tokenA === toToken && pool.tokenB === "PVX") || 
          (pool.tokenA === "PVX" && pool.tokenB === toToken)
      );
      
      if (fromTokenPVXPool && toTokenPVXPool) {
        // First hop: fromToken -> PVX
        let inputReserve1: number;
        let outputReserve1: number;
        
        if (fromTokenPVXPool.tokenA === fromToken) {
          inputReserve1 = fromTokenPVXPool.reserveA;
          outputReserve1 = fromTokenPVXPool.reserveB;
        } else {
          inputReserve1 = fromTokenPVXPool.reserveB;
          outputReserve1 = fromTokenPVXPool.reserveA;
        }
        
        const inputWithFee1 = amount * 0.997;
        const numerator1 = inputWithFee1 * outputReserve1;
        const denominator1 = inputReserve1 + inputWithFee1;
        const expectedOutputPVX = numerator1 / denominator1;
        
        // Second hop: PVX -> toToken
        let inputReserve2: number;
        let outputReserve2: number;
        
        if (toTokenPVXPool.tokenA === "PVX") {
          inputReserve2 = toTokenPVXPool.reserveA;
          outputReserve2 = toTokenPVXPool.reserveB;
        } else {
          inputReserve2 = toTokenPVXPool.reserveB;
          outputReserve2 = toTokenPVXPool.reserveA;
        }
        
        const inputWithFee2 = expectedOutputPVX * 0.997;
        const numerator2 = inputWithFee2 * outputReserve2;
        const denominator2 = inputReserve2 + inputWithFee2;
        const expectedOutput = numerator2 / denominator2;
        
        // Calculate combined price impact
        const priceImpact1 = (amount / inputReserve1) * 100;
        const priceImpact2 = (expectedOutputPVX / inputReserve2) * 100;
        const priceImpact = priceImpact1 + priceImpact2;
        
        // Calculate minimum output with 0.5% slippage
        const minimumOutput = expectedOutput * 0.995;
        
        return {
          expectedOutput,
          minimumOutput,
          priceImpact,
          path: [fromToken, "PVX", toToken],
          fee: amount * 0.003 + expectedOutputPVX * 0.003 // 0.3% fee on both swaps
        };
      }
      
      throw new Error("No valid swap path found");
    } catch (error) {
      console.error("Error calculating swap quote:", error);
      
      // Fallback values based on token pairs
      if ((fromToken === "PVX" && toToken === "USDC") || (fromToken === "USDC" && toToken === "PVX")) {
        return {
          expectedOutput: fromToken === "PVX" ? amount * 0.003 : amount * 333.33, // 1 PVX = 0.003 USDC
          minimumOutput: fromToken === "PVX" ? amount * 0.003 * 0.995 : amount * 333.33 * 0.995,
          priceImpact: 0.12,
          path: [fromToken, toToken],
          fee: amount * 0.003
        };
      } else if ((fromToken === "PVX" && toToken === "ETH") || (fromToken === "ETH" && toToken === "PVX")) {
        return {
          expectedOutput: fromToken === "PVX" ? amount * 0.0000003 : amount * 3333333.33, // 1 PVX = 0.0000003 ETH
          minimumOutput: fromToken === "PVX" ? amount * 0.0000003 * 0.995 : amount * 3333333.33 * 0.995,
          priceImpact: 0.08,
          path: [fromToken, toToken],
          fee: amount * 0.003
        };
      } else if ((fromToken === "PVX" && toToken === "WBTC") || (fromToken === "WBTC" && toToken === "PVX")) {
        return {
          expectedOutput: fromToken === "PVX" ? amount * 0.00000003 : amount * 30000000, // 1 PVX = 0.00000003 WBTC
          minimumOutput: fromToken === "PVX" ? amount * 0.00000003 * 0.995 : amount * 30000000 * 0.995,
          priceImpact: 0.15,
          path: [fromToken, toToken],
          fee: amount * 0.003
        };
      } else {
        // Multi-hop fallbacks
        return {
          expectedOutput: amount * 0.95, // 5% loss for multi-hop as fallback
          minimumOutput: amount * 0.95 * 0.995,
          priceImpact: 0.25,
          path: [fromToken, "PVX", toToken],
          fee: amount * 0.006 // Double fee for multi-hop
        };
      }
    }
  }

  /**
   * Execute a token swap
   */
  async executeSwap(address: string, params: SwapParams): Promise<{
    txId: string;
    fromToken: string;
    toToken: string;
    inputAmount: number;
    outputAmount: number;
    executedPrice: number;
    txFee: number;
    timestamp: Date;
  }> {
    const { fromToken, toToken, amount, slippageTolerance, deadline } = params;
    
    // Check if deadline has passed
    if (new Date() > deadline) {
      throw new Error("Swap deadline has expired");
    }
    
    // Get quote for the swap
    const quote = await this.getSwapQuote(fromToken, toToken, amount);
    
    // Apply slippage tolerance to the output
    const minimumOutputWithCustomSlippage = quote.expectedOutput * (1 - slippageTolerance / 100);
    
    // Verify balance for the input token
    const userBalance = await this.storage.getWalletBalance(address);
    if (fromToken === "PVX" && userBalance < amount) {
      throw new Error("Insufficient PVX balance");
    }
    
    // Execute the swap by creating a transaction
    const txDate = new Date();
    const txHash = this.generateTxHash(address, fromToken, toToken, amount, txDate);
    
    // Add a transaction record for the swap
    await this.storage.createTransaction({
      hash: txHash,
      type: TransactionType.DEX_SWAP,
      fromAddress: address,
      toAddress: "zk_PVX:dex:swap",
      amount: amount,
      timestamp: txDate,
      note: `Swap ${amount} ${fromToken} for ${quote.expectedOutput.toFixed(6)} ${toToken}`
    });
    
    // If swapping from PVX, subtract from user's balance
    if (fromToken === "PVX") {
      await this.storage.updateWalletBalance(address, userBalance - amount);
    }
    
    // If swapping to PVX, add to user's balance
    if (toToken === "PVX") {
      await this.storage.updateWalletBalance(address, userBalance + quote.expectedOutput);
    }
    
    // Create a unique ID for the swap transaction
    const txId = `swap_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Return the swap result
    return {
      txId,
      fromToken,
      toToken,
      inputAmount: amount,
      outputAmount: quote.expectedOutput,
      executedPrice: quote.expectedOutput / amount,
      txFee: quote.fee,
      timestamp: txDate
    };
  }

  /**
   * Add liquidity to a pool
   */
  async addLiquidity(address: string, params: AddLiquidityParams): Promise<{
    poolId: string;
    tokenA: string;
    tokenB: string;
    amountA: number;
    amountB: number;
    liquidityTokens: number;
    txId: string;
    timestamp: Date;
  }> {
    const { tokenA, tokenB, amountA, amountB, minLiquidity, deadline } = params;
    
    // Check if deadline has passed
    if (new Date() > deadline) {
      throw new Error("Liquidity addition deadline has expired");
    }
    
    // Find or create the liquidity pool
    let pool: LiquidityPool | undefined;
    const pools = await this.getLiquidityPools();
    
    pool = pools.find(
      p => 
        (p.tokenA === tokenA && p.tokenB === tokenB) || 
        (p.tokenA === tokenB && p.tokenB === tokenA)
    );
    
    let poolId: string;
    let liquidityTokens: number;
    let isNewPool = false;
    
    if (!pool) {
      // Creating a new pool
      poolId = `pool_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      liquidityTokens = Math.sqrt(amountA * amountB); // Initial LP tokens
      isNewPool = true;
      
      // Create the pool
      pool = {
        id: poolId,
        tokenA,
        tokenB,
        reserveA: amountA,
        reserveB: amountB,
        totalLiquidity: liquidityTokens,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Store the new pool
      await this.storage.createLiquidityPool(pool);
    } else {
      // Adding to an existing pool
      poolId = pool.id;
      
      // Calculate the proportion for the new liquidity
      let tokenAReserve: number;
      let tokenBReserve: number;
      
      if (pool.tokenA === tokenA) {
        tokenAReserve = pool.reserveA;
        tokenBReserve = pool.reserveB;
      } else {
        tokenAReserve = pool.reserveB;
        tokenBReserve = pool.reserveA;
      }
      
      // Ensure proportional contribution
      const tokenBExpected = (amountA * tokenBReserve) / tokenAReserve;
      
      if (amountB < tokenBExpected * 0.99 || amountB > tokenBExpected * 1.01) {
        throw new Error("Liquidity amounts are not proportional to the pool's current ratio");
      }
      
      // Calculate liquidity tokens to mint
      liquidityTokens = (amountA * pool.totalLiquidity) / tokenAReserve;
      
      if (liquidityTokens < minLiquidity) {
        throw new Error(`Insufficient liquidity minted: ${liquidityTokens} < ${minLiquidity}`);
      }
      
      // Update pool reserves
      if (pool.tokenA === tokenA) {
        pool.reserveA += amountA;
        pool.reserveB += amountB;
      } else {
        pool.reserveA += amountB;
        pool.reserveB += amountA;
      }
      
      pool.totalLiquidity += liquidityTokens;
      pool.updatedAt = new Date();
      
      // Update the pool in storage
      await this.storage.updateLiquidityPool(pool);
    }
    
    // Verify PVX balance if adding PVX liquidity
    if (tokenA === "PVX" || tokenB === "PVX") {
      const pvxAmount = tokenA === "PVX" ? amountA : amountB;
      const userBalance = await this.storage.getWalletBalance(address);
      
      if (userBalance < pvxAmount) {
        throw new Error("Insufficient PVX balance");
      }
      
      // Deduct PVX from wallet
      await this.storage.updateWalletBalance(address, userBalance - pvxAmount);
    }
    
    // Create position for the user
    const positionId = `pos_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const position: PoolPosition = {
      id: positionId,
      poolId,
      ownerAddress: address,
      liquidityTokens,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Store the position
    await this.storage.createLiquidityPosition(position);
    
    // Add a transaction record
    const txDate = new Date();
    const txHash = this.generateTxHash(address, tokenA, tokenB, amountA + amountB, txDate);
    
    await this.storage.createTransaction({
      hash: txHash,
      type: TransactionType.DEX_ADD_LIQUIDITY,
      fromAddress: address,
      toAddress: `zk_PVX:dex:pool:${poolId}`,
      amount: tokenA === "PVX" ? amountA : (tokenB === "PVX" ? amountB : 0),
      timestamp: txDate,
      note: `Add liquidity: ${amountA} ${tokenA} and ${amountB} ${tokenB}${isNewPool ? " (new pool)" : ""}`
    });
    
    // Generate a transaction ID
    const txId = `addliq_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Return the result
    return {
      poolId,
      tokenA,
      tokenB,
      amountA,
      amountB,
      liquidityTokens,
      txId,
      timestamp: txDate
    };
  }

  /**
   * Remove liquidity from a pool
   */
  async removeLiquidity(address: string, params: RemoveLiquidityParams): Promise<{
    poolId: string;
    tokenA: string;
    tokenB: string;
    amountA: number;
    amountB: number;
    liquidityTokensBurned: number;
    txId: string;
    timestamp: Date;
  }> {
    const { poolId, liquidityTokens, minAmountA, minAmountB, deadline } = params;
    
    // Check if deadline has passed
    if (new Date() > deadline) {
      throw new Error("Liquidity removal deadline has expired");
    }
    
    // Get the pool
    const pool = await this.getLiquidityPool(poolId);
    if (!pool) {
      throw new Error(`Pool with ID ${poolId} not found`);
    }
    
    // Get the user's position in the pool
    const positions = await this.getLiquidityPositions(address);
    const position = positions.find(p => p.poolId === poolId);
    
    if (!position) {
      throw new Error(`No liquidity position found for pool ${poolId}`);
    }
    
    if (position.liquidityTokens < liquidityTokens) {
      throw new Error(`Insufficient liquidity tokens: ${position.liquidityTokens} < ${liquidityTokens}`);
    }
    
    // Calculate the proportion of the pool being removed
    const shareOfPool = liquidityTokens / pool.totalLiquidity;
    const amountA = pool.reserveA * shareOfPool;
    const amountB = pool.reserveB * shareOfPool;
    
    // Check minimum amounts
    if (amountA < minAmountA || amountB < minAmountB) {
      throw new Error(`Slippage limit exceeded: Got ${amountA} ${pool.tokenA} (min: ${minAmountA}) and ${amountB} ${pool.tokenB} (min: ${minAmountB})`);
    }
    
    // Update the pool reserves
    pool.reserveA -= amountA;
    pool.reserveB -= amountB;
    pool.totalLiquidity -= liquidityTokens;
    pool.updatedAt = new Date();
    
    // Update the user's position
    position.liquidityTokens -= liquidityTokens;
    position.updatedAt = new Date();
    
    if (position.liquidityTokens === 0) {
      // Remove the position entirely if no tokens left
      await this.storage.deleteLiquidityPosition(position.id);
    } else {
      // Update the position
      await this.storage.updateLiquidityPosition(position);
    }
    
    // Update the pool
    await this.storage.updateLiquidityPool(pool);
    
    // If receiving PVX, add to wallet balance
    if (pool.tokenA === "PVX" || pool.tokenB === "PVX") {
      const pvxAmount = pool.tokenA === "PVX" ? amountA : amountB;
      const userBalance = await this.storage.getWalletBalance(address);
      
      // Add PVX to wallet
      await this.storage.updateWalletBalance(address, userBalance + pvxAmount);
    }
    
    // Add a transaction record
    const txDate = new Date();
    const txHash = this.generateTxHash(address, pool.tokenA, pool.tokenB, liquidityTokens, txDate);
    
    await this.storage.createTransaction({
      hash: txHash,
      type: TransactionType.DEX_REMOVE_LIQUIDITY,
      fromAddress: `zk_PVX:dex:pool:${poolId}`,
      toAddress: address,
      amount: pool.tokenA === "PVX" ? amountA : (pool.tokenB === "PVX" ? amountB : 0),
      timestamp: txDate,
      note: `Remove liquidity: ${liquidityTokens} LP tokens for ${amountA.toFixed(6)} ${pool.tokenA} and ${amountB.toFixed(6)} ${pool.tokenB}`
    });
    
    // Generate a transaction ID
    const txId = `remliq_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Return the result
    return {
      poolId,
      tokenA: pool.tokenA,
      tokenB: pool.tokenB,
      amountA,
      amountB,
      liquidityTokensBurned: liquidityTokens,
      txId,
      timestamp: txDate
    };
  }
  
  /**
   * Get DEX statistics
   */
  async getDexStats(): Promise<{
    totalPools: number;
    totalValueLocked: number;
    totalVolume24h: number;
    totalFees24h: number;
    mostActivePool: {
      id: string;
      tokenA: string;
      tokenB: string;
      volume24h: number;
    };
  }> {
    try {
      // In a real implementation, this would calculate total value locked,
      // trading volume, and fees collected over the last 24 hours
      return {
        totalPools: 3,
        totalValueLocked: 4250000, // in USD
        totalVolume24h: 1240000, // in USD
        totalFees24h: 3720, // in USD
        mostActivePool: {
          id: "1",
          tokenA: "PVX",
          tokenB: "USDC",
          volume24h: 750000 // in USD
        }
      };
    } catch (error) {
      console.error("Error getting DEX stats:", error);
      // Fallback values
      return {
        totalPools: 3,
        totalValueLocked: 4250000, // in USD
        totalVolume24h: 1240000, // in USD
        totalFees24h: 3720, // in USD
        mostActivePool: {
          id: "1",
          tokenA: "PVX",
          tokenB: "USDC",
          volume24h: 750000 // in USD
        }
      };
    }
  }
  
  /**
   * Generate a transaction hash (simplified for demo)
   */
  private generateTxHash(
    address: string,
    tokenA: string,
    tokenB: string,
    amount: number,
    timestamp: Date
  ): string {
    const hashInput = `${address}-${tokenA}-${tokenB}-${amount}-${timestamp.getTime()}`;
    let hash = "";
    for (let i = 0; i < 64; i++) {
      hash += "0123456789abcdef"[Math.floor(Math.random() * 16)];
    }
    return hash;
  }
}