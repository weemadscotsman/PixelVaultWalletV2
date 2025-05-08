import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { TransactionFlowVisualizer } from '@/components/visualization/TransactionFlowVisualizer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ActivityIcon, RefreshCw, Zap } from 'lucide-react';

export default function TransactionVisualizerPage() {
  return (
    <DashboardLayout>
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
          <div className="lg:col-span-3">
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
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Transaction statistics cards could be added here in the future */}
        </div>
      </div>
    </DashboardLayout>
  );
}