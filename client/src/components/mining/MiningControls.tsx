import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useMining } from "@/hooks/use-mining";
import { useEffect, useState } from "react";

export function MiningControls() {
  const { 
    isMining, 
    hashRate, 
    blocksMined, 
    startMining, 
    stopMining, 
    isStarting, 
    isStopping, 
    threads, 
    setThreads 
  } = useMining();
  
  // Add random hash rate increase effect for visual appeal
  const [displayHashRate, setDisplayHashRate] = useState(hashRate);
  
  useEffect(() => {
    if (!isMining) {
      setDisplayHashRate(0);
      return;
    }
    
    const interval = setInterval(() => {
      // Add small random fluctuations to hashrate for visual effect
      const randomDelta = (Math.random() * 2 - 1) * 5; // Random value between -5 and +5
      setDisplayHashRate(Math.max(1, hashRate + randomDelta));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isMining, hashRate]);
  
  return (
    <div className="w-full h-full bg-white dark:bg-dark-card rounded-md">
      <div className="h-full flex flex-col">
        {/* Performance Chart with Matrix Effect */}
        <div className="flex-1 p-4 flex justify-center items-center bg-black pixel-grid">
          <div className="w-full">
            {/* Hash Rate Data Visualization */}
            <div className="h-6 flex items-center justify-between mb-2">
              <span className="text-xs text-green-400 font-medium glitch">HASH RATE MONITOR</span>
              <span className="text-xs font-mono text-green-500 neon">
                {displayHashRate.toFixed(1)} H/s
              </span>
            </div>
            
            {/* Matrix-style hash rate indicator */}
            <div className="grid grid-cols-10 gap-1 mb-4">
              {[...Array(10)].map((_, i) => {
                const isActive = isMining && (displayHashRate / 100) * 10 > i;
                return (
                  <div 
                    key={i} 
                    className={`h-2 ${isActive ? 'bg-green-500' : 'bg-gray-800'} rounded-sm ${isActive ? 'flicker' : ''}`}
                  ></div>
                );
              })}
            </div>
            
            {/* Thread Usage with terminal-style */}
            <div className="mt-6 border border-green-900 bg-black bg-opacity-50 p-3 rounded">
              <div className="flex justify-between mb-2">
                <Label className="block text-xs font-medium text-green-400">CPU THREADS</Label>
                <span className="text-xs text-green-400">
                  {threads} {threads === 1 ? 'CORE' : 'CORES'}
                </span>
              </div>
              <Slider
                min={1}
                max={8}
                step={1}
                value={[threads]}
                onValueChange={(value) => setThreads(value[0])}
                disabled={isMining}
                className="my-2"
              />
              
              {/* CPU Thread Visualization */}
              <div className="grid grid-cols-8 gap-1 mt-2">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-4 rounded-sm flex items-center justify-center text-[9px] 
                      ${i < threads ? 'bg-green-800 text-green-400' : 'bg-gray-800 text-gray-600'}`}
                  >
                    {i+1}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Hash Algorithm Selection */}
            <div className="mt-4 border border-green-900 bg-black bg-opacity-50 p-3 rounded">
              <Label className="block text-xs font-medium text-green-400 mb-2">HASH ALGORITHM</Label>
              <RadioGroup defaultValue="sha3" className="grid grid-cols-1 gap-2">
                <div className="flex items-center space-x-2 bg-gray-900 p-2 rounded-md cursor-pointer border border-green-900">
                  <RadioGroupItem value="sha3" id="sha3" />
                  <Label htmlFor="sha3" className="cursor-pointer flex-1">
                    <div className="text-green-500 text-sm">SHA3 + zkSNARK</div>
                    <div className="text-xs text-green-700">CPU OPTIMIZED</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 bg-gray-900 p-2 rounded-md cursor-pointer border border-green-900 opacity-50">
                  <RadioGroupItem value="equalized" id="equalized" disabled />
                  <Label htmlFor="equalized" className="cursor-pointer flex-1">
                    <div className="text-green-500 text-sm">EQUIHASH (BETA)</div>
                    <div className="text-xs text-green-700">ASIC RESISTANT</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>
        
        {/* Mining Stats */}
        <div className="p-4 border-t border-green-900 bg-black">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 border border-green-900 p-3 rounded-md">
              <div className="text-sm text-green-400 mb-1">HASH RATE</div>
              <div className="text-xl font-mono text-green-500 font-bold neon">
                {displayHashRate.toFixed(1)} H/s
              </div>
            </div>
            <div className="bg-gray-900 border border-green-900 p-3 rounded-md">
              <div className="text-sm text-green-400 mb-1">BLOCKS MINED</div>
              <div className="text-xl font-mono text-green-500 font-bold neon">{blocksMined}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
