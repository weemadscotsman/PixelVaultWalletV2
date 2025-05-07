import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VetoGuardiansList } from "./VetoGuardiansList";
import { CreateVetoGuardianForm } from "./CreateVetoGuardianForm";
import { Shield } from "lucide-react";

export function VetoGuardiansPanel() {
  return (
    <Card className="border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary/80" />
            <CardTitle>Veto Guardians</CardTitle>
          </div>
          <CreateVetoGuardianForm />
        </div>
        <CardDescription>
          Special accounts with the power to veto harmful governance proposals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="active">Active Guardians</TabsTrigger>
            <TabsTrigger value="about">About Veto Power</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="space-y-4">
            <VetoGuardiansList />
          </TabsContent>
          <TabsContent value="about">
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-4">
                <h4 className="text-blue-400 font-medium mb-2">What are Veto Guardians?</h4>
                <p>
                  Veto Guardians are trusted blockchain addresses that have been granted the ability 
                  to instantly block harmful governance proposals before they can be executed.
                </p>
              </div>

              <div>
                <h4 className="text-gray-300 font-medium mb-2">Purpose</h4>
                <p>
                  The veto guardian system provides an additional layer of security against 
                  malicious or technically flawed governance proposals that could damage the 
                  network, while still allowing the community to govern the protocol.
                </p>
              </div>

              <div>
                <h4 className="text-gray-300 font-medium mb-2">Guardian Selection</h4>
                <p>
                  Guardians are carefully selected for their technical expertise, reputation, and 
                  commitment to the network's health. Their power is intentionally limited to 
                  rejecting harmful proposals and cannot be used to create or modify proposals.
                </p>
              </div>

              <div>
                <h4 className="text-gray-300 font-medium mb-2">Balance of Power</h4>
                <p>
                  To maintain a balance of power, each guardian's authority has an expiration date, 
                  requiring periodic renewal. Additionally, guardians must provide a clear reason 
                  when exercising their veto power, ensuring transparency and accountability.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}