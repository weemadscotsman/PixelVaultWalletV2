import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { Check, Clock, AlertTriangle, X, Filter, RefreshCw } from 'lucide-react';

interface UTREntry {
  id: number;
  tx_id: string;
  tx_type: string;
  from_address: string;
  to_address: string;
  amount: string;
  asset_type: string;
  asset_id: string;
  block_height: number | null;
  status: string;
  timestamp: string;
  metadata: Record<string, any>;
  zk_proof: string;
  signature: string;
  gas_fee: string;
  verified: boolean;
}

const txTypeColors: Record<string, string> = {
  transfer: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
  mining_reward: 'bg-green-900/50 text-green-300 border-green-700/50',
  stake: 'bg-purple-900/50 text-purple-300 border-purple-700/50',
  dex_swap: 'bg-orange-900/50 text-orange-300 border-orange-700/50',
  governance_vote: 'bg-cyan-900/50 text-cyan-300 border-cyan-700/50',
  nft_mint: 'bg-pink-900/50 text-pink-300 border-pink-700/50',
  default: 'bg-gray-900/50 text-gray-300 border-gray-700/50'
};

const formatAddress = (address: string) => {
  if (!address) return '';
  if (address.startsWith('zk_PVX:')) {
    return address; // Keep special addresses intact
  }
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
};

const formatAmount = (amount: string, assetType: string) => {
  // Convert string to number
  const numAmount = parseFloat(amount);
  
  // Format based on asset type
  if (assetType === 'token') {
    // Format PVX tokens with 6 decimal places
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    }).format(numAmount);
  } else if (assetType === 'nft') {
    return numAmount.toString(); // NFTs typically have whole number amounts
  } else {
    return numAmount.toString(); // Default formatting
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'confirmed':
      return (
        <Badge variant="outline" className="bg-green-900/40 text-green-300 border-green-700/50 flex items-center gap-1">
          <Check className="h-3 w-3" />
          Confirmed
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="outline" className="bg-yellow-900/40 text-yellow-300 border-yellow-700/50 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="outline" className="bg-red-900/40 text-red-300 border-red-700/50 flex items-center gap-1">
          <X className="h-3 w-3" />
          Failed
        </Badge>
      );
    case 'vetoed':
      return (
        <Badge variant="outline" className="bg-red-900/40 text-red-300 border-red-700/50 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Vetoed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-gray-900/40 text-gray-300 border-gray-700/50">
          {status}
        </Badge>
      );
  }
};

