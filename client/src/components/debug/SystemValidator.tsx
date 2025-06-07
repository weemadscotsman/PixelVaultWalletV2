import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Terminal } from "lucide-react";

interface EndpointTest {
  name: string;
  url: string;
  method: string;
  requiresAuth: boolean;
  status: 'pending' | 'success' | 'error' | 'testing';
  responseTime?: number;
  error?: string;
}

export function SystemValidator() {
  const [tests, setTests] = useState<EndpointTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState({ total: 0, passed: 0, failed: 0, successRate: 0 });

  const endpoints: EndpointTest[] = [
    // Authentication
    { name: "Auth Status", url: "/api/auth/status", method: "GET", requiresAuth: false, status: 'pending' },
    { name: "Auth Me", url: "/api/auth/me", method: "GET", requiresAuth: true, status: 'pending' },
    
    // Wallet
    { name: "All Wallets", url: "/api/wallet/all", method: "GET", requiresAuth: false, status: 'pending' },
    { name: "Genesis Wallet", url: "/api/wallet/PVX_1295b5490224b2eb64e9724dc091795a", method: "GET", requiresAuth: false, status: 'pending' },
    { name: "Wallet History", url: "/api/wallet/history/PVX_1295b5490224b2eb64e9724dc091795a", method: "GET", requiresAuth: true, status: 'pending' },
    
    // Blockchain
    { name: "Blockchain Status", url: "/api/blockchain/status", method: "GET", requiresAuth: false, status: 'pending' },
    { name: "Blockchain Metrics", url: "/api/blockchain/metrics", method: "GET", requiresAuth: false, status: 'pending' },
    { name: "Latest Block", url: "/api/blockchain/latest-block", method: "GET", requiresAuth: false, status: 'pending' },
    
    // Mining & Staking
    { name: "Mining Stats", url: "/api/blockchain/mining/stats/PVX_1295b5490224b2eb64e9724dc091795a", method: "GET", requiresAuth: false, status: 'pending' },
    { name: "Staking Pools", url: "/api/staking/pools", method: "GET", requiresAuth: false, status: 'pending' },
    
    // Transactions
    { name: "Recent Transactions", url: "/api/tx/recent", method: "GET", requiresAuth: false, status: 'pending' },
    { name: "User Transactions", url: "/api/utr/transactions?userAddress=PVX_1295b5490224b2eb64e9724dc091795a", method: "GET", requiresAuth: true, status: 'pending' },
    
    // Governance
    { name: "Governance Proposals", url: "/api/governance/proposals", method: "GET", requiresAuth: false, status: 'pending' },
    { name: "Governance Stats", url: "/api/governance/stats?address=PVX_1295b5490224b2eb64e9724dc091795a", method: "GET", requiresAuth: true, status: 'pending' },
    
    // Badges & Learning
    { name: "Badges", url: "/api/badges", method: "GET", requiresAuth: false, status: 'pending' },
    { name: "User Badges", url: "/api/badges/user/PVX_1295b5490224b2eb64e9724dc091795a", method: "GET", requiresAuth: true, status: 'pending' },
    { name: "Learning Modules", url: "/api/learning/modules", method: "GET", requiresAuth: false, status: 'pending' },
    
    // Health & Dev
    { name: "Health Check", url: "/api/health", method: "GET", requiresAuth: false, status: 'pending' },
    { name: "Dev Services", url: "/api/dev/services/status", method: "GET", requiresAuth: false, status: 'pending' },
  ];

  const testEndpoint = async (endpoint: EndpointTest): Promise<EndpointTest> => {
    const startTime = performance.now();
    
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      if (response.ok) {
        return {
          ...endpoint,
          status: 'success',
          responseTime,
        };
      } else {
        const errorText = await response.text();
        return {
          ...endpoint,
          status: 'error',
          responseTime,
          error: `${response.status}: ${errorText}`,
        };
      }
    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      return {
        ...endpoint,
        status: 'error',
        responseTime,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTests(endpoints.map(e => ({ ...e, status: 'testing' as const })));
    
    const results: EndpointTest[] = [];
    
    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint);
      results.push(result);
      
      // Update state progressively
      setTests([...results, ...endpoints.slice(results.length).map(e => ({ ...e, status: 'pending' as const }))]);
    }
    
    setTests(results);
    
    // Calculate summary
    const passed = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;
    const total = results.length;
    const successRate = Math.round((passed / total) * 100);
    
    setSummary({ total, passed, failed, successRate });
    setIsRunning(false);
  };

  useEffect(() => {
    setTests(endpoints);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'testing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'testing':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <Card className="bg-black/80 border-green-500/30">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-green-400">
            <Terminal className="h-5 w-5" />
            System Validator
          </CardTitle>
          <Button
            onClick={runAllTests}
            disabled={isRunning}
            className="bg-green-600 hover:bg-green-700 text-black"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Testing...
              </>
            ) : (
              'Run Full Test'
            )}
          </Button>
        </div>
        
        {summary.total > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{summary.total}</div>
              <div className="text-xs text-gray-400">Total Tests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{summary.passed}</div>
              <div className="text-xs text-gray-400">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{summary.failed}</div>
              <div className="text-xs text-gray-400">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{summary.successRate}%</div>
              <div className="text-xs text-gray-400">Success Rate</div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
        {tests.map((test, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-gray-700"
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(test.status)}
              <div>
                <div className="font-medium text-gray-200">{test.name}</div>
                <div className="text-xs text-gray-500">
                  {test.method} {test.url}
                  {test.requiresAuth && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Auth Required
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <Badge className={getStatusColor(test.status)}>
                {test.status.toUpperCase()}
              </Badge>
              {test.responseTime && (
                <div className="text-xs text-gray-500 mt-1">
                  {test.responseTime}ms
                </div>
              )}
              {test.error && (
                <div className="text-xs text-red-400 mt-1 max-w-xs truncate">
                  {test.error}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}