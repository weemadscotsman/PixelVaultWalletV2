import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Shield, AlertTriangle, Check, Copy, Eye, EyeOff, Download, Key } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// Validation schema for wallet creation
const formSchema = z.object({
  passphrase: z
    .string()
    .min(12, {
      message: "Passphrase must be at least 12 characters long.",
    })
    .max(64, {
      message: "Passphrase must not exceed 64 characters.",
    }),
  confirmPassphrase: z.string(),
}).refine((data) => data.passphrase === data.confirmPassphrase, {
  message: "Passphrases do not match.",
  path: ["confirmPassphrase"],
});

interface WalletCreationDetails {
  address: string;
  publicKey: string;
  privateKey: string;
}

export function CreateWalletForm() {
  const { createWalletMutation, exportWalletKeysMutation } = useWallet();
  const { toast } = useToast();
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [newWalletDetails, setNewWalletDetails] = useState<WalletCreationDetails | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copied, setCopied] = useState<'none' | 'address' | 'publicKey' | 'privateKey'>('none');

  // Form definition
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      passphrase: "",
      confirmPassphrase: "",
    },
  });

  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    
    if (password.length >= 12) strength += 1;
    if (password.length >= 16) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return Math.min(5, strength);
  };

  // Handle input change for passphrase
  const handlePassphraseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("passphrase", value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, type: 'address' | 'publicKey' | 'privateKey') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    
    toast({
      title: 'Copied to clipboard',
      description: `${type === 'address' ? 'Wallet address' : type === 'publicKey' ? 'Public key' : 'Private key'} copied to clipboard`,
    });
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopied('none');
    }, 2000);
  };

  // Download wallet keys as JSON file
  const downloadKeysFile = () => {
    if (!newWalletDetails) return;
    
    const keysData = {
      walletAddress: newWalletDetails.address,
      publicKey: newWalletDetails.publicKey,
      privateKey: newWalletDetails.privateKey,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(keysData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pvx-wallet-keys-${newWalletDetails.address.substring(4, 12)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Keys downloaded',
      description: 'Your wallet keys have been downloaded as a JSON file',
    });
  };

  // Form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      console.log("Creating wallet with passphrase (length):", values.passphrase.length);
      
      const wallet = await createWalletMutation.mutateAsync({ 
        passphrase: values.passphrase 
      });
      
      console.log("Wallet created successfully:", wallet);
      
      // Get private keys for the new wallet
      const keys = await exportWalletKeysMutation.mutateAsync({
        address: wallet.address,
        passphrase: values.passphrase
      });
      
      // Set wallet details including private key
      setNewWalletDetails({
        address: wallet.address,
        publicKey: wallet.publicKey,
        privateKey: keys.privateKey
      });
      
      // Show success message and reset form
      setShowSuccessMessage(true);
      form.reset();
    } catch (error) {
      console.error("Error in form submission:", error);
    }
  };

  // Get passphrase strength color
  const getStrengthColor = () => {
    if (passwordStrength <= 1) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Get passphrase strength label
  const getStrengthLabel = () => {
    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength <= 3) return "Moderate";
    return "Strong";
  };

  return (
    <Card className="bg-black/70 border-blue-900/50 w-full max-w-md mx-auto">
      <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
        <CardTitle className="text-blue-300 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Create New PVX Wallet
        </CardTitle>
        <CardDescription className="text-gray-400">
          Create a new secure wallet to store and manage your PVX tokens
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        {/* Show wallet creation form if no wallet details yet */}
        {!newWalletDetails ? (
          <>
            {showSuccessMessage && (
              <Alert className="mb-4 bg-green-900/20 border-green-600/30 text-green-400">
                <Check className="h-4 w-4" />
                <AlertTitle>Wallet created successfully!</AlertTitle>
                <AlertDescription>
                  Your new wallet has been created and is now active. Make sure to safely store your passphrase.
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Alert className="bg-blue-900/20 border-blue-600/30 text-blue-300">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Important security information</AlertTitle>
                  <AlertDescription className="text-xs">
                    Your passphrase is used to encrypt your private keys and is required for all transactions. 
                    Make sure it's strong and you remember it. If you lose your passphrase, you'll lose access to your wallet permanently.
                  </AlertDescription>
                </Alert>

                <FormField
                  control={form.control}
                  name="passphrase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Wallet Passphrase</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter a secure passphrase"
                          className="bg-gray-900/50 border-blue-900/50 focus:border-blue-500"
                          onChange={handlePassphraseChange}
                        />
                      </FormControl>
                      <div className="mt-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-400">Strength</span>
                          <span className="text-xs text-gray-400">{getStrengthLabel()}</span>
                        </div>
                        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getStrengthColor()} transition-all duration-300`} 
                            style={{ width: `${(passwordStrength / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <FormDescription className="text-gray-500 text-xs">
                        Use at least 12 characters with numbers, symbols, and capital letters
                      </FormDescription>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassphrase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Confirm Passphrase</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Confirm your passphrase"
                          className="bg-gray-900/50 border-blue-900/50 focus:border-blue-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <Button
                  type="submit"
                  className="w-full bg-blue-700 hover:bg-blue-600 text-white"
                  disabled={createWalletMutation.isPending}
                >
                  {createWalletMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Wallet...
                    </>
                  ) : (
                    "Create Wallet"
                  )}
                </Button>
              </form>
            </Form>
          </>
        ) : (
          /* Show wallet keys after successful creation */
          <div className="space-y-6">
            <Alert className="bg-green-900/20 border-green-600/30 text-green-400">
              <Check className="h-4 w-4" />
              <AlertTitle>Wallet Created Successfully!</AlertTitle>
              <AlertDescription className="text-xs">
                Your new wallet has been created and is now active. Please save your wallet keys for backup and recovery.
                <strong className="block mt-2">Important: Copy or download your private key now. It will not be shown again!</strong>
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="walletAddress" className="text-white flex justify-between">
                  <span>Wallet Address</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-blue-400"
                    onClick={() => copyToClipboard(newWalletDetails.address, 'address')}
                  >
                    {copied === 'address' ? (
                      <Check className="h-3.5 w-3.5 mr-1" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 mr-1" />
                    )}
                    Copy
                  </Button>
                </Label>
                <div className="bg-gray-900/70 p-2 rounded text-sm font-mono text-blue-300 break-all">
                  {newWalletDetails.address}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="publicKey" className="text-white flex justify-between">
                  <span>Public Key</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-blue-400"
                    onClick={() => copyToClipboard(newWalletDetails.publicKey, 'publicKey')}
                  >
                    {copied === 'publicKey' ? (
                      <Check className="h-3.5 w-3.5 mr-1" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 mr-1" />
                    )}
                    Copy
                  </Button>
                </Label>
                <div className="bg-gray-900/70 p-2 rounded text-xs font-mono text-gray-300 break-all">
                  {newWalletDetails.publicKey}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="privateKey" className="text-white flex justify-between">
                  <span>Private Key <span className="text-red-400 text-xs">(KEEP SECURE!)</span></span>
                  <div className="flex space-x-1">
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
                      onClick={() => copyToClipboard(newWalletDetails.privateKey, 'privateKey')}
                      disabled={!showPrivateKey}
                    >
                      {copied === 'privateKey' ? (
                        <Check className="h-3.5 w-3.5 mr-1" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 mr-1" />
                      )}
                      Copy
                    </Button>
                  </div>
                </Label>
                <div className="bg-gray-900/70 p-2 rounded text-xs font-mono text-red-300 break-all">
                  {showPrivateKey ? newWalletDetails.privateKey : '•'.repeat(64)}
                </div>
                <p className="text-red-400 text-xs italic">
                  Never share your private key with anyone! Anyone with access to this key can control your wallet.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3">
              <Button 
                onClick={downloadKeysFile}
                className="w-full bg-blue-700 hover:bg-blue-600 text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Wallet Keys as JSON File
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full border-blue-900/50 text-blue-300"
                onClick={() => setNewWalletDetails(null)}
              >
                <Key className="mr-2 h-4 w-4" />
                Create Another Wallet
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}