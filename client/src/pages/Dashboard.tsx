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
      <div className="flex flex-wrap mb-6 bg-black bg-opacity-40 p-2 rounded-lg">
        <button 
          onClick={() => setActiveSection("wallet")} 
          className={`px-4 py-2 rounded-md mr-2 mb-1 ${activeSection === "wallet" ? 
            "bg-primary text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
        >
          <i className="ri-wallet-3-line mr-2"></i>Wallet
        </button>
        <button 
          onClick={() => setActiveSection("mining")} 
          className={`px-4 py-2 rounded-md mr-2 mb-1 ${activeSection === "mining" ? 
            "bg-primary text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
        >
          <i className="ri-cpu-line mr-2"></i>Mining
        </button>
        <button 
          onClick={() => setActiveSection("staking")} 
          className={`px-4 py-2 rounded-md mr-2 mb-1 ${activeSection === "staking" ? 
            "bg-primary text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
        >
          <i className="ri-coins-line mr-2"></i>Staking
        </button>
        <button 
          onClick={() => setActiveSection("nft")} 
          className={`px-4 py-2 rounded-md mr-2 mb-1 ${activeSection === "nft" ? 
            "bg-primary text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
        >
          <i className="ri-gallery-line mr-2"></i>NFTs
        </button>
        <button 
          onClick={() => setActiveSection("games")} 
          className={`px-4 py-2 rounded-md mr-2 mb-1 ${activeSection === "games" ? 
            "bg-primary text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
        >
          <i className="ri-gamepad-line mr-2"></i>Game Center
        </button>
        <button 
          onClick={() => setActiveSection("drops")} 
          className={`px-4 py-2 rounded-md mr-2 mb-1 ${activeSection === "drops" ? 
            "bg-primary text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
        >
          <i className="ri-gift-line mr-2"></i>Exclusive Drops
        </button>
        <button 
          onClick={() => setActiveSection("market")} 
          className={`px-4 py-2 rounded-md mb-1 ${activeSection === "market" ? 
            "bg-primary text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
        >
          <i className="ri-line-chart-line mr-2"></i>Market Stats
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

      {/* Game Center Section */}
      <div className={activeSection === "games" ? "block" : "hidden"}>
        <h2 className="text-2xl font-bold text-green-400 mb-6 neon">Game Center</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Game Card 1 */}
          <div className="bg-black bg-opacity-80 rounded-lg shadow overflow-hidden border border-green-500">
            <div className="h-48 bg-gray-800 flex items-center justify-center">
              <p className="text-green-500 text-lg">Crypto Miner Tycoon</p>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-green-400 neon">Crypto Miner Tycoon</h3>
              <p className="text-gray-300 text-sm mb-4">Build and manage your mining empire in this strategy game.</p>
              <button className="w-full bg-green-700 hover:bg-green-600 text-white py-2 rounded font-medium transition-colors duration-200">
                Play Now
              </button>
            </div>
          </div>
          
          {/* Game Card 2 */}
          <div className="bg-black bg-opacity-80 rounded-lg shadow overflow-hidden border border-green-500">
            <div className="h-48 bg-gray-800 flex items-center justify-center">
              <p className="text-green-500 text-lg">Blockchain Battles</p>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-green-400 neon">Blockchain Battles</h3>
              <p className="text-gray-300 text-sm mb-4">Collect, trade, and battle with NFT characters in this P2E game.</p>
              <button className="w-full bg-green-700 hover:bg-green-600 text-white py-2 rounded font-medium transition-colors duration-200">
                Play Now
              </button>
            </div>
          </div>
          
          {/* Game Card 3 */}
          <div className="bg-black bg-opacity-80 rounded-lg shadow overflow-hidden border border-green-500">
            <div className="h-48 bg-gray-800 flex items-center justify-center">
              <p className="text-green-500 text-lg">PVX Crypto Racer</p>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-green-400 neon">PVX Crypto Racer</h3>
              <p className="text-gray-300 text-sm mb-4">Race your NFT vehicles on the blockchain highway and earn PVX tokens.</p>
              <button className="w-full bg-green-700 hover:bg-green-600 text-white py-2 rounded font-medium transition-colors duration-200">
                Play Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Exclusive Drops Section */}
      <div className={activeSection === "drops" ? "block" : "hidden"}>
        <h2 className="text-2xl font-bold text-green-400 mb-6 neon">Exclusive Drops</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming Drop */}
          <div className="bg-black bg-opacity-80 rounded-lg p-6 border border-green-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-green-400 neon">Genesis Collection</h3>
              <span className="bg-green-700 text-white text-xs px-2 py-1 rounded">Coming Soon</span>
            </div>
            <p className="text-gray-300 mb-4">Limited edition collection of 100 PVX Genesis NFTs with exclusive utility and governance rights.</p>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Pre-sale Progress</span>
                <span>63% Claimed</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '63%' }}></div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-400">Starts in</p>
                <p className="text-green-400">2 days, 5 hours</p>
              </div>
              <button className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded transition-colors">
                Get Notified
              </button>
            </div>
          </div>
          
          {/* Active Drop */}
          <div className="bg-black bg-opacity-80 rounded-lg p-6 border border-green-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-green-400 neon">Hacker Vault Collection</h3>
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">Live Now</span>
            </div>
            <p className="text-gray-300 mb-4">Elite collection of 50 cyberpunk-themed NFTs with special mining boosts and exclusive access.</p>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Minted</span>
                <span>32/50</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '64%' }}></div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-400">Price</p>
                <p className="text-green-400">25 PVX</p>
              </div>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors">
                Mint Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Market Stats Section */}
      <div className={activeSection === "market" ? "block" : "hidden"}>
        <h2 className="text-2xl font-bold text-green-400 mb-6 neon">Market Stats</h2>
        
        {/* Price Chart & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-black bg-opacity-80 rounded-lg p-4 border border-green-500">
            <h3 className="text-lg font-semibold text-green-400 mb-4 neon">PVX Price Chart</h3>
            <div className="h-64 bg-gray-900 rounded flex items-center justify-center">
              <div className="w-full h-full p-4 flex items-end">
                {/* Simple price chart bars */}
                <div className="flex-1 h-[30%] bg-green-500 mx-1"></div>
                <div className="flex-1 h-[45%] bg-green-500 mx-1"></div>
                <div className="flex-1 h-[25%] bg-red-500 mx-1"></div>
                <div className="flex-1 h-[55%] bg-green-500 mx-1"></div>
                <div className="flex-1 h-[60%] bg-green-500 mx-1"></div>
                <div className="flex-1 h-[45%] bg-red-500 mx-1"></div>
                <div className="flex-1 h-[35%] bg-red-500 mx-1"></div>
                <div className="flex-1 h-[65%] bg-green-500 mx-1"></div>
                <div className="flex-1 h-[75%] bg-green-500 mx-1"></div>
                <div className="flex-1 h-[60%] bg-green-500 mx-1"></div>
                <div className="flex-1 h-[40%] bg-red-500 mx-1"></div>
                <div className="flex-1 h-[70%] bg-green-500 mx-1"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-black bg-opacity-80 rounded-lg p-4 border border-green-500">
            <h3 className="text-lg font-semibold text-green-400 mb-4 neon">Current Stats</h3>
            <ul className="space-y-4">
              <li className="flex justify-between">
                <span className="text-gray-400">Current Price:</span>
                <span className="text-green-400">$0.342</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-400">24h Change:</span>
                <span className="text-green-400">+5.2%</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-400">24h Volume:</span>
                <span className="text-green-400">1.25M PVX</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-400">Circulating Supply:</span>
                <span className="text-green-400">420M PVX</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-400">Market Cap:</span>
                <span className="text-green-400">$143.64M</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Recent Transactions */}
        <div className="bg-black bg-opacity-80 rounded-lg p-4 border border-green-500">
          <h3 className="text-lg font-semibold text-green-400 mb-4 neon">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-900 text-left">
                  <th className="py-2 px-4 text-green-400 font-medium">Type</th>
                  <th className="py-2 px-4 text-green-400 font-medium">Amount</th>
                  <th className="py-2 px-4 text-green-400 font-medium">Hash</th>
                  <th className="py-2 px-4 text-green-400 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                <tr>
                  <td className="py-2 px-4 text-gray-300">Buy</td>
                  <td className="py-2 px-4 text-green-400">+2,500 PVX</td>
                  <td className="py-2 px-4 text-gray-300 font-mono text-xs">0x58a...3f9</td>
                  <td className="py-2 px-4 text-gray-300">5 mins ago</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-gray-300">Sell</td>
                  <td className="py-2 px-4 text-red-400">-1,000 PVX</td>
                  <td className="py-2 px-4 text-gray-300 font-mono text-xs">0x72c...8b4</td>
                  <td className="py-2 px-4 text-gray-300">12 mins ago</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-gray-300">Buy</td>
                  <td className="py-2 px-4 text-green-400">+5,250 PVX</td>
                  <td className="py-2 px-4 text-gray-300 font-mono text-xs">0x93e...7d2</td>
                  <td className="py-2 px-4 text-gray-300">32 mins ago</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
