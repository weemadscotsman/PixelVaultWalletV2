import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Transaction } from '@shared/types';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '@/hooks/useWebSocket';
import { ArrowRightIcon, CircleDollarSign, Database, Shield, Gem, ActivityIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface TransactionVisualizerProps {
  limit?: number;
}

const TRANSACTION_COLORS = {
  'TRANSFER': '#39ff14', // neon green
  'MINING_REWARD': '#ff9c00', // orange
  'STAKING_REWARD': '#ff00ff', // magenta
  'STAKE_START': '#ff00ff', // magenta
  'STAKE_END': '#ff00ff', // magenta
  'DROP_CLAIM': '#00e5ff', // cyan
  'GOVERNANCE_PROPOSAL': '#ffff00', // yellow
  'GOVERNANCE_VOTE': '#ffff00', // yellow
  'LEARNING_REWARD': '#1e90ff', // dodger blue
  'default': '#ffffff', // white
};

const TRANSACTION_ICONS = {
  'TRANSFER': CircleDollarSign,
  'MINING_REWARD': Database,
  'STAKING_REWARD': Gem,
  'STAKE_START': Gem,
  'STAKE_END': Gem,
  'DROP_CLAIM': Gem,
  'GOVERNANCE_PROPOSAL': Shield,
  'GOVERNANCE_VOTE': Shield,
  'LEARNING_REWARD': ActivityIcon,
  'default': CircleDollarSign,
};

// Helper function to shorten addresses for display
const shortenAddress = (address: string) => {
  if (!address) return '';
  if (address.startsWith('zk_PVX:')) return address;
  return address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
};

// Format amount with proper decimals
const formatAmount = (amount: number) => {
  if (amount === 0) return '0 PVX';
  
  // PVX has 6 decimal places
  const wholePart = Math.floor(amount / 1000000);
  const decimalPart = amount % 1000000;
  
  if (decimalPart === 0) {
    return `${wholePart} PVX`;
  }
  
  // Format with up to 6 decimal places, removing trailing zeros
  const decimalStr = (decimalPart / 1000000).toFixed(6).slice(2).replace(/0+$/, '');
  return `${wholePart}.${decimalStr} PVX`;
};

// Transaction type displayed in a user-friendly way
const formatTransactionType = (type: string) => {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
};

export const TransactionVisualizer: React.FC<TransactionVisualizerProps> = ({ limit = 10 }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();
  const transactionContainerRef = useRef<HTMLDivElement>(null);
  
  // Setup WebSocket for real-time transaction updates
  const { status: wsStatus } = useWebSocket({
    onOpen: () => {
      toast({
        title: 'Blockchain Connected',
        description: 'Real-time transaction updates enabled',
        variant: 'default',
      });
    },
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'transaction' || data.type === 'new_transaction') {
          // Extract transaction data from message
          const txData = data.transaction || data.data || {};
          
          // Create a transaction object with consistent property names
          const transaction: Transaction = {
            hash: txData.hash || '',
            type: txData.type || 'TRANSFER',
            from: txData.from || txData.fromAddress || '',
            to: txData.to || txData.toAddress || '',
            amount: typeof txData.amount === 'number' ? txData.amount : 0,
            timestamp: typeof txData.timestamp === 'number' ? txData.timestamp : Date.now(),
            nonce: txData.nonce || 0,
            signature: txData.signature || '',
            status: txData.status || 'confirmed',
            blockHeight: txData.blockHeight,
            fee: txData.fee,
            metadata: txData.metadata,
            note: txData.note,
          };
          
          // Add the new transaction to the beginning of our list
          setTransactions(prev => [transaction, ...prev].slice(0, limit));
          
          // Log for debugging
          console.log('Received real-time transaction:', transaction);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    },
    onError: () => {
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to blockchain network',
        variant: 'destructive',
      });
    }
  });
  
  // Fetch initial transactions when component mounts
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('/api/tx/recent?limit=' + limit);
        if (response.ok) {
          const data = await response.json();
          setTransactions(data);
        } else {
          console.error('Failed to fetch transactions');
          
          // If we fail to fetch real transactions, use demo data
          setTransactions(generateDemoTransactions(limit));
        }
      } catch (error) {
        console.error('Error fetching transaction history:', error);
        
        // If we fail to fetch real transactions, use demo data
        setTransactions(generateDemoTransactions(limit));
      }
    };
    
    fetchTransactions();
  }, [limit]);
  
  // Generate demo transactions for testing
  const generateDemoTransactions = (count: number): Transaction[] => {
    const now = Date.now();
    const types: Transaction['type'][] = [
      'TRANSFER', 'MINING_REWARD', 'STAKING_REWARD', 
      'STAKE_START', 'STAKE_END', 'DROP_CLAIM',
      'GOVERNANCE_PROPOSAL', 'GOVERNANCE_VOTE', 'LEARNING_REWARD'
    ];
    
    return Array.from({ length: count }, (_, i) => {
      const type = types[Math.floor(Math.random() * types.length)];
      const amount = type === 'GOVERNANCE_VOTE' || type === 'GOVERNANCE_PROPOSAL' 
        ? 0 
        : Math.floor(Math.random() * 1000000000) + 1000000;
      
      return {
        hash: `0x${Math.random().toString(16).substring(2, 34)}`,
        type,
        from: `PVX_${Math.random().toString(16).substring(2, 34)}`,
        to: type.includes('REWARD') 
          ? `PVX_${Math.random().toString(16).substring(2, 34)}`
          : `zk_PVX:${type.toLowerCase().split('_')[0]}`,
        amount,
        timestamp: now - (i * 60000) - Math.floor(Math.random() * 300000),
        nonce: Math.floor(Math.random() * 1000),
        signature: `sig_${Math.random().toString(16).substring(2, 34)}`,
        status: 'confirmed',
        blockHeight: 1000000 - i,
        fee: 100000,
      };
    });
  };
  
  // Get the appropriate icon for a transaction type
  const getTransactionIcon = (type: string) => {
    const IconComponent = TRANSACTION_ICONS[type as keyof typeof TRANSACTION_ICONS] || TRANSACTION_ICONS.default;
    return <IconComponent className="h-4 w-4" />;
  };
  
  // Get the appropriate color for a transaction type
  const getTransactionColor = (type: string) => {
    return TRANSACTION_COLORS[type as keyof typeof TRANSACTION_COLORS] || TRANSACTION_COLORS.default;
  };
  
  return (
    <Card className="bg-black/80 border-blue-900/50 h-full overflow-hidden">
      <CardContent className="p-0 h-full flex flex-col">
        <div className="p-3 border-b border-blue-900/30 bg-blue-900/10 flex justify-between items-center">
          <div className="text-blue-300 flex items-center text-sm font-medium">
            <ActivityIcon className="h-4 w-4 mr-2" />
            PVX Transaction Stream
          </div>
          
          <div className="flex items-center">
            <Badge 
              variant="outline" 
              className={`h-5 text-xs font-mono flex items-center gap-1 ${
                wsStatus === 'connected' 
                  ? 'bg-green-950/30 text-green-400 border-green-700/50' 
                  : 'bg-red-950/30 text-red-400 border-red-700/50'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${
                wsStatus === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-red-400'
              }`} />
              {wsStatus === 'connected' ? 'LIVE' : 'DISCONNECTED'}
            </Badge>
          </div>
        </div>
        
        <div 
          ref={transactionContainerRef}
          className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-blue-900/30 scrollbar-track-transparent"
        >
          <AnimatePresence>
            {transactions.map((tx) => (
              <motion.div
                key={tx.hash}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="mb-2 last:mb-0"
              >
                <Card className="bg-black/40 border-blue-900/20 overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-center mb-2">
                      <div 
                        className="mr-2 p-1.5 rounded-full" 
                        style={{ backgroundColor: `${getTransactionColor(tx.type)}20` }}
                      >
                        <div className="text-xs" style={{ color: getTransactionColor(tx.type) }}>
                          {getTransactionIcon(tx.type)}
                        </div>
                      </div>
                      
                      <div className="text-xs font-medium" style={{ color: getTransactionColor(tx.type) }}>
                        {formatTransactionType(tx.type)}
                      </div>
                      
                      <div className="ml-auto text-xs text-blue-400/70">
                        {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                    
                    <div className="flex items-center text-xs mt-1 text-blue-300/90">
                      <div className="font-mono">{shortenAddress(tx.from)}</div>
                      <ArrowRightIcon className="h-3 w-3 mx-1 text-blue-500/70" />
                      <div className="font-mono">{shortenAddress(tx.to)}</div>
                      
                      <div className="ml-auto font-medium text-blue-200">
                        {formatAmount(tx.amount)}
                      </div>
                    </div>
                    
                    {tx.note && (
                      <div className="mt-1.5 text-xs text-blue-400/70 truncate">
                        {tx.note}
                      </div>
                    )}
                    
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-blue-500/50 font-mono">
                      <div>{tx.hash.substring(0, 18)}...</div>
                      {tx.blockHeight && (
                        <div>Block #{tx.blockHeight}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            
            {transactions.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-blue-500/40">
                <ActivityIcon className="h-8 w-8 mb-2 opacity-30" />
                <div className="text-sm">Waiting for transactions...</div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};