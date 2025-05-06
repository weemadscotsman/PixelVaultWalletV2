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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertTriangle,
  Loader2,
  ShieldCheck,
  ShieldX
} from "lucide-react";
import { 
  useVetoGuardians, 
  useVetoGuardianByAddress, 
  useVetoProposal
} from "@/hooks/use-veto-guardian";
import { useWallet } from "@/hooks/use-wallet";

const formSchema = z.object({
  guardianId: z.string().min(1, { message: "Please select a guardian" }),
  reason: z.string().min(10, { message: "Reason must be at least 10 characters" })
    .max(500, { message: "Reason cannot exceed 500 characters" }),
});

type FormValues = z.infer<typeof formSchema>;

interface VetoProposalDialogProps {
  proposalId: number;
  proposalTitle: string;
}

export function VetoProposalDialog({ proposalId, proposalTitle }: VetoProposalDialogProps) {
  const [open, setOpen] = useState(false);
  const { wallet } = useWallet();
  const { data: guardians, isLoading: loadingGuardians } = useVetoGuardians();
  const { data: myGuardian } = useVetoGuardianByAddress(wallet?.publicAddress);
  const vetoMutation = useVetoProposal();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      guardianId: "",
      reason: "",
    },
  });
  
  // Set the guardian ID if the user is a guardian
  useState(() => {
    if (myGuardian) {
      form.setValue("guardianId", myGuardian.id.toString());
    }
  });
  
  function onSubmit(values: FormValues) {
    vetoMutation.mutate({
      proposalId,
      data: {
        guardianId: parseInt(values.guardianId),
        reason: values.reason
      }
    }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      }
    });
  }
  
  // Only show active guardians that the user controls
  const activeGuardians = guardians?.filter(g => 
    g.is_active && g.address === wallet?.publicAddress
  ) || [];
  
  const hasAccessToGuardian = activeGuardians.length > 0;
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm"
          className="gap-2"
          disabled={!hasAccessToGuardian}
        >
          <ShieldX className="h-4 w-4" />
          <span>Veto</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>Veto Proposal</span>
          </DialogTitle>
          <DialogDescription>
            You are about to veto proposal: <span className="font-medium">{proposalTitle}</span>
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-md">
              <p className="text-sm text-destructive/80">
                <strong>Warning:</strong> Vetoing a proposal is a serious action that should only be 
                taken when a proposal poses a significant risk to the network.
              </p>
            </div>
            
            <FormField
              control={form.control}
              name="guardianId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guardian Authority</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={loadingGuardians || activeGuardians.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a guardian" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeGuardians.map((guardian) => (
                        <SelectItem 
                          key={guardian.id} 
                          value={guardian.id.toString()}
                          className="flex items-center"
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            <span>{guardian.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select which guardian authority to use for the veto
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Veto Reason</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Explain why this proposal must be vetoed..."
                      className="resize-none min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a clear reason for vetoing this proposal
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
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="destructive"
                disabled={vetoMutation.isPending}
                className="gap-2"
              >
                {vetoMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Veto
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}