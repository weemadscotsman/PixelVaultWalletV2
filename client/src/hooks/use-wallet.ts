import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

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
  
  // Check if there's a bad wallet address in localStorage and remove it
  const storedWallet = localStorage.getItem('activeWallet');
  if (storedWallet === 'PVX_21800303904d0d372b6fe9c67066650e') {
    console.log('Removing invalid wallet from localStorage on initialization');
    localStorage.removeItem('activeWallet');
  }
  
  const [activeWallet, setActiveWallet] = useState<string | null>(
    localStorage.getItem('activeWallet')
  );

  // Set active wallet
  const setActiveWalletAddress = (address: string | null) => {
    setActiveWallet(address);
    if (address) {
      localStorage.setItem('activeWallet', address);
    } else {
      localStorage.removeItem('activeWallet');
    }
  };

  // Create a new wallet
  const createWalletMutation = useMutation({
    mutationFn: async (data: CreateWalletRequest) => {
      // Update to use new API path
      const res = await apiRequest('POST', '/api/wallet/create', data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create wallet');
      }
      return await res.json() as Wallet;
    },
    onSuccess: (data) => {
      toast({
        title: "Wallet created",
        description: `New wallet created with address ${data.address}`,
      });
      setActiveWalletAddress(data.address);
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

  // Import existing wallet
  const importWalletMutation = useMutation({
    mutationFn: async (data: ImportWalletRequest) => {
      console.log("Importing wallet with privateKey length:", data.privateKey.length);
      
      try {
        // Create full URL for better debugging
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/api/wallet/import`;
        console.log(`Making API request to ${url}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          credentials: 'include',
        });
        
        console.log(`API Response status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error importing wallet:", errorText);
          throw new Error(errorText || `Failed with status ${response.status}`);
        }
        
        const result = await response.json();
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

  // Export wallet keys
  const exportWalletKeysMutation = useMutation({
    mutationFn: async (data: ExportWalletRequest) => {
      const { address, passphrase } = data;
      console.log(`Exporting wallet keys for address: ${address}`);
      
      try {
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/api/wallet/${address}/export`;
        console.log(`Making API request to ${url}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ passphrase }),
          credentials: 'include',
        });
        
        console.log(`Export API Response status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error exporting wallet keys:", errorText);
          throw new Error(errorText || `Failed with status ${response.status}`);
        }
        
        const result = await response.json();
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

  // Get wallet by address
  const getWallet = (address?: string) => {
    const walletAddress = address || activeWallet;
    
    return useQuery({
      queryKey: ['/api/wallet/balance', walletAddress],
      queryFn: async () => {
        const res = await apiRequest('GET', `/api/wallet/balance/${walletAddress}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `Failed to fetch wallet with address ${walletAddress}`);
        }
        return await res.json() as Wallet;
      },
      enabled: !!walletAddress, // Only run query if address is provided
      refetchInterval: 5000, // Refetch every 5 seconds
    });
  };

  // Get all wallets
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

  // Get transactions for active wallet
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

  // Send transaction
  const sendTransactionMutation = useMutation({
    mutationFn: async (data: TransactionRequest) => {
      // Convert to new API format
      const sendData = {
        from: data.fromAddress,
        to: data.toAddress,
        amount: data.amount,
        passphrase: data.passphrase,
        memo: data.note || ""
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

  // Get active wallet data
  const walletQuery = useQuery({
    queryKey: ['/api/wallet/balance', activeWallet],
    queryFn: async () => {
      if (!activeWallet) return null;
      
      console.log(`Fetching wallet data for ${activeWallet}`);
      try {
        const res = await fetch(`/api/wallet/balance/${activeWallet}`, {
          credentials: 'include'
        });
        
        if (!res.ok) {
          console.error(`Error fetching wallet: ${res.status}`);
          // If we get a 404, the wallet doesn't exist, so clear it from localStorage
          if (res.status === 404) {
            console.log('Wallet not found in backend, clearing from localStorage');
            localStorage.removeItem('activeWallet');
            setActiveWallet(null);
          }
          return null;
        }
        
        // Convert balance response to wallet format
        const balanceData = await res.json();
        return {
          address: activeWallet,
          balance: balanceData.balance || "0",
          publicKey: "", // Will be filled later if needed
          createdAt: new Date().toISOString(),
          lastSynced: new Date().toISOString()
        } as Wallet;
      } catch (error) {
        console.error("Error fetching wallet data:", error);
        return null;
      }
    },
    enabled: !!activeWallet,
    refetchInterval: 5000
  });

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
  };
}