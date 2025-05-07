import { useEffect, useRef } from "react";
import { WalletGenerator } from "./WalletGenerator";
import { BalanceCard } from "./BalanceCard";
import { useWallet } from "@/hooks/use-wallet";

export function WalletSection() {
  const { wallet, refreshBalance } = useWallet();
  const sectionRef = useRef<HTMLElement>(null);

  // Scroll to this section if the URL hash is #wallet
  useEffect(() => {
    if (window.location.hash === "#wallet" && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <section id="wallet" ref={sectionRef}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Wallet</h2>
        <button 
          onClick={refreshBalance} 
          className="text-gray-400 hover:text-white"
          aria-label="Refresh balance"
        >
          <i className="ri-refresh-line text-lg"></i>
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <WalletGenerator />
        <BalanceCard />
      </div>
    </section>
  );
}
