import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";

interface Wallet {
  address: string;
  publicKey: string;
  balance: string;
  createdAt: string;
  lastSynced: string;
}

interface WalletKeys {
  publicKey: string;
  privateKey: string;
}

interface CreateWalletRequest {
  passphrase: string;
}

interface CreateWalletResponse {
  wallet: Wallet;
  sessionToken: string;
}

interface ImportWalletRequest {
  privateKey: string;
  passphrase: string;
}

interface ExportWalletRequest {
  address: string;
  passphrase: string;
}

interface TransactionRequest {
  fromAddress: string;
  toAddress: string;
  amount: string;
  passphrase: string;
  note?: string;
}

export function useWallet() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get active wallet from localStorage
  const storedWallet = localStorage.getItem('activeWallet');
  
  const [activeWallet, setActiveWallet] = useState<string | null>(storedWallet);

  // Set active wallet
  const setActiveWalletAddress = (address: string | null) => {
    setActiveWallet(address);
    if (address) {
      localStorage.setItem('activeWallet', address);
    } else {
      localStorage.removeItem('activeWallet');
    }
  };

  // Create a new wallet - using the exact endpoint from blueprint
  const createWalletMutation = useMutation({
    mutationFn: async (data: CreateWalletRequest) => {
      const res = await apiRequest('POST', '/api/wallet/create', data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create wallet');
      }
      return await res.json() as CreateWalletResponse;
    },
    onSuccess: (data) => {
      toast({
        title: "Wallet created",
        description: `New wallet created with address ${data.wallet.address}`,
      });
      setActiveWalletAddress(data.wallet.address);
      
      // Store session token for immediate authentication
      localStorage.setItem('pvx_session_token', data.sessionToken);
      
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/all'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create wallet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Import existing wallet - using the exact endpoint from blueprint
  const importWalletMutation = useMutation({
    mutationFn: async (data: ImportWalletRequest) => {
      console.log("Importing wallet with privateKey length:", data.privateKey.length);
      
      try {
        const res = await apiRequest('POST', '/api/wallet/import', data);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to import wallet');
        }
        const result = await res.json();
        console.log("Wallet import successful:", result.address);
        return result as Wallet;
      } catch (error) {
        console.error("Exception during wallet import:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Wallet imported",
        description: `Wallet imported successfully with address ${data.address}`,
      });
      setActiveWalletAddress(data.address);
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/all'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to import wallet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Export wallet keys - using the exact endpoint from blueprint
  const exportWalletKeysMutation = useMutation({
    mutationFn: async (data: ExportWalletRequest) => {
      const { address, passphrase } = data;
      console.log(`Exporting wallet keys for address: ${address}`);
      
      try {
        const res = await apiRequest('POST', `/api/wallet/${address}/export`, { passphrase });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to export wallet keys');
        }
        const result = await res.json();
        console.log("Wallet keys exported successfully");
        return result as WalletKeys;
      } catch (error) {
        console.error("Exception during wallet key export:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Keys exported",
        description: "Your wallet keys have been exported successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to export keys",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get wallet by address - using the exact endpoint from blueprint
  const getWallet = (address?: string) => {
    const walletAddress = address || activeWallet;
    
    return useQuery({
      queryKey: ['/api/wallet', walletAddress],
      queryFn: async () => {
        try {
          const res = await apiRequest('GET', `/api/wallet/${walletAddress}`, undefined, {
            retryCount: 5 // Increase retries for critical wallet data
          });
          return await res.json() as Wallet;
        } catch (error) {
          console.error(`Error fetching wallet ${walletAddress}:`, error);
          
          // Check if we have cached wallet data we can use temporarily
          const cachedData = queryClient.getQueryData(['/api/wallet', walletAddress]) as Wallet;
          if (cachedData) {
            console.log("Using cached wallet data while connection is restored");
            return cachedData;
          }
          
          throw error;
        }
      },
      enabled: !!walletAddress, // Only run query if address is provided
      refetchInterval: 5000, // Refetch every 5 seconds
      retry: 3, // Retry failed requests 3 times
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff with a max of 10 seconds
    });
  };

  // Get all wallets - using the exact endpoint from blueprint
  const getAllWallets = () => {
    return useQuery({
      queryKey: ['/api/wallet/all'],
      queryFn: async () => {
        const res = await apiRequest('GET', '/api/wallet/all');
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch wallets');
        }
        return await res.json() as Wallet[];
      },
      refetchInterval: 15000, // Refetch every 15 seconds
    });
  };

  // Get transactions for active wallet - using the exact endpoint from blueprint
  const getWalletTransactions = (address?: string) => {
    const walletAddress = address || activeWallet;
    
    return useQuery({
      queryKey: ['/api/wallet/history', walletAddress],
      queryFn: async () => {
        const res = await apiRequest('GET', `/api/wallet/history/${walletAddress}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `Failed to fetch transactions for address ${walletAddress}`);
        }
        return await res.json();
      },
      enabled: !!walletAddress, // Only run query if address is provided
      refetchInterval: 10000, // Refetch every 10 seconds
    });
  };

  // Send transaction - using the exact endpoint from blueprint
  const sendTransactionMutation = useMutation({
    mutationFn: async (data: TransactionRequest) => {
      // Convert to new API format
      const sendData = {
        from: data.fromAddress,
        to: data.toAddress,
        amount: data.amount,
        passphrase: data.passphrase,
        note: data.note || ""
      };
      
      const res = await apiRequest('POST', '/api/wallet/send', sendData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to send transaction');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Transaction sent",
        description: `Transaction submitted to the network successfully`,
      });
      // Update query keys to match new API paths
      if (activeWallet) {
        queryClient.invalidateQueries({ queryKey: ['/api/wallet/history', activeWallet] });
        queryClient.invalidateQueries({ queryKey: ['/api/wallet', activeWallet] });
        queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance', activeWallet] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send transaction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get active wallet data - using the exact endpoint from blueprint
  const walletQuery = useQuery({
    queryKey: ['/api/wallet', activeWallet],
    queryFn: async () => {
      if (!activeWallet) return null;
      
      console.log(`Fetching wallet data for ${activeWallet}`);
      try {
        // Use our enhanced apiRequest with exponential backoff and retries
        const res = await apiRequest('GET', `/api/wallet/${activeWallet}`, undefined, {
          retryCount: 5 // Higher number of retries for wallet data which is critical
        });
        
        return await res.json() as Wallet;
      } catch (error: any) {
        console.error("Error fetching wallet data:", error);
        
        // Special handling for specific error codes
        if (error.message && error.message.includes('404')) {
          console.log('Wallet not found in backend, clearing from localStorage');
          localStorage.removeItem('activeWallet');
          setActiveWallet(null);
          return null;
        }
        
        // Check if we have a cached version to use in case of temporary server issues
        const cachedData = queryClient.getQueryData(['/api/wallet', activeWallet]) as Wallet;
        if (cachedData) {
          console.log("Using cached wallet data due to connection error");
          // Mark data as stale so it will be refreshed as soon as connection is restored
          queryClient.invalidateQueries({ queryKey: ['/api/wallet', activeWallet] });
          return {
            ...cachedData,
            _fromCache: true
          };
        }
        
        // If the request still fails after retries but it's just a temporary connection issue
        // return a minimal wallet object to prevent UI crashes
        if (error.message && (
          error.message.includes('502') || 
          error.message.includes('503') || 
          error.message.includes('Failed to fetch')
        )) {
          console.log("Using minimal wallet object during server connection issues");
          return {
            address: activeWallet,
            publicKey: '',
            balance: '0',
            createdAt: new Date().toISOString(),
            lastSynced: new Date().toISOString(),
            _connectionError: true
          } as Wallet;
        }
        
        // For other errors, rethrow
        throw error;
      }
    },
    enabled: !!activeWallet,
    refetchInterval: 5000,
    retry: 3, // Retry failed requests 3 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff with a max of 30 seconds
  });

  // Function to refresh the wallet balance
  const refreshWalletBalance = async () => {
    if (activeWallet) {
      try {
        console.log("Manually refreshing wallet balance for:", activeWallet);
        await queryClient.invalidateQueries({ queryKey: ['/api/wallet', activeWallet] });
        await queryClient.invalidateQueries({ queryKey: ['/api/wallet/history', activeWallet] });
        await queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance', activeWallet] });
      } catch (error) {
        console.error("Error refreshing wallet balance:", error);
      }
    }
  };

  // Function to load wallet from localStorage and refresh data
  const loadWalletFromStorage = () => {
    const storedAddress = localStorage.getItem('activeWallet');
    if (storedAddress && storedAddress !== activeWallet) {
      console.log("Loading wallet from storage:", storedAddress);
      setActiveWallet(storedAddress);
      // Trigger balance refresh
      setTimeout(() => {
        refreshWalletBalance();
      }, 100);
    } else if (activeWallet) {
      // If wallet is already active, just refresh the balance
      refreshWalletBalance();
    }
  };
  
  return {
    // State
    activeWallet,
    setActiveWalletAddress,
    
    // Wallet data
    wallet: walletQuery.data,
    isLoadingWallet: walletQuery.isLoading,
    
    // Queries
    getWallet,
    getAllWallets,
    getWalletTransactions,
    
    // Mutations
    createWalletMutation,
    importWalletMutation,
    exportWalletKeysMutation,
    sendTransactionMutation,
    
    // Utility functions
    refreshWalletBalance,
    loadWalletFromStorage
  };
}