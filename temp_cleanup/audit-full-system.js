#!/usr/bin/env node

import http from 'http';

// Comprehensive PVX System Audit
console.log('🔍 INITIATING FULL PVX SYSTEM AUDIT...\n');

const BASE_URL = 'http://localhost:5000';

// Test wallet address for authenticated endpoints
const TEST_WALLET = 'PVX_1295b5490224b2eb64e9724dc091795a';

// All endpoints that need to be tested
const ENDPOINTS = {
  // Core Authentication
  auth: [
    { method: 'GET', path: '/api/auth/status', requiresAuth: false },
    { method: 'GET', path: '/api/auth/me', requiresAuth: true },
  ],
  
  // Wallet Management
  wallet: [
    { method: 'GET', path: '/api/wallet/all', requiresAuth: false },
    { method: 'GET', path: `/api/wallet/${TEST_WALLET}`, requiresAuth: false },
    { method: 'GET', path: '/api/wallet/current', requiresAuth: true },
    { method: 'GET', path: `/api/wallet/history/${TEST_WALLET}`, requiresAuth: true },
  ],
  
  // Blockchain Core
  blockchain: [
    { method: 'GET', path: '/api/blockchain/status', requiresAuth: false },
    { method: 'GET', path: '/api/blockchain/metrics', requiresAuth: false },
    { method: 'GET', path: '/api/blockchain/trends', requiresAuth: false },
    { method: 'GET', path: '/api/blockchain/latest-block', requiresAuth: false },
    { method: 'GET', path: '/api/blockchain/blocks', requiresAuth: false },
    { method: 'GET', path: '/api/blockchain/connect', requiresAuth: false },
    { method: 'GET', path: '/api/blockchain/info', requiresAuth: false },
    { method: 'GET', path: '/api/blockchain/mining/stats', requiresAuth: false },
    { method: 'GET', path: `/api/blockchain/mining/stats/${TEST_WALLET}`, requiresAuth: false },
  ],
  
  // Mining & Staking
  mining: [
    { method: 'GET', path: `/api/stake/status/${TEST_WALLET}`, requiresAuth: false },
    { method: 'GET', path: '/api/stake/status', requiresAuth: true },
    { method: 'GET', path: '/api/staking/pools', requiresAuth: false },
    { method: 'GET', path: '/api/stake/pools', requiresAuth: false },
  ],
  
  // Transactions
  transactions: [
    { method: 'GET', path: '/api/tx/recent', requiresAuth: false },
    { method: 'GET', path: `/api/utr/transactions?userAddress=${TEST_WALLET}`, requiresAuth: true },
    { method: 'GET', path: '/api/utr/realtime', requiresAuth: false },
    { method: 'GET', path: '/api/utr/stats', requiresAuth: false },
  ],
  
  // Governance
  governance: [
    { method: 'GET', path: '/api/governance/proposals', requiresAuth: false },
    { method: 'GET', path: '/api/governance/veto-guardians', requiresAuth: false },
    { method: 'GET', path: `/api/governance/stats?address=${TEST_WALLET}`, requiresAuth: true },
  ],
  
  // Drops & Airdrops
  drops: [
    { method: 'GET', path: '/api/drops', requiresAuth: false },
    { method: 'GET', path: '/api/drops/stats', requiresAuth: false },
    { method: 'GET', path: `/api/drops/eligibility?address=${TEST_WALLET}`, requiresAuth: true },
    { method: 'GET', path: `/api/drops/claims?address=${TEST_WALLET}`, requiresAuth: true },
  ],
  
  // Badges & Achievements
  badges: [
    { method: 'GET', path: '/api/badges', requiresAuth: false },
    { method: 'GET', path: '/api/badges/leaderboard', requiresAuth: false },
    { method: 'GET', path: `/api/badges/user/${TEST_WALLET}`, requiresAuth: true },
    { method: 'GET', path: `/api/badges/progress/${TEST_WALLET}`, requiresAuth: true },
  ],
  
  // Learning System
  learning: [
    { method: 'GET', path: '/api/learning/modules', requiresAuth: false },
    { method: 'GET', path: '/api/learning/leaderboard', requiresAuth: false },
    { method: 'GET', path: `/api/learning/stats/${TEST_WALLET}`, requiresAuth: true },
    { method: 'GET', path: `/api/learning/progress/${TEST_WALLET}`, requiresAuth: true },
  ],
  
  // Health & Monitoring
  health: [
    { method: 'GET', path: '/api/health', requiresAuth: false },
    { method: 'GET', path: '/api/health/metrics', requiresAuth: false },
    { method: 'GET', path: '/api/health/services', requiresAuth: false },
    { method: 'GET', path: '/api/health/blockchain', requiresAuth: false },
    { method: 'GET', path: '/api/status', requiresAuth: false },
  ],
  
  // Developer Tools
  dev: [
    { method: 'GET', path: '/api/dev/services/status', requiresAuth: false },
    { method: 'GET', path: '/api/dev/chain/metrics', requiresAuth: false },
  ],
  
  // Companions (AI)
  companions: [
    { method: 'GET', path: '/api/companions', requiresAuth: true },
  ]
};

