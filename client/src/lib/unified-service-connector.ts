import { queryClient } from './queryClient';

export interface ServiceConnection {
  name: string;
  endpoint: string;
  connected: boolean;
  authenticated: boolean;
}

export class UnifiedServiceConnector {
  private sessionToken: string | null = null;
  private walletAddress: string | null = null;
  private services: ServiceConnection[] = [
    { name: 'Governance', endpoint: '/api/governance/proposals', connected: false, authenticated: false },
    { name: 'Staking', endpoint: '/api/staking/pools', connected: false, authenticated: false },
    { name: 'Drops', endpoint: '/api/drops', connected: false, authenticated: false },
    { name: 'Badges', endpoint: '/api/badges', connected: false, authenticated: false },
    { name: 'UTR Transactions', endpoint: '/api/utr/stats', connected: false, authenticated: false },
    { name: 'Learning Modules', endpoint: '/api/learning/modules', connected: false, authenticated: false },
    { name: 'Mining', endpoint: '/api/mining/stats', connected: false, authenticated: false },
    { name: 'Blockchain Data', endpoint: '/api/blockchain/status', connected: false, authenticated: false }
  ];

  async connectWallet(address: string, sessionToken: string): Promise<void> {
    this.walletAddress = address;
    this.sessionToken = sessionToken;
    
    // Store authentication data
    localStorage.setItem('activeWallet', address);
    localStorage.setItem('pvx_session_token', sessionToken);
    
    // Connect to all services simultaneously
    await Promise.all([
      this.connectToService('Governance'),
      this.connectToService('Staking'),
      this.connectToService('Drops'),
      this.connectToService('Badges'),
      this.connectToService('UTR Transactions'),
      this.connectToService('Learning Modules'),
      this.connectToService('Mining'),
      this.connectToService('Blockchain Data')
    ]);
    
    // Invalidate all cached queries to force refresh with authenticated data
    queryClient.invalidateQueries();
    
    console.log(`PVX Wallet ${address} connected to all blockchain services`);
  }

  private async connectToService(serviceName: string): Promise<void> {
    const service = this.services.find(s => s.name === serviceName);
    if (!service) return;

    try {
      const response = await fetch(service.endpoint, {
        headers: {
          'Authorization': `Bearer ${this.sessionToken}`,
          'Content-Type': 'application/json'
        }
      });

      service.connected = response.ok;
      service.authenticated = response.status !== 401;
      
      if (response.ok) {
        console.log(`✓ ${serviceName} service connected`);
      }
    } catch (error) {
      console.log(`✗ ${serviceName} service connection failed:`, error);
      service.connected = false;
      service.authenticated = false;
    }
  }

  async disconnectWallet(): Promise<void> {
    // Clear authentication
    localStorage.removeItem('activeWallet');
    localStorage.removeItem('pvx_session_token');
    
    // Reset service connections
    this.services.forEach(service => {
      service.connected = false;
      service.authenticated = false;
    });
    
    this.walletAddress = null;
    this.sessionToken = null;
    
    // Clear all cached data
    queryClient.clear();
    
    console.log('PVX Wallet disconnected from all services');
  }

  getConnectionStatus(): ServiceConnection[] {
    return [...this.services];
  }

  isFullyConnected(): boolean {
    return this.services.every(service => service.connected);
  }

  getConnectedServicesCount(): number {
    return this.services.filter(service => service.connected).length;
  }
}

export const unifiedServiceConnector = new UnifiedServiceConnector();