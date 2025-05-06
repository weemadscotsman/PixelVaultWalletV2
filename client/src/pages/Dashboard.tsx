import { useEffect, useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { WalletSection } from "@/components/wallet/WalletSection";
import { MiningSection } from "@/components/mining/MiningSection";
import { StakingSection } from "@/components/staking/StakingSection";
import { NFTSection } from "@/components/nft/NFTSection";
import { useWallet } from "@/hooks/use-wallet";
import { useMining } from "@/hooks/use-mining";
import { useStaking } from "@/hooks/use-staking";
import { useNFT } from "@/hooks/use-nft";
import { MatrixBackground } from "@/components/ui/MatrixBackground";
import { Terminal } from "@/components/ui/Terminal";

export default function Dashboard() {
  const { wallet, loadWalletFromStorage } = useWallet();
  const { stopMining, miningStats, startMining } = useMining();
  const { initializeStaking } = useStaking();
  const { initializeNFTs } = useNFT();
  const [activeSection, setActiveSection] = useState("wallet");
  const [terminalOutput, setTerminalOutput] = useState("PIXELVAULT TERMINAL v1.0\n> Loading system...\n> Welcome to PIXELVAULT secure blockchain interface\n> Type 'help' for available commands\n>");

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

  const addTerminalLine = (line: string) => {
    setTerminalOutput(prev => `${prev}\n${line}\n>`);
  };

  const handleQuickCommand = (command: string) => {
    addTerminalLine(`$ ${command}`);
    
    switch (command) {
      case 'start-mining':
        if (wallet) {
          startMining();
          setTimeout(() => {
            addTerminalLine('Mining operation initialized');
            addTerminalLine('Connected to PVX network');
            addTerminalLine('Calculating hash rate...');
          }, 500);
        } else {
          addTerminalLine('Error: No wallet connected');
        }
        break;
      case 'stats':
        addTerminalLine('PVX Network Stats:');
        addTerminalLine('-------------------------');
        addTerminalLine('Current difficulty: 1243.45');
        addTerminalLine(`Hash rate: ${miningStats?.currentHashRate || 0} H/s`);
        addTerminalLine(`Blocks mined: ${miningStats?.blocksMined || 0}`);
        break;
      default:
        addTerminalLine(`Unknown command: ${command}`);
    }
  };

  return (
    <PageLayout isConnected={!!wallet}>
      {/* Matrix Background Effect */}
      <MatrixBackground />
      
      {/* Quick Navigation Tabs */}
      <div className="flex mb-6 bg-black bg-opacity-40 p-2 rounded-lg">
        <button 
          onClick={() => setActiveSection("wallet")} 
          className={`px-4 py-2 rounded-md mr-2 ${activeSection === "wallet" ? 
            "bg-primary text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
        >
          <i className="ri-wallet-3-line mr-2"></i>Wallet
        </button>
        <button 
          onClick={() => setActiveSection("mining")} 
          className={`px-4 py-2 rounded-md mr-2 ${activeSection === "mining" ? 
            "bg-primary text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
        >
          <i className="ri-cpu-line mr-2"></i>Mining
        </button>
        <button 
          onClick={() => setActiveSection("staking")} 
          className={`px-4 py-2 rounded-md mr-2 ${activeSection === "staking" ? 
            "bg-primary text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
        >
          <i className="ri-coins-line mr-2"></i>Staking
        </button>
        <button 
          onClick={() => setActiveSection("nft")} 
          className={`px-4 py-2 rounded-md ${activeSection === "nft" ? 
            "bg-primary text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
        >
          <i className="ri-gallery-line mr-2"></i>NFTs
        </button>
      </div>
      
      {/* Main Dashboard Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Mining Stats Panel */}
        <div className="bg-black bg-opacity-80 rounded-lg p-4 border border-green-500 shadow-lg">
          <h3 className="text-green-400 font-medium mb-2 neon">Mining Status</h3>
          <p className="text-green-500 font-semibold">{miningStats?.isCurrentlyMining ? 'Active' : 'Inactive'}</p>
          <div className="mt-2 flex items-center">
            <div className="w-full bg-gray-800 rounded-full h-2.5">
              <div className="bg-green-500 h-2.5 rounded-full" style={{ width: miningStats?.isCurrentlyMining ? '85%' : '0%' }}></div>
            </div>
            <span className="ml-2 text-xs text-gray-400">{miningStats?.isCurrentlyMining ? '85%' : '0%'}</span>
          </div>
        </div>
        
        {/* Hash Rate Panel */}
        <div className="bg-black bg-opacity-80 rounded-lg p-4 border border-green-500 shadow-lg">
          <h3 className="text-green-400 font-medium mb-2 neon">Hash Rate</h3>
          <p className="text-xl font-bold text-white">
            {miningStats?.currentHashRate ? `${(miningStats.currentHashRate / 1000).toFixed(1)} KH/s` : '0 H/s'}
          </p>
          <p className="text-xs text-green-500">+2.5% from yesterday</p>
        </div>
        
        {/* Earnings Panel */}
        <div className="bg-black bg-opacity-80 rounded-lg p-4 border border-green-500 shadow-lg">
          <h3 className="text-green-400 font-medium mb-2 neon">Daily Earnings</h3>
          <p className="text-xl font-bold text-white">
            {miningStats?.isCurrentlyMining ? '0.00124 PVX' : '0 PVX'}
          </p>
          <p className="text-xs text-green-500">≈ $0.42 USD</p>
        </div>
      </div>

      {/* Terminal Console */}
      <div className="mb-6">
        <Terminal 
          output={terminalOutput} 
          isRunning={true} 
          className="min-h-[200px] max-h-[300px] overflow-y-auto" 
        />
        <div className="flex mt-4 space-x-2">
          <button 
            onClick={() => handleQuickCommand('start-mining')} 
            className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Start Mining
          </button>
          <button 
            onClick={() => handleQuickCommand('stats')} 
            className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Network Stats
          </button>
        </div>
      </div>
      
      {/* Main Section Content */}
      <div className={activeSection === "wallet" ? "block" : "hidden"}>
        <WalletSection />
      </div>
      <div className={activeSection === "mining" ? "block" : "hidden"}>
        <MiningSection />
      </div>
      <div className={activeSection === "staking" ? "block" : "hidden"}>
        <StakingSection />
      </div>
      <div className={activeSection === "nft" ? "block" : "hidden"}>
        <NFTSection />
      </div>
    </PageLayout>
  );
}
