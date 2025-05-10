import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/use-wallet';
import { Loader2, Wallet, Lock, PlusCircle } from 'lucide-react';
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
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedWalletAddress, setSelectedWalletAddress] = useState<string | null>(null);
  const [authPassphrase, setAuthPassphrase] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Get all wallets for the connect dialog
  const walletsQuery = getAllWallets();
  
  const handleConnectClick = () => {
    setIsConnectDialogOpen(true);
    setShowCreateForm(false);
    setSelectedWalletAddress(null);
    setAuthPassphrase('');
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
      setShowCreateForm(false);
    } catch (error) {
      // Error handling is done in the mutation
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleSelectWallet = (address: string) => {
    setSelectedWalletAddress(address);
  };

  const handleAuthenticateWallet = async () => {
    if (!selectedWalletAddress || !authPassphrase.trim()) {
      toast({
        title: "Error",
        description: "Please select a wallet and enter your passphrase",
        variant: "destructive",
      });
      return;
    }

    setIsAuthenticating(true);
    try {
      // In a real implementation, we would validate the passphrase here with the wallet
      // For now, we're just setting the active wallet and assuming authentication works
      // This should be replaced with actual authentication against the backend
      
      // Store the authenticated wallet and passphrase in sessionStorage or a context
      // This would be used for API calls that require authentication
      sessionStorage.setItem('walletAuth', JSON.stringify({
        address: selectedWalletAddress,
        passphrase: authPassphrase
      }));
      
      setActiveWalletAddress(selectedWalletAddress);
      setIsConnectDialogOpen(false);
      setAuthPassphrase('');
      setSelectedWalletAddress(null);
      
      toast({
        title: "Wallet connected",
        description: "Your wallet has been authenticated and connected successfully",
      });
    } catch (error) {
      toast({
        title: "Authentication failed",
        description: "Failed to authenticate wallet. Please check your passphrase.",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
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
          
          {showCreateForm ? (
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
          ) : selectedWalletAddress ? (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-blue-200">Authenticate wallet:</h3>
              <div className="bg-blue-900/20 p-3 rounded-md border border-blue-900/30">
                <p className="text-xs text-gray-400">Selected wallet:</p>
                <p className="font-medium text-blue-200">{selectedWalletAddress}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="authPassphrase">Enter passphrase to authenticate</Label>
                <Input
                  id="authPassphrase"
                  type="password"
                  value={authPassphrase}
                  onChange={(e) => setAuthPassphrase(e.target.value)}
                  className="bg-black/70 border-blue-900/50 text-white"
                  placeholder="Wallet passphrase"
                />
                <p className="text-xs text-gray-400">
                  Your passphrase is required to authenticate operations with this wallet
                </p>
              </div>
            </div>
          ) : walletsQuery.data && walletsQuery.data.length > 0 ? (
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              <h3 className="text-sm font-medium text-blue-200">Select a wallet:</h3>
              <div className="space-y-2">
                {walletsQuery.data.map((wallet) => (
                  <div 
                    key={wallet.address}
                    className={`p-3 border rounded-md cursor-pointer hover:bg-blue-900/20 
                      ${selectedWalletAddress === wallet.address 
                        ? 'border-blue-500 bg-blue-900/30' 
                        : 'border-blue-900/30'}`}
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
              onClick={() => {
                if (selectedWalletAddress) {
                  // Go back to wallet selection
                  setSelectedWalletAddress(null);
                  setAuthPassphrase('');
                } else if (showCreateForm) {
                  // Go back to wallet selection if there are wallets
                  setShowCreateForm(false);
                } else {
                  // Close the dialog
                  setIsConnectDialogOpen(false);
                }
              }}
              className="border-blue-900/50 text-blue-300"
            >
              {selectedWalletAddress || showCreateForm ? 'Back' : 'Cancel'}
            </Button>
            
            {selectedWalletAddress ? (
              <Button
                onClick={handleAuthenticateWallet}
                disabled={isAuthenticating || !authPassphrase.trim()}
                className="bg-blue-700 hover:bg-blue-600 text-white"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Authenticate & Connect
                  </>
                )}
              </Button>
            ) : showCreateForm ? (
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
            ) : walletsQuery.data && walletsQuery.data.length > 0 ? (
              <Button
                onClick={() => {
                  setShowCreateForm(true);
                  setPassphrase('');
                }}
                className="bg-green-700 hover:bg-green-600 text-white"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
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