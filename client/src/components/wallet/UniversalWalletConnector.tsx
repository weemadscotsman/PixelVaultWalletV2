import React, { useState } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Plus, Import, Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UniversalWalletConnectorProps {
  compact?: boolean;
  showBalance?: boolean;
}

export function UniversalWalletConnector({ compact = false, showBalance = true }: UniversalWalletConnectorProps) {
  const { 
    activeWallet, 
    wallet, 
    createWalletMutation, 
    importWalletMutation,
    getWallet
  } = useWallet();
  
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  
  // Form states
  const [createPassphrase, setCreatePassphrase] = useState('');
  const [importPrivateKey, setImportPrivateKey] = useState('');
  const [importPassphrase, setImportPassphrase] = useState('');
  const [loginAddress, setLoginAddress] = useState('');
  const [loginPassphrase, setLoginPassphrase] = useState('');

  const { data: walletData, isLoading: isLoadingWallet } = getWallet();

  const handleCreateWallet = async () => {
    if (!createPassphrase.trim()) {
      toast({
        title: "Passphrase required",
        description: "Please enter a passphrase to secure your wallet",
        variant: "destructive"
      });
      return;
    }

    try {
      await createWalletMutation.mutateAsync({ passphrase: createPassphrase });
      setCreatePassphrase('');
      setIsOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleImportWallet = async () => {
    if (!importPrivateKey.trim() || !importPassphrase.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both private key and passphrase",
        variant: "destructive"
      });
      return;
    }

    try {
      await importWalletMutation.mutateAsync({ 
        privateKey: importPrivateKey, 
        passphrase: importPassphrase 
      });
      setImportPrivateKey('');
      setImportPassphrase('');
      setIsOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleLoginWallet = async () => {
    if (!loginAddress.trim() || !loginPassphrase.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both wallet address and passphrase",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: loginAddress,
          passphrase: loginPassphrase
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const { sessionToken, wallet } = await response.json();
      
      // Store session token in localStorage
      localStorage.setItem('pvx_session_token', sessionToken);
      localStorage.setItem('pvx_wallet_address', wallet.address);
      
      toast({
        title: "Success",
        description: `Connected to wallet ${wallet.address.slice(0, 8)}...`,
      });
      
      setLoginAddress('');
      setLoginPassphrase('');
      setIsOpen(false);
      
      // Trigger wallet data refresh without full page reload
      window.dispatchEvent(new CustomEvent('wallet-connected', { 
        detail: { sessionToken, wallet } 
      }));
      
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid wallet address or passphrase",
        variant: "destructive"
      });
    }
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    } else {
      return num.toFixed(6);
    }
  };

  // Connected state
  if (activeWallet && wallet) {
    return (
      <Card className={`bg-black/70 border-blue-900/50 ${compact ? 'p-2' : ''}`}>
        <CardContent className={compact ? 'p-3' : 'p-4'}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/20 p-2 rounded-full">
                <Wallet className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Connected Wallet</p>
                <p className="text-sm font-mono text-blue-300">
                  {activeWallet.slice(0, 6)}...{activeWallet.slice(-4)}
                </p>
                {showBalance && (
                  <p className="text-xs text-green-400">
                    {isLoadingWallet ? (
                      <Loader2 className="h-3 w-3 animate-spin inline" />
                    ) : (
                      `${formatBalance(wallet.balance)} PVX`
                    )}
                  </p>
                )}
              </div>
            </div>
            <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
              LIVE
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Disconnected state
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="bg-black/70 border-orange-900/50 cursor-pointer hover:border-orange-600/50 transition-colors">
          <CardContent className={compact ? 'p-3' : 'p-4'}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500/20 p-2 rounded-full">
                  <Wallet className="h-4 w-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Wallet Status</p>
                  <p className="text-sm text-orange-400">Not Connected</p>
                  <p className="text-xs text-gray-500">Click to connect</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-orange-600 text-orange-400">
                Connect
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="bg-gray-900 border-blue-900/50 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-400" />
            Connect Wallet
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="login" className="text-gray-300">Connect</TabsTrigger>
            <TabsTrigger value="create" className="text-gray-300">Create New</TabsTrigger>
            <TabsTrigger value="import" className="text-gray-300">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-address" className="text-gray-300">
                Wallet Address
              </Label>
              <Input
                id="login-address"
                type="text"
                placeholder="Enter your wallet address (e.g., PVX_...)"
                value={loginAddress}
                onChange={(e) => setLoginAddress(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="login-passphrase" className="text-gray-300">
                Passphrase
              </Label>
              <Input
                id="login-passphrase"
                type="password"
                placeholder="Enter your wallet passphrase"
                value={loginPassphrase}
                onChange={(e) => setLoginPassphrase(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-400">
                Enter the passphrase you used when creating this wallet
              </p>
            </div>
            
            <Button 
              onClick={handleLoginWallet}
              disabled={!loginAddress.trim() || !loginPassphrase.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-passphrase" className="text-gray-300">
                Wallet Passphrase
              </Label>
              <Input
                id="create-passphrase"
                type="password"
                placeholder="Enter a secure passphrase"
                value={createPassphrase}
                onChange={(e) => setCreatePassphrase(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-400">
                This passphrase will be used to encrypt your wallet
              </p>
            </div>
            
            <Button 
              onClick={handleCreateWallet}
              disabled={createWalletMutation.isPending || !createPassphrase.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {createWalletMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Wallet
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-key" className="text-gray-300">
                Private Key
              </Label>
              <div className="relative">
                <Input
                  id="import-key"
                  type={showPrivateKey ? "text" : "password"}
                  placeholder="Enter your private key"
                  value={importPrivateKey}
                  onChange={(e) => setImportPrivateKey(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                >
                  {showPrivateKey ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="import-passphrase" className="text-gray-300">
                Passphrase
              </Label>
              <Input
                id="import-passphrase"
                type="password"
                placeholder="Enter your passphrase"
                value={importPassphrase}
                onChange={(e) => setImportPassphrase(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            <Button 
              onClick={handleImportWallet}
              disabled={importWalletMutation.isPending || !importPrivateKey.trim() || !importPassphrase.trim()}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {importWalletMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Import className="h-4 w-4 mr-2" />
                  Import Wallet
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-3 bg-blue-900/20 rounded border border-blue-800/30">
          <p className="text-xs text-blue-300 font-medium">Universal Access</p>
          <p className="text-xs text-gray-400 mt-1">
            Connecting your wallet provides access to all PVX services: Mining, Staking, Governance, Drops, Badges, UTR Log, and Learning Modules.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}