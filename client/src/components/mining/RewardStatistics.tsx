import { Progress } from "@/components/ui/progress";
import { useMining } from "@/hooks/use-mining";
import { formatPVX } from "@/lib/utils";

export function RewardStatistics() {
  const { 
    halvingProgress, 
    nextHalvingEstimate, 
    rewardDistribution, 
    miningRewards
  } = useMining();
  
  // Calculate halving progress percentage
  const progressPercentage = halvingProgress ? 
    Math.round((halvingProgress.current / halvingProgress.total) * 100) : 0;
  
  return (
    <div className="bg-card rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-medium text-white mb-4 flex items-center">
        <i className="ri-bar-chart-box-line mr-2 text-accent"></i>
        Reward Statistics
      </h3>
      
      <div className="space-y-6">
        {/* Halving Progress */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-400">Halving Progress</span>
            <span className="text-sm">
              <span className="text-white">
                {halvingProgress ? halvingProgress.current.toLocaleString() : '0'}
              </span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-400">
                {halvingProgress ? halvingProgress.total.toLocaleString() : '210,000'} blocks
              </span>
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2.5" />
          <div className="mt-1 text-xs text-gray-400">
            Estimated next halving: 
            <span className="text-white ml-1">
              {nextHalvingEstimate || '~6 months'}
            </span>
          </div>
        </div>
        
        {/* Reward Distribution */}
        <div>
          <h4 className="text-sm uppercase text-gray-400 mb-3">Reward Distribution (Per Block)</h4>
          <div className="bg-background p-4 rounded-md">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-white">Miner Reward (50%)</span>
              <span className="text-sm text-white font-mono">
                {rewardDistribution ? formatPVX(rewardDistribution.miner) : '75.000000'} PVX
              </span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-white">Governance (25%)</span>
              <span className="text-sm text-white font-mono">
                {rewardDistribution ? formatPVX(rewardDistribution.governance) : '37.500000'} PVX
              </span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-white">Staking Pool (15%)</span>
              <span className="text-sm text-white font-mono">
                {rewardDistribution ? formatPVX(rewardDistribution.staking) : '22.500000'} PVX
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white">Vault Reserve (10%)</span>
              <span className="text-sm text-white font-mono">
                {rewardDistribution ? formatPVX(rewardDistribution.reserve) : '15.000000'} PVX
              </span>
            </div>
          </div>
        </div>
        
        {/* Mining Rewards History */}
        <div>
          <h4 className="text-sm uppercase text-gray-400 mb-3">Your Recent Rewards</h4>
          <div className="space-y-2">
            {/* If no mining activity */}
            {miningRewards.length === 0 ? (
              <div className="text-center py-6 text-gray-400 italic">
                No mining activity yet. Start mining to earn rewards.
              </div>
            ) : (
              /* When rewards are available */
              miningRewards.map((reward) => (
                <div key={reward.id} className="flex justify-between items-center p-2 bg-background rounded-md">
                  <div>
                    <div className="text-sm text-white">Block #{reward.blockHeight.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(reward.timestamp).toLocaleTimeString()} {new Date(reward.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-status-success">+{formatPVX(reward.amount)} PVX</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
