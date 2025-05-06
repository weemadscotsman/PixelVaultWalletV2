import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mintNFT as mintNFTApi, getNFTs as getNFTsApi } from "@/lib/nft";
import { NFT } from "@/types/blockchain";
import { useToast } from "./use-toast";

export function useNFT() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with wallet address
  const initializeNFTs = useCallback((address: string) => {
    setWalletAddress(address);
  }, []);

  // Fetch NFTs when wallet address is available
  const { refetch: refreshNFTs, isLoading: isNFTsLoading } = useQuery({
    queryKey: [`/api/nft/owned?address=${walletAddress}`],
    enabled: !!walletAddress,
    onSuccess: (data: NFT[]) => {
      if (data) {
        setNfts(data);
      }
    },
    onError: (error) => {
      console.error("Error fetching NFTs:", error);
      toast({
        title: "Failed to Load NFTs",
        description: error instanceof Error ? error.message : "Could not load your NFT collection",
        variant: "destructive",
      });
    }
  });

  // Mint NFT mutation
  const { mutateAsync: mintNFTMutation, isPending: isMinting } = useMutation({
    mutationFn: async (params: { 
      ownerAddress: string; 
      name: string; 
      description: string; 
      file: File;
      enableZkVerification: boolean;
      hideOwnerAddress: boolean;
    }) => {
      return mintNFTApi(
        params.ownerAddress,
        params.name,
        params.description,
        params.file,
        params.enableZkVerification,
        params.hideOwnerAddress
      );
    },
    onSuccess: () => {
      // Refresh NFTs after minting
      refreshNFTs();
      
      toast({
        title: "NFT Minted",
        description: "Your NFT has been minted successfully.",
      });
    },
    onError: (error) => {
      console.error("Minting error:", error);
      toast({
        title: "NFT Minting Failed",
        description: error instanceof Error ? error.message : "Failed to mint your NFT",
        variant: "destructive",
      });
      throw error;
    }
  });

  // Update loading state
  useEffect(() => {
    setIsLoading(isNFTsLoading || isMinting);
  }, [isNFTsLoading, isMinting]);

  // Refresh NFTs periodically
  useEffect(() => {
    if (walletAddress) {
      // Initial load
      refreshNFTs();
      
      // Set up periodic refresh
      const interval = setInterval(() => {
        refreshNFTs();
      }, 60000); // every minute
      
      return () => clearInterval(interval);
    }
  }, [walletAddress, refreshNFTs]);

  return {
    nfts,
    isLoading,
    initializeNFTs,
    mintNFT: async (
      ownerAddress: string,
      name: string,
      description: string,
      file: File,
      enableZkVerification: boolean,
      hideOwnerAddress: boolean
    ) => {
      return mintNFTMutation({
        ownerAddress,
        name,
        description,
        file,
        enableZkVerification,
        hideOwnerAddress
      });
    }
  };
}
