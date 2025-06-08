/**
 * COMPREHENSIVE PVX SYSTEM AUDIT
 * Tests every frontend component, backend endpoint, and service integration
 * Identifies missing routes, broken connections, and validates complete system functionality
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_COMPONENTS = [
  'Dashboard', 'WalletPage', 'StakingPage', 'GovernancePage', 'LearningPage',
  'SettingsPage', 'TransactionVisualizerPage', 'BlockchainExplorerPage',
  'MiningControlPanel', 'ThringletPage', 'BlockchainHealthDashboard'
];

const EXPECTED_ENDPOINTS = [
  // Core Authentication
  'POST /api/auth/login',
  'POST /api/auth/logout', 
  'GET /api/auth/status',
  'GET /api/auth/me',

  // Wallet Operations
  'POST /api/wallet/create',
  'GET /api/wallet/:address',
  'GET /api/wallet/:address/balance',
  'GET /api/wallet/:address/transactions',
  'GET /api/wallet/:address/export',
  'POST /api/wallet/:address/transfer',
  'GET /api/wallet/all',

  // Blockchain Core
  'GET /api/blockchain/status',
  'GET /api/blockchain/info',
  'GET /api/blockchain/metrics',
  'GET /api/blockchain/trends',
  'GET /api/blockchain/latest-block',
  'GET /api/blockchain/blocks',
  'GET /api/blockchain/connect',

  // Mining Operations
  'GET /api/blockchain/mining/stats',
  'GET /api/blockchain/mining/stats/:address',
  'POST /api/blockchain/mining/start',
  'POST /api/blockchain/mining/stop',

  // Transaction System
  'GET /api/utr/transactions',
  'GET /api/utr/stats',
  'POST /api/utr/submit',

  // Staking System
  'GET /api/stake/pools',
  'GET /api/stake/user/:address',
  'POST /api/stake/start',
  'POST /api/stake/claim',
  'POST /api/stake/unstake',

  // Governance
  'GET /api/governance/proposals',
  'GET /api/governance/proposal/:id',
  'POST /api/governance/proposals',
  'POST /api/governance/vote',

  // User Features
  'GET /api/badges',
  'GET /api/badges/user/:address',
  'POST /api/badges/award',
  'GET /api/drops',
  'GET /api/drops/user/:address',
  'POST /api/drops/claim',

  // Learning System
  'GET /api/learning/modules',
  'GET /api/learning/user/:address/progress',
  'POST /api/learning/complete',

  // Thringlets/Companions
  'GET /api/thringlets',
  'POST /api/companions/create',
  'GET /api/companions',
  'GET /api/companions/:id',

  // Health & Status
  'GET /api/health',
  'GET /api/status',
  'GET /api/ping',
  'GET /api/health/metrics',
  'GET /api/health/services',
  'GET /api/health/blockchain'
];

async function auditSystemComprehensively() {
  console.log('🔍 COMPREHENSIVE PVX SYSTEM AUDIT');
  console.log('=' .repeat(60));

  const results = {
    endpointTests: [],
    frontendComponents: [],
    serviceConnections: [],
    criticalIssues: [],
    recommendations: []
  };

  // Test all expected endpoints
  console.log('\n📡 Testing API Endpoints...');
  for (const endpoint of EXPECTED_ENDPOINTS) {
    const [method, path] = endpoint.split(' ');
    const testResult = await testEndpoint(method, path);
    results.endpointTests.push(testResult);
    
    if (!testResult.success) {
      results.criticalIssues.push(`MISSING ENDPOINT: ${endpoint}`);
    }
  }

  // Frontend component verification
  console.log('\n🖥️  Verifying Frontend Components...');
  const clientDir = './client/src';
  if (fs.existsSync(clientDir)) {
    for (const component of FRONTEND_COMPONENTS) {
      const componentExists = findComponentFile(clientDir, component);
      results.frontendComponents.push({
        component,
        exists: componentExists,
        path: componentExists || 'NOT FOUND'
      });
      
      if (!componentExists) {
        results.criticalIssues.push(`MISSING COMPONENT: ${component}`);
      }
    }
  }

  // Service connection tests
  console.log('\n🔗 Testing Service Connections...');
  const serviceTests = [
    { name: 'Database', test: () => testEndpoint('GET', '/api/ping') },
    { name: 'Blockchain Core', test: () => testEndpoint('GET', '/api/blockchain/status') },
    { name: 'WebSocket', test: () => testWebSocketConnection() },
    { name: 'Authentication', test: () => testEndpoint('GET', '/api/auth/status') }
  ];

  for (const service of serviceTests) {
    try {
      const result = await service.test();
      results.serviceConnections.push({
        service: service.name,
        status: result.success ? 'ONLINE' : 'OFFLINE',
        details: result
      });
      
      if (!result.success) {
        results.criticalIssues.push(`SERVICE DOWN: ${service.name}`);
      }
    } catch (error) {
      results.serviceConnections.push({
        service: service.name,
        status: 'ERROR',
        error: error.message
      });
      results.criticalIssues.push(`SERVICE ERROR: ${service.name} - ${error.message}`);
    }
  }

  // Generate comprehensive report
  generateAuditReport(results);
  
  return results;
}

async function testEndpoint(method, path, data = null) {
  const url = `http://localhost:5000${path.replace(':address', 'PVX_1295b5490224b2eb64e9724dc091795a').replace(':id', 'test_id')}`;
  
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const responseData = await response.text();
    
    return {
      success: response.ok,
      status: response.status,
      endpoint: `${method} ${path}`,
      response: responseData.substring(0, 200) + (responseData.length > 200 ? '...' : '')
    };
  } catch (error) {
    return {
      success: false,
      endpoint: `${method} ${path}`,
      error: error.message
    };
  }
}

async function testWebSocketConnection() {
  return new Promise((resolve) => {
    try {
      const { WebSocket } = await import('ws');
      const ws = new WebSocket('ws://localhost:5000/ws');
      
      const timeout = setTimeout(() => {
        ws.close();
        resolve({ success: false, error: 'Connection timeout' });
      }, 5000);
      
      ws.on('open', () => {
        clearTimeout(timeout);
        ws.close();
        resolve({ success: true });
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        resolve({ success: false, error: error.message });
      });
    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  });
}

function findComponentFile(dir, componentName) {
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        const found = findComponentFile(fullPath, componentName);
        if (found) return found;
      } else if (file.isFile() && file.name.includes(componentName)) {
        return fullPath;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

function generateAuditReport(results) {
  console.log('\n📊 AUDIT RESULTS SUMMARY');
  console.log('=' .repeat(60));
  
  const endpointSuccess = results.endpointTests.filter(t => t.success).length;
  const endpointTotal = results.endpointTests.length;
  const endpointRate = (endpointSuccess / endpointTotal * 100).toFixed(1);
  
  console.log(`📡 API Endpoints: ${endpointSuccess}/${endpointTotal} (${endpointRate}%)`);
  
  const componentSuccess = results.frontendComponents.filter(c => c.exists).length;
  const componentTotal = results.frontendComponents.length;
  const componentRate = componentTotal > 0 ? (componentSuccess / componentTotal * 100).toFixed(1) : '0.0';
  
  console.log(`🖥️  Frontend Components: ${componentSuccess}/${componentTotal} (${componentRate}%)`);
  
  const serviceSuccess = results.serviceConnections.filter(s => s.status === 'ONLINE').length;
  const serviceTotal = results.serviceConnections.length;
  const serviceRate = (serviceSuccess / serviceTotal * 100).toFixed(1);
  
  console.log(`🔗 Service Connections: ${serviceSuccess}/${serviceTotal} (${serviceRate}%)`);
  
  console.log(`\n🚨 Critical Issues Found: ${results.criticalIssues.length}`);
  
  if (results.criticalIssues.length > 0) {
    console.log('\n❌ CRITICAL ISSUES:');
    results.criticalIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }
  
  // Failed endpoints
  const failedEndpoints = results.endpointTests.filter(t => !t.success);
  if (failedEndpoints.length > 0) {
    console.log('\n❌ FAILED ENDPOINTS:');
    failedEndpoints.forEach(endpoint => {
      console.log(`   ${endpoint.endpoint} - ${endpoint.error || 'HTTP ' + endpoint.status}`);
    });
  }
  
  // Missing components
  const missingComponents = results.frontendComponents.filter(c => !c.exists);
  if (missingComponents.length > 0) {
    console.log('\n❌ MISSING COMPONENTS:');
    missingComponents.forEach(comp => {
      console.log(`   ${comp.component}`);
    });
  }
  
  // Service status
  console.log('\n🔗 SERVICE STATUS:');
  results.serviceConnections.forEach(service => {
    const status = service.status === 'ONLINE' ? '✅' : '❌';
    console.log(`   ${status} ${service.service}: ${service.status}`);
  });
  
  console.log('\n🏁 AUDIT COMPLETE');
}

// Run the comprehensive audit
auditSystemComprehensively().catch(console.error);