import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Copy,
  Clock
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Example wallet data
const walletData = {
  publicAddress: '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
  balance: 432914.832651,
  transactions: [
    { id: 1, type: 'receive', amount: 5000, from: '0x3a...4b2c', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
    { id: 2, type: 'send', amount: 2500, to: '0x8d...9f3e', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
    { id: 3, type: 'receive', amount: 10000, from: '0x5e...2a1d', timestamp: new Date(Date.now() - 1000 * 60 * 120) },
    { id: 4, type: 'send', amount: 7500, to: '0x4f...7a2e', timestamp: new Date(Date.now() - 1000 * 60 * 180) },
    { id: 5, type: 'receive', amount: 15000, from: '0x2b...9c5d', timestamp: new Date(Date.now() - 1000 * 60 * 240) },
  ]
};

export default function WalletPage() {
  const { toast } = useToast();
  
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M μPVX`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K μPVX`;
    } else {
      return `${value.toFixed(2)} μPVX`;
    }
  };
  
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletData.publicAddress);
    toast({
      title: "Address copied",
      description: "Wallet address copied to clipboard",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-300 text-shadow-neon">
            <Wallet className="inline-block mr-2 h-6 w-6" /> 
            PVX Wallet
          </h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Wallet Overview */}
          <Card className="bg-black/70 border-blue-900/50">
            <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
              <CardTitle className="text-blue-300">Wallet Overview</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-400">Current Balance</p>
                  <p className="text-3xl font-bold text-blue-300 mt-1">{formatCurrency(walletData.balance)}</p>
                  <div className="w-full bg-blue-950/30 h-1 mt-2 rounded-full">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full" style={{width: '72%'}}></div>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Wallet Address</p>
                  <div className="flex items-center">
                    <div className="bg-gray-900/50 p-2 rounded flex-1 font-mono text-sm text-gray-300">
                      {walletData.publicAddress}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="ml-2 border-blue-900/50"
                      onClick={copyToClipboard}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-950/20 p-4 rounded border border-blue-900/30">
                    <p className="text-xs text-gray-400">Available for Sending</p>
                    <p className="text-xl font-bold text-blue-300 mt-1">{formatCurrency(walletData.balance * 0.95)}</p>
                  </div>
                  <div className="bg-blue-950/20 p-4 rounded border border-blue-900/30">
                    <p className="text-xs text-gray-400">Staked Balance</p>
                    <p className="text-xl font-bold text-blue-300 mt-1">{formatCurrency(120000)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-blue-900/30 bg-blue-900/10 py-4">
              <div className="w-full grid grid-cols-2 gap-4">
                <Button className="bg-blue-700 hover:bg-blue-600 text-white">
                  Send PVX
                </Button>
                <Button variant="outline" className="border-blue-900/50 text-blue-300">
                  Receive PVX
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          {/* Transaction History */}
          <Card className="bg-black/70 border-blue-900/50">
            <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
              <CardTitle className="text-blue-300">Transaction History</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {walletData.transactions.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center bg-gray-900/30 p-3 rounded">
                    <div className="flex items-center">
                      {tx.type === 'receive' ? (
                        <div className="bg-green-900/30 rounded-full p-2 mr-3">
                          <ArrowDownRight className="w-5 h-5 text-green-400" />
                        </div>
                      ) : (
                        <div className="bg-orange-900/30 rounded-full p-2 mr-3">
                          <ArrowUpRight className="w-5 h-5 text-orange-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-300">{tx.type === 'receive' ? 'Received' : 'Sent'}</p>
                        <p className="text-xs text-gray-500">
                          {tx.type === 'receive' ? `From ${tx.from}` : `To ${tx.to}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${tx.type === 'receive' ? 'text-green-400' : 'text-orange-400'}`}>
                        {tx.type === 'receive' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <div className="flex items-center justify-end text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTimeAgo(tx.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t border-blue-900/30 bg-blue-900/10 py-4">
              <Button 
                variant="outline" 
                className="w-full border-blue-900/50 text-blue-300"
              >
                View All Transactions
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}