import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function MobileNavigation() {
  const [location] = useLocation();
  
  const isActive = (hash: string) => {
    return location === "/" && window.location.hash === hash;
  };

  const navItems = [
    { id: "#wallet", icon: "ri-wallet-3-line", label: "Wallet" },
    { id: "#mining", icon: "ri-hammer-line", label: "Mining" },
    { id: "#staking", icon: "ri-stack-line", label: "Staking" },
    { id: "#governance", icon: "ri-government-line", label: "Governance" },
    { id: "#nft", icon: "ri-nft-line", label: "NFT" },
  ];

  return (
    <div className="md:hidden flex justify-between mb-4 bg-sidebar p-2 rounded-md overflow-x-auto whitespace-nowrap">
      {navItems.map((item) => (
        <Link key={item.id} href={`/${item.id}`}>
          <a
            href={item.id}
            className={cn(
              "px-4 py-2 text-center flex-shrink-0 rounded-md",
              isActive(item.id)
                ? "text-white bg-primary"
                : "text-gray-300 hover:bg-gray-800"
            )}
          >
            <i className={`${item.icon} block mx-auto mb-1`}></i>
            <span className="text-xs">{item.label}</span>
          </a>
        </Link>
      ))}
    </div>
  );
}
