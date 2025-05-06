import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { LearningTerminal } from '@/components/learning/LearningTerminal';
import { useWallet } from '@/hooks/use-wallet';

export default function LearningPage() {
  const { wallet } = useWallet();
  
  return (
    <PageLayout isConnected={!!wallet}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
            Interactive Blockchain Learning
          </h1>
          <p className="text-sm text-gray-400">
            Learn how PVX blockchain works through hands-on mini-games and simulations
          </p>
        </div>
        
        <LearningTerminal />
      </div>
    </PageLayout>
  );
}