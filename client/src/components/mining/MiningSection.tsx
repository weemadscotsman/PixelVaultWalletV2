import { useEffect, useRef, useState } from "react";
import { MiningControls } from "./MiningControls";
import { RewardStatistics } from "./RewardStatistics";
import { useMining } from "@/hooks/use-mining";

export function MiningSection() {
  const { blockReward, miningStats, isMining, startMining, stopMining } = useMining();
  const sectionRef = useRef<HTMLElement>(null);
  const [miningOutput, setMiningOutput] = useState<string>("Awaiting command...");
  const [hashRate, setHashRate] = useState<string>("0 MH/s");
  const [earnings, setEarnings] = useState<string>("0.00000 PVX");
  
  // Scroll to this section if the URL hash is #mining
  useEffect(() => {
    if (window.location.hash === "#mining" && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);
  
  // Function to simulate mining CLI output
  const runMiningCLI = async () => {
    if (isMining) {
      setMiningOutput("Stopping mining operations...");
      await stopMining();
      setTimeout(() => {
        setMiningOutput("Mining operations stopped successfully.\nAwaiting command...");
      }, 1000);
    } else {
      setMiningOutput("Initializing mining operations...\nConnecting to PVX network...");
      
      setTimeout(() => {
        setMiningOutput(prev => prev + "\nChecking hardware capabilities...");
      }, 500);
      
      setTimeout(() => {
        setMiningOutput(prev => prev + "\nValidating blockchain state...");
      }, 1000);
      
      setTimeout(() => {
        setMiningOutput(prev => prev + "\nSetting up zkSNARK verification module...");
      }, 1500);
      
      setTimeout(() => {
        setMiningOutput(prev => prev + "\nStarting mining threads...");
        startMining();
      }, 2000);
      
      setTimeout(() => {
        setMiningOutput(prev => prev + "\nMining operations started successfully.\n\nMining statistics will appear here...");
        setHashRate(`${(Math.random() * 100 + 150).toFixed(1)} MH/s`);
        setEarnings(`${(Math.random() * 0.001 + 0.0001).toFixed(6)} PVX`);
      }, 2500);
    }
  };

  return (
    <section id="mining" className="mt-8 page-content active" ref={sectionRef}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Mining Dashboard</h2>
        <div className="text-sm px-3 py-1 bg-white dark:bg-dark-card rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className="text-gray-600 dark:text-gray-400">Current Block Reward:</span>
          <span className="text-gray-800 dark:text-white font-medium ml-1 glitch">{blockReward} PVX</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4 transition-colors duration-200">
          <h3 className="text-gray-700 dark:text-gray-200 font-medium mb-2">Mining Status</h3>
          <p className={`font-semibold ${isMining ? 'text-green-500' : 'text-red-500'}`}>
            {isMining ? 'Active' : 'Inactive'}
          </p>
          <div className="mt-2 flex items-center">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full animate-pulse" 
                style={{ width: isMining ? '85%' : '0%' }}
              ></div>
            </div>
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              {isMining ? '85%' : '0%'}
            </span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4 transition-colors duration-200">
          <h3 className="text-gray-700 dark:text-gray-200 font-medium mb-2">Hash Rate</h3>
          <p className="text-xl font-bold text-gray-800 dark:text-white">
            {isMining ? hashRate : '0 MH/s'}
          </p>
          {isMining && (
            <p className="text-xs text-green-500">+2.5% from yesterday</p>
          )}
        </div>
        
        <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4 transition-colors duration-200">
          <h3 className="text-gray-700 dark:text-gray-200 font-medium mb-2">Daily Earnings</h3>
          <p className="text-xl font-bold text-gray-800 dark:text-white">
            {isMining ? earnings : '0.00000 PVX'}
          </p>
          {isMining && (
            <p className="text-xs text-green-500">≈ $0.82 USD</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4 lg:col-span-2 transition-colors duration-200">
          <h3 className="text-gray-700 dark:text-gray-200 font-medium mb-4">Mining Controls</h3>
          <div className="mb-6">
            <button 
              className={`power-button ${isMining ? 'active' : ''}`} 
              onClick={runMiningCLI}
            >
              <i className={`icon fa ${isMining ? 'fa-stop' : 'fa-play'}`}></i>
            </button>
            <div className="mt-4 mb-2 flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isMining ? 'bg-green-500 pulse-shadow' : 'bg-red-500'}`}></div>
              <span className={`text-sm ${isMining ? 'text-green-500' : 'text-red-500'}`}>
                {isMining ? 'MINING ACTIVE' : 'MINING OFFLINE'}
              </span>
            </div>
            
            <div className="mt-4 h-[200px] overflow-auto">
              <div className="terminal">
                <div className="terminal-header">
                  <div className="terminal-title">PVX MINING CONSOLE</div>
                  <div className="terminal-controls">
                    <span className="terminal-red"></span>
                    <span className="terminal-yellow"></span>
                    <span className="terminal-green"></span>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap text-sm leading-relaxed p-2">
                  {miningOutput}
                  {isMining && <span className="terminal-cursor flicker">_</span>}
                </pre>
              </div>
            </div>
          </div>
          
          <h3 className="text-gray-700 dark:text-gray-200 font-medium mb-4">Mining Performance</h3>
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
            <MiningControls />
          </div>
        </div>
        
        <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4 transition-colors duration-200">
          <h3 className="text-gray-700 dark:text-gray-200 font-medium mb-4">Mining Stats</h3>
          <RewardStatistics />
          
          {miningStats && miningStats.lastBlockMined && (
            <div className="mt-4 text-gray-700 dark:text-gray-300 text-sm">
              <p className="mb-1">Last Block Mined: {new Date(miningStats.lastBlockMined).toLocaleString()}</p>
              <p className="mb-1">Total Blocks Mined: {miningStats.blocksMined}</p>
              <p>Total Rewards: {miningStats.totalRewards.toFixed(6)} PVX</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
