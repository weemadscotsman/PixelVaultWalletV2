import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WalletUser {
  address: string;
  balance: string;
  publicKey?: string;
  createdAt?: string;
  lastUpdated?: string;
}

interface AuthContextType {
  user: WalletUser | null;
  isLoading: boolean;
  error: Error | null;
  token: string | null;
  login: (credentials: { address: string; passphrase: string }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

// Create a context for global access to auth state
export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  
  // Load token from localStorage on initial mount
  useEffect(() => {
    const storedToken = localStorage.getItem('pvx_token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // Fetch current user data when token changes
  const {
    data: user,
    isLoading,
    error
  } = useQuery<WalletUser | null, Error>({
    queryKey: ["/api/auth/user", token],
    queryFn: async () => {
      if (!token) return null;
      
      try {
        const res = await fetch("/api/auth/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (res.ok) {
          return res.json();
        }
        
        // If unauthorized, clear token
        if (res.status === 401) {
          setToken(null);
          localStorage.removeItem('pvx_token');
          return null;
        }
        
        throw new Error(`Status ${res.status}: ${res.statusText}`);
      } catch (e) {
        console.error("Error fetching user:", e);
        return null;
      }
    },
    enabled: !!token, // Only run query if token exists
  });

  const login = async (credentials: { address: string; passphrase: string }) => {
    try {
      const res = await apiRequest('POST', '/api/auth/login', credentials);
      const data = await res.json();
      
      if (data.token) {
        // Store token in state and localStorage
        setToken(data.token);
        localStorage.setItem('pvx_token', data.token);
        
        // Update query cache
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        toast({
          title: "Login successful",
          description: `Wallet ${credentials.address} authenticated`,
        });
      } else {
        throw new Error("No token received from server");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await apiRequest('POST', '/api/auth/logout', {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      
      // Clear token and user data
      setToken(null);
      localStorage.removeItem('pvx_token');
      
      // Clear user data from cache
      queryClient.setQueryData(["/api/auth/user"], null);
      
      // Invalidate all queries to force refetch on next render
      queryClient.invalidateQueries();
      
      toast({
        title: "Logout successful",
        description: "You have been logged out.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      
      // Even if the server request fails, clear local token and data
      setToken(null);
      localStorage.removeItem('pvx_token');
      queryClient.setQueryData(["/api/auth/user"], null);
      
      toast({
        title: "Logged out",
        description: "You have been logged out.",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
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