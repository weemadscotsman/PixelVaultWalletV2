import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, XCircle, AlertTriangle, Wifi, WifiOff, Activity, Database, Server, Cpu } from "lucide-react";

interface ConnectionTest {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST';
  requiresAuth?: boolean;
  expectedFields?: string[];
  category: 'core' | 'wallet' | 'blockchain' | 'features' | 'auth';
  critical: boolean;
}

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  responseTime: number;
  error?: string;
  data?: any;
  missingFields?: string[];
}

const CONNECTION_TESTS: ConnectionTest[] = [
  // Core System Tests
  { name: 'Backend Ping', endpoint: '/api/ping', method: 'GET', category: 'core', critical: true, expectedFields: ['status', 'message'] },
  { name: 'System Health', endpoint: '/api/health', method: 'GET', category: 'core', critical: true, expectedFields: ['status', 'uptime', 'services'] },
  { name: 'System Status', endpoint: '/api/status', method: 'GET', category: 'core', critical: true, expectedFields: ['online', 'totalWallets'] },
  
  // Blockchain Tests
  { name: 'Blockchain Info', endpoint: '/api/blockchain/info', method: 'GET', category: 'blockchain', critical: true, expectedFields: ['latestBlock', 'totalBlocks'] },
  { name: 'Blockchain Metrics', endpoint: '/api/blockchain/metrics', method: 'GET', category: 'blockchain', critical: true, expectedFields: ['blockHeight', 'avgBlockTime'] },
  { name: 'Blockchain Trends', endpoint: '/api/blockchain/trends', method: 'GET', category: 'blockchain', critical: false, expectedFields: [] },
  
  // Wallet Tests
  { name: 'All Wallets', endpoint: '/api/wallet/all', method: 'GET', category: 'wallet', critical: true, expectedFields: [] },
  { name: 'Current Wallet', endpoint: '/api/wallet/current', method: 'GET', category: 'wallet', critical: true, requiresAuth: true, expectedFields: ['address', 'balance'] },
  
  // Feature Tests
  { name: 'Staking Pools', endpoint: '/api/staking/pools', method: 'GET', category: 'features', critical: true, expectedFields: [] },
  { name: 'Governance Proposals', endpoint: '/api/governance/proposals', method: 'GET', category: 'features', critical: false, expectedFields: [] },
  { name: 'Learning Modules', endpoint: '/api/learning/modules', method: 'GET', category: 'features', critical: false, expectedFields: [] },
  { name: 'Drops List', endpoint: '/api/drops', method: 'GET', category: 'features', critical: false, expectedFields: [] },
  { name: 'Badge System', endpoint: '/api/badges', method: 'GET', category: 'features', critical: false, expectedFields: [] },
  
  // Auth Tests
  { name: 'Auth Status', endpoint: '/api/auth/status', method: 'GET', category: 'auth', critical: true, requiresAuth: true, expectedFields: ['authenticated', 'address'] },
];

