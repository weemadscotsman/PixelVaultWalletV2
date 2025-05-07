import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { formatPVX, formatMicroPVX, timeAgo } from "@/lib/utils";
import { TransactionItem } from "./TransactionItem";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Transaction, TransactionType } from "@/types/blockchain";

export function BalanceCard() {
  const { wallet, transactions, createTransaction, isLoading, lastUpdated } = useWallet();
  const { toast } = useToast();
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!wallet) return;
    
    try {
      setIsSending(true);
      await createTransaction(wallet.publicAddress, recipient, parseFloat(amount), note);
      setShowSendDialog(false);
      
      toast({
        title: "Transaction Submitted",
        description: `Sent ${amount} PVX to ${recipient.substring(0, 10)}...`,
      });
      
      // Reset form
      setRecipient("");
      setAmount("");
      setNote("");
    } catch (error) {
      console.error("Transaction error:", error);
      toast({
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-card rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-medium text-white mb-4 flex items-center">
        <i className="ri-coin-line mr-2 text-primary"></i>
        Balance
      </h3>
      
      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-white">
            {wallet ? formatPVX(wallet.balance) : "0.000000"}
          </span>
          <span className="ml-2 text-xl text-gray-400">PVX</span>
        </div>
        <div className="text-sm text-gray-400 mt-1">
          <span>{wallet ? formatMicroPVX(wallet.balance) : "0"}</span> μPVX
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Last updated: <span>{lastUpdated ? timeAgo(lastUpdated) : "never"}</span>
        </div>
      </div>
      
      <div className="border-t border-gray-700 pt-4">
        <h4 className="text-sm uppercase text-gray-400 mb-3">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-3">
          <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                className="bg-background hover:bg-muted"
                disabled={!wallet}
              >
                <i className="ri-send-plane-line mr-2"></i>
                Send
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send PVX</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Address</Label>
                  <Input 
                    id="recipient" 
                    placeholder="zk_PVX:0x..." 
                    value={recipient} 
                    onChange={(e) => setRecipient(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (PVX)</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    step="0.000001" 
                    min="0.000001" 
                    placeholder="0.000000" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                  />
                  {amount && <p className="text-xs text-muted-foreground">{formatMicroPVX(parseFloat(amount))} μPVX</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">Note (optional)</Label>
                  <Input 
                    id="note" 
                    placeholder="Payment for..." 
                    value={note} 
                    onChange={(e) => setNote(e.target.value)} 
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSend} disabled={isSending || !recipient || !amount}>
                  {isSending ? (
                    <>
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      Sending...
                    </>
                  ) : (
                    "Send PVX"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                className="bg-background hover:bg-muted"
                disabled={!wallet}
              >
                <i className="ri-download-line mr-2"></i>
                Receive
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Receive PVX</DialogTitle>
              </DialogHeader>
              {wallet && (
                <div className="py-4">
                  <p className="text-sm mb-4">Share your wallet address to receive PVX tokens:</p>
                  <div className="bg-muted p-3 rounded-md font-mono text-xs break-all">
                    {wallet.publicAddress}
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button onClick={() => {
                      navigator.clipboard.writeText(wallet.publicAddress);
                      toast({ title: "Address copied to clipboard" });
                    }}>
                      <i className="ri-file-copy-line mr-2"></i>
                      Copy Address
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="mt-6">
        <h4 className="text-sm uppercase text-gray-400 mb-3">Recent Transactions</h4>
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <i className="ri-loader-4-line animate-spin text-xl text-primary"></i>
            </div>
          ) : transactions && transactions.length > 0 ? (
            transactions.slice(0, 3).map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))
          ) : (
            <div className="text-center py-4 text-gray-400">
              No transactions yet
            </div>
          )}
        </div>
        
        {transactions && transactions.length > 3 && (
          <Button 
            variant="link" 
            className="w-full mt-3 text-sm text-primary hover:text-primary-light"
          >
            View all transactions
          </Button>
        )}
      </div>
    </div>
  );
}
