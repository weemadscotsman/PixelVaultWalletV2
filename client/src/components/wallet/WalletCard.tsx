import { useState } from 'react';
import { Wallet, Copy, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { shortenAddress, formatCryptoAmount } from '@/lib/utils';
import { useWallet } from '@/hooks/use-wallet';

export function WalletCard() {
  const { toast } = useToast();
  const { activeWallet, getWallet, setActiveWalletAddress } = useWallet();
  const [showFullAddress, setShowFullAddress] = useState(false);
  
  // Get wallet data for active wallet
  const { data: wallet, isLoading, error } = getWallet(activeWallet || undefined);

  // Handle disconnect wallet
  const handleDisconnect = () => {
    setActiveWalletAddress(null);
    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected successfully",
    });
  };

  // Copy address to clipboard
  const copyToClipboard = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  // Toggle address display
  const toggleAddressDisplay = () => {
    setShowFullAddress(!showFullAddress);
  };

  if (isLoading) {
    return (
      <Card className="bg-black/70 border-blue-900/50">
        <CardContent className="pt-6 pb-6 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </CardContent>
      </Card>
    );
  }

  if (error || !wallet) {
    return (
      <Card className="bg-black/70 border-blue-900/50">
        <CardContent className="pt-6 pb-6">
          <div className="text-center">
            <p className="text-red-400">Error loading wallet data</p>
            <p className="text-gray-400 text-sm mt-1">{error?.message || "Please try again later"}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/70 border-blue-900/50">
      <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
        <CardTitle className="text-blue-300">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Wallet className="h-5 w-5 mr-2" /> Active Wallet
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-400 hover:text-gray-300 hover:bg-transparent"
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-400">Current Balance</p>
            <p className="text-3xl font-bold text-blue-300 mt-1">
              {formatCryptoAmount(wallet.balance)}
            </p>
            <div className="w-full bg-blue-950/30 h-1 mt-2 rounded-full">
              <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full" style={{width: '72%'}}></div>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-400 mb-1">Wallet Address</p>
            <div className="flex items-center">
              <div 
                className="bg-gray-900/50 p-2 rounded flex-1 font-mono text-sm text-gray-300 cursor-pointer hover:bg-gray-900/70 transition-colors"
                onClick={toggleAddressDisplay}
              >
                {showFullAddress ? wallet.address : shortenAddress(wallet.address)}
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
              <p className="text-xl font-bold text-blue-300 mt-1">
                {formatCryptoAmount(wallet.balance)}
              </p>
            </div>
            <div className="bg-blue-950/20 p-4 rounded border border-blue-900/30">
              <p className="text-xs text-gray-400">Created At</p>
              <p className="text-sm font-medium text-blue-300 mt-1">
                {new Date(wallet.createdAt).toLocaleString()}
              </p>
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
  );
}