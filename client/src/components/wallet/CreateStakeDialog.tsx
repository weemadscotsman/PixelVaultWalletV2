import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Coins, 
  Lock, 
  Calendar, 
  TrendingUp, 
  Info, 
  Loader2, 
  AlertCircle
} from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { formatCryptoAmount } from "@/lib/utils";

interface StakingPool {
  id: string;
  name: string;
  description?: string;
  minStake: string;
  lockupPeriod: number; // in days
  apy: string;
  totalStaked: string;
  active?: boolean;
}

interface CreateStakeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stakingPools: StakingPool[];
}

export function CreateStakeDialog({ 
  open, 
  onOpenChange,
  stakingPools
}: CreateStakeDialogProps) {
  const { activeWallet, wallet } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [poolId, setPoolId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [passphrase, setPassphrase] = useState<string>("");
  const [errors, setErrors] = useState<{
    poolId?: string;
    amount?: string;
    passphrase?: string;
  }>({});
  
  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      // Always set the pool ID using the string ID format (e.g., 'pool1', 'pool2')
      // This ensures it matches the IDs expected by the backend
      setPoolId(stakingPools.length > 0 ? stakingPools[0].id : "");
      console.log("Selected initial pool ID:", stakingPools.length > 0 ? stakingPools[0].id : "none");
      setAmount("");
      setPassphrase("");
      setErrors({});
    }
  }, [open, stakingPools]);
  
  // Get selected pool
  const selectedPool = stakingPools.find(pool => pool.id === poolId);
  
  // Calculate estimated rewards
  const calculateRewards = () => {
    if (!selectedPool || !amount) return "0";
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) return "0";
    
    const dailyRate = parseFloat(selectedPool.apy) / 365 / 100; // Daily interest rate
    const days = selectedPool.lockupPeriod;
    
    // Daily compound interest calculation
    const futureValue = parsedAmount * Math.pow(1 + dailyRate, days);
    const rewards = futureValue - parsedAmount;
    
    return rewards.toFixed(6);
  };
  
  // Create stake mutation - using the exact endpoint from blueprint
  const createStakeMutation = useMutation({
    mutationFn: async (data: {
      address: string;
      poolId: string;
      amount: string;
      passphrase: string;
    }) => {
      const res = await apiRequest('POST', '/api/stake/start', data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create stake');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Stake Created",
        description: `Successfully staked ${amount} μPVX`,
      });
      onOpenChange(false);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/stake/status', activeWallet] });
      queryClient.invalidateQueries({ queryKey: ['/api/stake/pools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance', activeWallet] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Stake",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Validate form
  const validateForm = () => {
    const newErrors: {
      poolId?: string;
      amount?: string;
      passphrase?: string;
    } = {};
    
    // Validate pool selection
    if (!poolId) {
      newErrors.poolId = "Please select a staking pool";
    }
    
    // Validate amount
    if (!amount) {
      newErrors.amount = "Amount is required";
    } else {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        newErrors.amount = "Amount must be greater than 0";
      } else if (selectedPool && parsedAmount < parseFloat(selectedPool.minStake)) {
        newErrors.amount = `Minimum stake amount is ${selectedPool.minStake} μPVX`;
      } else if (wallet && parsedAmount > parseFloat(wallet.balance)) {
        newErrors.amount = "Amount exceeds available balance";
      }
    }
    
    // Validate passphrase
    if (!passphrase) {
      newErrors.passphrase = "Wallet passphrase is required";
    } else if (passphrase.length < 8) {
      newErrors.passphrase = "Passphrase must be at least 8 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !activeWallet) return;
    
    await createStakeMutation.mutateAsync({
      address: activeWallet,
      poolId,
      amount,
      passphrase,
    });
  };
  
  // Calculate max stake amount
  const handleSetMaxAmount = () => {
    if (wallet) {
      setAmount(wallet.balance);
      setErrors(prev => ({ ...prev, amount: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border border-blue-900/50 text-gray-100 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-blue-300 flex items-center">
            <Coins className="mr-2 h-5 w-5" />
            Create New Stake
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Stake your PVX tokens to earn passive rewards
          </DialogDescription>
        </DialogHeader>
        
        {!activeWallet ? (
          <Alert className="bg-blue-900/30 border-blue-900/50 text-blue-200">
            <Info className="h-4 w-4" />
            <AlertTitle>Wallet Required</AlertTitle>
            <AlertDescription className="text-blue-300">
              You need to connect a wallet before staking. Please go to the wallet page to create or import a wallet.
              <Button 
                className="mt-2 w-full bg-blue-700 hover:bg-blue-600 text-white"
                onClick={() => {
                  onOpenChange(false);
                  window.location.href = '/wallet';
                }}
              >
                Go to Wallet Page
              </Button>
            </AlertDescription>
          </Alert>
        ) : stakingPools.length === 0 ? (
          <Alert className="bg-orange-900/30 border-orange-900/50 text-orange-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Staking Pools Available</AlertTitle>
            <AlertDescription className="text-orange-300">
              There are currently no active staking pools available. Please check back later.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-5 py-2">
              <div className="space-y-2">
                <Label htmlFor="poolId" className="text-gray-300">Select Staking Pool</Label>
                <Select 
                  value={poolId} 
                  onValueChange={(value) => {
                    setPoolId(value);
                    setErrors(prev => ({ ...prev, poolId: undefined }));
                  }}
                >
                  <SelectTrigger className="bg-gray-900/50 border-blue-900/30 text-gray-300">
                    <SelectValue placeholder="Select a staking pool" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-blue-900/50 text-gray-300">
                    {stakingPools.map((pool) => (
                      <SelectItem key={pool.id} value={pool.id}>
                        {pool.name} - {pool.apy}% APY
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.poolId && (
                  <p className="text-red-400 text-sm">{errors.poolId}</p>
                )}
              </div>
              
              {selectedPool && (
                <div className="rounded-lg bg-blue-900/10 border border-blue-900/30 p-4 text-sm space-y-2">
                  <p className="text-gray-300">{selectedPool.description}</p>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div>
                      <p className="text-gray-400 flex items-center">
                        <Lock className="h-3 w-3 mr-1" />
                        Min Stake
                      </p>
                      <p className="text-gray-300">{formatCryptoAmount(selectedPool.minStake)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Lock Period
                      </p>
                      <p className="text-gray-300">{selectedPool.lockupPeriod} days</p>
                    </div>
                    <div>
                      <p className="text-gray-400 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        APY
                      </p>
                      <p className="text-green-400">{selectedPool.apy}%</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="amount" className="text-gray-300">Amount (μPVX)</Label>
                  {wallet && (
                    <span className="text-xs text-gray-400">
                      Available: {formatCryptoAmount(wallet.balance)}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="amount"
                    type="text"
                    placeholder="0.000000"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (errors.amount) {
                        setErrors(prev => ({ ...prev, amount: undefined }));
                      }
                    }}
                    className="bg-gray-900/50 border-blue-900/30 placeholder:text-gray-600"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-blue-900/50 text-blue-300"
                    onClick={handleSetMaxAmount}
                  >
                    MAX
                  </Button>
                </div>
                {errors.amount && (
                  <p className="text-red-400 text-sm">{errors.amount}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="passphrase" className="text-gray-300">Wallet Passphrase</Label>
                <Input
                  id="passphrase"
                  type="password"
                  placeholder="Enter your wallet passphrase"
                  value={passphrase}
                  onChange={(e) => {
                    setPassphrase(e.target.value);
                    if (errors.passphrase) {
                      setErrors(prev => ({ ...prev, passphrase: undefined }));
                    }
                  }}
                  className="bg-gray-900/50 border-blue-900/30 placeholder:text-gray-600"
                />
                {errors.passphrase && (
                  <p className="text-red-400 text-sm">{errors.passphrase}</p>
                )}
              </div>
              
              {amount && selectedPool && (
                <div className="rounded-lg bg-green-900/10 border border-green-900/30 p-4">
                  <h4 className="text-sm font-medium text-green-400 mb-2">Estimated Rewards</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">After {selectedPool.lockupPeriod} days:</span>
                    <span className="text-lg font-bold text-green-400">+{calculateRewards()} μPVX</span>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-blue-900/50 text-blue-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-700 hover:bg-blue-600 text-white"
                disabled={createStakeMutation.isPending}
              >
                {createStakeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Stake...
                  </>
                ) : (
                  <>
                    <Coins className="mr-2 h-4 w-4" />
                    Create Stake
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}