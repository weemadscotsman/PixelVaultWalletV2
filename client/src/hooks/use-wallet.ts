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
        const res = await apiRequest('POST', '/api/blockchain/wallet/import', data);
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

  // Export wallet keys
  const exportWalletKeysMutation = useMutation({
    mutationFn: async (data: ExportWalletRequest) => {
      const { address, passphrase } = data;
      console.log(`Exporting wallet keys for address: ${address}`);
      
      try {
        const res = await apiRequest('POST', `/api/blockchain/wallet/${address}/export`, { passphrase });
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
      queryKey: ['/api/blockchain/transactions', walletAddress],
      queryFn: async () => {
        const res = await apiRequest('GET', `/api/blockchain/transactions/${walletAddress}`);
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
        note: data.note || ""
      };
      
      const res = await apiRequest('POST', '/api/blockchain/transaction', sendData);
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
        queryClient.invalidateQueries({ queryKey: ['/api/blockchain/transactions', activeWallet] });
        queryClient.invalidateQueries({ queryKey: ['/api/blockchain/wallet', activeWallet] });
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
    queryKey: ['/api/blockchain/wallet', activeWallet],
    queryFn: async () => {
      if (!activeWallet) return null;
      
      console.log(`Fetching wallet data for ${activeWallet}`);
      try {
        const res = await apiRequest('GET', `/api/blockchain/wallet/${activeWallet}`);
        if (!res.ok) {
          const errorStatus = res.status;
          console.error(`Error fetching wallet: ${errorStatus}`);
          
          // If we get a 404, the wallet doesn't exist, so clear it from localStorage
          if (errorStatus === 404) {
            console.log('Wallet not found in backend, clearing from localStorage');
            localStorage.removeItem('activeWallet');
            setActiveWallet(null);
          }
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