import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Shield, Key, PlusCircle, Download, FileDown } from "lucide-react";
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
import { apiRequest } from "@/lib/queryClient";
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
  confirmPassphrase: z
    .string()
    .min(12, {
      message: "Passphrase must be at least 12 characters long.",
    })
}).refine(data => data.passphrase === data.confirmPassphrase, {
  message: "Passphrases do not match",
  path: ["confirmPassphrase"],
});

type FormValues = z.infer<typeof formSchema>;

export function CreateWalletForm() {
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walletCreated, setWalletCreated] = useState<{address: string, publicKey: string, passphrase: string} | null>(null);
  const { toast } = useToast();

  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      passphrase: "",
      confirmPassphrase: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const res = await fetch('/api/wallet/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          passphrase: values.passphrase
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create wallet');
      }
      
      const data = await res.json();
      setWalletCreated({
        address: data.wallet.address,
        publicKey: data.wallet.publicKey,
        passphrase: values.passphrase
      });
      
      toast({
        title: "Wallet created successfully",
        description: `Your new wallet address is: ${data.wallet.address}. SAVE YOUR PASSPHRASE! You'll need it to login.`,
      });
      
      // Keep the passphrase visible in the form for now
      form.reset({
        passphrase: values.passphrase,
        confirmPassphrase: values.confirmPassphrase
      });
      
    } catch (error) {
      console.error("Wallet creation error:", error);
      toast({
        title: "Failed to create wallet",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to export wallet information to a file
  const exportWalletToFile = () => {
    if (!walletCreated) return;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `pvx-paper-wallet-${walletCreated.address.substring(4, 12)}-${timestamp}.txt`;
    
    const walletInfo = `
======== PVX PAPER WALLET ========
IMPORTANT: Store this file securely offline!
Created: ${new Date().toLocaleString()}

WALLET ADDRESS:
${walletCreated.address}

PUBLIC KEY:
${walletCreated.publicKey}

PRIVATE PASSPHRASE (KEEP SECRET!):
${walletCreated.passphrase}

INSTRUCTIONS:
1. Print this document or store it on a secure offline device
2. Keep your passphrase completely private
3. Never share your passphrase with anyone
4. To access your wallet, you'll need both the address and passphrase

======== PVX BLOCKCHAIN ========
    `;
    
    const blob = new Blob([walletInfo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Paper Wallet Downloaded",
      description: "Store this file in a secure location. Anyone with access to this file can access your wallet!",
      variant: "default",
    });
  };

  return (
    <Card className="border-blue-900/50 bg-black/60">
      <CardHeader>
        <CardTitle className="text-blue-400">Create New Wallet</CardTitle>
        <CardDescription>
          Generate a new PVX wallet for the PixelVault blockchain
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="bg-blue-900/20 border-blue-700/50 mb-6">
          <Shield className="h-4 w-4 text-blue-400" />
          <AlertTitle className="text-blue-400">Security Warning</AlertTitle>
          <AlertDescription className="text-gray-300">
            Save your passphrase safely. If you lose it, you'll lose access to your wallet permanently.
          </AlertDescription>
        </Alert>

        {walletCreated ? (
          <div className="space-y-4">
            <div className="p-4 border border-green-600/30 bg-green-950/20 rounded-md">
              <h3 className="text-green-400 font-medium mb-2">Wallet Created Successfully!</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-400 text-sm">Address: </span>
                  <code className="text-white bg-black/50 p-1 rounded">{walletCreated.address}</code>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Public Key: </span>
                  <code className="text-white bg-black/50 p-1 rounded text-xs break-all">{walletCreated.publicKey}</code>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <Button 
                className="w-full bg-green-600 hover:bg-green-500"
                onClick={exportWalletToFile}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export Paper Wallet
              </Button>
              
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-500"
                onClick={() => setWalletCreated(null)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Another Wallet
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="passphrase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet Passphrase</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Enter a secure passphrase"
                          type={showPassphrase ? "text" : "password"}
                          {...field}
                          className="bg-black/30 border-blue-900/40 text-white pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                          onClick={() => setShowPassphrase(!showPassphrase)}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Create a strong, memorable passphrase (min 12 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassphrase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Passphrase</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Confirm your passphrase"
                        type={showPassphrase ? "text" : "password"}
                        {...field}
                        className="bg-black/30 border-blue-900/40 text-white"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the same passphrase again to confirm
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-500"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Wallet...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Wallet
                  </>
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}