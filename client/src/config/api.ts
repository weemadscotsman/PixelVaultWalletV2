/**
 * API Configuration
 * Centralizes all API-related configuration settings and utilities
 */

// API base URL - use current origin if not explicitly provided
export const API_URL = import.meta.env.VITE_API_URL || '';

// Server timeout in milliseconds
export const API_TIMEOUT = 30000;

// Request retry settings
export const API_MAX_RETRY_ATTEMPTS = 3;
export const API_RETRY_DELAY = 1000; // 1 second

/**
 * Available API endpoints
 */
export enum ApiEndpoints {
  // Wallet endpoints
  WALLET_INFO = '/api/wallet',
  WALLET_CREATE = '/api/wallet/create',
  WALLET_IMPORT = '/api/wallet/import',
  WALLET_EXPORT = '/api/wallet/export',
  WALLET_BALANCE = '/api/wallet/balance',
  
  // Transaction endpoints
  TRANSACTION_CREATE = '/api/transaction/create',
  TRANSACTION_HISTORY = '/api/transaction/history',
  TRANSACTION_INFO = '/api/transaction',
  
  // Blockchain endpoints
  BLOCKCHAIN_INFO = '/api/blockchain/info',
  BLOCKCHAIN_METRICS = '/api/blockchain/metrics',
  
  // Mining endpoints
  MINING_START = '/api/mining/start',
  MINING_STOP = '/api/mining/stop',
  MINING_INFO = '/api/mining/info',
  
  // Staking endpoints
  STAKING_POOLS = '/api/staking/pools',
  STAKING_CREATE = '/api/staking/create',
  STAKING_WITHDRAW = '/api/staking/withdraw',
  STAKING_INFO = '/api/staking/info',
  
  // Drops endpoints
  DROPS_LIST = '/api/drops',
  DROPS_INFO = '/api/drops/info',
  DROPS_CLAIM = '/api/drops/claim',
  DROPS_ELIGIBLE = '/api/drops/eligible',
  
  // Governance endpoints
  GOVERNANCE_PROPOSALS = '/api/governance/proposals',
  GOVERNANCE_PROPOSAL_CREATE = '/api/governance/proposal/create',
  GOVERNANCE_VOTE = '/api/governance/vote',
  GOVERNANCE_EXECUTE = '/api/governance/execute',
  
  // Learning Lab endpoints
  LEARNING_MODULES = '/api/learning/modules',
  LEARNING_MODULE_START = '/api/learning/start',
  LEARNING_MODULE_SUBMIT = '/api/learning/submit',
  LEARNING_MODULE_REWARDS = '/api/learning/rewards',
  LEARNING_PROGRESS = '/api/learning/progress',
  
  // System endpoints
  SYSTEM_STATUS = '/api/status',
  SYSTEM_HEALTH = '/api/health'
}

/**
 * API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
}

/**
 * Format API URL with path and parameters
 * @param path API endpoint path
 * @param params URL parameters
 * @returns Formatted URL
 */
export const formatApiUrl = (path: string, params?: Record<string, string | number>): string => {
  const url = new URL(`${API_URL}${path}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }
  
  return url.toString();
};

/**
 * Handle API error responses
 * @param response Fetch response object
 * @returns Error message
 */
export const handleApiError = async (response: Response): Promise<string> => {
  try {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      return errorData.error || errorData.message || `Error ${response.status}: ${response.statusText}`;
    }
    
    return `Error ${response.status}: ${response.statusText}`;
  } catch (error) {
    return `Error ${response.status}: ${response.statusText}`;
  }
};

/**
 * Generic API call function with retry logic and proper error handling
 * @param method HTTP method
 * @param endpoint API endpoint
 * @param data Request body data
 * @param params URL parameters
 * @param options Additional fetch options
 * @returns API response data
 */
export const callApi = async <T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  data?: any,
  params?: Record<string, string | number>,
  options?: RequestInit
): Promise<T> => {
  const url = formatApiUrl(endpoint, params);
  let attempts = 0;
  
  const executeRequest = async (): Promise<T> => {
    try {
      attempts++;
      
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers
        },
        credentials: 'same-origin',
        ...options
      };
      
      if (data && (method !== 'GET')) {
        fetchOptions.body = JSON.stringify(data);
      }
      
      console.log(`API Request: ${method} ${endpoint}`, params);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
      fetchOptions.signal = controller.signal;
      
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      console.log(`API Response: ${response.status} for ${method} ${endpoint}`);
      
      if (!response.ok) {
        const errorMessage = await handleApiError(response);
        console.error(`API Error: ${response.status} for ${method} ${endpoint}`, errorMessage);
        throw new Error(errorMessage);
      }
      
      // Return as is for empty responses or non-JSON
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {} as T;
      }
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        }
        return await response.text() as unknown as T;
      } catch (error) {
        console.error(`API Exception for ${method} ${endpoint}:`, error);
        throw error;
      }
    } catch (error: any) {
      // Handle abort errors from timeout
      if (error.name === 'AbortError') {
        console.error(`API Request timeout for ${method} ${endpoint}`);
        throw new Error(`Request timeout after ${API_TIMEOUT}ms`);
      }
      
      // Retry logic for network errors
      if (attempts < API_MAX_RETRY_ATTEMPTS && (error.message.includes('network') || error.message.includes('failed'))) {
        console.warn(`Retrying API request (${attempts}/${API_MAX_RETRY_ATTEMPTS}): ${method} ${endpoint}`);
        await new Promise(resolve => setTimeout(resolve, API_RETRY_DELAY));
        return executeRequest();
      }
      
      throw error;
    }
  };
  
  return executeRequest();
};

/**
 * Convenience methods for API calls
 */
export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, string | number>, options?: RequestInit) => 
    callApi<T>('GET', endpoint, undefined, params, options),
    
  post: <T = any>(endpoint: string, data?: any, params?: Record<string, string | number>, options?: RequestInit) => 
    callApi<T>('POST', endpoint, data, params, options),
    
  put: <T = any>(endpoint: string, data?: any, params?: Record<string, string | number>, options?: RequestInit) => 
    callApi<T>('PUT', endpoint, data, params, options),
    
  patch: <T = any>(endpoint: string, data?: any, params?: Record<string, string | number>, options?: RequestInit) => 
    callApi<T>('PATCH', endpoint, data, params, options),
    
  delete: <T = any>(endpoint: string, data?: any, params?: Record<string, string | number>, options?: RequestInit) => 
    callApi<T>('DELETE', endpoint, data, params, options)
};