export function SystemConnectionAudit() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const runConnectionTests = async () => {
    setIsRunning(true);
    setProgress(0);
    const results: TestResult[] = [];
    
    // Get session token for auth tests
    const sessionToken = localStorage.getItem('pvx_session_token');
    
    for (let i = 0; i < CONNECTION_TESTS.length; i++) {
      const test = CONNECTION_TESTS[i];
      const startTime = Date.now();
      
      try {
        const headers: Record<string, string> = {};
        if (test.requiresAuth && sessionToken) {
          headers['Authorization'] = `Bearer ${sessionToken}`;
        }
        
        const response = await apiRequest(test.method, test.endpoint, undefined, { headers });
        const data = await response.json();
        const responseTime = Date.now() - startTime;
        
        // Check for expected fields
        const missingFields = test.expectedFields?.filter(field => !(field in data)) || [];
        
        results.push({
          name: test.name,
          status: missingFields.length > 0 ? 'warning' : 'success',
          responseTime,
          data,
          missingFields: missingFields.length > 0 ? missingFields : undefined
        });
        
      } catch (error) {
        const responseTime = Date.now() - startTime;
        results.push({
          name: test.name,
          status: 'error',
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      setProgress(((i + 1) / CONNECTION_TESTS.length) * 100);
      setTestResults([...results]);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'bg-green-500/20 text-green-300 border-green-600/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-300 border-yellow-600/30';
      case 'error': return 'bg-red-500/20 text-red-300 border-red-600/30';
    }
  };

  const getCategoryIcon = (category: ConnectionTest['category']) => {
    switch (category) {
      case 'core': return <Server className="w-5 h-5" />;
      case 'blockchain': return <Database className="w-5 h-5" />;
      case 'wallet': return <Wifi className="w-5 h-5" />;
      case 'features': return <Activity className="w-5 h-5" />;
      case 'auth': return <Cpu className="w-5 h-5" />;
    }
  };

  const successCount = testResults.filter(r => r.status === 'success').length;
  const warningCount = testResults.filter(r => r.status === 'warning').length;
  const errorCount = testResults.filter(r => r.status === 'error').length;
  const totalTests = testResults.length;
  const healthScore = totalTests > 0 ? Math.round((successCount / totalTests) * 100) : 0;

  const categorizedResults = CONNECTION_TESTS.map(test => ({
    test,
    result: testResults.find(r => r.name === test.name)
  }));

  const resultsByCategory = categorizedResults.reduce((acc, { test, result }) => {
    if (!acc[test.category]) acc[test.category] = [];
    acc[test.category].push({ test, result });
    return acc;
  }, {} as Record<string, Array<{ test: ConnectionTest; result?: TestResult }>>);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gradient">System Connection Audit</h2>
          <p className="text-muted-foreground">
            Comprehensive verification of all frontend-backend service connections
          </p>
        </div>
        
        <Button 
          onClick={runConnectionTests}
          disabled={isRunning}
          className="bg-gradient-to-r from-primary to-primary/80"
        >
          {isRunning ? (
            <>
              <Activity className="w-4 h-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Run Full Audit
            </>
          )}
        </Button>
      </div>

      {/* Progress and Summary */}
      {(isRunning || testResults.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Audit Progress</span>
              <Badge className={healthScore >= 80 ? 'bg-green-500/20 text-green-300' : 
                             healthScore >= 60 ? 'bg-yellow-500/20 text-yellow-300' : 
                             'bg-red-500/20 text-red-300'}>
                Health Score: {healthScore}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="mb-4" />
            
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{successCount}</div>
                <div className="text-sm text-muted-foreground">Connected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{warningCount}</div>
                <div className="text-sm text-muted-foreground">Warnings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{errorCount}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{totalTests}</div>
                <div className="text-sm text-muted-foreground">Total Tests</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Results by Category */}
      {Object.entries(resultsByCategory).map(([category, items]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 capitalize">
              {getCategoryIcon(category as ConnectionTest['category'])}
              {category} Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map(({ test, result }) => (
                <div key={test.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    {result ? getStatusIcon(result.status) : <div className="w-4 h-4 rounded-full bg-muted" />}
                    <div>
                      <div className="font-medium">{test.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {test.method} {test.endpoint}
                        {test.critical && <Badge variant="outline" className="ml-2 text-xs">Critical</Badge>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {result && (
                      <>
                        <Badge className={getStatusColor(result.status)}>
                          {result.status === 'success' ? 'Connected' : 
                           result.status === 'warning' ? 'Partial' : 'Failed'}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {result.responseTime}ms
                        </div>
                        {result.error && (
                          <div className="text-xs text-red-400 mt-1 max-w-48 truncate">
                            {result.error}
                          </div>
                        )}
                        {result.missingFields && result.missingFields.length > 0 && (
                          <div className="text-xs text-yellow-400 mt-1">
                            Missing: {result.missingFields.join(', ')}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Raw Data Inspector */}
      {testResults.length > 0 && (
        <Card className="bg-black/30">
          <CardHeader>
            <CardTitle>Connection Data Inspector</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-mono text-muted-foreground max-h-64 overflow-auto">
              <pre>{JSON.stringify(testResults, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}