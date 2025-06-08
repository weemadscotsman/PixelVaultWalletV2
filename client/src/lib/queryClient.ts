import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: {
    headers?: Record<string, string>;
    retryCount?: number;
  }
): Promise<Response> {
  const startTime = Date.now();
  console.log(`API Request: ${method} ${url}`, data);
  
  // Import system logger dynamically to avoid circular dependencies
  import('../components/SystemLogger').then(({ systemLogger }) => {
    systemLogger.logSystemEvent(`API Request: ${method} ${url}`, 'info', { data });
  });
  
  // Set default retry parameters
  const maxRetries = options?.retryCount || 3;
  let retryDelay = 500; // Start with 500ms delay
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      // Check for session token in localStorage
      const sessionToken = localStorage.getItem('pvx_session_token');
      
      // Prepare headers
      const headers: Record<string, string> = {
        ...(data ? { "Content-Type": "application/json" } : {}),
        ...(sessionToken ? { "Authorization": `Bearer ${sessionToken}` } : {}),
        ...(options?.headers || {})
      };
      
      const res = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      });

      console.log(`API Response: ${res.status} for ${method} ${url}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`API Error: ${res.status} for ${method} ${url}`, errorText);
        
        // If it's a 502 error (Bad Gateway), 503 (Service Unavailable), or 404 (Not Found), retry
        if ((res.status === 502 || res.status === 503 || res.status === 404) && attempt < maxRetries - 1) {
          attempt++;
          console.log(`Retrying request (${attempt}/${maxRetries}) after ${retryDelay}ms delay...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          retryDelay *= 2; // Exponential backoff
          continue;
        }
        
        // For other errors, don't throw immediately - return the response to let components handle gracefully
        if (res.status >= 400 && res.status < 500) {
          console.warn(`Client error ${res.status} for ${method} ${url}, returning response for graceful handling`);
          return res; // Let the component handle the error gracefully
        }
        
        throw new Error(`${res.status}: ${errorText || res.statusText}`);
      }
      
      return res;
    } catch (error) {
      // If it's a network error (like connection refused), retry
      if (error instanceof TypeError && attempt < maxRetries - 1) {
        attempt++;
        console.log(`Network error, retrying (${attempt}/${maxRetries}) after ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay *= 2; // Exponential backoff
        continue;
      }
      
      console.error(`API Exception for ${method} ${url}:`, error);
      throw error;
    }
  }
  
  // This should never be reached, but TypeScript requires a return statement
  throw new Error(`Failed after ${maxRetries} attempts`);
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Set default retry parameters
    const maxRetries = 3;
    let retryDelay = 500; // Start with 500ms delay
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        // Check for auth token in localStorage
        const token = localStorage.getItem('pvx_session_token');
        const activeWallet = localStorage.getItem('activeWallet');
        
        // Prepare headers with auth token and wallet address if available
        const headers: Record<string, string> = {
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          ...(activeWallet ? { "X-Wallet-Address": activeWallet } : {})
        };
        
        // Make the API request with headers
        const res = await fetch(queryKey[0] as string, {
          credentials: "include",
          headers
        });
        
        // Handle 401 unauthorized as configured
        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          return null;
        }
        
        // Handle server errors with retry
        if ((res.status === 502 || res.status === 503) && attempt < maxRetries - 1) {
          attempt++;
          console.log(`Retrying query (${attempt}/${maxRetries}) after ${retryDelay}ms delay...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          retryDelay *= 2; // Exponential backoff
          continue;
        }
        
        // Handle successful response or other errors
        if (!res.ok) {
          await throwIfResNotOk(res);
        }
        
        return await res.json();
      } catch (error) {
        // If it's a network error (like connection refused), retry
        if (error instanceof TypeError && attempt < maxRetries - 1) {
          attempt++;
          console.log(`Network error in query, retrying (${attempt}/${maxRetries}) after ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          retryDelay *= 2; // Exponential backoff
          continue;
        }
        
        console.error(`Query exception for ${queryKey[0]}:`, error);
        throw error;
      }
    }
    
    // This should never be reached, but TypeScript requires a return statement
    throw new Error(`Failed after ${maxRetries} attempts`);
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Add a generic fetch query method to use in our hooks
// This works alongside the TanStack's existing fetchQuery method but with our custom implementation
// for direct API calls
export async function fetchQueryData<T>(url: string): Promise<T> {
  // Set default retry parameters
  const maxRetries = 3;
  let retryDelay = 500; // Start with 500ms delay
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      // Check for auth token in localStorage
      const token = localStorage.getItem('pvx_session_token');
      const activeWallet = localStorage.getItem('activeWallet');
      
      // Prepare headers with auth token and wallet address if available
      const headers: Record<string, string> = {
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...(activeWallet ? { "X-Wallet-Address": activeWallet } : {})
      };
      
      const res = await fetch(url, {
        credentials: "include",
        headers
      });
      
      // Handle server errors with retry
      if ((res.status === 502 || res.status === 503) && attempt < maxRetries - 1) {
        attempt++;
        console.log(`Retrying fetchQueryData (${attempt}/${maxRetries}) after ${retryDelay}ms delay...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay *= 2; // Exponential backoff
        continue;
      }
      
      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      
      return await res.json();
    } catch (error) {
      // If it's a network error (like connection refused), retry
      if (error instanceof TypeError && attempt < maxRetries - 1) {
        attempt++;
        console.log(`Network error in fetchQueryData, retrying (${attempt}/${maxRetries}) after ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay *= 2; // Exponential backoff
        continue;
      }
      
      console.error(`fetchQueryData exception for ${url}:`, error);
      throw error;
    }
  }
  
  // This should never be reached, but TypeScript requires a return statement
  throw new Error(`Failed after ${maxRetries} attempts`);
};
