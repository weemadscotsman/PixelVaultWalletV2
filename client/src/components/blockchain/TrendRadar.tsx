import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveRadar } from '@nivo/radar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

type TimeRange = '24h' | '7d' | '30d';

type RadarDataPoint = {
  metric: string;
  value: number;
  maxValue: number;
};

type TrendMetric = {
  id: string;
  label: string;
  color: string;
  data: {
    [key in TimeRange]: RadarDataPoint[];
  };
};

interface TrendRadarProps {
  className?: string;
}

export function TrendRadar({ className }: TrendRadarProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  
  // Mock data - will be replaced with API data
  const { isLoading, error, data: blockchainTrends } = useQuery({
    queryKey: ['/api/blockchain/trends', timeRange],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/blockchain/trends?timeRange=${timeRange}`);
      if (!res.ok) {
        throw new Error('Failed to fetch blockchain trends');
      }
      return res.json();
    },
    placeholderData: getPlaceholderData(),
  });

  // Generate radar chart data from the trends
  const radarData = React.useMemo(() => {
    if (!blockchainTrends) return [];
    
    return blockchainTrends.metrics.map((metric: any) => ({
      metric: metric.label,
      [metric.id]: Math.round((metric.data[timeRange].value / metric.data[timeRange].maxValue) * 100),
    })).reduce((acc: any, item: any) => {
      // Convert array of objects to a single object with all metrics
      const { metric, ...values } = item;
      
      if (!acc.find((i: any) => i.metric === metric)) {
        acc.push({ metric, ...values });
      }
      
      return acc;
    }, []);
  }, [blockchainTrends, timeRange]);
  
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
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
              <SelectTrigger className="w-24 h-8 text-xs border-blue-900/50 bg-blue-950/30">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-blue-900/50">
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
              </SelectContent>
            </Select>
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
              borderWidth={2}
              borderColor={{ from: 'color', modifiers: [] }}
              gridLabelOffset={15}
              dotSize={10}
              dotColor={{ theme: 'background' }}
              dotBorderWidth={2}
              dotBorderColor={{ from: 'color' }}
              enableDotLabel={false}
              colors={radarColors}
              blendMode="screen"
              motionConfig="gentle"
              gridShape="circular"
              gridLevels={5}
              gridLabel={(value) => ''}
              theme={{
                textColor: '#94a3b8',
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