import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, Plus, Clock, AlertCircle, User, Check, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Form validation schema for creating a veto guardian
const vetoGuardianSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  address: z.string().min(10, { message: "Please enter a valid address" }), // Basic validation for demo
  description: z.string().optional(),
  activeUntil: z.string().refine(date => !isNaN(new Date(date).getTime()), {
    message: "Please enter a valid date"
  })
});

type VetoGuardianFormValues = z.infer<typeof vetoGuardianSchema>;

interface VetoGuardian {
  id: number;
  address: string;
  name: string;
  appointedAt: Date;
  activeUntil: Date;
  isActive: boolean;
  vetoCount: number;
  description?: string;
}

const VetoGuardianSection: React.FC = () => {
  const [isAddGuardianOpen, setIsAddGuardianOpen] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState<VetoGuardian | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch veto guardians
  const { data: guardians, isLoading, error } = useQuery<VetoGuardian[]>({
    queryKey: ['/api/governance/veto-guardians'],
    retry: 1,
  });

  // Create veto guardian mutation
  const createGuardianMutation = useMutation({
    mutationFn: async (guardian: VetoGuardianFormValues) => {
      const formattedGuardian = {
        ...guardian,
        active_until: new Date(guardian.activeUntil).toISOString(),
        is_active: true
      };
      const res = await apiRequest('POST', '/api/governance/veto-guardian/create', formattedGuardian);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/governance/veto-guardians'] });
      setIsAddGuardianOpen(false);
      toast({
        title: 'Guardian created',
        description: 'Veto guardian has been created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Toggle guardian active status mutation
  const toggleGuardianStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest('PATCH', `/api/governance/veto-guardian/${id}`, { is_active: isActive });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/governance/veto-guardians'] });
      toast({
        title: 'Guardian updated',
        description: 'Veto guardian status has been updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Setup form for creating a new guardian
  const form = useForm<VetoGuardianFormValues>({
    resolver: zodResolver(vetoGuardianSchema),
    defaultValues: {
      name: '',
      address: '',
      description: '',
      activeUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
    },
  });

  const onSubmit = (values: VetoGuardianFormValues) => {
    createGuardianMutation.mutate(values);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Check if a guardian's term is active
  const isGuardianActive = (guardian: VetoGuardian) => {
    return guardian.isActive && new Date(guardian.activeUntil) > new Date();
  };

  // Get status badge styling
  const getStatusBadge = (guardian: VetoGuardian) => {
    if (!guardian.isActive) {
      return (
        <Badge variant="outline" className="bg-gray-700/20 text-gray-300 border-gray-600/30">
          Inactive
        </Badge>
      );
    }

    if (new Date(guardian.activeUntil) <= new Date()) {
      return (
        <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-600/30">
          Expired
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-600/30">
        Active
      </Badge>
    );
  };

  return (
    <Card className="bg-black/70 border-blue-900/50">
      <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
        <div className="flex justify-between items-center">
          <CardTitle className="text-blue-300 flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Veto Guardians
          </CardTitle>
          <Button 
            size="sm" 
            className="bg-blue-700 hover:bg-blue-600 text-white"
            onClick={() => setIsAddGuardianOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Guardian
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-400">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>There was an error loading veto guardians</p>
          </div>
        ) : guardians && guardians.length > 0 ? (
          <div className="space-y-4">
            {guardians.map((guardian) => (
              <div 
                key={guardian.id} 
                className="p-4 rounded border border-blue-900/30 bg-gray-900/30 transition-all hover:border-blue-400/50 cursor-pointer"
                onClick={() => setSelectedGuardian(guardian)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-blue-300">{guardian.name}</p>
                    <p className="text-xs font-mono text-gray-400">{guardian.address}</p>
                  </div>
                  {getStatusBadge(guardian)}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="text-xs text-gray-400 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Until: {formatDate(guardian.activeUntil)}</span>
                  </div>
                  <div className="text-xs text-gray-400 flex items-center">
                    <Shield className="h-3 w-3 mr-1" />
                    <span>Veto Count: {guardian.vetoCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Shield className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No veto guardians have been appointed yet</p>
            <p className="text-sm mt-1">
              Guardians can protect the network by vetoing harmful proposals
            </p>
          </div>
        )}
      </CardContent>

      {/* Add Guardian Dialog */}
      <Dialog open={isAddGuardianOpen} onOpenChange={setIsAddGuardianOpen}>
        <DialogContent className="bg-gray-900 border-blue-900/50 text-gray-200">
          <DialogHeader>
            <DialogTitle className="text-blue-300">Add Veto Guardian</DialogTitle>
            <DialogDescription>
              Create a new veto guardian to help protect the network from harmful proposals.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guardian Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter guardian name" 
                        className="bg-gray-800 border-gray-700"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="0x..." 
                        className="bg-gray-800 border-gray-700 font-mono"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-gray-400">
                      The wallet address that will have veto power.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="activeUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Active Until</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        className="bg-gray-800 border-gray-700"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-gray-400">
                      The date until which this guardian will have veto power.
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter a description of this guardian's role" 
                        className="bg-gray-800 border-gray-700 min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" className="border-gray-700 text-gray-300" onClick={() => setIsAddGuardianOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-700 hover:bg-blue-600 text-white"
                  disabled={createGuardianMutation.isPending}
                >
                  {createGuardianMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Guardian'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Guardian Details Dialog */}
      {selectedGuardian && (
        <Dialog open={!!selectedGuardian} onOpenChange={(open) => !open && setSelectedGuardian(null)}>
          <DialogContent className="bg-gray-900 border-blue-900/50 text-gray-200">
            <DialogHeader>
              <DialogTitle className="text-blue-300">Guardian Details</DialogTitle>
              <DialogDescription>
                View and manage this veto guardian's account.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-gray-800/40 p-4 rounded border border-gray-800 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <div className="flex items-center mt-1">
                    {getStatusBadge(selectedGuardian)}
                  </div>
                </div>
                {selectedGuardian.isActive ? (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => toggleGuardianStatusMutation.mutate({ 
                      id: selectedGuardian.id, 
                      isActive: false 
                    })}
                    disabled={toggleGuardianStatusMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Deactivate
                  </Button>
                ) : (
                  <Button 
                    className="bg-green-700 hover:bg-green-600 text-white" 
                    size="sm"
                    onClick={() => toggleGuardianStatusMutation.mutate({ 
                      id: selectedGuardian.id, 
                      isActive: true 
                    })}
                    disabled={toggleGuardianStatusMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Activate
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/40 p-4 rounded border border-gray-800">
                  <p className="text-sm text-gray-400">Name</p>
                  <p className="text-lg font-semibold text-blue-300 mt-1">{selectedGuardian.name}</p>
                </div>
                <div className="bg-gray-800/40 p-4 rounded border border-gray-800">
                  <p className="text-sm text-gray-400">Veto Count</p>
                  <p className="text-lg font-semibold text-blue-300 mt-1">{selectedGuardian.vetoCount}</p>
                </div>
              </div>
              
              <div className="bg-gray-800/40 p-4 rounded border border-gray-800">
                <p className="text-sm text-gray-400">Wallet Address</p>
                <p className="text-sm font-mono text-blue-300 mt-1">{selectedGuardian.address}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/40 p-4 rounded border border-gray-800">
                  <p className="text-sm text-gray-400">Appointed On</p>
                  <p className="text-sm text-blue-300 mt-1">{formatDate(selectedGuardian.appointedAt)}</p>
                </div>
                <div className="bg-gray-800/40 p-4 rounded border border-gray-800">
                  <p className="text-sm text-gray-400">Active Until</p>
                  <p className="text-sm text-blue-300 mt-1">{formatDate(selectedGuardian.activeUntil)}</p>
                </div>
              </div>
              
              {selectedGuardian.description && (
                <div className="bg-gray-800/40 p-4 rounded border border-gray-800">
                  <p className="text-sm text-gray-400">Description</p>
                  <p className="text-sm text-blue-300 mt-1">{selectedGuardian.description}</p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" className="border-gray-700 text-gray-300" onClick={() => setSelectedGuardian(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

export default VetoGuardianSection;