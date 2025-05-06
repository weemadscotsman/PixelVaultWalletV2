import { useEffect, useRef } from "react";
import { NFTMinter } from "./NFTMinter";
import { NFTCollection } from "./NFTCollection";

export function NFTSection() {
  const sectionRef = useRef<HTMLElement>(null);

  // Scroll to this section if the URL hash is #nft
  useEffect(() => {
    if (window.location.hash === "#nft" && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <section id="nft" className="mt-8 mb-8" ref={sectionRef}>
      <h2 className="text-xl font-semibold text-white mb-4">NFT Minting</h2>
      
      <div className="bg-card rounded-xl p-6 border border-gray-700">
        <div className="grid md:grid-cols-2 gap-6">
          <NFTMinter />
          <NFTCollection />
        </div>
      </div>
    </section>
  );
}
