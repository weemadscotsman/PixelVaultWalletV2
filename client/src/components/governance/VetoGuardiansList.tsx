import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  useVetoGuardians, 
  useUpdateVetoGuardian,
  VetoGuardian
} from "@/hooks/use-veto-guardian";
import { Loader2, Shield, ShieldAlert, ShieldCheck } from "lucide-react";

export function VetoGuardiansList() {
  const { data: guardians, isLoading, error } = useVetoGuardians();
  const [selectedGuardian, setSelectedGuardian] = useState<VetoGuardian | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleOpenDetails = (guardian: VetoGuardian) => {
    setSelectedGuardian(guardian);
    setDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive/80 p-4 text-center">
        Failed to load veto guardians
      </div>
    );
  }

  if (!guardians || guardians.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 italic bg-background/50 rounded-lg border border-gray-800">
        No veto guardians have been appointed yet
      </div>
    );
  }

  return (
    <>
      <div className="mt-2 mb-4">
        <p className="text-muted-foreground text-sm">
          Veto guardians protect the network by being able to veto harmful proposals.
        </p>
      </div>

      <div className="border border-gray-800 rounded-lg overflow-hidden relative">
        <Table className="text-sm">
          <TableHeader className="bg-muted/10">
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Guardian</TableHead>
              <TableHead>Appointed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Vetoes</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guardians.map((guardian) => (
              <TableRow 
                key={guardian.id}
                className="hover:bg-muted/5 cursor-pointer"
                onClick={() => handleOpenDetails(guardian)}
              >
                <TableCell>
                  {guardian.is_active ? 
                    <ShieldCheck className="h-5 w-5 text-green-500" /> : 
                    <ShieldAlert className="h-5 w-5 text-yellow-500" />
                  }
                </TableCell>
                <TableCell className="font-medium text-gray-200">
                  {guardian.name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(guardian.appointed_at), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={guardian.is_active ? "outline" : "secondary"}
                    className={guardian.is_active ? "text-green-500 border-green-500/30" : "text-yellow-500"}
                  >
                    {guardian.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {guardian.veto_count}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetails(guardian);
                    }}
                  >
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedGuardian && (
        <VetoGuardianDetails 
          guardian={selectedGuardian}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </>
  );
}

interface VetoGuardianDetailsProps {
  guardian: VetoGuardian;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function VetoGuardianDetails({ guardian, open, onOpenChange }: VetoGuardianDetailsProps) {
  const updateMutation = useUpdateVetoGuardian();
  
  const handleStatusChange = () => {
    updateMutation.mutate({ 
      id: guardian.id, 
      isActive: !guardian.is_active 
    });
    onOpenChange(false);
  };

  const statusText = guardian.is_active ? "Active" : "Inactive";
  const toggleText = guardian.is_active ? "Deactivate" : "Activate"; 
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary/80" />
            <span>Veto Guardian Details</span>
          </DialogTitle>
          <DialogDescription>
            View details and manage veto guardian status
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-[120px_1fr] gap-2">
            <div className="text-muted-foreground">Name:</div>
            <div className="font-medium">{guardian.name}</div>
            
            <div className="text-muted-foreground">Address:</div>
            <div className="font-mono text-xs break-all">{guardian.address}</div>
            
            <div className="text-muted-foreground">Appointed:</div>
            <div>{new Date(guardian.appointed_at).toLocaleDateString()}</div>
            
            <div className="text-muted-foreground">Active Until:</div>
            <div>{new Date(guardian.active_until).toLocaleDateString()}</div>
            
            <div className="text-muted-foreground">Status:</div>
            <div>
              <Badge 
                variant={guardian.is_active ? "outline" : "secondary"}
                className={guardian.is_active ? "text-green-500 border-green-500/30" : "text-yellow-500"}
              >
                {statusText}
              </Badge>
            </div>
            
            <div className="text-muted-foreground">Vetoes:</div>
            <div>{guardian.veto_count}</div>
          </div>

          {guardian.description && (
            <div className="mt-2">
              <div className="text-muted-foreground mb-1">Description:</div>
              <div className="text-sm">{guardian.description}</div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant={guardian.is_active ? "destructive" : "default"}
            onClick={handleStatusChange}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {toggleText} Guardian
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}