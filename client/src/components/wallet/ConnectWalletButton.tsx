import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/use-wallet';
import { Loader2, Wallet } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface ConnectWalletButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | null;
  size?: 'default' | 'sm' | 'lg' | 'icon' | null;
  className?: string;
  fullWidth?: boolean;
}

export function ConnectWalletButton({ 
  variant = 'default',
  size = 'default',
  className = '',
  fullWidth = false
}: ConnectWalletButtonProps) {
  const { wallet, isLoadingWallet, activeWallet, setActiveWalletAddress, createWalletMutation, getAllWallets } = useWallet();
  const { toast } = useToast();
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Get all wallets for the connect dialog
  const walletsQuery = getAllWallets();
  
  const handleConnectClick = () => {
    setIsConnectDialogOpen(true);
  };
  
  const handleDisconnectClick = () => {
    setActiveWalletAddress(null);
    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected",
    });
  };
  
  const handleCreateWallet = async () => {
    if (!passphrase.trim()) {
      toast({
        title: "Error",
        description: "Please enter a passphrase",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreating(true);
    try {
      await createWalletMutation.mutateAsync({ passphrase });
      setIsConnectDialogOpen(false);
      setPassphrase('');
    } catch (error) {
      // Error handling is done in the mutation
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleSelectWallet = (address: string) => {
    setActiveWalletAddress(address);
    setIsConnectDialogOpen(false);
    toast({
      title: "Wallet connected",
      description: "Your wallet has been connected successfully",
    });
  };
  
  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`${className} ${fullWidth ? 'w-full' : ''}`}
        onClick={activeWallet ? handleDisconnectClick : handleConnectClick}
        disabled={isLoadingWallet}
      >
        {isLoadingWallet ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : activeWallet ? (
          'Disconnect Wallet'
        ) : (
          <>
            <Wallet className="h-4 w-4 mr-2" />
            Connect Wallet
          </>
        )}
      </Button>
      
      <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-black border border-blue-900/50">
          <DialogHeader>
            <DialogTitle className="text-blue-300">Connect to PVX Wallet</DialogTitle>
            <DialogDescription>
              Connect to an existing wallet or create a new one
            </DialogDescription>
          </DialogHeader>
          
          {walletsQuery.data && walletsQuery.data.length > 0 ? (
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              <h3 className="text-sm font-medium text-blue-200">Select a wallet:</h3>
              <div className="space-y-2">
                {walletsQuery.data.map((wallet) => (
                  <div 
                    key={wallet.address}
                    className="p-3 border border-blue-900/30 rounded-md cursor-pointer hover:bg-blue-900/20"
                    onClick={() => handleSelectWallet(wallet.address)}
                  >
                    <p className="font-medium text-blue-200">{wallet.address}</p>
                    <p className="text-xs text-gray-400">Balance: {wallet.balance} μPVX</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-blue-200">Create a new wallet:</h3>
              <div className="space-y-2">
                <Label htmlFor="passphrase">Passphrase</Label>
                <Input
                  id="passphrase"
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="bg-black/70 border-blue-900/50 text-white"
                  placeholder="Enter a secure passphrase"
                />
                <p className="text-xs text-gray-400">
                  This passphrase will be used to encrypt your wallet. Make sure to remember it!
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConnectDialogOpen(false)}
              className="border-blue-900/50 text-blue-300"
            >
              Cancel
            </Button>
            {walletsQuery.data && walletsQuery.data.length > 0 ? (
              <Button
                onClick={() => {
                  setPassphrase('');
                  setIsConnectDialogOpen(false); // Close the dialog instead of removing the query
                }}
                className="bg-green-700 hover:bg-green-600 text-white"
              >
                Create New Wallet
              </Button>
            ) : (
              <Button
                onClick={handleCreateWallet}
                disabled={isCreating || !passphrase.trim()}
                className="bg-blue-700 hover:bg-blue-600 text-white"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Wallet'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}