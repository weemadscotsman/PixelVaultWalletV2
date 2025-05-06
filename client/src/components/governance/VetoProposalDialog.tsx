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
          className="gap-2 bg-red-900/80 border border-red-500/30 hover:bg-red-800/90 text-shadow-neon"
          disabled={!hasAccessToGuardian}
        >
          <ShieldX className="h-4 w-4" />
          <span>Veto</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-background/95 border-gray-800 border-2 shadow-[0_0_15px_rgba(0,128,255,0.15)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-shadow-neon">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="font-mono tracking-tight">SYSPROTOCOL://VETO_COMMAND</span>
          </DialogTitle>
          <DialogDescription className="opacity-80">
            <code className="text-primary-light font-mono text-xs">{"> VETO_TARGET:"}</code> 
            <span className="font-mono text-white ml-1">{proposalTitle}</span>
            <p className="text-xs mt-1 text-muted-foreground">Veto guardians may override network consensus under critical conditions</p>
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
            <div className="bg-red-950/40 border border-red-500/30 p-4 rounded-md backdrop-blur-sm">
              <div className="flex gap-2 items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm text-red-400 font-medium mb-1 text-shadow-neon">CRITICAL ALERT: BLOCKCHAIN SECURITY OVERRIDE</p>
                  <p className="text-xs text-red-300/80 leading-tight">
                    Guardian veto authority can only be exercised in response to malicious, network-destabilizing protocol risks. All vetoes are permanently recorded on-chain with your guardian identity.
                  </p>
                </div>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="guardianId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary-light text-xs uppercase font-mono tracking-wide">
                    <span className="font-mono text-xs text-primary-light">{">>"}</span> GUARDIAN_AUTHORITY
                  </FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={loadingGuardians || activeGuardians.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background/70 border-gray-700 focus:ring-primary/30">
                        <SelectValue placeholder="SELECT GUARDIAN IDENTITY" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background/90 border-gray-700">
                      {activeGuardians.map((guardian) => (
                        <SelectItem 
                          key={guardian.id} 
                          value={guardian.id.toString()}
                          className="flex items-center"
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            <span className="font-mono text-white">{guardian.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs text-muted-foreground/70">
                    Authenticate with a qualified guardian identity
                  </FormDescription>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary-light text-xs uppercase font-mono tracking-wide">
                    <span className="font-mono text-xs text-primary-light">{">>"}</span> VETO_REASONING
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="INPUT SECURITY REASONING [REQUIRED]: Details will be permanently recorded on-chain"
                      className="resize-none min-h-[120px] bg-background/70 border-gray-700 font-mono text-sm focus:ring-primary/30"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground/70">
                    Provide detailed security justification for the blockchain record
                  </FormDescription>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />
            
            <div className="flex justify-between items-center pt-4 border-t border-gray-800">
              <div className="text-xs text-muted-foreground/60 font-mono">
                {vetoMutation.isPending ? (
                  <span className="text-primary-light animate-pulse">EXECUTING VETO PROTOCOL...</span>
                ) : (
                  <span>AUTH: {myGuardian?.name || "UNKNOWN"}</span>
                )}
              </div>
              
              <div className="space-x-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setOpen(false)}
                  className="border border-gray-700 text-white hover:bg-background/80"
                >
                  ABORT
                </Button>
                <Button 
                  type="submit" 
                  variant="destructive"
                  disabled={vetoMutation.isPending}
                  className="bg-red-900/70 border border-red-500/30 hover:bg-red-800/90 text-shadow-neon gap-2"
                >
                  {vetoMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  EXECUTE VETO
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}