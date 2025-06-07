import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveRadar } from '@nivo/radar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Define key types and interfaces
interface MetricDataPoint {
  value: number;
  maxValue: number;
  unit: string;
}

interface MetricCategory {
  id: string;
  label: string;
  color: string;
  data: {
    [key: string]: MetricDataPoint;
  };
}

interface BlockchainTrends {
  metrics: MetricCategory[];
}

interface TrendRadarProps {
  className?: string;
}

export function TrendRadar({ className }: TrendRadarProps) {
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  
  // Fetch real blockchain data from the API
  const { isLoading, error, data: blockchainTrends, refetch } = useQuery({
    queryKey: ['/api/blockchain/trends'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/blockchain/trends');
      if (!res.ok) {
        throw new Error('Failed to fetch blockchain trends');
      }
      return res.json() as Promise<BlockchainTrends>;
    },
  });

  // Process API data for the radar chart
  const radarData = React.useMemo(() => {
    if (!blockchainTrends) return [];
    
    // Create an array to hold all the metric data points for the radar
    const processedData: Array<Record<string, any>> = [];
    
    // For each metric category (mining, network, etc.)
    blockchainTrends.metrics.forEach(metric => {
      // For each data point in this category (hashrate, difficulty, etc.)
      Object.entries(metric.data).forEach(([dataKey, dataPoint]) => {
        // Calculate percentage relative to max value (for radar chart, which works on 0-100 scale)
        const value = dataPoint.value || 0;
        const maxValue = dataPoint.maxValue || 1; // Prevent division by zero
        const percentage = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
        
        // Add this data point to our array
        processedData.push({
          metric: `${metric.label} (${dataKey})`, // e.g. "Mining Activity (hashrate)"
          [metric.id]: String(percentage), // e.g. "mining": "60"
          rawValue: value,
          rawMax: maxValue,
          unit: dataPoint.unit
        });
      });
    });
    
    return processedData;
  }, [blockchainTrends]);
  
  // Generate keys for the radar chart
  const radarKeys = React.useMemo(() => {
    if (!blockchainTrends) return [];
    return blockchainTrends.metrics.map((metric: any) => metric.id);
  }, [blockchainTrends]);
  
  // Generate colors for the radar chart
  const radarColors = React.useMemo(() => {
    if (!blockchainTrends) return [];
    return blockchainTrends.metrics.map((metric: any) => metric.color);
  }, [blockchainTrends]);

  return (
    <Card className={`bg-black/70 border-blue-900/50 overflow-hidden ${className}`}>
      <CardHeader className="border-b border-blue-900/30 bg-blue-900/10 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-blue-300">Blockchain Trend Radar</CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm"
              className="h-8 px-3 bg-transparent hover:bg-gray-800/60 border-blue-900/50 text-blue-400 hover:text-blue-300"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-red-400">Failed to load blockchain trends</p>
            <Button variant="outline" className="border-blue-900/50 text-blue-400">
              Retry
            </Button>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveRadar
              data={radarData}
              keys={radarKeys}
              indexBy="metric"
              maxValue={100}
              margin={{ top: 30, right: 60, bottom: 30, left: 60 }}
              // Fixed width values to avoid NaN errors by using strings
              borderWidth={2}
              borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
              gridLabelOffset={15}
              dotSize={8}
              dotColor={{ theme: 'background' }}
              dotBorderWidth={2}
              dotBorderColor={{ from: 'color' }}
              transitionDuration={300}
              animate={true}
              enableDotLabel={false}
              colors={radarColors}
              blendMode="screen"
              motionConfig="gentle"
              onMouseEnter={(_data, index) => {
                setActivePointIndex(index);
              }}
              onMouseLeave={() => {
                setActivePointIndex(null);
              }}
              gridShape="circular"
              gridLevels={5}
              gridLabel={(value) => ''}
              tooltip={({ point }) => {
                return (
                  <div className="bg-slate-900 border border-blue-900/30 rounded p-2 text-xs shadow-md">
                    <div className="font-semibold text-blue-300">{point.data.metric}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: point.color }}
                      />
                      <span className="text-slate-300">{point.key}: </span>
                      <span className="font-medium text-blue-200">
                        {point.data.rawValue?.toLocaleString()} {point.data.unit}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[10px] mt-1">
                      Max: {point.data.rawMax?.toLocaleString()} {point.data.unit}
                    </div>
                  </div>
                );
              }}
              theme={{
                labels: {
                  text: {
                    fontSize: 12,
                    fill: '#94a3b8',
                  }
                },
                grid: {
                  line: {
                    stroke: '#1e293b',
                    strokeWidth: 1,
                  }
                },
                tooltip: {
                  container: {
                    background: '#0f172a',
                    color: '#e2e8f0',
                    fontSize: 12,
                    borderRadius: 4,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    padding: '8px 12px',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                  }
                }
              }}
              legends={[
                {
                  anchor: 'top-left',
                  direction: 'column',
                  translateX: -40,
                  translateY: -20,
                  itemWidth: 80,
                  itemHeight: 20,
                  itemTextColor: '#94a3b8',
                  symbolSize: 12,
                  symbolShape: 'circle',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemTextColor: '#e2e8f0'
                      }
                    }
                  ]
                }
              ]}
            />
          </div>
        )}
        
        <div className="mt-4 text-xs text-gray-500">
          <p>This radar chart displays the relative trends in various blockchain metrics compared to their historical maximums.</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Placeholder data function for development
function getPlaceholderData() {
  return {
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
}