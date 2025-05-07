import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldAlert,
  BarChart4, 
  History,
  Send,
  QrCode,
  Coins,
  Copy,
  TrendingUp
} from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WalletCard } from '@/components/wallet/WalletCard';
import { TransactionsList } from '@/components/wallet/TransactionsList';
import { CreateWalletForm } from '@/components/wallet/CreateWalletForm';
import { ImportWalletForm } from '@/components/wallet/ImportWalletForm';
import { SendTransactionForm } from '@/components/wallet/SendTransactionForm';
import { ReceiveAddressCard } from '@/components/wallet/ReceiveAddressCard';
import { ExportWalletKeys } from '@/components/wallet/ExportWalletKeys';
import { StakingCard } from '@/components/wallet/StakingCard';
import { formatCryptoAmount } from '@/lib/utils';

export default function WalletPage() {
  const { activeWallet, wallet, setActiveWalletAddress } = useWallet();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(activeWallet ? 'overview' : 'create');
  
  // Check for hash in URL for direct tab navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash && ['overview', 'send', 'receive', 'transactions', 'staking', 'security'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    
    // Check on mount and when hash changes
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header section with wallet info/status */}
        <div className="bg-black/70 border border-blue-900/50 p-4 rounded-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-blue-300 text-shadow-neon flex items-center">
                <Wallet className="mr-2 h-6 w-6" /> 
                PVX Wallet
              </h2>
              {activeWallet && (
                <div className="mt-1">
                  <p className="text-xs text-gray-400 flex items-center">
                    Address: <span className="font-mono ml-1 text-gray-300">{activeWallet}</span>
                    <Button 
                      variant="ghost" 
                      className="h-6 w-6 p-0 ml-1 text-blue-400"
                      onClick={() => {
                        navigator.clipboard.writeText(activeWallet);
                        toast({
                          title: "Address copied",
                          description: "Wallet address copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </p>
                </div>
              )}
            </div>
            
            {activeWallet && wallet ? (
              <div className="flex items-center gap-4">
                <div className="bg-blue-900/20 border border-blue-900/40 rounded-lg px-4 py-2">
                  <p className="text-xs text-gray-400">Balance</p>
                  <p className="text-xl font-bold text-blue-300">{formatCryptoAmount(wallet.balance)} μPVX</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="bg-red-900/70 hover:bg-red-800/90 text-white h-10"
                  onClick={() => {
                    setActiveTab('create');
                    setActiveWalletAddress(null);
                    window.location.hash = '';
                  }}
                >
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  className="bg-blue-700 hover:bg-blue-600 text-white"
                  onClick={() => setActiveTab('create')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Wallet
                </Button>
                <Button
                  variant="outline"
                  className="border-blue-900/50 text-blue-300"
                  onClick={() => setActiveTab('import')}
                >
                  <ArrowDownRight className="h-4 w-4 mr-2" />
                  Import Wallet
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Main content based on wallet connection status */}
        {activeWallet ? (
          // Wallet Connected View
          <div className="space-y-6">
            {/* Tab Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-6 bg-black/70 border border-blue-900/50 mb-6">
                <TabsTrigger value="overview" onClick={() => window.location.hash = 'overview'} className="data-[state=active]:bg-blue-900/30">
                  <BarChart4 className="w-4 h-4 mr-2" /> Overview
                </TabsTrigger>
                <TabsTrigger value="send" onClick={() => window.location.hash = 'send'} className="data-[state=active]:bg-blue-900/30">
                  <Send className="w-4 h-4 mr-2" /> Send
                </TabsTrigger>
                <TabsTrigger value="receive" onClick={() => window.location.hash = 'receive'} className="data-[state=active]:bg-blue-900/30">
                  <QrCode className="w-4 h-4 mr-2" /> Receive
                </TabsTrigger>
                <TabsTrigger value="staking" onClick={() => window.location.hash = 'staking'} className="data-[state=active]:bg-blue-900/30">
                  <Coins className="w-4 h-4 mr-2" /> Staking
                </TabsTrigger>
                <TabsTrigger value="transactions" onClick={() => window.location.hash = 'transactions'} className="data-[state=active]:bg-blue-900/30">
                  <History className="w-4 h-4 mr-2" /> History
                </TabsTrigger>
                <TabsTrigger value="security" onClick={() => window.location.hash = 'security'} className="data-[state=active]:bg-blue-900/30">
                  <ShieldAlert className="w-4 h-4 mr-2" /> Security
                </TabsTrigger>
              </TabsList>
              
              {/* Overview Tab - Shows wallet summary, quick actions, and recent transactions */}
              <TabsContent value="overview" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Wallet Info */}
                  <div className="space-y-6">
                    {/* Wallet Card */}
                    <Card className="bg-black/70 border-blue-900/50">
                      <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
                        <CardTitle className="text-blue-300">
                          Wallet Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-400">Address</span>
                            <div className="flex items-center">
                              <span className="font-mono text-sm text-blue-300">{activeWallet}</span>
                              <Button 
                                variant="ghost" 
                                className="h-7 w-7 p-0 ml-1"
                                onClick={() => {
                                  navigator.clipboard.writeText(activeWallet);
                                  toast({
                                    title: "Address copied",
                                    description: "Wallet address copied to clipboard",
                                  });
                                }}
                              >
                                <Copy className="h-3.5 w-3.5 text-blue-400" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm text-gray-400">Balance</span>
                              <p className="text-xl font-bold text-blue-300">{formatCryptoAmount(wallet?.balance || '0')} μPVX</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-400">Last Activity</span>
                              <p className="text-gray-300">3 minutes ago</p>
                            </div>
                          </div>
                          
                          <div className="pt-4 flex gap-3">
                            <Button 
                              className="flex-1 bg-blue-700 hover:bg-blue-600 text-white"
                              onClick={() => setActiveTab('send')}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Send
                            </Button>
                            <Button 
                              variant="outline"
                              className="flex-1 border-blue-900/50 text-blue-300"
                              onClick={() => setActiveTab('receive')}
                            >
                              <QrCode className="mr-2 h-4 w-4" />
                              Receive
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Staking Summary */}
                    <Card className="bg-black/70 border-blue-900/50">
                      <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
                        <CardTitle className="text-blue-300">
                          <Coins className="inline-block mr-2 h-5 w-5" />
                          Staking Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <span className="text-sm text-gray-400">Total Staked</span>
                            <p className="text-xl font-bold text-blue-300">120.00K μPVX</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-400">Active Stakes</span>
                            <p className="text-xl font-bold text-blue-300">3</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-400">Staking Power</span>
                            <p className="text-xl font-bold text-blue-300">85%</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-400">Earned Rewards</span>
                            <p className="text-xl font-bold text-green-400">+3.25K μPVX</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button 
                            className="flex-1 bg-blue-700 hover:bg-blue-600 text-white"
                            onClick={() => setActiveTab('staking')}
                          >
                            <Coins className="mr-2 h-4 w-4" />
                            Manage Stakes
                          </Button>
                          <Button 
                            variant="outline"
                            className="flex-1 border-green-900/50 text-green-300"
                          >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Claim Rewards
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Right Column - Transactions */}
                  <div>
                    <Card className="bg-black/70 border-blue-900/50">
                      <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-blue-300">
                            <History className="inline-block mr-2 h-5 w-5" />
                            Recent Transactions
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-300 h-8"
                            onClick={() => setActiveTab('transactions')}
                          >
                            View All
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <TransactionsList />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              {/* Send Tab - Form to send PVX */}
              <TabsContent value="send" className="mt-0">
                <SendTransactionForm />
              </TabsContent>
              
              {/* Receive Tab - QR code and address display */}
              <TabsContent value="receive" className="mt-0">
                <ReceiveAddressCard />
              </TabsContent>
              
              {/* Staking Tab - Staking functionality */}
              <TabsContent value="staking" className="mt-0">
                <StakingCard />
              </TabsContent>
              
              {/* Transactions Tab - Full transactions list */}
              <TabsContent value="transactions" className="mt-0">
                <div className="bg-black/70 border-blue-900/50 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-blue-300 mb-4">Transaction History</h3>
                  <TransactionsList fullView={true} />
                </div>
              </TabsContent>
              
              {/* Security Tab - Export keys and other security features */}
              <TabsContent value="security" className="mt-0">
                <div className="bg-black/70 border-blue-900/50 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-blue-300 mb-4">Wallet Security</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-blue-300 font-semibold mb-2">Export Wallet Keys</h4>
                      <p className="text-gray-400 text-sm mb-4">
                        Export your private keys for backup and recovery. 
                        Never share your private keys with anyone.
                      </p>
                      {activeWallet && (
                        <ExportWalletKeys walletAddress={activeWallet} />
                      )}
                    </div>
                    <div>
                      <h4 className="text-blue-300 font-semibold mb-2">Privacy Settings</h4>
                      <p className="text-gray-400 text-sm mb-4">
                        Control privacy features for your transactions.
                        Enable zkSNARK privacy for enhanced security.
                      </p>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="zk-mode" className="text-gray-300">
                            Enable zkSNARK Privacy
                          </Label>
                          <Switch id="zk-mode" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="shield-balances" className="text-gray-300">
                            Shield Balance from Explorer
                          </Label>
                          <Switch id="shield-balances" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          // No Wallet Connected View
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-black/70 border border-blue-900/50 mb-6">
                <TabsTrigger value="create" className="data-[state=active]:bg-blue-900/30">
                  <Plus className="w-4 h-4 mr-2" /> Create New Wallet
                </TabsTrigger>
                <TabsTrigger value="import" className="data-[state=active]:bg-blue-900/30">
                  <ArrowDownRight className="w-4 h-4 mr-2" /> Import Existing Wallet
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="create" className="mt-0">
                <CreateWalletForm />
              </TabsContent>
              
              <TabsContent value="import" className="mt-0">
                <ImportWalletForm />
              </TabsContent>
            </Tabs>
            
            <div className="mt-8 bg-blue-900/10 border border-blue-900/30 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-blue-300 mb-2">PVX Wallet Security Information</h3>
              <p className="text-gray-400 mb-4">
                Your PVX wallet is secured using industry-leading zkSNARK cryptography. Here's what you need to know:
              </p>
              <ul className="space-y-2 text-gray-400 text-sm list-disc pl-5">
                <li>Your private keys are never sent to our servers and are secured locally</li>
                <li>All transactions are verified using zero-knowledge proofs for enhanced privacy</li>
                <li>Make sure to save your passphrase in a safe place - it cannot be recovered if lost</li>
                <li>The PVX wallet supports optional privacy mode for confidential transactions</li>
                <li>Your wallet balance is updated in real-time with network confirmations</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}