// Test function for HTTP requests
function testEndpoint(method, path, requiresAuth = false) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PVX-System-Auditor/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const result = {
          method,
          path,
          status: res.statusCode,
          requiresAuth,
          success: res.statusCode >= 200 && res.statusCode < 400,
          responseSize: data.length,
          contentType: res.headers['content-type'] || 'unknown'
        };
        
        // Try to parse JSON response for additional info
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) result.errorMessage = parsed.error;
          if (parsed.message) result.message = parsed.message;
        } catch (e) {
          // Not JSON, check if it's HTML (502 error page)
          if (data.includes('<!DOCTYPE html>')) {
            result.errorMessage = 'Server returned HTML error page (likely 502)';
            result.isHtmlError = true;
          }
        }
        
        resolve(result);
      });
    });

    req.on('error', (error) => {
      resolve({
        method,
        path,
        status: 'ERROR',
        success: false,
        errorMessage: error.message,
        requiresAuth
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        method,
        path,
        status: 'TIMEOUT',
        success: false,
        errorMessage: 'Request timeout after 5 seconds',
        requiresAuth
      });
    });

    req.end();
  });
}

// Main audit function
async function runFullAudit() {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: [],
    warnings: [],
    categoryResults: {}
  };

  console.log('📊 TESTING ALL ENDPOINT CATEGORIES...\n');

  for (const [category, endpoints] of Object.entries(ENDPOINTS)) {
    console.log(`🔍 Testing ${category.toUpperCase()} endpoints...`);
    
    const categoryResults = {
      total: endpoints.length,
      passed: 0,
      failed: 0,
      details: []
    };

    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint.method, endpoint.path, endpoint.requiresAuth);
      
      results.total++;
      categoryResults.details.push(result);
      
      if (result.success) {
        results.passed++;
        categoryResults.passed++;
        console.log(`  ✅ ${result.method} ${result.path} - ${result.status}`);
      } else {
        results.failed++;
        categoryResults.failed++;
        console.log(`  ❌ ${result.method} ${result.path} - ${result.status} ${result.errorMessage || ''}`);
        
        results.errors.push({
          category,
          endpoint: `${result.method} ${result.path}`,
          status: result.status,
          error: result.errorMessage,
          requiresAuth: result.requiresAuth
        });
      }
    }
    
    results.categoryResults[category] = categoryResults;
    console.log(`  📈 ${category}: ${categoryResults.passed}/${categoryResults.total} passed\n`);
  }

  // Summary report
  console.log('📋 AUDIT SUMMARY REPORT');
  console.log('='.repeat(50));
  console.log(`Total Endpoints: ${results.total}`);
  console.log(`✅ Passed: ${results.passed} (${((results.passed/results.total)*100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${results.failed} (${((results.failed/results.total)*100).toFixed(1)}%)`);
  console.log('');

  // Category breakdown
  console.log('📊 CATEGORY BREAKDOWN:');
  for (const [category, stats] of Object.entries(results.categoryResults)) {
    const percentage = ((stats.passed/stats.total)*100).toFixed(1);
    console.log(`  ${category.padEnd(15)}: ${stats.passed}/${stats.total} (${percentage}%)`);
  }
  console.log('');

  // Critical failures
  if (results.errors.length > 0) {
    console.log('🚨 CRITICAL FAILURES DETECTED:');
    results.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. [${error.category.toUpperCase()}] ${error.endpoint}`);
      console.log(`     Status: ${error.status}`);
      console.log(`     Error: ${error.error || 'Unknown error'}`);
      console.log(`     Auth Required: ${error.requiresAuth ? 'Yes' : 'No'}`);
      console.log('');
    });
  }

  // Health check
  const healthScore = (results.passed / results.total) * 100;
  console.log('🏥 SYSTEM HEALTH SCORE:');
  if (healthScore >= 95) {
    console.log(`  🟢 EXCELLENT (${healthScore.toFixed(1)}%) - System is fully operational`);
  } else if (healthScore >= 85) {
    console.log(`  🟡 GOOD (${healthScore.toFixed(1)}%) - Minor issues detected`);
  } else if (healthScore >= 70) {
    console.log(`  🟠 WARNING (${healthScore.toFixed(1)}%) - Several issues need attention`);
  } else {
    console.log(`  🔴 CRITICAL (${healthScore.toFixed(1)}%) - System requires immediate attention`);
  }

  console.log('\n🔧 AUDIT COMPLETE - Review failures and fix critical issues');
  
  return results;
}

// Execute audit
runFullAudit().catch(console.error);