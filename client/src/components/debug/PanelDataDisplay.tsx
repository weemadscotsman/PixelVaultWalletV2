import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PanelData {
  timestamp: string;
  panelName: string;
  dataType: string;
  data: any;
  status: 'loading' | 'success' | 'error';
}

interface PanelDataDisplayProps {
  title: string;
  className?: string;
}

export function PanelDataDisplay({ title, className = "" }: PanelDataDisplayProps) {
  const [panelData, setPanelData] = useState<PanelData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    // Track all panel data updates
    const trackPanelData = (panelName: string, dataType: string, data: any, status: 'loading' | 'success' | 'error') => {
      const newEntry: PanelData = {
        timestamp: new Date().toISOString(),
        panelName,
        dataType,
        data,
        status
      };

      setPanelData(prev => {
        const updated = [...prev, newEntry];
        return updated.slice(-100); // Keep last 100 entries
      });
      setLastUpdate(new Date().toLocaleTimeString());
    };

    // Expose global function for panels to use
    (window as any).trackPanelData = trackPanelData;

    // Clean up
    return () => {
      delete (window as any).trackPanelData;
    };
  }, []);

  const getStatusColor = (status: PanelData['status']) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'loading': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getDataTypeColor = (dataType: string) => {
    switch (dataType.toLowerCase()) {
      case 'wallet': return 'bg-orange-500';
      case 'blockchain': return 'bg-green-600';
      case 'mining': return 'bg-yellow-600';
      case 'staking': return 'bg-blue-600';
      case 'governance': return 'bg-purple-600';
      case 'transaction': return 'bg-indigo-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{title}</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">{panelData.length} updates</Badge>
            {lastUpdate && (
              <Badge variant="outline" className="text-xs">
                Last: {lastUpdate}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-48">
          <div className="p-4 space-y-1">
            {panelData.length === 0 ? (
              <div className="text-center text-gray-500 text-xs py-4">
                No panel data yet
              </div>
            ) : (
              panelData.slice(-10).reverse().map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded text-xs bg-gray-50 border"
                >
                  <Badge className={`${getStatusColor(entry.status)} text-white text-xs px-1 py-0`}>
                    {entry.status.toUpperCase()}
                  </Badge>
                  <Badge className={`${getDataTypeColor(entry.dataType)} text-white text-xs px-1 py-0`}>
                    {entry.dataType}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-600 truncate">
                      {entry.panelName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-xs text-gray-700 max-w-20 truncate">
                    {typeof entry.data === 'object' ? 
                      `${Object.keys(entry.data).length} fields` : 
                      String(entry.data).slice(0, 20)
                    }
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}