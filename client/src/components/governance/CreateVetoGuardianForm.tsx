import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, ShieldOff } from "lucide-react";
import { useCreateVetoGuardian } from "@/hooks/use-veto-guardian";
import { useWallet } from "@/hooks/use-wallet";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Guardian name must be at least 2 characters.",
  }),
  address: z.string().min(32, {
    message: "Please enter a valid blockchain address.",
  }),
  description: z.string().optional(),
  active_until: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateVetoGuardianForm() {
  const [open, setOpen] = useState(false);
  const { wallet } = useWallet();
  const createMutation = useCreateVetoGuardian();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: wallet?.publicAddress || "",
      description: "",
      active_until: "",
    },
  });
  
  function onSubmit(values: FormValues) {
    createMutation.mutate({
      name: values.name,
      address: values.address,
      description: values.description || undefined,
      active_until: values.active_until ? new Date(values.active_until) : undefined,
    }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      }
    });
  }

  // Update the address field when wallet changes
  useState(() => {
    if (wallet?.publicAddress) {
      form.setValue("address", wallet.publicAddress);
    }
  });
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Create Guardian</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Veto Guardian</DialogTitle>
          <DialogDescription>
            Veto guardians have the authority to block harmful governance proposals.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guardian Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Security Committee Alpha" {...field} />
                  </FormControl>
                  <FormDescription>
                    Public name displayed in the guardians list
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Blockchain Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    This address will be granted veto powers
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detail the purpose and authority of this guardian..."
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description of guardian's role
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="active_until"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Active Until</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    Optional expiration date (defaults to 6 months)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpen(false)}
                className="gap-2"
              >
                <ShieldOff className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="gap-2"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Guardian
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}