const TransactionTypeFilter = ({ currentType, onTypeChange }: { 
  currentType: string; 
  onTypeChange: (type: string) => void 
}) => {
  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-cyan-400" />
      <Select value={currentType} onValueChange={onTypeChange}>
        <SelectTrigger className="w-[180px] h-8 bg-gray-900/60 border-gray-700 text-gray-200 focus:ring-cyan-500/30 focus:border-cyan-500/50">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border-gray-700">
          <SelectItem value="all" className="text-gray-200 focus:bg-gray-800">All Types</SelectItem>
          <SelectItem value="transfer" className="text-blue-300 focus:bg-gray-800">Transfer</SelectItem>
          <SelectItem value="mining_reward" className="text-green-300 focus:bg-gray-800">Mining Reward</SelectItem>
          <SelectItem value="stake" className="text-purple-300 focus:bg-gray-800">Stake</SelectItem>
          <SelectItem value="dex_swap" className="text-orange-300 focus:bg-gray-800">DEX Swap</SelectItem>
          <SelectItem value="governance_vote" className="text-cyan-300 focus:bg-gray-800">Governance Vote</SelectItem>
          <SelectItem value="nft_mint" className="text-pink-300 focus:bg-gray-800">NFT Mint</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

const StatusFilter = ({ currentStatus, onStatusChange }: { 
  currentStatus: string; 
  onStatusChange: (status: string) => void 
}) => {
  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-purple-400" />
      <Select value={currentStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[180px] h-8 bg-gray-900/60 border-gray-700 text-gray-200 focus:ring-purple-500/30 focus:border-purple-500/50">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border-gray-700">
          <SelectItem value="all" className="text-gray-200 focus:bg-gray-800">All Statuses</SelectItem>
          <SelectItem value="confirmed" className="text-green-300 focus:bg-gray-800">Confirmed</SelectItem>
          <SelectItem value="pending" className="text-yellow-300 focus:bg-gray-800">Pending</SelectItem>
          <SelectItem value="failed" className="text-red-300 focus:bg-gray-800">Failed</SelectItem>
          <SelectItem value="vetoed" className="text-red-300 focus:bg-gray-800">Vetoed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export function UTRList({ wallet, limit = 50 }: { wallet?: string; limit?: number }) {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Determine the query endpoint based on whether a wallet is provided
  const queryEndpoint = wallet 
    ? `/api/utr/address/${wallet}` 
    : '/api/utr';

  const { data, isLoading, isError, error, refetch } = useQuery<UTREntry[]>({
    queryKey: [queryEndpoint, limit],
    enabled: true,
  });

  // Filter the data based on selected filters
  const filteredData = data?.filter(entry => {
    // Apply type filter
    if (typeFilter !== 'all' && entry.tx_type !== typeFilter) {
      return false;
    }
    
    // Apply status filter
    if (statusFilter !== 'all' && entry.status !== statusFilter) {
      return false;
    }
    
    return true;
  }) || [];

  return (
    <Card className="w-full overflow-hidden border border-gray-800 bg-black/70 backdrop-blur-sm backdrop-filter rounded-xl shadow-md">
      <CardHeader className="bg-gradient-to-b from-gray-900/90 to-gray-900/70 text-white p-4 pb-3 border-b border-gray-800/60">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-shadow-neon bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Universal Transaction Registry
            </CardTitle>
            <CardDescription className="text-gray-300 mt-1">
              {wallet ? 'Wallet transactions' : 'Recent blockchain activity'}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <TransactionTypeFilter 
              currentType={typeFilter} 
              onTypeChange={setTypeFilter} 
            />
            <StatusFilter 
              currentStatus={statusFilter} 
              onStatusChange={setStatusFilter} 
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-2 bg-transparent hover:bg-gray-800/60 border-gray-700 text-cyan-400 hover:text-cyan-300"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <Skeleton className="h-8 w-16 bg-gray-800/50" />
                <Skeleton className="h-8 w-32 bg-gray-800/50" />
                <Skeleton className="h-8 w-24 bg-gray-800/50" />
                <Skeleton className="h-8 w-32 ml-auto bg-gray-800/50" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center p-8 text-gray-400 border border-red-900/30 m-4 rounded-lg bg-red-950/20">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <div className="mb-2 font-medium">Error loading transactions</div>
            <div className="text-sm text-gray-500">{(error as Error)?.message}</div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center p-8 text-gray-400 border border-gray-800/30 m-4 rounded-lg bg-gray-900/20">
            <Filter className="h-8 w-8 text-gray-500 mx-auto mb-2" />
            <div className="mb-2 font-medium">No transactions found</div>
            <div className="text-sm text-gray-500">Try adjusting your filters or refreshing</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-900/60 sticky top-0">
                <TableRow className="border-b border-gray-800">
                  <TableHead className="text-left pl-5 text-gray-300 font-medium">Type</TableHead>
                  <TableHead className="text-left text-gray-300 font-medium">From</TableHead>
                  <TableHead className="text-left text-gray-300 font-medium">To</TableHead>
                  <TableHead className="text-right text-gray-300 font-medium">Amount</TableHead>
                  <TableHead className="text-center text-gray-300 font-medium">Status</TableHead>
                  <TableHead className="text-right pr-5 text-gray-300 font-medium">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-gray-800/40 border-b border-gray-800/30">
                    <TableCell className="pl-5">
                      <Badge 
                        variant="outline" 
                        className={txTypeColors[entry.tx_type] || txTypeColors.default}
                      >
                        {entry.tx_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-gray-300">
                      {formatAddress(entry.from_address)}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-gray-300">
                      {formatAddress(entry.to_address)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-gray-200 font-medium">{formatAmount(entry.amount, entry.asset_type)}</span>
                        <span className="text-xs text-gray-500">{entry.asset_id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={entry.status} />
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-500 pr-5">
                      {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default UTRList;