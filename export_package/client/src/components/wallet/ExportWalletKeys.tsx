import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Key, 
  Shield, 
  Copy, 
  Download, 
  Loader2,
  AlertCircle, 
  Check, 
  Eye, 
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ExportWalletKeysProps {
  walletAddress: string;
}

export function ExportWalletKeys({ walletAddress }: ExportWalletKeysProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [keyCopied, setKeyCopied] = useState<string | null>(null);
  
  // Fetch wallet keys
  const { 
    data: walletKeys, 
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["walletKeys", walletAddress],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/wallet/${walletAddress}/keys`);
      const data = await response.json();
      return data;
    },
    enabled: isDialogOpen && !!walletAddress,
  });
  
  // Copy key to clipboard
  const copyToClipboard = (text: string, keyType: string) => {
    navigator.clipboard.writeText(text);
    setKeyCopied(keyType);
    
    toast({
      title: "Copied to clipboard",
      description: `${keyType} has been copied to your clipboard`,
    });
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      setKeyCopied(null);
    }, 2000);
  };
  
  // Download keys as JSON file
  const downloadKeysAsJson = () => {
    if (!walletKeys) return;
    
    const keysData = {
      address: walletAddress,
      publicKey: walletKeys.publicKey,
      privateKey: walletKeys.privateKey,
      exportDate: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(keysData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `pvx-wallet-keys-${walletAddress.substring(4, 12)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Keys Downloaded",
      description: "Your wallet keys have been downloaded as a JSON file",
    });
  };
  
  // Print paper wallet
  const printPaperWallet = () => {
    if (!walletKeys) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Print Failed",
        description: "Unable to open print window. Please check your popup settings.",
        variant: "destructive",
      });
      return;
    }
    
    // Generate HTML content for paper wallet
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PVX Paper Wallet</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .paper-wallet {
            border: 2px solid #000;
            padding: 20px;
            margin-bottom: 20px;
          }
          .section {
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px dashed #ccc;
          }
          .key {
            word-break: break-all;
            font-size: 12px;
            background: #f5f5f5;
            padding: 10px;
            border: 1px solid #ddd;
          }
          h1, h2 {
            margin-top: 0;
          }
          .warning {
            color: #721c24;
            background-color: #f8d7da;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
          }
          .address {
            font-weight: bold;
            font-size: 14px;
          }
          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <h1>PVX Paper Wallet</h1>
          <p>Your PVX wallet has been formatted for printing. This page will automatically print when it finishes loading.</p>
          <p>Please keep this document in a secure location as it contains your private key.</p>
          <button onclick="window.print()">Print Wallet</button>
          <hr />
        </div>
        
        <div class="paper-wallet">
          <h2>PVX Wallet Backup</h2>
          <p>Created: ${new Date().toLocaleString()}</p>
          
          <div class="section">
            <h3>Wallet Address</h3>
            <div class="address">${walletAddress}</div>
          </div>
          
          <div class="section">
            <h3>Public Key</h3>
            <div class="key">${walletKeys.publicKey}</div>
          </div>
          
          <div class="section">
            <h3>Private Key (KEEP SECRET)</h3>
            <div class="warning">WARNING: Never share your private key with anyone!</div>
            <div class="key">${walletKeys.privateKey}</div>
          </div>
          
          <div class="warning">
            <strong>Important Security Information:</strong>
            <ul>
              <li>Keep this document in a secure location</li>
              <li>Make multiple copies and store in different physical locations</li>
              <li>Protect from moisture, fire, and unauthorized access</li>
              <li>Consider using a safe deposit box for long-term storage</li>
            </ul>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Write to the window
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Print the window after it loads
    printWindow.onload = function() {
      printWindow.print();
    };
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-700 hover:bg-blue-600 text-white">
          <Key className="mr-2 h-4 w-4" />
          Export Wallet Keys
        </Button>
      </DialogTrigger>
      
      <DialogContent className="bg-gray-900 border border-blue-900/50 text-gray-100 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-blue-300 flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Export Wallet Keys
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Your private key gives full control of your funds. Never share it with anyone.
          </DialogDescription>
        </DialogHeader>
        
        <Alert className="bg-red-900/30 border-red-900/50 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Warning: Security Risk</AlertTitle>
          <AlertDescription className="text-red-300">
            Exporting your private key poses a security risk. Make sure you're in a secure location and no one is watching your screen.
          </AlertDescription>
        </Alert>
        
        {isLoading && (
          <div className="flex justify-center items-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        )}
        
        {error && (
          <Alert className="bg-red-900/30 border-red-900/50 text-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error retrieving keys</AlertTitle>
            <AlertDescription className="text-red-300">
              Failed to load wallet keys. Please try again.
              <Button 
                variant="outline"
                className="mt-2 w-full border-red-900/50 text-red-300"
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {walletKeys && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-400">Wallet Address</label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-blue-300"
                  onClick={() => copyToClipboard(walletAddress, "Wallet Address")}
                >
                  {keyCopied === "Wallet Address" ? (
                    <Check className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 mr-1" />
                  )}
                  Copy
                </Button>
              </div>
              <div className="bg-black/50 border border-blue-900/30 rounded p-2.5 font-mono text-xs text-blue-300 break-all">
                {walletAddress}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-400">Public Key</label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-blue-300"
                  onClick={() => copyToClipboard(walletKeys.publicKey, "Public Key")}
                >
                  {keyCopied === "Public Key" ? (
                    <Check className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 mr-1" />
                  )}
                  Copy
                </Button>
              </div>
              <div className="bg-black/50 border border-blue-900/30 rounded p-2.5 font-mono text-xs text-blue-300 break-all">
                {walletKeys.publicKey}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-400">
                  Private Key (NEVER SHARE)
                </label>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-blue-300"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                  >
                    {showPrivateKey ? (
                      <EyeOff className="h-3.5 w-3.5 mr-1" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 mr-1" />
                    )}
                    {showPrivateKey ? "Hide" : "Show"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-blue-300"
                    onClick={() => copyToClipboard(walletKeys.privateKey, "Private Key")}
                  >
                    {keyCopied === "Private Key" ? (
                      <Check className="h-3.5 w-3.5 mr-1" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 mr-1" />
                    )}
                    Copy
                  </Button>
                </div>
              </div>
              <div className="bg-black/50 border border-red-900/30 rounded p-2.5 font-mono text-xs text-red-300 break-all">
                {showPrivateKey ? walletKeys.privateKey : "••••••••••••••••••••••••••••••••••••••••••••••••••"}
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1 border-blue-900/50 text-blue-300"
            onClick={downloadKeysAsJson}
            disabled={!walletKeys}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Keys
          </Button>
          <Button
            className="flex-1 bg-blue-700 hover:bg-blue-600 text-white"
            onClick={printPaperWallet}
            disabled={!walletKeys}
          >
            <Key className="mr-2 h-4 w-4" />
            Print Paper Wallet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}