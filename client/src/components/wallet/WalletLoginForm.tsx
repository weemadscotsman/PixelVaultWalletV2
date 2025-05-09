import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Shield, Key, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
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

// Validation schema for wallet login
const formSchema = z.object({
  address: z
    .string()
    .min(8, {
      message: "Address must be valid.",
    }),
  passphrase: z
    .string()
    .min(12, {
      message: "Passphrase must be at least 12 characters long.",
    })
    .max(64, {
      message: "Passphrase must not exceed 64 characters.",
    }),
});

type FormValues = z.infer<typeof formSchema>;

export function WalletLoginForm() {
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
      passphrase: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await login(values);
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-blue-900/50 bg-black/60">
      <CardHeader>
        <CardTitle className="text-blue-400">Wallet Login</CardTitle>
        <CardDescription>
          Authenticate with your wallet address and passphrase to access secured features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="bg-blue-900/20 border-blue-700/50 mb-6">
          <Shield className="h-4 w-4 text-blue-400" />
          <AlertTitle className="text-blue-400">Security Note</AlertTitle>
          <AlertDescription className="text-gray-300">
            We never store your passphrase. It's only used to generate a signature that authenticates your requests.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wallet Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your PVX wallet address" 
                      {...field} 
                      className="bg-black/30 border-blue-900/40 text-white"
                    />
                  </FormControl>
                  <FormDescription>
                    Your PVX wallet address (starts with PVX_)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="passphrase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passphrase</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Enter your wallet passphrase"
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
                        {showPassphrase ? 
                          <Key className="h-4 w-4" /> : 
                          <Key className="h-4 w-4" />
                        }
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    The secret passphrase you set when creating your wallet
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
                  Authenticating...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}