import { useState } from 'react';
import {
  ShieldAlert,
  Download,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ExportWalletKeys({ walletAddress }: { walletAddress: string }) {
  const { toast } = useToast();
  const [passphrase, setPassphrase] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [exportingKeys, setExportingKeys] = useState(false);
  const [keys, setKeys] = useState<{ publicKey: string, privateKey: string } | null>(null);
  const [copied, setCopied] = useState<'none' | 'public' | 'private'>('none');
  
  // Get wallet export keys function from useWallet
  const { exportWalletKeysMutation } = useWallet();

  // Handle export keys
  const handleExportKeys = async () => {
    if (!passphrase || passphrase.length < 8) {
      toast({
        title: 'Invalid passphrase',
        description: 'Please enter your wallet passphrase',
        variant: 'destructive',
      });
      return;
    }

    setExportingKeys(true);
    
    try {
      // Call the API to get the keys
      const exportedKeys = await exportWalletKeysMutation.mutateAsync({
        address: walletAddress,
        passphrase,
      });
      
      setKeys(exportedKeys);
    } catch (error) {
      // Keep the error handling from the mutation
    } finally {
      setExportingKeys(false);
    }
  };

  // Reset the state when dialog closes
  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setPassphrase('');
      setShowPrivateKey(false);
      setKeys(null);
      setCopied('none');
    }
  };

  // Copy key to clipboard
  const copyToClipboard = (text: string, type: 'public' | 'private') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    
    toast({
      title: 'Copied to clipboard',
      description: `${type === 'public' ? 'Public' : 'Private'} key copied to clipboard`,
    });
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopied('none');
    }, 2000);
  };

  // Download keys as JSON file
  const downloadKeysFile = () => {
    if (!keys) return;
    
    const keysData = {
      walletAddress,
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(keysData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pvx-wallet-keys-${walletAddress.substring(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Keys downloaded',
      description: 'Your wallet keys have been downloaded as a JSON file',
    });
  };

  return (
    <Dialog onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-blue-900/50 text-blue-300">
          <ShieldAlert className="h-4 w-4 mr-2" />
          Export Keys
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-black/90 border-blue-900/50">
        <DialogHeader>
          <DialogTitle className="text-blue-300">Export Wallet Keys</DialogTitle>
          <DialogDescription className="text-gray-400">
            Securely export your public and private keys for backup
          </DialogDescription>
        </DialogHeader>
        
        <Alert className="bg-red-900/20 border-red-600/30 text-red-400">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Security Warning</AlertTitle>
          <AlertDescription className="text-xs">
            Your private key gives complete control over your wallet. Never share it with anyone, and store it securely.
            Anyone with access to these keys can spend your PVX tokens.
          </AlertDescription>
        </Alert>
        
        {!keys ? (
          <>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="passphrase" className="text-white">
                  Enter your wallet passphrase to access your keys
                </Label>
                <Input
                  id="passphrase"
                  type="password"
                  placeholder="Enter your wallet passphrase"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="bg-gray-900/50 border-blue-900/50 focus:border-blue-500"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                className="bg-blue-700 hover:bg-blue-600 text-white"
                onClick={handleExportKeys}
                disabled={exportingKeys}
              >
                {exportingKeys ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  'Export Keys'
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="publicKey" className="text-white flex justify-between">
                  <span>Public Key</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-blue-400"
                    onClick={() => copyToClipboard(keys.publicKey, 'public')}
                  >
                    {copied === 'public' ? (
                      <Check className="h-3.5 w-3.5 mr-1" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 mr-1" />
                    )}
                    Copy
                  </Button>
                </Label>
                <div className="bg-gray-900/70 p-2 rounded text-xs font-mono text-gray-300 break-all">
                  {keys.publicKey}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="privateKey" className="text-white flex justify-between">
                  <span>Private Key</span>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-blue-400"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                    >
                      {showPrivateKey ? (
                        <EyeOff className="h-3.5 w-3.5 mr-1" />
                      ) : (
                        <Eye className="h-3.5 w-3.5 mr-1" />
                      )}
                      {showPrivateKey ? 'Hide' : 'Show'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-blue-400"
                      onClick={() => copyToClipboard(keys.privateKey, 'private')}
                    >
                      {copied === 'private' ? (
                        <Check className="h-3.5 w-3.5 mr-1" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 mr-1" />
                      )}
                      Copy
                    </Button>
                  </div>
                </Label>
                <div className="bg-gray-900/70 p-2 rounded text-xs font-mono text-gray-300 break-all">
                  {showPrivateKey ? keys.privateKey : '•'.repeat(64)}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                className="bg-blue-700 hover:bg-blue-600 text-white mr-2"
                onClick={downloadKeysFile}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Keys
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}