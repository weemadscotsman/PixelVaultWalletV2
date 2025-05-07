import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { formatCryptoAmount } from "@/lib/utils";

export function SendTransactionForm() {
  const { activeWallet, wallet, sendTransaction } = useWallet();
  const { toast } = useToast();
  
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    recipient?: string;
    amount?: string;
  }>({});
  
  // Validate form inputs
  const validateForm = () => {
    const newErrors: {
      recipient?: string;
      amount?: string;
    } = {};
    
    // Validate recipient address
    if (!recipient) {
      newErrors.recipient = "Recipient address is required";
    } else if (!recipient.startsWith("PVX_") || recipient.length !== 38) {
      newErrors.recipient = "Invalid PVX wallet address format";
    }
    
    // Validate amount
    if (!amount) {
      newErrors.amount = "Amount is required";
    } else {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        newErrors.amount = "Amount must be greater than 0";
      } else if (wallet && parsedAmount > parseFloat(wallet.balance)) {
        newErrors.amount = "Amount exceeds available balance";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!activeWallet) return;
    
    try {
      setIsSubmitting(true);
      
      const txResult = await sendTransaction.mutateAsync({
        from: activeWallet,
        to: recipient,
        amount: parseFloat(amount),
      });
      
      toast({
        title: "Transaction Sent",
        description: `Successfully sent ${amount} PVX to ${recipient.substring(0, 10)}...`,
      });
      
      // Reset form
      setRecipient("");
      setAmount("");
      
    } catch (error: any) {
      toast({
        title: "Transaction Failed",
        description: error.message || "Could not send transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Calculate max available amount
  const handleSetMaxAmount = () => {
    if (wallet) {
      setAmount(wallet.balance);
      setErrors((prev) => ({ ...prev, amount: undefined }));
    }
  };

  return (
    <Card className="bg-black/70 border-blue-900/50">
      <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
        <CardTitle className="text-blue-300 flex items-center gap-2">
          <Send className="h-5 w-5" />
          Send PVX
        </CardTitle>
        <CardDescription className="text-gray-400">
          Transfer PVX tokens to another wallet address
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 pt-6">
          {!activeWallet ? (
            <div className="text-center py-6">
              <p className="text-gray-400">Connect or create a wallet first</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="recipient" className="text-gray-300">Recipient Address</Label>
                <Input
                  id="recipient"
                  placeholder="PVX_..."
                  value={recipient}
                  onChange={(e) => {
                    setRecipient(e.target.value);
                    if (errors.recipient) {
                      setErrors((prev) => ({ ...prev, recipient: undefined }));
                    }
                  }}
                  className="bg-gray-900/50 border-blue-900/30 placeholder:text-gray-600"
                />
                {errors.recipient && (
                  <p className="text-red-400 text-sm">{errors.recipient}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="amount" className="text-gray-300">Amount (PVX)</Label>
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
                        setErrors((prev) => ({ ...prev, amount: undefined }));
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
              
              <div className="rounded-lg bg-blue-900/10 border border-blue-900/30 p-4">
                <h4 className="text-sm font-medium text-blue-300 mb-2">Transaction Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network Fee</span>
                    <span className="text-gray-300">0.000100 PVX</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-400">Total Amount</span>
                    <span className="text-gray-300">
                      {amount ? (parseFloat(amount) + 0.0001).toFixed(6) : "0.000100"} PVX
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter className="border-t border-blue-900/30 bg-blue-900/10 py-4">
          <Button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-600 text-white flex items-center"
            disabled={!activeWallet || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Transaction...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send PVX
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}