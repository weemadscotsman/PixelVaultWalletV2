import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/use-wallet';
import { Loader2, Wallet, Plus, Key } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("connect");
  
  // Get all wallets for the connect dialog
  const walletsQuery = getAllWallets();
  
  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isConnectDialogOpen) {
      setPassphrase('');
      setSelectedWallet(null);
      setIsConnecting(false);
      setIsCreating(false);
    }
  }, [isConnectDialogOpen]);
  
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
      
      // Show a success message with more details
      toast({
        title: "Wallet created and connected",
        description: "Your wallet was successfully created and is now connected to all PVX services",
      });
    } catch (error) {
      // Error handling is done in the mutation
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleSelectWallet = (address: string) => {
    setSelectedWallet(address);
  };
  
  const handleConnectWallet = async () => {
    if (!selectedWallet) {
      toast({
        title: "Error",
        description: "Please select a wallet",
        variant: "destructive",
      });
      return;
    }
    
    if (!passphrase.trim()) {
      toast({
        title: "Error",
        description: "Please enter your wallet passphrase",
        variant: "destructive",
      });
      return;
    }
    
    setIsConnecting(true);
    try {
      // Make a wallet authentication request to establish a session
      const response = await fetch(`/api/wallet/${selectedWallet}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ passphrase: passphrase }),
        credentials: 'include' // Important: This ensures cookies are sent
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Authentication failed');
      }
      
      // If authentication succeeded, set the active wallet
      setActiveWalletAddress(selectedWallet);
      setIsConnectDialogOpen(false);
      setPassphrase('');
      
      toast({
        title: "Wallet connected to all services",
        description: "Your wallet is now connected to all PVX blockchain features",
      });
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message || "Could not authenticate wallet session",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
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
          <>
            <Wallet className="h-4 w-4 mr-2" />
            {activeWallet.slice(0, 8)}...
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4 mr-2" />
            Connect Wallet
          </>
        )}
      </Button>
      
      <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-black border border-blue-900/50">
          <DialogHeader>
            <DialogTitle className="text-blue-300">PVX Blockchain Platform</DialogTitle>
            <DialogDescription>
              Connect your wallet to access all blockchain features
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="connect" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-blue-950/30">
              <TabsTrigger value="connect" className="data-[state=active]:bg-blue-800/30">
                Connect Existing
              </TabsTrigger>
              <TabsTrigger value="create" className="data-[state=active]:bg-blue-800/30">
                Create New
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="connect" className="p-4 border border-blue-900/20 rounded-md mt-4">
              {walletsQuery.isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                </div>
              ) : walletsQuery.data && walletsQuery.data.length > 0 ? (
                <>
                  <div className="space-y-4 max-h-[200px] overflow-y-auto mb-4">
                    <h3 className="text-sm font-medium text-blue-200">Select your wallet:</h3>
                    <div className="space-y-2">
                      {walletsQuery.data.map((wallet) => (
                        <div 
                          key={wallet.address}
                          className={`p-3 border rounded-md cursor-pointer transition-colors
                            ${selectedWallet === wallet.address 
                              ? 'border-blue-500 bg-blue-900/30' 
                              : 'border-blue-900/30 hover:bg-blue-900/20'}`}
                          onClick={() => handleSelectWallet(wallet.address)}
                        >
                          <p className="font-medium text-blue-200">{wallet.address}</p>
                          <p className="text-xs text-gray-400">Balance: {wallet.balance} μPVX</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {selectedWallet && (
                    <div className="space-y-3 my-4">
                      <Label htmlFor="connect-passphrase">Enter Passphrase</Label>
                      <Input
                        id="connect-passphrase"
                        type="password"
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        className="bg-black/70 border-blue-900/50 text-white"
                        placeholder="Wallet passphrase"
                      />
                      <p className="text-xs text-gray-400">
                        Your passphrase unlocks access to all PVX blockchain features
                      </p>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleConnectWallet}
                    disabled={isConnecting || !selectedWallet || !passphrase.trim()}
                    className="w-full bg-blue-700 hover:bg-blue-600 text-white mt-2"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-2" />
                        Connect & Unlock All Features
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="py-8 text-center space-y-4">
                  <p className="text-gray-400">No wallets found</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("create")}
                    className="border-blue-900/50 text-blue-300"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Wallet
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="create" className="p-4 border border-blue-900/20 rounded-md mt-4">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-blue-200">Create a new PVX wallet:</h3>
                <div className="space-y-3">
                  <Label htmlFor="create-passphrase">Set Wallet Passphrase</Label>
                  <Input
                    id="create-passphrase"
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="bg-black/70 border-blue-900/50 text-white"
                    placeholder="Enter a secure passphrase"
                  />
                  <p className="text-xs text-gray-400">
                    This passphrase will be used to secure your wallet. You'll need it to access all PVX features.
                  </p>
                </div>
                
                <Button
                  onClick={handleCreateWallet}
                  disabled={isCreating || !passphrase.trim()}
                  className="w-full bg-green-700 hover:bg-green-600 text-white mt-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create & Connect Wallet
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConnectDialogOpen(false)}
              className="border-blue-900/50 text-blue-300"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}