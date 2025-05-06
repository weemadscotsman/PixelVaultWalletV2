import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface NetworkStatsType {
  blockHeight: number;
  blockTime: string;
  peers: number;
  hashRate: string;
}

interface SidebarProps {
  networkStats: NetworkStatsType;
}

export function Sidebar({ networkStats }: SidebarProps) {
  const [location] = useLocation();

  const isActive = (hash: string) => {
    return location === "/" && window.location.hash === hash;
  };

  const navItems = [
    { id: "#wallet", icon: "ri-wallet-3-line", label: "Wallet" },
    { id: "#mining", icon: "ri-hammer-line", label: "Mining" },
    { id: "#staking", icon: "ri-stack-line", label: "Staking" },
    { id: "#governance", icon: "ri-government-line", label: "Governance" },
    { id: "#nft", icon: "ri-nft-line", label: "NFT Minting" },
  ];

  return (
    <aside className="hidden md:block w-64 bg-sidebar border-r border-gray-700">
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <Link href={`/${item.id}`}>
                <a
                  href={item.id}
                  className={cn(
                    "flex items-center p-2 rounded-md",
                    isActive(item.id)
                      ? "bg-primary text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  )}
                >
                  <i className={`${item.icon} mr-3 text-lg`}></i>
                  <span>{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <h3 className="text-xs uppercase text-gray-500 font-medium px-2 mb-2">
            Network Status
          </h3>
          <div className="bg-background p-3 rounded-md text-sm space-y-2 text-gray-300">
            <div className="flex justify-between">
              <span>Block Height:</span>
              <span className="font-mono">
                {networkStats.blockHeight.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Block Time:</span>
              <span className="font-mono">{networkStats.blockTime}</span>
            </div>
            <div className="flex justify-between">
              <span>Peers:</span>
              <span className="font-mono">{networkStats.peers}</span>
            </div>
            <div className="flex justify-between">
              <span>Hash Rate:</span>
              <span className="font-mono">{networkStats.hashRate}</span>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}
