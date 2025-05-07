import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

// Get blockchain trend data
router.get('/api/blockchain/trends', async (req, res) => {
  try {
    const timeRange = req.query.timeRange as string || '24h';
    
    // Mock data for development - in production, this would come from storage or blockchain API
    const trendData = {
      metrics: [
        {
          id: 'hashRate',
          label: 'Hash Rate',
          color: '#3b82f6', // blue
          data: {
            '24h': { value: 12.4, maxValue: 15, unit: 'TH/s' },
            '7d': { value: 11.8, maxValue: 15, unit: 'TH/s' },
            '30d': { value: 10.2, maxValue: 15, unit: 'TH/s' },
          }
        },
        {
          id: 'txVolume',
          label: 'Transaction Volume',
          color: '#10b981', // green
          data: {
            '24h': { value: 125000, maxValue: 200000, unit: 'tx' },
            '7d': { value: 750000, maxValue: 1000000, unit: 'tx' },
            '30d': { value: 2800000, maxValue: 4000000, unit: 'tx' },
          }
        },
        {
          id: 'difficulty',
          label: 'Mining Difficulty',
          color: '#f59e0b', // amber
          data: {
            '24h': { value: 12876954, maxValue: 15000000, unit: '' },
            '7d': { value: 12450000, maxValue: 15000000, unit: '' },
            '30d': { value: 11250000, maxValue: 15000000, unit: '' },
          }
        },
        {
          id: 'blockSize',
          label: 'Avg Block Size',
          color: '#8b5cf6', // violet
          data: {
            '24h': { value: 1.2, maxValue: 2, unit: 'MB' },
            '7d': { value: 1.1, maxValue: 2, unit: 'MB' },
            '30d': { value: 0.8, maxValue: 2, unit: 'MB' },
          }
        },
        {
          id: 'stakingYield',
          label: 'Staking Yield',
          color: '#ec4899', // pink
          data: {
            '24h': { value: 5.2, maxValue: 12, unit: '%' },
            '7d': { value: 5.8, maxValue: 12, unit: '%' },
            '30d': { value: 6.5, maxValue: 12, unit: '%' },
          }
        },
        {
          id: 'activeNodes',
          label: 'Active Nodes',
          color: '#ef4444', // red
          data: {
            '24h': { value: 24, maxValue: 50, unit: '' },
            '7d': { value: 22, maxValue: 50, unit: '' },
            '30d': { value: 18, maxValue: 50, unit: '' },
          }
        },
      ]
    };

    // Add some random variation to the data to make it more dynamic
    const variationFactor = timeRange === '24h' ? 0.1 : timeRange === '7d' ? 0.15 : 0.2;
    
    trendData.metrics.forEach(metric => {
      const range = metric.data[timeRange as '24h' | '7d' | '30d'];
      const randomVariation = (Math.random() * 2 - 1) * variationFactor; // Between -variation and +variation
      range.value = Math.max(0, range.value * (1 + randomVariation));
      
      // Ensure value doesn't exceed maxValue
      if (range.value > range.maxValue) {
        range.value = range.maxValue * 0.95; // Set to 95% of max
      }
    });
    
    res.json(trendData);
  } catch (error) {
    console.error('Error fetching blockchain trends:', error);
    res.status(500).json({ error: 'Failed to fetch blockchain trends' });
  }
});

export default router;