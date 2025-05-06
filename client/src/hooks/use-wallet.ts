import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { generateWallet, loadWallet, getWalletBalance, getWalletTransactions, getWalletMnemonic, createTransaction as createTx } from "@/lib/wallet";
import { Wallet, WalletInfo } from "@/types/wallet";
import { Transaction } from "@/types/blockchain";
import { useToast } from "./use-toast";

export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [mnemonicRevealed, setMnemonicRevealed] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Load wallet from localStorage
  const loadWalletFromStorage = useCallback(() => {
    const storedWallet = loadWallet();
    if (storedWallet) {
      setWallet(storedWallet);
      setLastUpdated(storedWallet.lastUpdated);
      // Store current wallet address for transaction component to use
      localStorage.setItem("currentWalletAddress", storedWallet.publicAddress);

      // Load mnemonic if it exists but keep it hidden
      const storedMnemonic = getWalletMnemonic();
      if (storedMnemonic) {
        setMnemonic(storedMnemonic);
      }
    }
  }, []);

  // Generate a new wallet
  const generateNewWallet = useCallback(async (useMnemonic: boolean = false, entropy?: string) => {
    try {
      setIsGenerating(true);
      const newWallet = await generateWallet(useMnemonic, entropy);
      setWallet(newWallet);
      setLastUpdated(new Date());
      
      // Store current wallet address for transaction component to use
      localStorage.setItem("currentWalletAddress", newWallet.publicAddress);
      
      // Load mnemonic if it was generated
      if (useMnemonic) {
        const generatedMnemonic = getWalletMnemonic();
        setMnemonic(generatedMnemonic);
        setMnemonicRevealed(false);
      }
      
      // Refresh data after wallet generation
      queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] });
      
      toast({
        title: "Wallet Generated",
        description: "Your new zkSNARK wallet has been created successfully.",
      });
      
      return newWallet;
    } catch (error) {
      console.error("Error generating wallet:", error);
      toast({
        title: "Wallet Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate wallet",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [queryClient, toast]);

  // Reveal or hide mnemonic
  const revealMnemonic = useCallback(() => {
    setMnemonicRevealed(true);
  }, []);
  
  const hideMnemonic = useCallback(() => {
    setMnemonicRevealed(false);
  }, []);

  // Get wallet balance
  const { refetch: refreshBalance, isLoading: isBalanceLoading } = useQuery({
    queryKey: [`/api/wallet/balance?address=${wallet?.publicAddress || ''}`],
    enabled: !!wallet,
    onSuccess: (data) => {
      if (wallet && data) {
        setWallet({
          ...wallet,
          balance: data.balance,
          lastUpdated: new Date()
        });
        setLastUpdated(new Date());
      }
    },
    onError: (error) => {
      console.error("Error fetching balance:", error);
      toast({
        title: "Balance Update Failed",
        description: error instanceof Error ? error.message : "Failed to update balance",
        variant: "destructive",
      });
    }
  });

  // Get wallet transactions
  const { refetch: refreshTransactions, isLoading: isTransactionsLoading } = useQuery({
    queryKey: [`/api/wallet/transactions?address=${wallet?.publicAddress || ''}`],
    enabled: !!wallet,
    onSuccess: (data) => {
      if (data) {
        setTransactions(data);
      }
    },
    onError: (error) => {
      console.error("Error fetching transactions:", error);
      toast({
        title: "Transaction Load Failed",
        description: error instanceof Error ? error.message : "Failed to load transactions",
        variant: "destructive",
      });
    }
  });

  // Create transaction mutation
  const { mutateAsync: createTransaction, isPending: isTransactionPending } = useMutation({
    mutationFn: async (params: { 
      fromAddress: string; 
      toAddress: string; 
      amount: number;
      note?: string;
    }) => {
      if (!wallet) throw new Error("No wallet found");

      return createTx(
        params.fromAddress,
        params.toAddress,
        params.amount,
        wallet.privateKey,
        params.note
      );
    },
    onSuccess: () => {
      // Refresh wallet data after transaction
      refreshBalance();
      refreshTransactions();
      
      toast({
        title: "Transaction Successful",
        description: "Your transaction has been processed successfully.",
      });
    },
    onError: (error) => {
      console.error("Transaction error:", error);
      toast({
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : "Failed to process transaction",
        variant: "destructive",
      });
      throw error;
    }
  });

  // Combine loading states
  const isLoading = isBalanceLoading || isTransactionsLoading || isTransactionPending;

  // Initial load
  useEffect(() => {
    loadWalletFromStorage();
  }, [loadWalletFromStorage]);

  // Auto refresh data when wallet changes
  useEffect(() => {
    if (wallet) {
      refreshBalance();
      refreshTransactions();
    }
  }, [wallet, refreshBalance, refreshTransactions]);

  return {
    wallet,
    transactions,
    isLoading,
    isGenerating,
    lastUpdated,
    mnemonic,
    mnemonicRevealed,
    loadWalletFromStorage,
    generateNewWallet,
    refreshBalance: () => {
      refreshBalance();
      refreshTransactions();
    },
    createTransaction: async (fromAddress: string, toAddress: string, amount: number, note?: string) => {
      return createTransaction({ fromAddress, toAddress, amount, note });
    },
    revealMnemonic,
    hideMnemonic
  };
}
