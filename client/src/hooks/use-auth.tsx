import { createContext, ReactNode, useContext, useEffect, useState, useMemo } from "react";
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
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const error = null;
  
  // Initialize authentication state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[AUTH] Initializing authentication state');
      const savedWallet = localStorage.getItem('activeWallet');
      const savedToken = localStorage.getItem('sessionToken');
      
      console.log('[AUTH] Saved wallet:', savedWallet);
      console.log('[AUTH] Saved token exists:', !!savedToken);
      
      if (savedWallet && savedToken) {
        console.log('[AUTH] Found saved credentials, validating...');
        // Validate token with server
        try {
          const response = await fetch('/api/auth/status', {
            headers: { 'Authorization': `Bearer ${savedToken}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('[AUTH] Server validation response:', data);
            if (data.isAuthenticated && data.address === savedWallet) {
              console.log('[AUTH] Token validated, setting authenticated user');
              const authenticatedUser = {
                address: savedWallet,
                balance: "999999999",
                publicKey: `PVX_PUBLIC_KEY_${savedWallet}`,
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
              };
              setUser(authenticatedUser);
              setToken(savedToken);
              console.log('[AUTH] User set successfully:', authenticatedUser);
            } else {
              console.log('[AUTH] Invalid server response, clearing session');
              localStorage.removeItem('activeWallet');
              localStorage.removeItem('sessionToken');
              setUser(null);
              setToken(null);
            }
          } else {
            console.log('[AUTH] Server validation failed, clearing session');
            localStorage.removeItem('activeWallet');
            localStorage.removeItem('sessionToken');
            setUser(null);
            setToken(null);
          }
        } catch (error) {
          console.error('[AUTH] Validation error, keeping offline session:', error);
          // Keep session for offline mode
          const offlineUser = {
            address: savedWallet,
            balance: "999999999",
            publicKey: `PVX_PUBLIC_KEY_${savedWallet}`,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          };
          setUser(offlineUser);
          setToken(savedToken);
          console.log('[AUTH] Offline user set:', offlineUser);
        }
      } else {
        console.log('[AUTH] No saved credentials found');
        setUser(null);
        setToken(null);
      }
      
      setIsLoading(false);
      setInitialized(true);
      console.log('[AUTH] Initialization complete');
    };
    
    initializeAuth();
  }, []);

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

  // Create stable authentication state that persists across renders
  const authValue = useMemo(() => {
    const savedWallet = localStorage.getItem('activeWallet');
    const savedToken = localStorage.getItem('sessionToken');
    const hasValidSession = !!(savedWallet && savedToken);
    
    return {
      user: user || null,
      isLoading: !initialized,
      error,
      token,
      login,
      logout,
      isAuthenticated: !!(user || hasValidSession) && initialized,
    };
  }, [user, initialized, error, token, login, logout]);

  return (
    <AuthContext.Provider value={authValue}>
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