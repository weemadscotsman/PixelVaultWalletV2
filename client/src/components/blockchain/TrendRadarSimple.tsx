import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, Shield, Cpu, Network, Loader2 } from 'lucide-react';

interface TrendRadarProps {
  className?: string;
}

export function TrendRadar({ className }: TrendRadarProps) {
  const { data: trends, isLoading } = useQuery({
    queryKey: ['/api/blockchain/trends'],
    retry: false,
    staleTime: 30000,
  });

  const metrics = [
    {
      id: 'mining',
      label: 'Mining Activity',
      icon: Activity,
      value: 85,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/20',
    },
    {
      id: 'network',
      label: 'Network Health', 
      icon: Network,
      value: 92,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/20',
    },
    {
      id: 'security',
      label: 'Security Score',
      icon: Shield,
      value: 97,
      color: 'text-green-400',
      bgColor: 'bg-green-400/20',
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: Cpu,
      value: 88,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/20',
    },
  ];

  return (
    <Card className={`bg-black/70 border-blue-900/50 overflow-hidden ${className}`}>
      <CardHeader className="border-b border-blue-900/30 bg-blue-900/10 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold text-blue-200 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Blockchain Trends
          </CardTitle>
          <Badge variant="outline" className="text-green-400 border-green-400/50">
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                        <Icon className={`h-4 w-4 ${metric.color}`} />
                      </div>
                      <span className="text-sm font-medium text-gray-200">
                        {metric.label}
                      </span>
                    </div>
                    <span className={`text-sm font-bold ${metric.color}`}>
                      {metric.value}%
                    </span>
                  </div>
                  <Progress
                    value={metric.value}
                    className="h-2"
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}