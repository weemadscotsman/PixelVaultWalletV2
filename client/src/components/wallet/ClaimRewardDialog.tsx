import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { apiRequest } from "@/lib/queryClient";
import { formatCryptoAmount } from "@/lib/utils";

interface ClaimRewardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stakeId: string;
  stakeAmount: string;
  poolName: string;
  rewards: string;
}

export function ClaimRewardDialog({
  open,
  onOpenChange,
  stakeId,
  stakeAmount,
  poolName,
  rewards
}: ClaimRewardDialogProps) {
  const { toast } = useToast();
  const { activeWallet } = useWallet();
  const [passphrase, setPassphrase] = useState("");
  const queryClient = useQueryClient();
  
  const { mutate: claimRewards, isPending } = useMutation({
    mutationFn: async () => {
      if (!activeWallet || !stakeId) {
        throw new Error("Missing wallet or stake information");
      }
      
      const res = await apiRequest("POST", "/api/stake/claim", {
        stakeId,
        address: activeWallet,
        passphrase
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to claim rewards");
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      // Invalidate queries that should be updated
      queryClient.invalidateQueries({ queryKey: ['/api/stake/status', activeWallet] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet', activeWallet] });
      
      // Show success message
      toast({
        title: "Rewards claimed successfully!",
        description: `${formatCryptoAmount(data.reward)} has been credited to your wallet.`,
        variant: "success"
      });
      
      // Close the dialog
      onOpenChange(false);
      
      // Reset form
      setPassphrase("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to claim rewards",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase) {
      toast({
        title: "Passphrase required",
        description: "Please enter your wallet passphrase to claim rewards",
        variant: "destructive"
      });
      return;
    }
    
    claimRewards();
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-950 border-blue-900/50 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-blue-300">Claim Staking Rewards</DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter your wallet passphrase to claim your earned rewards from {poolName}.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4 bg-blue-950/20 p-4 rounded border border-blue-900/30">
              <div>
                <p className="text-sm text-gray-400">Stake Amount</p>
                <p className="text-blue-300 font-medium">{formatCryptoAmount(stakeAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Rewards Available</p>
                <p className="text-green-400 font-medium">+{formatCryptoAmount(rewards)}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="passphrase" className="text-gray-300">Wallet Passphrase</Label>
              <Input
                id="passphrase"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter your wallet passphrase"
                className="bg-gray-900 border-gray-800 text-white"
                disabled={isPending}
                required
              />
              <p className="text-xs text-gray-500">
                Your passphrase is required to authorize this transaction
              </p>
            </div>
          </div>
          
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-blue-900/50 text-gray-300"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-green-700 hover:bg-green-600 text-white"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Claiming...
                </>
              ) : (
                "Claim Rewards"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}