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
  address: string;
  message: string;
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
  const [user, setUser] = useState<WalletUser | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('sessionToken');
  });
  
  // Initialize user from localStorage if available
  useEffect(() => {
    const savedWallet = localStorage.getItem('activeWallet');
    const savedToken = localStorage.getItem('sessionToken');
    
    if (savedWallet && savedToken) {
      setUser({
        address: savedWallet,
        balance: "999999999",
        publicKey: `PVX_PUBLIC_KEY_${savedWallet}`,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
      setToken(savedToken);
    }
  }, []);
  
  // Query for the current user based on the token (simplified)
  const {
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
          localStorage.removeItem('sessionToken');
          localStorage.removeItem('activeWallet');
          setToken(null);
          setUser(null);
          return null;
        }
        throw new Error('Failed to fetch user data');
      }
      
      return await res.json();
    },
    enabled: !!token,
    retry: false,
  });

  // Effect to sync token with localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('sessionToken', token);
    } else {
      localStorage.removeItem('sessionToken');
    }
  }, [token]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await apiRequest('POST', '/api/auth/login', credentials);
      return await res.json() as AuthResponse;
    },
    onSuccess: (data) => {
      console.log('Auth response:', data);
      
      if (!data || !data.address || !data.sessionToken) {
        console.error('Invalid auth response:', data);
        toast({
          title: "Login failed",
          description: "Invalid response from server",
          variant: "destructive",
        });
        return;
      }

      setToken(data.sessionToken);
      
      // Create complete wallet user object
      const walletUser: WalletUser = {
        address: data.address,
        balance: "999999999", // Will be updated by wallet query
        publicKey: `PVX_PUBLIC_KEY_${data.address}`,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      setUser(walletUser);
      
      // Store authentication data
      localStorage.setItem('activeWallet', data.address);
      localStorage.setItem('sessionToken', data.sessionToken);
      
      // Update query cache with proper structure
      queryClient.setQueryData(['/api/auth/me'], {
        success: true,
        user: {
          address: data.address,
          isAuthenticated: true,
          sessionToken: data.sessionToken
        }
      });
      
      // Invalidate queries to refresh with authenticated state
      queryClient.invalidateQueries();
      
      toast({
        title: "Wallet Connected",
        description: `Connected: ${data.address.substring(0, 20)}...`,
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
      // Clear all authentication state
      setToken(null);
      setUser(null);
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('activeWallet');
      
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.invalidateQueries();
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Clear state on error too
      setToken(null);
      setUser(null);
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('activeWallet');
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