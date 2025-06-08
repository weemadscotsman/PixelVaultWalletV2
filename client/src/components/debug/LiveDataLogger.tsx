import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  category: string;
  message: string;
  data?: any;
}

export function LiveDataLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    // Intercept console logs and API responses
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog(...args);
      addLog('info', 'CONSOLE', args.join(' '));
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', 'ERROR', args.join(' '));
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warning', 'WARNING', args.join(' '));
    };

    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      const method = options?.method || 'GET';
      
      addLog('info', 'API', `${method} ${url} - STARTED`);
      
      try {
        const response = await originalFetch(...args);
        const status = response.status;
        const statusText = response.statusText;
        
        addLog(
          status >= 200 && status < 300 ? 'success' : 'error',
          'API',
          `${method} ${url} - ${status} ${statusText}`,
          { status, statusText, url, method }
        );
        
        return response;
      } catch (error) {
        addLog('error', 'API', `${method} ${url} - FAILED: ${error}`, { error, url, method });
        throw error;
      }
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      window.fetch = originalFetch;
    };
  }, []);

  const addLog = (level: LogEntry['level'], category: string, message: string, data?: any) => {
    const newLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data
    };

    setLogs(prev => {
      const updated = [...prev, newLog];
      // Keep only last 1000 logs
      return updated.slice(-1000);
    });
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.level === filter || log.category.toLowerCase().includes(filter.toLowerCase()));

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'API': return 'bg-purple-500';
      case 'WEBSOCKET': return 'bg-cyan-500';
      case 'BLOCKCHAIN': return 'bg-green-600';
      case 'WALLET': return 'bg-orange-500';
      case 'MINING': return 'bg-yellow-600';
      case 'STAKING': return 'bg-blue-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Live System Logger</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">{filteredLogs.length} entries</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAutoScroll(!isAutoScroll)}
              className={isAutoScroll ? 'bg-green-100' : ''}
            >
              Auto-scroll: {isAutoScroll ? 'ON' : 'OFF'}
            </Button>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              Clear
            </Button>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'success', 'error', 'warning', 'info', 'api', 'websocket', 'blockchain'].map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className="text-xs"
            >
              {f.toUpperCase()}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="p-4 space-y-2">
            {filteredLogs.map((log, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 border text-sm"
              >
                <Badge className={`${getLevelColor(log.level)} text-white text-xs px-1 py-0`}>
                  {log.level.toUpperCase()}
                </Badge>
                <Badge className={`${getCategoryColor(log.category)} text-white text-xs px-1 py-0`}>
                  {log.category}
                </Badge>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="font-mono text-xs break-all">
                    {log.message}
                  </div>
                  {log.data && (
                    <details className="mt-1">
                      <summary className="text-xs text-blue-600 cursor-pointer">Data</summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}