import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useStaking } from "@/hooks/use-staking";
import { useWallet } from "@/hooks/use-wallet";
import { formatPVX } from "@/lib/utils";
import { calculateVotingPower } from "@/lib/staking";
import { useToast } from "@/hooks/use-toast";

export function StakingControls() {
  const { 
    stakes, 
    totalStaked, 
    votingPower, 
    estimatedYield, 
    createStake, 
    unstake 
  } = useStaking();
  
  const { wallet } = useWallet();
  const { toast } = useToast();
  
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("30");
  const [estimatedVotingPower, setEstimatedVotingPower] = useState(0);
  const [isStaking, setIsStaking] = useState(false);
  
  // Calculate estimated voting power when amount or duration changes
  useEffect(() => {
    if (amount && !isNaN(parseFloat(amount))) {
      const vp = calculateVotingPower(parseFloat(amount), parseInt(duration));
      setEstimatedVotingPower(vp);
    } else {
      setEstimatedVotingPower(0);
    }
  }, [amount, duration]);
  
  const handleStake = async () => {
    if (!wallet) return;
    
    try {
      setIsStaking(true);
      await createStake(wallet.publicAddress, parseFloat(amount), parseInt(duration));
      
      toast({
        title: "Stake Created",
        description: `Successfully staked ${amount} PVX for ${duration} days`,
      });
      
      // Reset form
      setAmount("");
    } catch (error) {
      console.error("Staking error:", error);
      toast({
        title: "Staking Failed",
        description: error instanceof Error ? error.message : "Failed to create stake",
        variant: "destructive",
      });
    } finally {
      setIsStaking(false);
    }
  };
  
  const handleUnstake = async (stakeId: string) => {
    try {
      await unstake(stakeId);
      toast({
        title: "Unstaked Successfully",
        description: "Your tokens have been returned to your wallet",
      });
    } catch (error) {
      console.error("Unstaking error:", error);
      toast({
        title: "Unstaking Failed",
        description: error instanceof Error ? error.message : "Failed to unstake",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="bg-card rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-medium text-white mb-4 flex items-center">
        <i className="ri-stack-line mr-2 text-primary"></i>
        Staking Controls
      </h3>
      
      <div className="space-y-6">
        {/* Current Staking Stats */}
        <div className="bg-background p-4 rounded-md">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-400">Total Staked</span>
            <span className="text-lg text-white font-semibold">
              {formatPVX(totalStaked)} PVX
            </span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-400">Voting Power</span>
            <span className="text-white">
              {votingPower.toFixed(2)} vPVX
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Est. Annual Yield</span>
            <span className="text-white">
              ~{estimatedYield}%
            </span>
          </div>
        </div>
        
        {/* Staking Form */}
        <div>
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium text-gray-400 mb-1">
                Amount to Stake (PVX)
              </Label>
              <Input 
                type="number" 
                placeholder="0.000000" 
                min="0.000001" 
                step="0.000001" 
                className="w-full bg-background border border-gray-600 text-white"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-gray-400 mb-1">
                Lock Duration
              </Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="w-full bg-background border border-gray-600 text-white">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days (1.2x voting power)</SelectItem>
                  <SelectItem value="90">90 days (1.5x voting power)</SelectItem>
                  <SelectItem value="180">180 days (2x voting power)</SelectItem>
                  <SelectItem value="365">365 days (3x voting power)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-background p-3 rounded-md">
              <div className="text-sm text-gray-400 mb-1">Estimated Voting Power</div>
              <div className="text-lg text-white">
                {estimatedVotingPower.toFixed(2)} vPVX
              </div>
            </div>
          </div>
          
          <Button 
            className="w-full mt-4"
            onClick={handleStake}
            disabled={!wallet || isStaking || !amount || parseFloat(amount) <= 0}
          >
            {isStaking ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Staking...
              </>
            ) : (
              <>
                <i className="ri-stack-line mr-2"></i>
                Stake PVX
              </>
            )}
          </Button>
        </div>
        
        {/* Active Stakes */}
        {stakes.length > 0 && (
          <div>
            <h4 className="text-sm uppercase text-gray-400 mb-3">Active Stakes</h4>
            
            {stakes.map((stake) => {
              // Calculate remaining days
              const endDate = new Date(stake.endTime);
              const today = new Date();
              const remainingDays = Math.max(0, Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
              
              // Can only unstake if lock period is over
              const canUnstake = remainingDays <= 0;
              
              return (
                <div key={stake.id} className="bg-background p-3 rounded-md mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-white font-medium">
                      {formatPVX(stake.amount)} PVX
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-primary text-white rounded-full">
                      {stake.duration} Days
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mb-2">
                    Locked until {endDate.toLocaleDateString()} 
                    {remainingDays > 0 ? ` (${remainingDays} days remaining)` : ' (unlock available)'}
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">
                      Voting Power: <span className="text-white">{stake.votingPower.toFixed(2)} vPVX</span>
                    </span>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className={canUnstake ? "text-status-error hover:underline p-0 h-6" : "text-gray-500 p-0 h-6"}
                      disabled={!canUnstake}
                      onClick={() => canUnstake && handleUnstake(stake.id)}
                    >
                      Unstake
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
