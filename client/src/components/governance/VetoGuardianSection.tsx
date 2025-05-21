import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Check, X, Pencil, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useVetoGuardians, useCreateVetoGuardian, useUpdateVetoGuardian, VetoGuardian } from '@/hooks/use-veto-guardian';
import Spinner from '@/components/ui/spinner';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export function VetoGuardianSection() {
  const { data: vetoGuardians, isLoading, error } = useVetoGuardians();
  const createMutation = useCreateVetoGuardian();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentGuardian, setCurrentGuardian] = useState<VetoGuardian | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    address: '',
    name: '',
    description: '',
    activeUntil: ''
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      address: formData.address,
      name: formData.name,
      description: formData.description,
      activeUntil: formData.activeUntil || undefined
    });
    setCreateDialogOpen(false);
    setFormData({ address: '', name: '', description: '', activeUntil: '' });
  };

  const updateMutation = useUpdateVetoGuardian(currentGuardian?.id || '');

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGuardian) return;

    updateMutation.mutate({
      name: formData.name || currentGuardian.name,
      description: formData.description || currentGuardian.description || '',
      isActive: true,
      activeUntil: formData.activeUntil ? new Date(formData.activeUntil).toISOString() : currentGuardian.activeUntil
    });
    setEditDialogOpen(false);
    setFormData({ address: '', name: '', description: '', activeUntil: '' });
    setCurrentGuardian(null);
  };

  const handleEditGuardian = (guardian: VetoGuardian) => {
    setCurrentGuardian(guardian);
    setFormData({
      address: guardian.address,
      name: guardian.name,
      description: guardian.description || '',
      activeUntil: guardian.activeUntil ? new Date(guardian.activeUntil).toISOString().split('T')[0] : ''
    });
    setEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="w-full h-[400px] flex items-center justify-center border-border/50 bg-background/50">
        <Spinner size="lg" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-border/50 bg-background/50">
        <CardHeader>
          <CardTitle className="flex items-center text-neon-blue">
            <Shield className="mr-2 h-5 w-5" /> Veto Guardians
          </CardTitle>
          <CardDescription>Network protection system</CardDescription>
        </CardHeader>
        <CardContent className="text-center p-6">
          <p className="text-red-500">Error loading veto guardians: {(error as Error).message}</p>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full border-border/50 bg-background/50">
      <CardHeader>
        <CardTitle className="flex items-center text-neon-blue">
          <Shield className="mr-2 h-5 w-5" /> Veto Guardians
        </CardTitle>
        <CardDescription>Network protection system</CardDescription>
      </CardHeader>
      <CardContent>
        {vetoGuardians && Array.isArray(vetoGuardians) && vetoGuardians.length > 0 ? (
          <div className="space-y-4">
            {vetoGuardians.map((guardian: VetoGuardian) => (
              <div key={guardian.id} className="p-4 border rounded-md bg-background/70 hover:bg-background/90 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium flex items-center">
                      {guardian.name}
                      {guardian.isActive ? (
                        <Badge variant="outline" className="ml-2 bg-green-900/30 text-green-400 border-green-700">
                          <Check className="h-3 w-3 mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="ml-2 bg-red-900/30 text-red-400 border-red-700">
                          <X className="h-3 w-3 mr-1" /> Inactive
                        </Badge>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">{guardian.address}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleEditGuardian(guardian)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                
                {guardian.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{guardian.description}</p>
                )}
                
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>Appointed: {formatDistanceToNow(new Date(guardian.appointedAt), { addSuffix: true })}</span>
                  {guardian.activeUntil && (
                    <span>• Active until: {new Date(guardian.activeUntil).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-6 border rounded-md border-dashed">
            <p className="text-muted-foreground">No veto guardians found</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-1 text-neon-blue border-neon-blue/50 hover:bg-neon-blue/10">
              <Plus className="h-4 w-4" /> Add Guardian
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Veto Guardian</DialogTitle>
              <DialogDescription>
                Veto guardians protect the network by reviewing and potentially blocking harmful governance proposals.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="address">Wallet Address</Label>
                  <Input 
                    id="address" 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="PVX_..." 
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="name">Guardian Title</Label>
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Network Supervisor" 
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe this guardian's responsibilities..." 
                    rows={3}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="activeUntil">Active Until (optional)</Label>
                  <Input 
                    id="activeUntil" 
                    type="date"
                    value={formData.activeUntil}
                    onChange={(e) => setFormData({...formData, activeUntil: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">If not specified, guardian will be active for 1 year</p>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="gap-1 text-background bg-neon-blue hover:bg-neon-blue/90"
                >
                  {createMutation.isPending && <Spinner size="sm" />}
                  Create Guardian
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Veto Guardian</DialogTitle>
              <DialogDescription>
                Edit the details for this veto guardian.
              </DialogDescription>
            </DialogHeader>
            
            {currentGuardian && (
              <form onSubmit={handleUpdateSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-address">Wallet Address</Label>
                    <Input 
                      id="edit-address" 
                      value={formData.address}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Guardian Title</Label>
                    <Input 
                      id="edit-name" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Network Supervisor" 
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea 
                      id="edit-description" 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Describe this guardian's responsibilities..." 
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-activeUntil">Active Until</Label>
                    <Input 
                      id="edit-activeUntil" 
                      type="date"
                      value={formData.activeUntil}
                      onChange={(e) => setFormData({...formData, activeUntil: e.target.value})}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit" className="gap-1 text-background bg-neon-blue hover:bg-neon-blue/90">
                    Update Guardian
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}