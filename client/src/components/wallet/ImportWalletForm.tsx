import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, ShieldAlert, Upload } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Validation schema for wallet import by private key
const privateKeyFormSchema = z.object({
  privateKey: z
    .string()
    .min(64, {
      message: "Private key must be at least 64 characters long.",
    })
    .max(128, {
      message: "Private key must not exceed 128 characters.",
    }),
  passphrase: z
    .string()
    .min(12, {
      message: "Passphrase must be at least 12 characters long.",
    }),
  confirmPassphrase: z.string(),
}).refine((data) => data.passphrase === data.confirmPassphrase, {
  message: "Passphrases do not match.",
  path: ["confirmPassphrase"],
});

// Validation schema for wallet import by JSON file
const jsonFileFormSchema = z.object({
  passphrase: z
    .string()
    .min(12, {
      message: "Passphrase must be at least 12 characters long.",
    }),
  confirmPassphrase: z.string(),
}).refine((data) => data.passphrase === data.confirmPassphrase, {
  message: "Passphrases do not match.",
  path: ["confirmPassphrase"],
});

export function ImportWalletForm() {
  const { importWalletMutation } = useWallet();
  const [importMethod, setImportMethod] = useState<'privateKey' | 'jsonFile'>('privateKey');
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [jsonFileData, setJsonFileData] = useState<{
    privateKey?: string;
    walletAddress?: string;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Private key form definition
  const privateKeyForm = useForm<z.infer<typeof privateKeyFormSchema>>({
    resolver: zodResolver(privateKeyFormSchema),
    defaultValues: {
      privateKey: "",
      passphrase: "",
      confirmPassphrase: "",
    },
  });

  // JSON file form definition
  const jsonFileForm = useForm<z.infer<typeof jsonFileFormSchema>>({
    resolver: zodResolver(jsonFileFormSchema),
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
  const handlePassphraseChange = (e: React.ChangeEvent<HTMLInputElement>, form: any) => {
    const value = e.target.value;
    form.setValue("passphrase", value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    setJsonFileData(null);
    
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }
    
    const file = files[0];
    if (file.type !== 'application/json') {
      setFileError('Please upload a valid JSON file');
      return;
    }
    
    setJsonFile(file);
    
    // Read the file contents
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        if (!jsonData.privateKey) {
          setFileError('Invalid wallet file: missing private key');
          return;
        }
        
        setJsonFileData(jsonData);
      } catch (error) {
        setFileError('Invalid JSON file format');
      }
    };
    reader.readAsText(file);
  };

  // Form submission for private key
  const onSubmitPrivateKey = async (values: z.infer<typeof privateKeyFormSchema>) => {
    await importWalletMutation.mutateAsync({ 
      privateKey: values.privateKey,
      passphrase: values.passphrase 
    });
    
    // Reset form
    privateKeyForm.reset();
  };

  // Form submission for JSON file
  const onSubmitJsonFile = async (values: z.infer<typeof jsonFileFormSchema>) => {
    if (!jsonFileData || !jsonFileData.privateKey) {
      setFileError('Please upload a valid wallet file first');
      return;
    }
    
    await importWalletMutation.mutateAsync({ 
      privateKey: jsonFileData.privateKey,
      passphrase: values.passphrase 
    });
    
    // Reset form
    jsonFileForm.reset();
    setJsonFile(null);
    setJsonFileData(null);
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
          <Upload className="h-5 w-5" />
          Import Existing Wallet
        </CardTitle>
        <CardDescription className="text-gray-400">
          Import an existing PVX wallet using your private key or wallet file
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <Tabs 
          defaultValue="privateKey" 
          value={importMethod} 
          onValueChange={(value: string) => setImportMethod(value as 'privateKey' | 'jsonFile')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-gray-900/50 mb-6">
            <TabsTrigger value="privateKey" className="data-[state=active]:bg-blue-900/30">
              Private Key
            </TabsTrigger>
            <TabsTrigger value="jsonFile" className="data-[state=active]:bg-blue-900/30">
              Wallet File
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="privateKey" className="mt-0">
            <Alert className="mb-4 bg-amber-900/20 border-amber-600/30 text-amber-400">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription className="text-xs">
                Only enter your private key if you're on a secure device. Never share your private key with anyone.
              </AlertDescription>
            </Alert>

            <Form {...privateKeyForm}>
              <form onSubmit={privateKeyForm.handleSubmit(onSubmitPrivateKey)} className="space-y-6">
                <FormField
                  control={privateKeyForm.control}
                  name="privateKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Wallet Private Key</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter your wallet private key"
                          className="bg-gray-900/50 border-blue-900/50 focus:border-blue-500 font-mono"
                        />
                      </FormControl>
                      <FormDescription className="text-gray-500 text-xs">
                        The private key from your existing PVX wallet
                      </FormDescription>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={privateKeyForm.control}
                  name="passphrase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">New Wallet Passphrase</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter a secure passphrase"
                          className="bg-gray-900/50 border-blue-900/50 focus:border-blue-500"
                          onChange={(e) => handlePassphraseChange(e, privateKeyForm)}
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
                        This passphrase will encrypt your wallet on this device
                      </FormDescription>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={privateKeyForm.control}
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
                  disabled={importWalletMutation.isPending}
                >
                  {importWalletMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing Wallet...
                    </>
                  ) : (
                    'Import Wallet'
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="jsonFile" className="mt-0">
            <Alert className="mb-4 bg-blue-900/20 border-blue-600/30 text-blue-400">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Import from Backup File</AlertTitle>
              <AlertDescription className="text-xs">
                Upload the wallet file you exported previously from your PVX wallet and set a new passphrase.
              </AlertDescription>
            </Alert>

            <div className="mb-6">
              <FormLabel className="text-gray-300 block mb-2">Wallet Backup File</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".json"
                  className="bg-gray-900/50 border-blue-900/50 focus:border-blue-500 file:bg-blue-800 file:text-white file:border-0 file:rounded file:px-2 file:py-1 file:mr-2"
                />
              </div>
              {fileError && (
                <p className="text-red-400 text-xs mt-1">{fileError}</p>
              )}
              {jsonFileData && jsonFileData.walletAddress && (
                <p className="text-green-400 text-xs mt-1">
                  Wallet found: {jsonFileData.walletAddress}
                </p>
              )}
            </div>

            <Form {...jsonFileForm}>
              <form onSubmit={jsonFileForm.handleSubmit(onSubmitJsonFile)} className="space-y-6">
                <FormField
                  control={jsonFileForm.control}
                  name="passphrase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">New Wallet Passphrase</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter a secure passphrase"
                          className="bg-gray-900/50 border-blue-900/50 focus:border-blue-500"
                          onChange={(e) => handlePassphraseChange(e, jsonFileForm)}
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
                        This passphrase will encrypt your wallet on this device
                      </FormDescription>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={jsonFileForm.control}
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
                  disabled={importWalletMutation.isPending || !jsonFileData}
                >
                  {importWalletMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing Wallet...
                    </>
                  ) : (
                    'Import Wallet'
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}