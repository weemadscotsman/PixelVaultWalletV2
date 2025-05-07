import express from 'express';
import { storage } from '../storage';

const router = express.Router();

// Get all tokens
router.get('/dex/tokens', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const tokens = await storage.getTokens(limit);
    res.json(tokens);
  } catch (error) {
    console.error('Error fetching tokens:', error);
    res.status(500).json({ error: 'Failed to fetch tokens' });
  }
});

// Get token by ID
router.get('/dex/tokens/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid token ID' });
    }

    const token = await storage.getTokenById(id);
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    res.json(token);
  } catch (error) {
    console.error(`Error fetching token with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch token' });
  }
});

// Get token by symbol
router.get('/dex/tokens/symbol/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const token = await storage.getTokenBySymbol(symbol);
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    res.json(token);
  } catch (error) {
    console.error(`Error fetching token with symbol ${req.params.symbol}:`, error);
    res.status(500).json({ error: 'Failed to fetch token' });
  }
});

// Create token (admin only in a real app)
router.post('/dex/tokens', async (req, res) => {
  try {
    const { symbol, name, logo_url, decimals, contract_address, description, total_supply } = req.body;

    if (!symbol || !name) {
      return res.status(400).json({ error: 'Symbol and name are required' });
    }

    // Check if token with this symbol already exists
    const existingToken = await storage.getTokenBySymbol(symbol);
    if (existingToken) {
      return res.status(409).json({ error: 'Token with this symbol already exists' });
    }

    const newToken = await storage.createToken({
      symbol,
      name,
      logo_url,
      decimals: decimals || 6,
      contract_address,
      is_native: false,
      is_verified: false,
      total_supply,
      description
    });

    res.status(201).json(newToken);
  } catch (error) {
    console.error('Error creating token:', error);
    res.status(500).json({ error: 'Failed to create token' });
  }
});

// Get all liquidity pools
router.get('/dex/pools', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const pools = await storage.getLiquidityPools(limit);
    res.json(pools);
  } catch (error) {
    console.error('Error fetching liquidity pools:', error);
    res.status(500).json({ error: 'Failed to fetch liquidity pools' });
  }
});

// Get liquidity pool by ID
router.get('/dex/pools/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid pool ID' });
    }

    const pool = await storage.getLiquidityPoolById(id);
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }

    res.json(pool);
  } catch (error) {
    console.error(`Error fetching pool with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch pool' });
  }
});

// Get liquidity pool stats by ID
router.get('/dex/pools/:id/stats', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid pool ID' });
    }

    const stats = await storage.getPoolStats(id);
    res.json(stats);
  } catch (error) {
    console.error(`Error fetching pool stats for ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch pool stats' });
  }
});

// Get liquidity pools by token
router.get('/dex/pools/token/:tokenId', async (req, res) => {
  try {
    const tokenId = parseInt(req.params.tokenId, 10);
    if (isNaN(tokenId)) {
      return res.status(400).json({ error: 'Invalid token ID' });
    }

    const pools = await storage.getLiquidityPoolsByToken(tokenId);
    res.json(pools);
  } catch (error) {
    console.error(`Error fetching pools for token ID ${req.params.tokenId}:`, error);
    res.status(500).json({ error: 'Failed to fetch pools for token' });
  }
});

// Create liquidity pool
router.post('/dex/pools', async (req, res) => {
  try {
    const { token0_id, token1_id, token0_amount, token1_amount, lp_token_supply, swap_fee_percent, pool_address } = req.body;

    if (!token0_id || !token1_id || !token0_amount || !token1_amount || !lp_token_supply || !pool_address) {
      return res.status(400).json({ error: 'Missing required pool fields' });
    }

    // Check if pool already exists for this token pair
    const existingPool = await storage.getLiquidityPoolByTokens(token0_id, token1_id);
    if (existingPool) {
      return res.status(409).json({ error: 'Pool already exists for this token pair' });
    }

    const newPool = await storage.createLiquidityPool({
      token0_id,
      token1_id,
      token0_amount,
      token1_amount,
      lp_token_supply,
      swap_fee_percent: swap_fee_percent || "0.3",
      pool_address,
      is_active: true
    });

    res.status(201).json(newPool);
  } catch (error) {
    console.error('Error creating liquidity pool:', error);
    res.status(500).json({ error: 'Failed to create liquidity pool', details: (error as Error).message });
  }
});

// Get LP positions by address
router.get('/dex/positions', async (req, res) => {
  try {
    const address = req.query.address as string;
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const positions = await storage.getLPPositions(address);
    res.json(positions);
  } catch (error) {
    console.error(`Error fetching LP positions for address ${req.query.address}:`, error);
    res.status(500).json({ error: 'Failed to fetch LP positions' });
  }
});

// Get LP position by ID
router.get('/dex/positions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid position ID' });
    }

    const position = await storage.getLPPositionById(id);
    if (!position) {
      return res.status(404).json({ error: 'Position not found' });
    }

    res.json(position);
  } catch (error) {
    console.error(`Error fetching position with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch position' });
  }
});

