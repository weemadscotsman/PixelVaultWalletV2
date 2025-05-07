import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  address: string; // Wallet address associated with the user
  created_at: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: { username: string; password: string; address?: string }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mockUser, setMockUser] = useState<User | null>(null);

  // For demo purposes, use local storage to persist the mock user
  useEffect(() => {
    const storedUser = localStorage.getItem('pvx_user');
    if (storedUser) {
      try {
        setMockUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing stored user:", e);
        localStorage.removeItem('pvx_user');
      }
    }
  }, []);

  // Mock user data - in a real app, this would come from backend
  const {
    data: user = mockUser,
    isLoading,
    error
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      // Try to get user from API
      try {
        const res = await fetch("/api/user");
        if (res.ok) {
          return res.json();
        }
        return mockUser; // Fall back to mock user
      } catch (e) {
        console.log("Error fetching user, using mock:", e);
        return mockUser;
      }
    },
    initialData: mockUser,
  });

  const login = async (credentials: { username: string; password: string }) => {
    try {
      // In a real app, this would call the login API
      // For demo purposes, create a mock user
      const mockUserData: User = {
        id: 1,
        username: credentials.username,
        address: "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        created_at: new Date().toISOString(),
        role: "user",
      };
      
      setMockUser(mockUserData);
      localStorage.setItem('pvx_user', JSON.stringify(mockUserData));
      
      // Invalidate relevant queries
      queryClient.setQueryData(["/api/user"], mockUserData);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${credentials.username}!`,
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      // In a real app, call logout API
      setMockUser(null);
      localStorage.removeItem('pvx_user');
      
      // Clear user data from cache
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (userData: { username: string; password: string; address?: string }) => {
    try {
      // In a real app, this would call the register API
      // For demo purposes, create a mock user
      const mockUserData: User = {
        id: 1,
        username: userData.username,
        address: userData.address || ("0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')),
        created_at: new Date().toISOString(),
        role: "user",
      };
      
      setMockUser(mockUserData);
      localStorage.setItem('pvx_user', JSON.stringify(mockUserData));
      
      // Update cache
      queryClient.setQueryData(["/api/user"], mockUserData);
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${userData.username}!`,
      });
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout,
        register,
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