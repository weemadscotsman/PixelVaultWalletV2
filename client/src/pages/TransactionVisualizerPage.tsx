import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { TransactionVisualizer } from '@/components/visualization/TransactionVisualizer';
import { TransactionFlowVisualizer } from '@/components/visualization/TransactionFlowVisualizer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ActivityIcon, RefreshCw, Zap, LineChart, Blocks, Landmark } from 'lucide-react';

export default function TransactionVisualizerPage() {
  return (
    <PageLayout isConnected={true}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-300 text-shadow-neon">
            <ActivityIcon className="inline-block mr-2 h-6 w-6" /> 
            PVX Blockchain Real-Time Visualizer
          </h2>
          <div className="flex items-center text-xs text-green-300">
            <Zap className="h-4 w-4 mr-1 animate-pulse" />
            <span className="mr-1">Live</span>
            <span className="px-1.5 py-0.5 rounded bg-green-900/30 border border-green-600/30">WebSocket Connected</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-black/70 border-blue-900/50 h-[500px]">
              <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
                <CardTitle className="text-blue-300 flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Real-Time Transaction Flow
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-4rem)]">
                <TransactionFlowVisualizer
                  transactions={[]} // The component will use WebSocket for real-time data
                  maxDisplay={8} 
                  animationSpeed={1.5}
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1 h-[500px]">
            <TransactionVisualizer limit={12} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-black/70 border-blue-900/50">
            <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
              <CardTitle className="text-blue-300 text-sm flex items-center">
                <LineChart className="h-4 w-4 mr-2" />
                Transaction Volume
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 h-[120px] flex items-center justify-center">
              <div className="text-blue-500/40 text-sm">Transaction metrics coming soon</div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/70 border-blue-900/50">
            <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
              <CardTitle className="text-blue-300 text-sm flex items-center">
                <Blocks className="h-4 w-4 mr-2" />
                Block Production
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 h-[120px] flex items-center justify-center">
              <div className="text-blue-500/40 text-sm">Block metrics coming soon</div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/70 border-blue-900/50">
            <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
              <CardTitle className="text-blue-300 text-sm flex items-center">
                <Landmark className="h-4 w-4 mr-2" />
                Network Economics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 h-[120px] flex items-center justify-center">
              <div className="text-blue-500/40 text-sm">Economic metrics coming soon</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}