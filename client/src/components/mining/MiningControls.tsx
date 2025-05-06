import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useMining } from "@/hooks/use-mining";

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
  
  return (
    <div className="bg-card rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-medium text-white mb-4 flex items-center">
        <i className="ri-hammer-line mr-2 text-accent"></i>
        Mining Controls
      </h3>
      
      <div className="space-y-6">
        {/* Mining Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-background p-3 rounded-md">
            <div className="text-sm text-gray-400">Your Hash Rate</div>
            <div className="text-xl font-mono text-white">
              {hashRate.toFixed(1)} H/s
            </div>
          </div>
          <div className="bg-background p-3 rounded-md">
            <div className="text-sm text-gray-400">Blocks Mined</div>
            <div className="text-xl font-mono text-white">{blocksMined}</div>
          </div>
        </div>
        
        {/* Hash Algorithm Selection */}
        <div>
          <Label className="block text-sm font-medium text-gray-400 mb-2">Hash Algorithm</Label>
          <RadioGroup defaultValue="sha3" className="grid grid-cols-1 gap-2">
            <div className="flex items-center space-x-2 bg-background p-3 rounded-md cursor-pointer">
              <RadioGroupItem value="sha3" id="sha3" />
              <Label htmlFor="sha3" className="cursor-pointer flex-1">
                <div className="text-white">SHA3 + zk Commit</div>
                <div className="text-xs text-gray-400">Optimized for CPU mining</div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 bg-background p-3 rounded-md cursor-pointer opacity-50">
              <RadioGroupItem value="equalized" id="equalized" disabled />
              <Label htmlFor="equalized" className="cursor-pointer flex-1">
                <div className="text-white">Equalized Hash (Beta)</div>
                <div className="text-xs text-gray-400">ASIC & GPU resistant variant</div>
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        {/* Thread Control */}
        <div>
          <div className="flex justify-between mb-2">
            <Label className="block text-sm font-medium text-gray-400">Thread Usage</Label>
            <span className="text-sm text-gray-400">{threads} {threads === 1 ? 'Thread' : 'Threads'}</span>
          </div>
          <Slider
            min={1}
            max={8}
            step={1}
            value={[threads]}
            onValueChange={(value) => setThreads(value[0])}
            disabled={isMining}
          />
        </div>
        
        {/* Mining Actions */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="bg-accent hover:bg-accent-light text-white flex-1"
            onClick={startMining}
            disabled={isMining || isStarting}
          >
            {isStarting ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Starting...
              </>
            ) : isMining ? (
              <>
                <i className="ri-hammer-line mr-2"></i>
                Mining Active
              </>
            ) : (
              <>
                <i className="ri-play-circle-line mr-2"></i>
                Start Mining
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="bg-background hover:bg-muted text-white flex-1"
            onClick={stopMining}
            disabled={!isMining || isStopping}
          >
            {isStopping ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Stopping...
              </>
            ) : (
              <>
                <i className="ri-stop-circle-line mr-2"></i>
                Stop
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
