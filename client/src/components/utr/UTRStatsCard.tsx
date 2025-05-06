import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Badge,
} from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Check,
  Clock,
  AlertTriangle,
  X,
  BarChart3,
  Repeat,
  FileText,
  Gem,
  Vote,
  Award
} from 'lucide-react';

interface UTRStats {
  total: number;
  pending: number;
  confirmed: number;
  failed: number;
  vetoed: number;
  byType: Record<string, number>;
  byAsset: Record<string, number>;
}

const txTypeIcons: Record<string, React.ReactNode> = {
  transfer: <Repeat size={16} />,
  mining_reward: <Award size={16} />,
  stake: <Gem size={16} />,
  dex_swap: <Repeat size={16} />,
  governance_vote: <Vote size={16} />,
  nft_mint: <FileText size={16} />,
};

export function UTRStatsCard() {
  const { data, isLoading, isError } = useQuery<UTRStats>({
    queryKey: ['/api/utr/stats'],
    enabled: true,
  });

  // Handle different states
  if (isLoading) {
    return (
      <Card className="w-full h-full overflow-hidden border border-gray-200 bg-transparent backdrop-blur-sm backdrop-filter bg-opacity-80 rounded-xl shadow-sm">
        <CardHeader className="bg-gradient-to-b from-gray-900/70 to-gray-900/40 text-white p-4 pb-3">
          <CardTitle className="text-xl font-bold tracking-tight">
            Transaction Statistics
          </CardTitle>
          <CardDescription className="text-gray-300 mt-1">
            Loading network activity...
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="w-full h-full overflow-hidden border border-gray-200 bg-transparent backdrop-blur-sm backdrop-filter bg-opacity-80 rounded-xl shadow-sm">
        <CardHeader className="bg-gradient-to-b from-gray-900/70 to-gray-900/40 text-white p-4 pb-3">
          <CardTitle className="text-xl font-bold tracking-tight">
            Transaction Statistics
          </CardTitle>
          <CardDescription className="text-gray-300 mt-1">
            Error loading network activity
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center p-6 text-gray-500">
            <div className="mb-2">Unable to load transaction statistics</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format the statistics
  const txTypeStats = Object.entries(data.byType).sort((a, b) => b[1] - a[1]);
  const assetStats = Object.entries(data.byAsset).sort((a, b) => b[1] - a[1]);

  return (
    <Card className="w-full h-full overflow-hidden border border-gray-200 bg-transparent backdrop-blur-sm backdrop-filter bg-opacity-80 rounded-xl shadow-sm">
      <CardHeader className="bg-gradient-to-b from-gray-900/70 to-gray-900/40 text-white p-4 pb-3">
        <CardTitle className="text-xl font-bold tracking-tight">
          Transaction Statistics
        </CardTitle>
        <CardDescription className="text-gray-300 mt-1">
          PVX blockchain activity overview
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {/* Status Counts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col items-center p-3 rounded bg-gradient-to-b from-green-900/20 to-green-800/5 border border-green-800/20">
            <Check className="h-6 w-6 text-green-500 mb-1" />
            <div className="text-xl font-bold text-green-500">{data.confirmed.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Confirmed</div>
          </div>
          
          <div className="flex flex-col items-center p-3 rounded bg-gradient-to-b from-yellow-900/20 to-yellow-800/5 border border-yellow-800/20">
            <Clock className="h-6 w-6 text-yellow-500 mb-1" />
            <div className="text-xl font-bold text-yellow-500">{data.pending.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Pending</div>
          </div>
          
          <div className="flex flex-col items-center p-3 rounded bg-gradient-to-b from-red-900/20 to-red-800/5 border border-red-800/20">
            <X className="h-6 w-6 text-red-500 mb-1" />
            <div className="text-xl font-bold text-red-500">{data.failed.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Failed</div>
          </div>
          
          <div className="flex flex-col items-center p-3 rounded bg-gradient-to-b from-red-900/20 to-red-800/5 border border-red-800/20">
            <AlertTriangle className="h-6 w-6 text-red-500 mb-1" />
            <div className="text-xl font-bold text-red-500">{data.vetoed.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Vetoed</div>
          </div>
        </div>

        {/* Type Distribution */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Transaction Types
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {txTypeStats.map(([type, count]) => (
              <div key={type} className="flex items-center gap-2 p-2 rounded bg-gray-900/20 border border-gray-800/30">
                <div className="text-gray-400">
                  {txTypeIcons[type] || <FileText size={16} />}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-white">
                    {type.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-400">{count.toLocaleString()}</span>
                </div>
                <div className="ml-auto">
                  <Badge variant="outline" className="text-xs">
                    {((count / data.total) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Asset Distribution */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <Gem className="h-4 w-4" />
            Asset Distribution
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {assetStats.map(([asset, count]) => (
              <div key={asset} className="flex items-center gap-2 p-2 rounded bg-gray-900/20 border border-gray-800/30">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-white">{asset}</span>
                  <span className="text-sm text-gray-400">{count.toLocaleString()}</span>
                </div>
                <div className="ml-auto">
                  <Badge variant="outline" className="text-xs">
                    {((count / data.total) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Count */}
        <div className="mt-4 pt-4 border-t border-gray-800/30 flex justify-between items-center">
          <span className="text-sm text-gray-400">Total Transactions</span>
          <span className="text-lg font-bold text-white">{data.total.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default UTRStatsCard;