// PVX System Interconnection Validator
// Validates all frontend-backend connections with real authentication

interface ValidationResult {
  service: string;
  endpoint: string;
  status: 'success' | 'error' | 'warning';
  responseTime: number;
  dataShape: any;
  authRequired: boolean;
  authValid: boolean;
  error?: string;
}

interface SystemStatus {
  overallHealth: 'healthy' | 'degraded' | 'critical';
  validationResults: ValidationResult[];
  walletConnected: boolean;
  tokenValid: boolean;
  servicesOnline: number;
  totalServices: number;
  timestamp: number;
}

class PVXSystemValidator {
  private baseUrl = '/api';
  private wallet: string | null = null;
  private token: string | null = null;

  constructor(wallet?: string, token?: string) {
    this.wallet = wallet || null;
    this.token = token || null;
  }

  // Test individual endpoint with auth context
  async validateEndpoint(
    service: string,
    endpoint: string,
    authRequired: boolean = true,
    expectedShape?: any
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (authRequired && this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, { headers });
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        return {
          service,
          endpoint,
          status: 'error',
          responseTime,
          dataShape: null,
          authRequired,
          authValid: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      
      return {
        service,
        endpoint,
        status: 'success',
        responseTime,
        dataShape: this.analyzeDataShape(data),
        authRequired,
        authValid: authRequired ? !!this.token : true
      };

    } catch (error) {
      return {
        service,
        endpoint,
        status: 'error',
        responseTime: Date.now() - startTime,
        dataShape: null,
        authRequired,
        authValid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Analyze response data structure
  private analyzeDataShape(data: any): any {
    if (Array.isArray(data)) {
      return {
        type: 'array',
        length: data.length,
        sampleItem: data.length > 0 ? this.getObjectKeys(data[0]) : null
      };
    } else if (typeof data === 'object' && data !== null) {
      return {
        type: 'object',
        keys: this.getObjectKeys(data),
        hasData: Object.keys(data).length > 0
      };
    } else {
      return {
        type: typeof data,
        value: data
      };
    }
  }

  private getObjectKeys(obj: any): string[] {
    return obj && typeof obj === 'object' ? Object.keys(obj) : [];
  }

  // Run comprehensive system validation
  async runFullSystemCheck(): Promise<SystemStatus> {
    console.log('INITIATING PVX SYSTEM CROSS-CHECK...');
    console.log(`Wallet: ${this.wallet || 'NOT CONNECTED'}`);
    console.log(`Token: ${this.token ? 'VALID' : 'MISSING'}`);

    const testEndpoints = [
      { service: 'Wallet System', endpoint: '/wallet/me', authRequired: true },
      { service: 'Wallet Balance', endpoint: `/wallet/${this.wallet}`, authRequired: false },
      { service: 'Blockchain Status', endpoint: '/blockchain/status', authRequired: false },
      { service: 'Latest Block', endpoint: '/blockchain/latest-block', authRequired: false },
      { service: 'Recent Blocks', endpoint: '/blockchain/blocks?limit=5', authRequired: false },
      { service: 'Mining Stats', endpoint: `/blockchain/mining/stats/${this.wallet}`, authRequired: false },
      { service: 'Blockchain Trends', endpoint: '/blockchain/trends', authRequired: false },
      { service: 'Staking Rewards', endpoint: '/stake/rewards', authRequired: true },
      { service: 'Staking Pools', endpoint: '/stake/pools', authRequired: false },
      { service: 'NFT Marketplace', endpoint: '/nfts/all', authRequired: false },
      { service: 'User NFTs', endpoint: `/nfts/mine/${this.wallet}`, authRequired: true },
      { service: 'Governance Proposals', endpoint: '/gov/proposals', authRequired: false },
      { service: 'User Governance', endpoint: '/gov/user-votes', authRequired: true },
      { service: 'Drops Stats', endpoint: '/drops/stats', authRequired: false },
      { service: 'User Drops', endpoint: '/drops/user-claims', authRequired: true },
      { service: 'Badge Leaderboard', endpoint: '/badges/leaderboard', authRequired: false },
      { service: 'User Badges', endpoint: `/badges/user/${this.wallet}`, authRequired: true },
      { service: 'Thringlet State', endpoint: '/thringlet/state', authRequired: true },
      { service: 'Learning Modules', endpoint: '/learn/modules', authRequired: false },
      { service: 'User Progress', endpoint: '/learn/progress', authRequired: true },
      { service: 'Companions', endpoint: '/companions/mine', authRequired: true },
      { service: 'Transaction History', endpoint: `/transactions/wallet/${this.wallet}`, authRequired: false }
    ];

    const results: ValidationResult[] = [];
    
    for (const test of testEndpoints) {
      console.log(`Testing: ${test.service} (${test.endpoint})`);
      const result = await this.validateEndpoint(
        test.service,
        test.endpoint,
        test.authRequired
      );
      results.push(result);
      
      // Log result immediately
      const status = result.status === 'success' ? 'PASS' : 'FAIL';
      console.log(`${status} ${test.service}: ${result.status} (${result.responseTime}ms)`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const overallHealth = this.determineOverallHealth(successCount, results.length);

    const systemStatus: SystemStatus = {
      overallHealth,
      validationResults: results,
      walletConnected: !!this.wallet,
      tokenValid: !!this.token,
      servicesOnline: successCount,
      totalServices: results.length,
      timestamp: Date.now()
    };

    this.logSystemReport(systemStatus);
    return systemStatus;
  }

  private determineOverallHealth(successCount: number, totalCount: number): 'healthy' | 'degraded' | 'critical' {
    const percentage = successCount / totalCount;
    if (percentage >= 0.9) return 'healthy';
    if (percentage >= 0.7) return 'degraded';
    return 'critical';
  }

  private logSystemReport(status: SystemStatus) {
    console.log('\nPVX SYSTEM VALIDATION COMPLETE');
    console.log('================================');
    console.log(`Overall Health: ${status.overallHealth.toUpperCase()}`);
    console.log(`Services Online: ${status.servicesOnline}/${status.totalServices}`);
    console.log(`Wallet Connected: ${status.walletConnected ? 'YES' : 'NO'}`);
    console.log(`Auth Token: ${status.tokenValid ? 'VALID' : 'MISSING'}`);
    console.log('\nService Status Matrix:');
    
    status.validationResults.forEach(result => {
      const statusIcon = result.status === 'success' ? 'PASS' : 'FAIL';
      const authIcon = result.authRequired ? (result.authValid ? 'AUTH' : 'NOAUTH') : 'PUBLIC';
      console.log(`${statusIcon} ${authIcon} ${result.service.padEnd(20)} ${result.responseTime}ms`);
    });

    console.log('\nLegend: PASS=Online FAIL=Offline AUTH=Authenticated NOAUTH=Missing Auth PUBLIC=No Auth Required');
  }

  // Validate wallet propagation across all authenticated endpoints
  async validateWalletPropagation(): Promise<boolean> {
    if (!this.wallet) {
      console.log('No wallet connected for propagation test');
      return false;
    }

    console.log(`Testing wallet propagation for: ${this.wallet}`);
    
    const authEndpoints = [
      '/wallet/me',
      '/stake/rewards',
      `/nfts/mine/${this.wallet}`,
      '/gov/user-votes',
      '/drops/user-claims',
      `/badges/user/${this.wallet}`,
      '/thringlet/state',
      '/learn/progress',
      '/companions/mine'
    ];

    let propagationSuccess = 0;
    
    for (const endpoint of authEndpoints) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Check if response contains wallet reference
          const hasWalletRef = JSON.stringify(data).includes(this.wallet);
          if (hasWalletRef) {
            propagationSuccess++;
            console.log(`PASS ${endpoint}: Wallet found in response`);
          } else {
            console.log(`WARN ${endpoint}: Response OK but no wallet reference`);
          }
        } else {
          console.log(`FAIL ${endpoint}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`FAIL ${endpoint}: ${error}`);
      }
    }

    const success = propagationSuccess >= authEndpoints.length * 0.8;
    console.log(`\nWallet Propagation: ${success ? 'PASSED' : 'FAILED'}`);
    console.log(`${propagationSuccess}/${authEndpoints.length} endpoints properly reference wallet`);
    
    return success;
  }
}

export { PVXSystemValidator, type SystemStatus, type ValidationResult };