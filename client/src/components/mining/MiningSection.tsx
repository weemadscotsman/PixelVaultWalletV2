import { useEffect, useRef } from "react";
import { MiningControls } from "./MiningControls";
import { RewardStatistics } from "./RewardStatistics";
import { useMining } from "@/hooks/use-mining";

export function MiningSection() {
  const { blockReward } = useMining();
  const sectionRef = useRef<HTMLElement>(null);

  // Scroll to this section if the URL hash is #mining
  useEffect(() => {
    if (window.location.hash === "#mining" && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <section id="mining" className="mt-8" ref={sectionRef}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Mining</h2>
        <div className="text-sm px-3 py-1 bg-card rounded-full border border-gray-700">
          <span className="text-gray-400">Current Block Reward:</span>
          <span className="text-white font-medium ml-1">{blockReward} PVX</span>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <MiningControls />
        <RewardStatistics />
      </div>
    </section>
  );
}
