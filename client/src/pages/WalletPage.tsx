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
  Coins
} from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletCard } from '@/components/wallet/WalletCard';
import { TransactionsList } from '@/components/wallet/TransactionsList';
import { CreateWalletForm } from '@/components/wallet/CreateWalletForm';
import { ImportWalletForm } from '@/components/wallet/ImportWalletForm';
import { SendTransactionForm } from '@/components/wallet/SendTransactionForm';
import { ReceiveAddressCard } from '@/components/wallet/ReceiveAddressCard';
import { formatCryptoAmount } from '@/lib/utils';

export default function WalletPage() {
  const { activeWallet, wallet, setActiveWalletAddress } = useWallet();
  const [activeTab, setActiveTab] = useState(activeWallet ? 'overview' : 'create');
  
  // Check for hash in URL for direct tab navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash && ['overview', 'send', 'receive', 'transactions', 'security'].includes(hash)) {
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
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-300 text-shadow-neon">
            <Wallet className="inline-block mr-2 h-6 w-6" /> 
            PVX Wallet
          </h2>
          
          {activeWallet && wallet && (
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <p className="text-sm text-gray-400">Balance</p>
                <p className="text-xl font-bold text-blue-300">
                  {formatCryptoAmount(wallet.balance)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-900/30 rounded-full flex items-center justify-center">
                <Coins className="h-6 w-6 text-blue-300" />
              </div>
            </div>
          )}
        </div>
        
        {activeWallet ? (
          // Wallet Connected View
          <div className="space-y-6">
            {/* Tab Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-5 bg-black/70 border border-blue-900/50 mb-6">
                <TabsTrigger value="overview" onClick={() => window.location.hash = 'overview'} className="data-[state=active]:bg-blue-900/30">
                  <BarChart4 className="w-4 h-4 mr-2" /> Overview
                </TabsTrigger>
                <TabsTrigger value="send" onClick={() => window.location.hash = 'send'} className="data-[state=active]:bg-blue-900/30">
                  <Send className="w-4 h-4 mr-2" /> Send
                </TabsTrigger>
                <TabsTrigger value="receive" onClick={() => window.location.hash = 'receive'} className="data-[state=active]:bg-blue-900/30">
                  <QrCode className="w-4 h-4 mr-2" /> Receive
                </TabsTrigger>
                <TabsTrigger value="transactions" onClick={() => window.location.hash = 'transactions'} className="data-[state=active]:bg-blue-900/30">
                  <History className="w-4 h-4 mr-2" /> History
                </TabsTrigger>
                <TabsTrigger value="security" onClick={() => window.location.hash = 'security'} className="data-[state=active]:bg-blue-900/30">
                  <ShieldAlert className="w-4 h-4 mr-2" /> Security
                </TabsTrigger>
              </TabsList>
              
              {/* Overview Tab - Shows wallet card and transactions */}
              <TabsContent value="overview" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <WalletCard />
                  <TransactionsList />
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
                        <div className="flex items-center space-x-2">
                          <Button
                            className="bg-blue-700 hover:bg-blue-600 text-white"
                            onClick={() => window.location.hash = '#export'}
                          >
                            <ShieldAlert className="h-4 w-4 mr-2" />
                            Export Keys
                          </Button>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-blue-300 font-semibold mb-2">Disconnect Wallet</h4>
                      <p className="text-gray-400 text-sm mb-4">
                        Disconnect your current wallet from this session. 
                        Your wallet will remain in the system, but you'll need to reconnect it.
                      </p>
                      <Button 
                        variant="destructive" 
                        className="bg-red-900 hover:bg-red-800 text-white"
                        onClick={() => {
                          setActiveTab('create');
                          setActiveWalletAddress(null);
                          window.location.hash = '';
                        }}
                      >
                        <ShieldAlert className="h-4 w-4 mr-2" />
                        Disconnect Wallet
                      </Button>
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