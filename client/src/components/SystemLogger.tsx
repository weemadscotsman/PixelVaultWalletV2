import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, Network, Server, Zap, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface SystemLog {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'success';
  category: 'API' | 'AUTH' | 'BLOCKCHAIN' | 'DATABASE' | 'WEBSOCKET' | 'MINING' | 'STAKING' | 'SYSTEM';
  message: string;
  details?: any;
  endpoint?: string;
  duration?: number;
  status?: number;
}

class SystemLogManager {
  private static instance: SystemLogManager;
  private logs: SystemLog[] = [];
  private listeners: ((logs: SystemLog[]) => void)[] = [];
  private maxLogs = 1000;

  static getInstance(): SystemLogManager {
    if (!SystemLogManager.instance) {
      SystemLogManager.instance = new SystemLogManager();
    }
    return SystemLogManager.instance;
  }

  addLog(log: Omit<SystemLog, 'id' | 'timestamp'>) {
    const newLog: SystemLog = {
      ...log,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    this.logs.unshift(newLog);
    
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    this.listeners.forEach(listener => listener(this.logs));
  }

  getLogs(): SystemLog[] {
    return [...this.logs];
  }

  subscribe(listener: (logs: SystemLog[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  clearLogs() {
    this.logs = [];
    this.listeners.forEach(listener => listener(this.logs));
  }

  logAPICall(endpoint: string, method: string, status: number, duration: number, data?: any) {
    this.addLog({
      level: status >= 200 && status < 300 ? 'success' : status >= 400 ? 'error' : 'warn',
      category: 'API',
      message: `${method} ${endpoint} - ${status}`,
      endpoint,
      duration,
      status,
      details: data
    });
  }

  logAuthentication(action: string, success: boolean, address?: string) {
    this.addLog({
      level: success ? 'success' : 'error',
      category: 'AUTH',
      message: `${action} ${success ? 'successful' : 'failed'}${address ? ` for ${address}` : ''}`,
      details: { action, success, address }
    });
  }

  logBlockchainEvent(event: string, details?: any) {
    this.addLog({
      level: 'info',
      category: 'BLOCKCHAIN',
      message: event,
      details
    });
  }

  logDatabaseOperation(operation: string, table: string, success: boolean, details?: any) {
    this.addLog({
      level: success ? 'success' : 'error',
      category: 'DATABASE',
      message: `${operation} on ${table} ${success ? 'successful' : 'failed'}`,
      details
    });
  }

  logWebSocketEvent(event: string, details?: any) {
    this.addLog({
      level: 'info',
      category: 'WEBSOCKET',
      message: event,
      details
    });
  }

  logMiningActivity(activity: string, address?: string, details?: any) {
    this.addLog({
      level: 'info',
      category: 'MINING',
      message: `${activity}${address ? ` for ${address}` : ''}`,
      details
    });
  }

  logStakingActivity(activity: string, address?: string, details?: any) {
    this.addLog({
      level: 'info',
      category: 'STAKING',
      message: `${activity}${address ? ` for ${address}` : ''}`,
      details
    });
  }

  logSystemEvent(event: string, level: 'info' | 'warn' | 'error' = 'info', details?: any) {
    this.addLog({
      level,
      category: 'SYSTEM',
      message: event,
      details
    });
  }
}

export const systemLogger = SystemLogManager.getInstance();

export function useSystemLogs() {
  const [logs, setLogs] = useState<SystemLog[]>(systemLogger.getLogs());

  useEffect(() => {
    const unsubscribe = systemLogger.subscribe(setLogs);
    return unsubscribe;
  }, []);

  return {
    logs,
    clearLogs: () => systemLogger.clearLogs(),
    addLog: (log: Omit<SystemLog, 'id' | 'timestamp'>) => systemLogger.addLog(log)
  };
}

export function SystemLogger() {
  const { logs, clearLogs } = useSystemLogs();
  const [filter, setFilter] = useState<string>('ALL');

  const filteredLogs = filter === 'ALL' 
    ? logs 
    : logs.filter(log => log.category === filter);

  const getLogIcon = (category: SystemLog['category']) => {
    switch (category) {
      case 'API': return <Network className="h-4 w-4" />;
      case 'AUTH': return <CheckCircle className="h-4 w-4" />;
      case 'BLOCKCHAIN': return <Zap className="h-4 w-4" />;
      case 'DATABASE': return <Database className="h-4 w-4" />;
      case 'WEBSOCKET': return <Activity className="h-4 w-4" />;
      case 'MINING': return <Server className="h-4 w-4" />;
      case 'STAKING': return <Server className="h-4 w-4" />;
      case 'SYSTEM': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getLogColor = (level: SystemLog['level']) => {
    switch (level) {
      case 'success': return 'text-green-400';
      case 'warn': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-blue-400';
    }
  };

  const getBadgeVariant = (level: SystemLog['level']) => {
    switch (level) {
      case 'success': return 'default';
      case 'warn': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const categories = ['ALL', 'API', 'AUTH', 'BLOCKCHAIN', 'DATABASE', 'WEBSOCKET', 'MINING', 'STAKING', 'SYSTEM'];

  return (
    <Card className="border-green-500/20 bg-black/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-green-400 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            SYSTEM LOGS ({filteredLogs.length})
          </CardTitle>
          <Button 
            onClick={clearLogs} 
            variant="outline" 
            size="sm"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            Clear
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          {categories.map(category => (
            <Button
              key={category}
              variant={filter === category ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(category)}
              className={filter === category ? "bg-green-600 text-black" : "border-green-500/30 text-green-400"}
            >
              {category}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-96 w-full">
          <div className="space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No logs available
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div 
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-900/50 border border-gray-700/50 hover:border-green-500/30 transition-colors"
                >
                  <div className={`mt-0.5 ${getLogColor(log.level)}`}>
                    {getLogIcon(log.category)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getBadgeVariant(log.level)} className="text-xs">
                        {log.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {log.level.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      {log.duration && (
                        <span className="text-xs text-blue-400">
                          {log.duration}ms
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-200 font-mono">
                      {log.message}
                    </div>
                    
                    {log.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-400 cursor-pointer hover:text-green-400">
                          Details
                        </summary>
                        <pre className="text-xs text-gray-300 mt-1 p-2 bg-black/30 rounded overflow-auto max-h-32">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
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

// Initialize system logging
if (typeof window !== 'undefined') {
  systemLogger.logSystemEvent('PVX System Logger initialized', 'info');
  
  // Log authentication events
  window.addEventListener('storage', (e) => {
    if (e.key === 'activeWallet' || e.key === 'sessionToken') {
      systemLogger.logAuthentication(
        e.newValue ? 'Session stored' : 'Session cleared',
        !!e.newValue
      );
    }
  });
}