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
  }
): Promise<Response> {
  console.log(`API Request: ${method} ${url}`, data);
  try {
    // Check for auth token in localStorage
    const token = localStorage.getItem('pvx_token');
    
    // Prepare headers
    const headers: Record<string, string> = {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
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
      throw new Error(`${res.status}: ${errorText || res.statusText}`);
    }
    
    return res;
  } catch (error) {
    console.error(`API Exception for ${method} ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Check for auth token in localStorage
    const token = localStorage.getItem('pvx_token');
    
    // Prepare headers with auth token if available
    const headers: Record<string, string> = 
      token ? { "Authorization": `Bearer ${token}` } : {};
    
    // Make the API request with headers
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
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
queryClient.fetchQuery = async function<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
  });
  
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  
  return await res.json();
};