// Calculate position value
router.get('/dex/positions/:id/value', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid position ID' });
    }

    const position = await storage.getLPPositionById(id);
    if (!position) {
      return res.status(404).json({ error: 'Position not found' });
    }

    const value = await storage.calculateLiquidityValue(
      position.pool_id,
      position.lp_token_amount
    );

    res.json({
      position_id: id,
      ...value
    });
  } catch (error) {
    console.error(`Error calculating position value for ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to calculate position value' });
  }
});

// Create LP position
router.post('/dex/positions', async (req, res) => {
  try {
    const { pool_id, owner_address, lp_token_amount, token0_amount, token1_amount } = req.body;

    if (!pool_id || !owner_address || !lp_token_amount || !token0_amount || !token1_amount) {
      return res.status(400).json({ error: 'Missing required position fields' });
    }

    const newPosition = await storage.createLPPosition({
      pool_id,
      owner_address,
      lp_token_amount,
      token0_amount,
      token1_amount,
      is_active: true
    });

    res.status(201).json(newPosition);
  } catch (error) {
    console.error('Error creating LP position:', error);
    res.status(500).json({ error: 'Failed to create LP position', details: (error as Error).message });
  }
});

// Get swaps
router.get('/dex/swaps', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const address = req.query.address as string;
    const poolId = req.query.poolId ? parseInt(req.query.poolId as string) : undefined;

    if (address) {
      const swaps = await storage.getSwapsByAddress(address, limit);
      return res.json(swaps);
    } else if (poolId !== undefined) {
      const swaps = await storage.getSwapsByPool(poolId, limit);
      return res.json(swaps);
    } else {
      const swaps = await storage.getSwaps(limit);
      return res.json(swaps);
    }
  } catch (error) {
    console.error('Error fetching swaps:', error);
    res.status(500).json({ error: 'Failed to fetch swaps' });
  }
});

// Calculate swap output
router.get('/dex/swap/quote', async (req, res) => {
  try {
    const poolId = parseInt(req.query.poolId as string, 10);
    const tokenInId = parseInt(req.query.tokenInId as string, 10);
    const amountIn = req.query.amountIn as string;

    if (isNaN(poolId) || isNaN(tokenInId) || !amountIn) {
      return res.status(400).json({ error: 'Pool ID, token in ID, and amount in are required' });
    }

    const result = await storage.calculateSwapOutput(poolId, tokenInId, amountIn);
    res.json(result);
  } catch (error) {
    console.error('Error calculating swap output:', error);
    res.status(500).json({ error: 'Failed to calculate swap output', details: (error as Error).message });
  }
});

// Execute swap
router.post('/dex/swap', async (req, res) => {
  try {
    const { pool_id, trader_address, token_in_id, token_out_id, amount_in, amount_out, fee_amount, tx_hash, price_impact_percent, slippage_tolerance_percent } = req.body;

    if (!pool_id || !trader_address || !token_in_id || !token_out_id || !amount_in || !amount_out || !fee_amount || !tx_hash) {
      return res.status(400).json({ error: 'Missing required swap fields' });
    }

    const swap = await storage.createSwap({
      pool_id,
      trader_address,
      token_in_id,
      token_out_id,
      amount_in,
      amount_out,
      fee_amount,
      tx_hash,
      price_impact_percent,
      slippage_tolerance_percent
    });

    res.status(201).json(swap);
  } catch (error) {
    console.error('Error executing swap:', error);
    res.status(500).json({ error: 'Failed to execute swap', details: (error as Error).message });
  }
});

export default router;