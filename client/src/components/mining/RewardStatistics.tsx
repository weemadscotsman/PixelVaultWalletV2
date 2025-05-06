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
    <div className="space-y-4">
      {/* Halving Progress */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Halving Progress</span>
          <span className="text-sm">
            <span className="text-gray-800 dark:text-white font-medium">
              {halvingProgress ? halvingProgress.current.toLocaleString() : '0'}
            </span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600 dark:text-gray-400">
              {halvingProgress ? halvingProgress.total.toLocaleString() : '210,000'}
            </span>
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2 bg-gray-200 dark:bg-gray-700" />
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Estimated next halving: 
          <span className="text-gray-800 dark:text-white ml-1 font-medium">
            {nextHalvingEstimate || '~6 months'}
          </span>
        </div>
      </div>
      
      {/* Reward Distribution */}
      <div>
        <h4 className="text-xs uppercase text-gray-600 dark:text-gray-400 font-medium mb-2">Reward Distribution</h4>
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">Miner (50%)</span>
            <span className="text-sm text-gray-800 dark:text-white font-mono font-medium">
              {rewardDistribution ? formatPVX(rewardDistribution.miner) : '0.00000'} PVX
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">Governance (25%)</span>
            <span className="text-sm text-gray-800 dark:text-white font-mono font-medium">
              {rewardDistribution ? formatPVX(rewardDistribution.governance) : '0.00000'} PVX
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">Staking (15%)</span>
            <span className="text-sm text-gray-800 dark:text-white font-mono font-medium">
              {rewardDistribution ? formatPVX(rewardDistribution.staking) : '0.00000'} PVX
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700 dark:text-gray-300">Reserve (10%)</span>
            <span className="text-sm text-gray-800 dark:text-white font-mono font-medium">
              {rewardDistribution ? formatPVX(rewardDistribution.reserve) : '0.00000'} PVX
            </span>
          </div>
        </div>
      </div>
      
      {/* Recent Miners List */}
      <div>
        <h4 className="text-xs uppercase text-gray-600 dark:text-gray-400 font-medium mb-2">Recent Miners</h4>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          <li className="py-2">
            <div className="flex justify-between">
              <span className="text-gray-700 dark:text-gray-300">Miner #1</span>
              <span className="text-green-500">Online</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">78.5 MH/s</div>
          </li>
          <li className="py-2">
            <div className="flex justify-between">
              <span className="text-gray-700 dark:text-gray-300">Miner #2</span>
              <span className="text-green-500">Online</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">92.1 MH/s</div>
          </li>
        </ul>
      </div>
      
      {/* Mining Rewards History */}
      <div>
        <h4 className="text-xs uppercase text-gray-600 dark:text-gray-400 font-medium mb-2">Your Rewards</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {/* If no mining activity */}
          {miningRewards.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400 italic">
              No mining activity yet. Start mining to earn rewards.
            </div>
          ) : (
            /* When rewards are available */
            miningRewards.map((reward) => (
              <div key={reward.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                <div>
                  <div className="text-sm text-gray-800 dark:text-white">Block #{reward.blockHeight.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(reward.timestamp).toLocaleTimeString()} {new Date(reward.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-emerald-500 font-medium">+{formatPVX(reward.amount)} PVX</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
