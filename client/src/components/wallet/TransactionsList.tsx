import { ArrowUpRight, ArrowDownRight, Clock, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/use-wallet';
import { shortenAddress, formatCryptoAmount, formatTimeAgo } from '@/lib/utils';
import { Link } from 'wouter';

interface TransactionsListProps {
  fullView?: boolean;
}

export function TransactionsList({ fullView = false }: TransactionsListProps) {
  const { activeWallet, getWalletTransactions } = useWallet();
  
  // Get transactions for the active wallet
  const { 
    data: transactions, 
    isLoading, 
    error 
  } = getWalletTransactions(activeWallet || undefined);

  // Determine transaction type
  const getTransactionType = (tx: any, walletAddress: string) => {
    if (tx.from === walletAddress && tx.to === walletAddress) {
      return 'self';
    } else if (tx.from === walletAddress) {
      return 'sent';
    } else {
      return 'received';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-black/70 border-blue-900/50">
        <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
          <CardTitle className="text-blue-300">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 pb-6 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </CardContent>
      </Card>
    );
  }

  if (error || !transactions) {
    return (
      <Card className="bg-black/70 border-blue-900/50">
        <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
          <CardTitle className="text-blue-300">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 pb-6">
          <div className="text-center">
            <p className="text-red-400">Error loading transactions</p>
            <p className="text-gray-400 text-sm mt-1">{error?.message || "Please try again later"}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activeWallet) {
    return (
      <Card className="bg-black/70 border-blue-900/50">
        <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
          <CardTitle className="text-blue-300">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 pb-6">
          <div className="text-center">
            <p className="text-gray-400">Connect a wallet to view transactions</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="bg-black/70 border-blue-900/50">
        <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
          <CardTitle className="text-blue-300">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 pb-6">
          <div className="text-center">
            <p className="text-gray-400">No transactions found for this wallet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If fullView, render a simple div with transactions rather than a card
  if (fullView) {
    return (
      <div className="space-y-4">
        {transactions.map((tx: any) => {
          const type = getTransactionType(tx, activeWallet);
          
          return (
            <div key={tx.hash} className="flex justify-between items-center bg-gray-900/30 p-3 rounded border border-blue-900/20">
              <div className="flex items-center">
                {type === 'received' ? (
                  <div className="bg-green-900/30 rounded-full p-2 mr-3">
                    <ArrowDownRight className="w-5 h-5 text-green-400" />
                  </div>
                ) : type === 'sent' ? (
                  <div className="bg-orange-900/30 rounded-full p-2 mr-3">
                    <ArrowUpRight className="w-5 h-5 text-orange-400" />
                  </div>
                ) : (
                  <div className="bg-blue-900/30 rounded-full p-2 mr-3">
                    <ArrowUpRight className="w-5 h-5 text-blue-400" />
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-300">
                    {type === 'received' ? 'Received' : type === 'sent' ? 'Sent' : 'Self Transfer'}
                  </p>
                  <div className="flex items-center">
                    <p className="text-xs text-gray-500">
                      {type === 'received' 
                        ? `From ${shortenAddress(tx.from)}` 
                        : type === 'sent' 
                          ? `To ${shortenAddress(tx.to)}`
                          : 'Self Transfer'
                      }
                    </p>
                    <div className="mx-2 text-gray-600">•</div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTimeAgo(new Date(tx.timestamp))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${
                  type === 'received' 
                    ? 'text-green-400' 
                    : type === 'sent' 
                      ? 'text-orange-400'
                      : 'text-blue-400'
                }`}>
                  {type === 'received' ? '+' : type === 'sent' ? '-' : ''}
                  {formatCryptoAmount(tx.amount)}
                </p>
                <p className="text-xs text-gray-500">
                  Hash: {shortenAddress(tx.hash)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Normal card view for transactions
  return (
    <Card className="bg-black/70 border-blue-900/50">
      <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
        <CardTitle className="text-blue-300">Transaction History</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Only show the last 5 transactions in normal view */}
          {transactions.slice(0, 5).map((tx: any) => {
            const type = getTransactionType(tx, activeWallet);
            
            return (
              <div key={tx.hash} className="flex justify-between items-center bg-gray-900/30 p-3 rounded">
                <div className="flex items-center">
                  {type === 'received' ? (
                    <div className="bg-green-900/30 rounded-full p-2 mr-3">
                      <ArrowDownRight className="w-5 h-5 text-green-400" />
                    </div>
                  ) : type === 'sent' ? (
                    <div className="bg-orange-900/30 rounded-full p-2 mr-3">
                      <ArrowUpRight className="w-5 h-5 text-orange-400" />
                    </div>
                  ) : (
                    <div className="bg-blue-900/30 rounded-full p-2 mr-3">
                      <ArrowUpRight className="w-5 h-5 text-blue-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-300">
                      {type === 'received' ? 'Received' : type === 'sent' ? 'Sent' : 'Self Transfer'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {type === 'received' 
                        ? `From ${shortenAddress(tx.from)}` 
                        : type === 'sent' 
                          ? `To ${shortenAddress(tx.to)}`
                          : 'Self Transfer'
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${
                    type === 'received' 
                      ? 'text-green-400' 
                      : type === 'sent' 
                        ? 'text-orange-400'
                        : 'text-blue-400'
                  }`}>
                    {type === 'received' ? '+' : type === 'sent' ? '-' : ''}
                    {formatCryptoAmount(tx.amount)}
                  </p>
                  <div className="flex items-center justify-end text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTimeAgo(new Date(tx.timestamp))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="border-t border-blue-900/30 bg-blue-900/10 py-4">
        <Link href="/transactions">
          <Button 
            variant="outline" 
            className="w-full border-blue-900/50 text-blue-300"
          >
            View All Transactions
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}