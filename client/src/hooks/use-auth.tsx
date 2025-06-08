import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { SessionManager, WalletManager } from "@/lib/secure-storage";

interface WalletUser {
  address: string;
  balance: string;
  publicKey?: string;
  createdAt?: string;
  lastUpdated?: string;
}

interface LoginCredentials {
  address: string;
  passphrase: string;
}

interface AuthResponse {
  success: boolean;
  sessionToken: string;
  wallet: WalletUser;
}

interface AuthContextType {
  user: WalletUser | null;
  isLoading: boolean;
  error: Error | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('pvx_session_token');
  });
  
  // Query for the current user based on the token
  const {
    data: user,
    error,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      if (!token) return null;
      
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          // Token is invalid or expired
          localStorage.removeItem('pvx_session_token');
          setToken(null);
          return null;
        }
        throw new Error('Failed to fetch user data');
      }
      
      return await res.json() as WalletUser;
    },
    enabled: !!token,
    retry: false,
  });

  // Effect to sync token with localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('pvx_session_token', token);
    } else {
      localStorage.removeItem('pvx_session_token');
    }
  }, [token]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await apiRequest('POST', '/api/auth/login', credentials);
      return await res.json() as AuthResponse;
    },
    onSuccess: (data) => {
      setToken(data.sessionToken);
      
      // Create wallet object from login response
      const walletUser = {
        address: data.address,
        isAuthenticated: true,
        sessionToken: data.sessionToken
      };
      
      queryClient.setQueryData(['/api/auth/me'], walletUser);
      
      // CRITICAL: Set active wallet in localStorage for unified state
      localStorage.setItem('activeWallet', data.address);
      
      // Invalidate any queries that may now return different results with auth
      queryClient.invalidateQueries();
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.address}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout function
  const logout = async () => {
    try {
      const res = await apiRequest('POST', '/api/auth/logout', {});
      // Clear token regardless of response
      setToken(null);
      queryClient.setQueryData(['/api/auth/me'], null);
      
      // Invalidate any queries that may now return different results without auth
      queryClient.invalidateQueries();
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear token on error
      setToken(null);
      queryClient.setQueryData(['/api/auth/me'], null);
    }
  };

  // Login function
  const login = async (credentials: LoginCredentials) => {
    return loginMutation.mutateAsync(credentials);
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        token,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}