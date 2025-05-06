import { useEffect, useRef } from "react";
import { StakingControls } from "./StakingControls";
import { GovernancePanel } from "./GovernancePanel";

export function StakingSection() {
  const sectionRef = useRef<HTMLElement>(null);

  // Scroll to this section if the URL hash is #staking or #governance
  useEffect(() => {
    if ((window.location.hash === "#staking" || window.location.hash === "#governance") && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <section id="staking" className="mt-8" ref={sectionRef}>
      <h2 className="text-xl font-semibold text-white mb-4">Staking & Governance</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <StakingControls />
        <GovernancePanel />
      </div>
    </section>
  );
}
