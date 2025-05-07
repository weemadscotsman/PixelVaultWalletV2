import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Shield, AlertTriangle, Check } from "lucide-react";
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

export function CreateWalletForm() {
  const { createWalletMutation } = useWallet();
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

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

  // Form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      console.log("Creating wallet with passphrase (length):", values.passphrase.length);
      
      const result = await createWalletMutation.mutateAsync({ 
        passphrase: values.passphrase 
      });
      
      console.log("Wallet created successfully:", result);
      
      // Show success message and reset form
      setShowSuccessMessage(true);
      form.reset();
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
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
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="border-t border-blue-900/30 bg-blue-900/10 py-4">
        <Button
          className="w-full bg-blue-700 hover:bg-blue-600 text-white"
          onClick={form.handleSubmit(onSubmit)}
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
      </CardFooter>
    </Card>
  );
}