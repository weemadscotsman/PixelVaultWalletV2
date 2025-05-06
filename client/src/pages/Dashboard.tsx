import { useEffect } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { WalletSection } from "@/components/wallet/WalletSection";
import { MiningSection } from "@/components/mining/MiningSection";
import { StakingSection } from "@/components/staking/StakingSection";
import { NFTSection } from "@/components/nft/NFTSection";
import { useWallet } from "@/hooks/use-wallet";
import { useMining } from "@/hooks/use-mining";
import { useStaking } from "@/hooks/use-staking";
import { useNFT } from "@/hooks/use-nft";

export default function Dashboard() {
  const { wallet, loadWalletFromStorage } = useWallet();
  const { stopMining } = useMining();
  const { initializeStaking } = useStaking();
  const { initializeNFTs } = useNFT();

  useEffect(() => {
    // Load wallet from storage on initial render
    loadWalletFromStorage();
    
    // Clean up mining on component unmount
    return () => {
      stopMining();
    };
  }, [loadWalletFromStorage, stopMining]);

  useEffect(() => {
    // Initialize staking and NFTs when wallet is loaded
    if (wallet) {
      initializeStaking(wallet.publicAddress);
      initializeNFTs(wallet.publicAddress);
    }
  }, [wallet, initializeStaking, initializeNFTs]);

  return (
    <PageLayout isConnected={!!wallet}>
      <WalletSection />
      <MiningSection />
      <StakingSection />
      <NFTSection />
    </PageLayout>
  );
}
