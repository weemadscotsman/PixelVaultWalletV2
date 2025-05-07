import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../lib/queryClient';
import { useToast } from './use-toast';

export type Wallet = {
  id: string;
  address: string;
  privateKey: string;
  publicKey: string;
  balance: string;
  mnemonicPhrase?: string;
  isZkEnabled: boolean;
};

export function useWallet() {
  const { toast } = useToast();
  const [storedWallet, setStoredWallet] = useState<Wallet | null>(null);
  
  // Load wallet from localStorage on component mount
  useEffect(() => {
    const walletData = localStorage.getItem('pvx_wallet');
    if (walletData) {
      try {
        setStoredWallet(JSON.parse(walletData));
      } catch (e) {
        console.error('Failed to parse wallet data from localStorage');
      }
    }
  }, []);
  
  // Create a new wallet
  const createWalletMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/wallet/create');
      return await response.json();
    },
    onSuccess: (wallet: Wallet) => {
      localStorage.setItem('pvx_wallet', JSON.stringify(wallet));
      setStoredWallet(wallet);
      toast({
        title: 'Wallet Created',
        description: 'Your new PVX wallet has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Create Wallet',
        description: error.message || 'There was an error creating your wallet.',
        variant: 'destructive',
      });
    },
  });
  
  // Import wallet from private key
  const importWalletMutation = useMutation({
    mutationFn: async (privateKey: string) => {
      const response = await apiRequest('POST', '/api/wallet/import', { privateKey });
      return await response.json();
    },
    onSuccess: (wallet: Wallet) => {
      localStorage.setItem('pvx_wallet', JSON.stringify(wallet));
      setStoredWallet(wallet);
      toast({
        title: 'Wallet Imported',
        description: 'Your PVX wallet has been imported successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Import Wallet',
        description: error.message || 'There was an error importing your wallet.',
        variant: 'destructive',
      });
    },
  });
  
  // Get wallet balance (refreshes on interval)
  const { data: walletBalance, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['/api/wallet/balance', storedWallet?.address],
    queryFn: async () => {
      if (!storedWallet?.address) return null;
      const response = await apiRequest('GET', `/api/wallet/balance?address=${storedWallet.address}`);
      return await response.json();
    },
    enabled: !!storedWallet?.address,
    refetchInterval: 15000, // Refresh every 15 seconds
  });
  
  // Update wallet with latest balance
  useEffect(() => {
    if (walletBalance && storedWallet) {
      const updatedWallet = { ...storedWallet, balance: walletBalance.balance };
      setStoredWallet(updatedWallet);
      localStorage.setItem('pvx_wallet', JSON.stringify(updatedWallet));
    }
  }, [walletBalance, storedWallet]);
  
  // Clear wallet from storage
  const clearWallet = () => {
    localStorage.removeItem('pvx_wallet');
    setStoredWallet(null);
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected.',
    });
  };
  
  return {
    wallet: storedWallet,
    createWallet: createWalletMutation.mutate,
    importWallet: importWalletMutation.mutate,
    clearWallet,
    isCreatingWallet: createWalletMutation.isPending,
    isImportingWallet: importWalletMutation.isPending,
    isLoadingBalance,
  };
}