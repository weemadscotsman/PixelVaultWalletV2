import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Wallet, Plus } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletCard } from '@/components/wallet/WalletCard';
import { TransactionsList } from '@/components/wallet/TransactionsList';
import { CreateWalletForm } from '@/components/wallet/CreateWalletForm';

export default function WalletPage() {
  const { activeWallet } = useWallet();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-300 text-shadow-neon">
            <Wallet className="inline-block mr-2 h-6 w-6" /> 
            PVX Wallet
          </h2>
        </div>
        
        {activeWallet ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Wallet Card */}
            <WalletCard />
            
            {/* Transaction History */}
            <TransactionsList />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-black/70 border border-blue-900/50 mb-6">
                <TabsTrigger value="create" className="data-[state=active]:bg-blue-900/30">
                  <Plus className="w-4 h-4 mr-2" /> Create New Wallet
                </TabsTrigger>
                <TabsTrigger value="import" className="data-[state=active]:bg-blue-900/30">
                  Import Existing Wallet
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="create" className="mt-0">
                <CreateWalletForm />
              </TabsContent>
              
              <TabsContent value="import" className="mt-0">
                <div className="bg-black/70 border-blue-900/50 p-8 rounded-lg text-center">
                  <h3 className="text-xl font-bold text-blue-300 mb-4">Import Wallet</h3>
                  <p className="text-gray-400 mb-6">
                    Import functionality will be available in the next update. For now, please create a new wallet.
                  </p>
                  <Button className="bg-blue-700 hover:bg-blue-600 text-white">
                    Create New Wallet Instead
                  </Button>
                </div>
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