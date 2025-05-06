import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import BadgeGrid, { BadgeData, UserBadge } from '@/components/badges/BadgeGrid';
import BadgeDetails from '@/components/badges/BadgeDetails';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Award, 
  Users, 
  ShieldCheck, 
  Pickaxe, 
  Banknote, 
  Heart, 
  Lock 
} from 'lucide-react';

const BadgesPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | UserBadge | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Handle badge click
  const handleBadgeClick = (badge: BadgeData | UserBadge) => {
    setSelectedBadge(badge);
    setIsDetailsOpen(true);
  };
  
  // Close badge details modal
  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
  };
  
  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Your Badges Section */}
        <div className="w-full md:w-2/3">
          <BadgeGrid
            title="Your Badges"
            description="Badges you've earned in the PVX ecosystem"
            userId={user?.id}
            maxBadgesToShow={12}
            onBadgeClick={handleBadgeClick}
          />
        </div>
        
        {/* Featured Badges Section */}
        <div className="w-full md:w-1/3">
          <BadgeGrid
            title="Featured Badges"
            description="Your showcase badges"
            userId={user?.id}
            maxBadgesToShow={6}
            size="lg"
            onBadgeClick={handleBadgeClick}
          />
        </div>
      </div>
      
      {/* Badge Categories Tabs */}
      <Tabs defaultValue="achievements" className="w-full">
        <div className="border-b border-border/40 mb-6">
          <TabsList className="bg-transparent p-0 h-auto">
            <TabsTrigger 
              value="achievements"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 data-[state=active]:bg-transparent h-12"
            >
              <Award className="w-4 h-4 mr-2" />
              Achievements
            </TabsTrigger>
            <TabsTrigger 
              value="community"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 data-[state=active]:bg-transparent h-12"
            >
              <Users className="w-4 h-4 mr-2" />
              Community
            </TabsTrigger>
            <TabsTrigger 
              value="governance"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 data-[state=active]:bg-transparent h-12"
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Governance
            </TabsTrigger>
            <TabsTrigger 
              value="mining"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 data-[state=active]:bg-transparent h-12"
            >
              <Pickaxe className="w-4 h-4 mr-2" />
              Mining
            </TabsTrigger>
            <TabsTrigger 
              value="staking"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 data-[state=active]:bg-transparent h-12"
            >
              <Banknote className="w-4 h-4 mr-2" />
              Staking
            </TabsTrigger>
            <TabsTrigger 
              value="thringlets"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 data-[state=active]:bg-transparent h-12"
            >
              <Heart className="w-4 h-4 mr-2" />
              Thringlets
            </TabsTrigger>
            <TabsTrigger 
              value="security"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 data-[state=active]:bg-transparent h-12"
            >
              <Lock className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="achievements" className="mt-0">
          <BadgeGrid
            title="Achievement Badges"
            description="Badges earned by reaching milestones in the PVX ecosystem"
            category="achievements"
            showLocked={true}
            onBadgeClick={handleBadgeClick}
          />
        </TabsContent>
        
        <TabsContent value="community" className="mt-0">
          <BadgeGrid
            title="Community Badges"
            description="Badges earned through community participation and contribution"
            category="community"
            showLocked={true}
            onBadgeClick={handleBadgeClick}
          />
        </TabsContent>
        
        <TabsContent value="governance" className="mt-0">
          <BadgeGrid
            title="Governance Badges"
            description="Badges earned through participation in governance activities"
            category="governance"
            showLocked={true}
            onBadgeClick={handleBadgeClick}
          />
        </TabsContent>
        
        <TabsContent value="mining" className="mt-0">
          <BadgeGrid
            title="Mining Badges"
            description="Badges earned through mining activities on the PVX network"
            category="mining"
            showLocked={true}
            onBadgeClick={handleBadgeClick}
          />
        </TabsContent>
        
        <TabsContent value="staking" className="mt-0">
          <BadgeGrid
            title="Staking Badges"
            description="Badges earned through staking PVX tokens"
            category="staking"
            showLocked={true}
            onBadgeClick={handleBadgeClick}
          />
        </TabsContent>
        
        <TabsContent value="thringlets" className="mt-0">
          <BadgeGrid
            title="Thringlet Badges"
            description="Badges earned through interaction with Thringlets"
            category="thringlets"
            showLocked={true}
            onBadgeClick={handleBadgeClick}
          />
        </TabsContent>
        
        <TabsContent value="security" className="mt-0">
          <BadgeGrid
            title="Security Badges"
            description="Badges earned through maintaining high security standards"
            category="security"
            showLocked={true}
            onBadgeClick={handleBadgeClick}
          />
        </TabsContent>
      </Tabs>
      
      {/* Badge Details Modal */}
      {selectedBadge && (
        <BadgeDetails
          badge={selectedBadge}
          isOpen={isDetailsOpen}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
};

export default BadgesPage;