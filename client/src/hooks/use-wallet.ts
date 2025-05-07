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
      const res = await apiRequest('POST', '/api/blockchain/wallet', data);
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
      queryClient.invalidateQueries({ queryKey: ['/api/blockchain/wallets'] });
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
        const url = `${baseUrl}/api/blockchain/wallet/import`;
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
      queryClient.invalidateQueries({ queryKey: ['/api/blockchain/wallets'] });
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
        const url = `${baseUrl}/api/blockchain/wallet/${address}/export`;
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
      queryKey: ['/api/blockchain/wallet', walletAddress],
      queryFn: async () => {
        const res = await apiRequest('GET', `/api/blockchain/wallet/${walletAddress}`);
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
      queryKey: ['/api/blockchain/wallets'],
      queryFn: async () => {
        const res = await apiRequest('GET', '/api/blockchain/wallets');
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
      queryKey: ['/api/blockchain/address', walletAddress, 'transactions'],
      queryFn: async () => {
        const res = await apiRequest('GET', `/api/blockchain/address/${walletAddress}/transactions`);
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
      const res = await apiRequest('POST', '/api/blockchain/transaction', data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to send transaction');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Transaction sent",
        description: `Transaction with hash ${data.hash} has been submitted to the network`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blockchain/address', data.fromAddress, 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blockchain/wallet', data.fromAddress] });
      queryClient.invalidateQueries({ queryKey: ['/api/blockchain/wallet', data.toAddress] });
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
    queryKey: ['/api/blockchain/wallet', activeWallet],
    queryFn: async () => {
      if (!activeWallet) return null;
      
      console.log(`Fetching wallet data for ${activeWallet}`);
      try {
        const res = await fetch(`/api/blockchain/wallet/${activeWallet}`, {
          credentials: 'include'
        });
        
        if (!res.ok) {
          console.error(`Error fetching wallet: ${res.status}`);
          return null;
        }
        
        return await res.json() as Wallet;
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