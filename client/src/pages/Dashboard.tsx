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
import { OnboardingSection } from "@/components/onboarding/OnboardingSection";
import { Tooltip } from "@/components/ui/tooltip";

export default function Dashboard() {
  const { wallet, loadWalletFromStorage } = useWallet();
  const { stopMining, miningStats, startMining } = useMining();
  const { initializeStaking } = useStaking();
  const { initializeNFTs } = useNFT();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [terminalOutput, setTerminalOutput] = useState("PIXELVAULT TERMINAL v1.0\n> Loading system...\n> Welcome to PIXELVAULT secure blockchain interface\n> Type 'help' for available commands\n>");

  // Handle hash change from sidebar navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        // Remove the # symbol to get the section name
        const section = hash.substring(1);
        setActiveSection(section);
      }
    };

    // Add event listener for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

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
      
      {/* No top navigation tabs needed since we're using the sidebar */}
      
      {/* Main Dashboard Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Mining Stats Panel */}
        <div className="bg-black bg-opacity-78 rounded-lg p-4 border border-blue-800 shadow-lg shadow-blue-900/30">
          <h3 className="text-blue-400 font-semibold mb-3 text-shadow-neon">Mining Status</h3>
          <p className="text-blue-300 font-semibold">{miningStats?.isCurrentlyMining ? 'Active' : 'Inactive'}</p>
          <div className="mt-3 flex items-center">
            <div className="w-full bg-black bg-opacity-60 rounded-full h-2.5 border border-blue-900/50">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: miningStats?.isCurrentlyMining ? '85%' : '0%' }}></div>
            </div>
            <span className="ml-2 text-xs text-blue-300">{miningStats?.isCurrentlyMining ? '85%' : '0%'}</span>
          </div>
        </div>
        
        {/* Hash Rate Panel */}
        <div className="bg-black bg-opacity-78 rounded-lg p-4 border border-blue-800 shadow-lg shadow-blue-900/30">
          <h3 className="text-blue-400 font-semibold mb-3 text-shadow-neon">Hash Rate</h3>
          <p className="text-xl font-bold text-blue-300">
            {miningStats?.currentHashRate ? `${(miningStats.currentHashRate / 1000).toFixed(1)} KH/s` : '0 H/s'}
          </p>
          <p className="text-xs text-blue-400">+2.5% from yesterday</p>
        </div>
        
        {/* Earnings Panel */}
        <div className="bg-black bg-opacity-78 rounded-lg p-4 border border-blue-800 shadow-lg shadow-blue-900/30">
          <h3 className="text-blue-400 font-semibold mb-3 text-shadow-neon">Daily Earnings</h3>
          <p className="text-xl font-bold text-blue-300">
            {miningStats?.isCurrentlyMining ? '0.00124 PVX' : '0 PVX'}
          </p>
          <p className="text-xs text-blue-400">≈ $0.42 USD</p>
        </div>
      </div>

      {/* Terminal Console */}
      <div className="mb-6">
        <Terminal 
          output={terminalOutput} 
          isRunning={true} 
          className="min-h-[200px] max-h-[300px] overflow-y-auto border-blue-800 shadow-lg shadow-blue-900/30 bg-opacity-78" 
        />
        <div className="flex mt-4 space-x-2">
          <button 
            onClick={() => handleQuickCommand('start-mining')} 
            className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors shadow-md shadow-blue-900/30 border border-blue-600"
          >
            Start Mining
          </button>
          <button 
            onClick={() => handleQuickCommand('stats')} 
            className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors shadow-md shadow-blue-900/30 border border-blue-700"
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
        <h2 className="text-2xl font-bold text-blue-400 mb-6 text-shadow-neon">Game Center</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Game Card 1 */}
          <div className="bg-black bg-opacity-78 rounded-lg shadow-lg shadow-blue-900/30 overflow-hidden border border-blue-800">
            <div className="h-48 bg-black bg-opacity-78 flex items-center justify-center">
              <p className="text-blue-400 text-lg text-shadow-neon">Crypto Miner Tycoon</p>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-blue-400 text-shadow-neon mb-2">Crypto Miner Tycoon</h3>
              <p className="text-blue-300 text-sm mb-4">Build and manage your mining empire in this strategy game.</p>
              <button className="w-full bg-blue-700 hover:bg-blue-600 text-white py-2 rounded font-medium transition-colors duration-200 shadow-md shadow-blue-900/30">
                Play Now
              </button>
            </div>
          </div>
          
          {/* Game Card 2 */}
          <div className="bg-black bg-opacity-78 rounded-lg shadow-lg shadow-blue-900/30 overflow-hidden border border-blue-800">
            <div className="h-48 bg-black bg-opacity-78 flex items-center justify-center">
              <p className="text-blue-400 text-lg text-shadow-neon">Blockchain Battles</p>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-blue-400 text-shadow-neon mb-2">Blockchain Battles</h3>
              <p className="text-blue-300 text-sm mb-4">Collect, trade, and battle with NFT characters in this P2E game.</p>
              <button className="w-full bg-blue-700 hover:bg-blue-600 text-white py-2 rounded font-medium transition-colors duration-200 shadow-md shadow-blue-900/30">
                Play Now
              </button>
            </div>
          </div>
          
          {/* Game Card 3 */}
          <div className="bg-black bg-opacity-78 rounded-lg shadow-lg shadow-blue-900/30 overflow-hidden border border-blue-800">
            <div className="h-48 bg-black bg-opacity-78 flex items-center justify-center">
              <p className="text-blue-400 text-lg text-shadow-neon">PVX Crypto Racer</p>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-blue-400 text-shadow-neon mb-2">PVX Crypto Racer</h3>
              <p className="text-blue-300 text-sm mb-4">Race your NFT vehicles on the blockchain highway and earn PVX tokens.</p>
              <button className="w-full bg-blue-700 hover:bg-blue-600 text-white py-2 rounded font-medium transition-colors duration-200 shadow-md shadow-blue-900/30">
                Play Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Exclusive Drops Section */}
      <div className={activeSection === "drops" ? "block" : "hidden"}>
        <h2 className="text-2xl font-bold text-blue-400 mb-6 text-shadow-neon">Exclusive Drops</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming Drop */}
          <div className="bg-black bg-opacity-78 rounded-lg p-6 border border-blue-800 shadow-lg shadow-blue-900/30">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-blue-400 text-shadow-neon">Genesis Collection</h3>
              <span className="bg-blue-800 text-white text-xs px-2 py-1 rounded shadow-sm shadow-blue-500/30">Coming Soon</span>
            </div>
            <p className="text-blue-300 mb-4">Limited edition collection of 100 PVX Genesis NFTs with exclusive utility and governance rights.</p>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-blue-400 mb-1">
                <span>Pre-sale Progress</span>
                <span>63% Claimed</span>
              </div>
              <div className="w-full bg-black bg-opacity-60 rounded-full h-2 border border-blue-900/50">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '63%' }}></div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-400">Starts in</p>
                <p className="text-blue-300 font-medium">2 days, 5 hours</p>
              </div>
              <button className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded transition-colors shadow-md shadow-blue-900/30">
                Get Notified
              </button>
            </div>
          </div>
          
          {/* Active Drop */}
          <div className="bg-black bg-opacity-78 rounded-lg p-6 border border-blue-800 shadow-lg shadow-blue-900/30">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-blue-400 text-shadow-neon">Hacker Vault Collection</h3>
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-sm shadow-blue-500/30">Live Now</span>
            </div>
            <p className="text-blue-300 mb-4">Elite collection of 50 cyberpunk-themed NFTs with special mining boosts and exclusive access.</p>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-blue-400 mb-1">
                <span>Minted</span>
                <span>32/50</span>
              </div>
              <div className="w-full bg-black bg-opacity-60 rounded-full h-2 border border-blue-900/50">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '64%' }}></div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-400">Price</p>
                <p className="text-blue-300 font-medium">25 PVX</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors shadow-md shadow-blue-900/30">
                Mint Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Market Stats Section */}
      <div className={activeSection === "market" ? "block" : "hidden"}>
        <h2 className="text-2xl font-bold text-blue-400 mb-6 text-shadow-neon">Market Stats</h2>
        
        {/* Price Chart & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-black bg-opacity-78 rounded-lg p-4 border border-blue-800 shadow-lg shadow-blue-900/30">
            <h3 className="text-lg font-semibold text-blue-400 mb-4 text-shadow-neon">PVX Price Chart</h3>
            <div className="h-64 bg-black bg-opacity-78 rounded border border-blue-900/50 flex items-center justify-center shadow-inner shadow-blue-900/20">
              <div className="w-full h-full p-4 flex items-end">
                {/* Simple price chart bars */}
                <div className="flex-1 h-[30%] bg-blue-600 mx-1"></div>
                <div className="flex-1 h-[45%] bg-blue-600 mx-1"></div>
                <div className="flex-1 h-[25%] bg-blue-400 mx-1"></div>
                <div className="flex-1 h-[55%] bg-blue-600 mx-1"></div>
                <div className="flex-1 h-[60%] bg-blue-600 mx-1"></div>
                <div className="flex-1 h-[45%] bg-blue-400 mx-1"></div>
                <div className="flex-1 h-[35%] bg-blue-400 mx-1"></div>
                <div className="flex-1 h-[65%] bg-blue-600 mx-1"></div>
                <div className="flex-1 h-[75%] bg-blue-600 mx-1"></div>
                <div className="flex-1 h-[60%] bg-blue-600 mx-1"></div>
                <div className="flex-1 h-[40%] bg-blue-400 mx-1"></div>
                <div className="flex-1 h-[70%] bg-blue-600 mx-1"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-black bg-opacity-78 rounded-lg p-4 border border-blue-800 shadow-lg shadow-blue-900/30">
            <h3 className="text-lg font-semibold text-blue-400 mb-4 text-shadow-neon">Current Stats</h3>
            <ul className="space-y-4">
              <li className="flex justify-between items-center">
                <span className="text-blue-300">Current Price:</span>
                <span className="text-blue-400 font-medium text-shadow-neon bg-black bg-opacity-78 px-2 py-1 rounded border border-blue-900/50">$0.342</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-blue-300">24h Change:</span>
                <span className="text-blue-400 font-medium text-shadow-neon bg-black bg-opacity-78 px-2 py-1 rounded border border-blue-900/50">+5.2%</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-blue-300">24h Volume:</span>
                <span className="text-blue-400 font-medium text-shadow-neon bg-black bg-opacity-78 px-2 py-1 rounded border border-blue-900/50">1.25M PVX</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-blue-300">Circulating Supply:</span>
                <span className="text-blue-400 font-medium text-shadow-neon bg-black bg-opacity-78 px-2 py-1 rounded border border-blue-900/50">420M PVX</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-blue-300">Market Cap:</span>
                <span className="text-blue-400 font-medium text-shadow-neon bg-black bg-opacity-78 px-2 py-1 rounded border border-blue-900/50">$143.64M</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Recent Transactions */}
        <div className="bg-black bg-opacity-78 rounded-lg p-4 border border-blue-800 shadow-lg shadow-blue-900/30">
          <h3 className="text-lg font-semibold text-blue-400 mb-4 text-shadow-neon">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-black bg-opacity-78 text-left border-b border-blue-900/50">
                  <th className="py-2 px-4 text-blue-400 font-medium">Type</th>
                  <th className="py-2 px-4 text-blue-400 font-medium">Amount</th>
                  <th className="py-2 px-4 text-blue-400 font-medium">Hash</th>
                  <th className="py-2 px-4 text-blue-400 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/30">
                <tr>
                  <td className="py-2 px-4 text-blue-300">Buy</td>
                  <td className="py-2 px-4 text-blue-400">+2,500 PVX</td>
                  <td className="py-2 px-4 text-blue-300 font-mono text-xs">0x58a...3f9</td>
                  <td className="py-2 px-4 text-blue-300">5 mins ago</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-blue-300">Sell</td>
                  <td className="py-2 px-4 text-blue-400">-1,000 PVX</td>
                  <td className="py-2 px-4 text-blue-300 font-mono text-xs">0x72c...8b4</td>
                  <td className="py-2 px-4 text-blue-300">12 mins ago</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-blue-300">Buy</td>
                  <td className="py-2 px-4 text-blue-400">+5,250 PVX</td>
                  <td className="py-2 px-4 text-blue-300 font-mono text-xs">0x93e...7d2</td>
                  <td className="py-2 px-4 text-blue-300">32 mins ago</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Learning/Onboarding Section */}
      <div className={activeSection === "learn" ? "block" : "hidden"}>
        <h2 className="text-2xl font-bold text-blue-400 mb-6 text-shadow-neon">Learning Center</h2>
        <OnboardingSection />
      </div>
      

      
      {/* Blockchain terminology example in the footer */}
      <div className="fixed bottom-5 right-5 bg-black bg-opacity-78 p-3 rounded-lg border border-blue-800 text-xs text-blue-300 max-w-xs shadow-lg shadow-blue-900/30">
        <div>
          Hover over highlighted terms like <Tooltip term="blockchain" highlightStyle="dotted">blockchain</Tooltip>,{" "}
          <Tooltip term="zero-knowledge proof" highlightStyle="glow">zero-knowledge proof</Tooltip>, or{" "}
          <Tooltip term="consensus" highlightStyle="underline">consensus</Tooltip> to learn more.
        </div>
      </div>
    </PageLayout>
  );
}
