import { useState } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { shortenAddress } from "@/lib/utils";

export function WalletGenerator() {
  const { wallet, isGenerating, generateNewWallet, revealMnemonic, hideMnemonic, mnemonicRevealed, mnemonic } = useWallet();
  const [entropySource, setEntropySource] = useState("system");
  const [additionalEntropy, setAdditionalEntropy] = useState("");
  const [generateMnemonicOption, setGenerateMnemonicOption] = useState(false);
  const { toast } = useToast();

  const handleGenerateWallet = async () => {
    try {
      await generateNewWallet(generateMnemonicOption, additionalEntropy);
    } catch (error) {
      console.error("Error generating wallet:", error);
      toast({
        title: "Wallet Generation Failed",
        description: "There was an error generating your wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description,
    });
  };

  return (
    <div className="bg-card rounded-xl p-6 border border-gray-700" id="wallet-generator">
      <h3 className="text-lg font-medium text-white mb-4 flex items-center">
        <i className="ri-key-2-line mr-2 text-primary"></i>
        ZK Wallet Generator
      </h3>
      
      {!wallet ? (
        <div className="space-y-4 mb-6">
          <div>
            <Label className="text-sm font-medium text-gray-400 mb-1">Entropy Source</Label>
            <Select value={entropySource} onValueChange={setEntropySource}>
              <SelectTrigger className="w-full bg-background border border-gray-600 text-white">
                <SelectValue placeholder="Select entropy source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System Random + User Input</SelectItem>
                <SelectItem value="user">User Provided Entropy Only</SelectItem>
                <SelectItem value="hardware">Hardware Key (if available)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-400 mb-1">Additional Entropy (optional)</Label>
            <Input 
              type="text" 
              placeholder="Type random characters..." 
              className="w-full bg-background border border-gray-600 text-white"
              value={additionalEntropy}
              onChange={(e) => setAdditionalEntropy(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="generate-mnemonic" 
              checked={generateMnemonicOption} 
              onCheckedChange={(checked) => setGenerateMnemonicOption(checked as boolean)}
            />
            <Label htmlFor="generate-mnemonic" className="text-sm text-gray-300">Generate recovery mnemonic</Label>
          </div>
        
          <Button 
            className="w-full mt-4" 
            onClick={handleGenerateWallet} 
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Generating...
              </>
            ) : (
              "Generate New Wallet"
            )}
          </Button>
        </div>
      ) : (
        <div className="mb-6">
          <Button 
            variant="outline" 
            className="w-full"
            disabled={true}
          >
            <i className="ri-check-line mr-2"></i>
            Wallet Generated
          </Button>
        </div>
      )}
      
      {wallet && (
        <div className="border-t border-gray-700 mt-2 pt-4">
          <h4 className="text-sm uppercase text-gray-400 mb-2">Your Wallet</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Public Address</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-primary hover:text-primary-light p-0 h-auto"
                  onClick={() => copyToClipboard(wallet.publicAddress, "Address copied to clipboard")}
                >
                  <i className="ri-file-copy-line mr-1"></i>Copy
                </Button>
              </div>
              <div className="bg-background rounded p-2 mt-1 break-all font-mono text-xs text-white">
                {wallet.publicAddress}
              </div>
            </div>
            
            {(generateMnemonicOption || mnemonic) && (
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Mnemonic Phrase</span>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-primary hover:text-primary-light p-0 h-auto"
                      onClick={mnemonicRevealed ? hideMnemonic : revealMnemonic}
                    >
                      <i className={`${mnemonicRevealed ? 'ri-eye-off-line' : 'ri-eye-line'} mr-1`}></i>
                      {mnemonicRevealed ? 'Hide' : 'Reveal'}
                    </Button>
                    {mnemonicRevealed && mnemonic && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-primary hover:text-primary-light p-0 h-auto"
                        onClick={() => copyToClipboard(mnemonic, "Mnemonic copied to clipboard")}
                      >
                        <i className="ri-file-copy-line mr-1"></i>Copy
                      </Button>
                    )}
                  </div>
                </div>
                <div className="bg-background rounded p-2 mt-1 font-mono text-xs text-white">
                  {mnemonicRevealed && mnemonic ? mnemonic : (
                    <span className="text-gray-500">••••• ••••• ••••• ••••• ••••• •••••</span>
                  )}
                </div>
                <p className="text-xs text-orange-500 mt-1">
                  <i className="ri-alert-line mr-1"></i>
                  Store this securely. Never share it with anyone.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
