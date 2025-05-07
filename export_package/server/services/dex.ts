import { storage } from '../storage';
import { InsertToken, InsertLiquidityPool } from '@shared/schema';

export class DEXService {
  private storage;

  constructor(storage: typeof import('../storage').storage) {
    this.storage = storage;
  }

  async initializeSampleData() {
    try {
      // Check if tokens already exist
      const existingTokens = await this.storage.getTokens();
      if (existingTokens.length > 0) {
        console.log('Sample DEX data already initialized');
        return;
      }

      // Create base tokens
      const pvx = await this.storage.createToken({
        symbol: 'PVX',
        name: 'PixelVault',
        decimals: 6,
        logo_url: '/assets/tokens/pvx-logo.png',
        is_native: true,
        is_verified: true,
        total_supply: '6009420000000',
        description: 'Native token of the PixelVault blockchain ecosystem',
        contract_address: 'zk_PVX:native'
      });

      const usdc = await this.storage.createToken({
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        logo_url: '/assets/tokens/usdc-logo.png',
        is_native: false,
        is_verified: true,
        total_supply: '10000000000',
        description: 'Stablecoin pegged to the US Dollar',
        contract_address: 'zk_PVX:usdc'
      });

      const eth = await this.storage.createToken({
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        logo_url: '/assets/tokens/eth-logo.png',
        is_native: false,
        is_verified: true,
        total_supply: '120000000000000000000000000',
        description: 'Wrapped Ethereum on PixelVault',
        contract_address: 'zk_PVX:eth'
      });

      const pxenergy = await this.storage.createToken({
        symbol: 'PXENERGY',
        name: 'PixelVault Energy',
        decimals: 6,
        logo_url: '/assets/tokens/pxenergy-logo.png',
        is_native: false,
        is_verified: true,
        total_supply: '30000000000000',
        description: 'Utility token for the PixelVault ecosystem',
        contract_address: 'zk_PVX:pxenergy'
      });

      // Create liquidity pools
      // PVX-USDC Pool: 1 PVX = 0.003 USDC
      const pvxUsdcPool = await this.storage.createLiquidityPool({
        token0_id: pvx.id,
        token1_id: usdc.id,
        token0_amount: '20000000000', // 20,000 PVX
        token1_amount: '60000000',    // 60 USDC
        lp_token_supply: '1732050808', // sqrt(20000*60) * 1000
        swap_fee_percent: '0.3',
        pool_address: 'zk_PVX:pool:pvx-usdc',
        is_active: true
      });

      // PVX-ETH Pool: 1 ETH = 2000 PVX
      const pvxEthPool = await this.storage.createLiquidityPool({
        token0_id: pvx.id,
        token1_id: eth.id,
        token0_amount: '10000000000',            // 10,000 PVX
        token1_amount: '5000000000000000000',    // 5 ETH
        lp_token_supply: '223606797',            // sqrt(10000*5) * 1000
        swap_fee_percent: '0.3',
        pool_address: 'zk_PVX:pool:pvx-eth',
        is_active: true
      });

      // PVX-PXENERGY Pool: 1 PVX = 5 PXENERGY
      const pvxPxenergyPool = await this.storage.createLiquidityPool({
        token0_id: pvx.id,
        token1_id: pxenergy.id,
        token0_amount: '15000000000',  // 15,000 PVX
        token1_amount: '75000000000',  // 75,000 PXENERGY
        lp_token_supply: '1060660171', // sqrt(15000*75000) * 1000
        swap_fee_percent: '0.3',
        pool_address: 'zk_PVX:pool:pvx-pxenergy',
        is_active: true
      });

      // USDC-PXENERGY Pool: 1 USDC = 1666.67 PXENERGY
      const usdcPxenergyPool = await this.storage.createLiquidityPool({
        token0_id: usdc.id,
        token1_id: pxenergy.id,
        token0_amount: '30000000',     // 30 USDC
        token1_amount: '50000000000',  // 50,000 PXENERGY
        lp_token_supply: '387298334',  // sqrt(30*50000) * 1000
        swap_fee_percent: '0.3',
        pool_address: 'zk_PVX:pool:usdc-pxenergy',
        is_active: true
      });

      console.log('Sample DEX data initialized successfully');
      
      return {
        tokens: [pvx, usdc, eth, pxenergy],
        pools: [pvxUsdcPool, pvxEthPool, pvxPxenergyPool, usdcPxenergyPool]
      };
    } catch (error) {
      console.error('Error initializing sample DEX data:', error);
      throw error;
    }
  }

  async createSampleLPPosition(address: string) {
    try {
      // Get first pool (PVX-USDC)
      const pools = await this.storage.getLiquidityPools(1);
      if (pools.length === 0) {
        throw new Error('No pools found');
      }
      
      const pool = pools[0];
      
      // Create LP position for user
      const lpPosition = await this.storage.createLPPosition({
        pool_id: pool.id,
        owner_address: address,
        lp_token_amount: '173205080', // 10% of total LP supply
        token0_amount: '2000000000',  // 10% of token0 in pool
        token1_amount: '6000000',     // 10% of token1 in pool
        is_active: true
      });
      
      return lpPosition;
    } catch (error) {
      console.error('Error creating sample LP position:', error);
      throw error;
    }
  }

  async createSampleSwap(address: string) {
    try {
      // Get first pool (PVX-USDC)
      const pools = await this.storage.getLiquidityPools(1);
      if (pools.length === 0) {
        throw new Error('No pools found');
      }
      
      const pool = pools[0];
      
      // Create sample swap (PVX -> USDC)
      const swap = await this.storage.createSwap({
        pool_id: pool.id,
        trader_address: address,
        token_in_id: pool.token0_id,
        token_out_id: pool.token1_id,
        amount_in: '100000000',  // 100 PVX
        amount_out: '299100',    // ~0.3 USDC
        fee_amount: '300000',    // 0.3% fee
        tx_hash: `0x${Math.random().toString(16).substring(2)}`,
        price_impact_percent: '0.5',
        slippage_tolerance_percent: '0.5'
      });
      
      return swap;
    } catch (error) {
      console.error('Error creating sample swap:', error);
      throw error;
    }
  }
}

// Singleton instance
export const dexService = new DEXService(storage);