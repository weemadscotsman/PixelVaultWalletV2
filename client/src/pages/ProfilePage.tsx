import { useState, useEffect } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { useWallet } from "@/hooks/use-wallet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Award, 
  BadgeCheck, 
  Code, 
  CreditCard, 
  Flame, 
  Github, 
  Globe, 
  Medal, 
  Share2, 
  Shield, 
  Star, 
  Trophy, 
  Users 
} from "lucide-react";
import { formatTokenAmount } from "@/lib/format";

export default function ProfilePage() {
  const { wallet } = useWallet();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Mock user activity data
  const [userStats, setUserStats] = useState({
    txCount: 142,
    blocksValidated: 23,
    proposalsVoted: 15,
    lpProvided: "12500.00",
    nftsMinted: 7,
    reputationScore: 870,
    stakingAmount: "45000.00",
    achievements: [
      { id: 1, name: "Early Adopter", icon: <Award />, date: "Apr 2025", description: "Joined PVX network in its early stage" },
      { id: 2, name: "Governance Guardian", icon: <Shield />, date: "May 2025", description: "Voted on 10+ governance proposals" },
      { id: 3, name: "Liquidity Luminary", icon: <CreditCard />, date: "Apr 2025", description: "Provided liquidity to 3+ pools" },
      { id: 4, name: "Thringlet Tamer", icon: <Code />, date: "May 2025", description: "Interacted with 5+ thringlets" },
      { id: 5, name: "Mining Maven", icon: <Flame />, date: "May 2025", description: "Successfully mined 20+ blocks" },
    ],
    badges: [
      { id: 1, name: "Verified User", level: "Platinum", rarity: "Legendary" },
      { id: 2, name: "Community Contributor", level: "Gold", rarity: "Epic" },
      { id: 3, name: "Problem Solver", level: "Silver", rarity: "Rare" },
    ],
    activityFeed: [
      { id: 1, type: "transaction", description: "Sent 500 PVX to 0x7f...3a4b", timestamp: "2 hours ago" },
      { id: 2, type: "staking", description: "Staked 1,000 PVX", timestamp: "1 day ago" },
      { id: 3, type: "governance", description: "Voted YES on Proposal #42", timestamp: "3 days ago" },
      { id: 4, type: "liquidity", description: "Added liquidity to PVX/ETH pool", timestamp: "1 week ago" },
      { id: 5, type: "mining", description: "Successfully mined block #3265789", timestamp: "1 week ago" },
    ]
  });
  
  // Calculate level based on reputation score
  const level = Math.floor(userStats.reputationScore / 100);
  const levelProgress = (userStats.reputationScore % 100);
  
  // Mock get badge color based on rarity
  const getBadgeColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "common": return "bg-gray-600 text-white";
      case "uncommon": return "bg-green-600 text-white";
      case "rare": return "bg-blue-600 text-white";
      case "epic": return "bg-purple-600 text-white";
      case "legendary": return "bg-gradient-to-r from-yellow-500 to-orange-500 text-black";
      default: return "bg-gray-600 text-white";
    }
  };
  
  return (
    <PageLayout isConnected={!!wallet}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent pb-1">
            User Profile
          </h1>
          <p className="text-muted-foreground">
            View and manage your on-chain identity and reputation
          </p>
        </div>
        
        {/* User Profile Header */}
        <Card className="bg-black/80 backdrop-blur-lg border-slate-800">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <div className="flex flex-col items-center space-y-3">
                <Avatar className="h-24 w-24 border-4 border-blue-600">
                  <AvatarImage src="https://avatars.githubusercontent.com/u/1486366?v=4" alt="User" />
                  <AvatarFallback className="text-2xl font-bold">ZH</AvatarFallback>
                </Avatar>
                
                <div className="text-center">
                  <Badge className="bg-gradient-to-r from-blue-600 to-violet-600 text-white">
                    Level {level}
                  </Badge>
                  <div className="mt-2 text-sm text-gray-400 flex items-center gap-1">
                    <BadgeCheck className="h-4 w-4 text-blue-500" />
                    Verified User
                  </div>
                </div>
              </div>
              
              <div className="flex-1 space-y-3 text-center md:text-left">
                <div>
                  <h2 className="text-2xl font-bold flex items-center justify-center md:justify-start gap-2">
                    ZK_Hashlord
                    <Badge variant="outline" className="ml-2 bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30">
                      <Trophy className="h-3 w-3 mr-1" />
                      Top Contributor
                    </Badge>
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Joined April 2025 • 0x7f...3a4b
                  </p>
                </div>
                
                <p className="max-w-lg">
                  Blockchain developer and PVX network enthusiast. Focused on building decentralized privacy solutions and contributing to the governance ecosystem.
                </p>
                
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <Button variant="outline" size="sm">
                    <Globe className="h-4 w-4 mr-1" />
                    Website
                  </Button>
                  <Button variant="outline" size="sm">
                    <Github className="h-4 w-4 mr-1" />
                    Github
                  </Button>
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-1" />
                    Follow
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </div>
                
                <div className="pt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Reputation {userStats.reputationScore}</span>
                    <span>Next Level: {(level + 1) * 100}</span>
                  </div>
                  <Progress value={levelProgress} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* User Stats & Activity */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
              Overview
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-blue-600">
              Achievements
            </TabsTrigger>
            <TabsTrigger value="badges" className="data-[state=active]:bg-blue-600">
              Badges
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-blue-600">
              Activity
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-black/80 backdrop-blur-lg border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Wallet Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className="text-lg font-semibold">
                        {wallet ? formatTokenAmount(wallet.balance, 6) : "0"} PVX
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Transactions</p>
                      <p className="text-lg font-semibold">{userStats.txCount}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Staking</p>
                      <p className="text-lg font-semibold">{userStats.stakingAmount} PVX</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Liquidity</p>
                      <p className="text-lg font-semibold">{userStats.lpProvided} PVX</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-black/80 backdrop-blur-lg border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Network Contributions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Blocks Validated</p>
                      <p className="text-lg font-semibold">{userStats.blocksValidated}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Proposals Voted</p>
                      <p className="text-lg font-semibold">{userStats.proposalsVoted}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">NFTs Minted</p>
                      <p className="text-lg font-semibold">{userStats.nftsMinted}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Reputation</p>
                      <p className="text-lg font-semibold">{userStats.reputationScore}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="bg-black/80 backdrop-blur-lg border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Recent Achievements</CardTitle>
                <CardDescription>Most recent accomplishments on the PVX network</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {userStats.achievements.slice(0, 3).map((achievement) => (
                    <div 
                      key={achievement.id} 
                      className="bg-gradient-to-b from-blue-950/50 to-indigo-950/50 p-4 rounded-lg border border-blue-800/50 flex flex-col items-center text-center"
                    >
                      <div className="h-12 w-12 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 mb-3">
                        {achievement.icon}
                      </div>
                      <h3 className="font-bold">{achievement.name}</h3>
                      <p className="text-xs text-blue-300 mt-1">{achievement.date}</p>
                      <p className="text-sm text-gray-400 mt-2">{achievement.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4 mt-4">
            <Card className="bg-black/80 backdrop-blur-lg border-slate-800">
              <CardHeader>
                <CardTitle>Your Achievements</CardTitle>
                <CardDescription>
                  Accomplishments and milestones you've reached on the PVX network
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userStats.achievements.map((achievement) => (
                    <div 
                      key={achievement.id} 
                      className="bg-gradient-to-b from-blue-950/50 to-indigo-950/50 p-4 rounded-lg border border-blue-800/50 flex flex-col items-center text-center"
                    >
                      <div className="h-16 w-16 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 mb-3">
                        {achievement.icon}
                      </div>
                      <h3 className="font-bold text-lg">{achievement.name}</h3>
                      <p className="text-sm text-blue-300 mt-1">{achievement.date}</p>
                      <p className="text-sm text-gray-400 mt-2">{achievement.description}</p>
                    </div>
                  ))}
                  
                  {/* Locked Achievement */}
                  <div 
                    className="bg-gradient-to-b from-gray-950/50 to-gray-900/30 p-4 rounded-lg border border-gray-800/30 flex flex-col items-center text-center opacity-60"
                  >
                    <div className="h-16 w-16 rounded-full bg-gray-800/20 flex items-center justify-center text-gray-600 mb-3">
                      <Trophy />
                    </div>
                    <h3 className="font-bold text-lg">Staking Champion</h3>
                    <p className="text-sm text-gray-500 mt-1">Locked</p>
                    <p className="text-sm text-gray-600 mt-2">Stake 100,000 PVX tokens for at least 30 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Badges Tab */}
          <TabsContent value="badges" className="space-y-4 mt-4">
            <Card className="bg-black/80 backdrop-blur-lg border-slate-800">
              <CardHeader>
                <CardTitle>Your Badges</CardTitle>
                <CardDescription>
                  Recognition badges earned for your contributions to the ecosystem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userStats.badges.map((badge) => (
                    <div key={badge.id} className="flex flex-col items-center space-y-3 p-6 bg-slate-900/50 rounded-lg border border-slate-800">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center ${getBadgeColor(badge.rarity)}`}>
                        <Medal className="h-10 w-10" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-bold text-lg">{badge.name}</h3>
                        <p className="text-sm text-gray-400">{badge.level} Tier</p>
                        <Badge className="mt-2" variant="outline">
                          {badge.rarity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {/* Locked Badge */}
                  <div className="flex flex-col items-center space-y-3 p-6 bg-slate-900/20 rounded-lg border border-slate-800/50 opacity-60">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gray-800">
                      <Medal className="h-10 w-10 text-gray-600" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-lg">DAO Governance Expert</h3>
                      <p className="text-sm text-gray-500">Bronze Tier</p>
                      <Badge className="mt-2" variant="outline">
                        Locked
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4 mt-4">
            <Card className="bg-black/80 backdrop-blur-lg border-slate-800">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest on-chain interactions and transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userStats.activityFeed.map((activity, index) => (
                    <div key={activity.id}>
                      <div className="flex items-start">
                        <div className="mr-4 mt-1">
                          <Badge variant="outline" className="h-8 w-8 rounded-full p-0 flex items-center justify-center">
                            {activity.type === "transaction" && <CreditCard className="h-4 w-4" />}
                            {activity.type === "staking" && <Star className="h-4 w-4" />}
                            {activity.type === "governance" && <Shield className="h-4 w-4" />}
                            {activity.type === "liquidity" && <Flame className="h-4 w-4" />}
                            {activity.type === "mining" && <Code className="h-4 w-4" />}
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="font-medium">{activity.description}</p>
                            <span className="text-sm text-muted-foreground">{activity.timestamp}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {activity.type === "transaction" && "Transaction"}
                            {activity.type === "staking" && "Staking Activity"}
                            {activity.type === "governance" && "Governance Action"}
                            {activity.type === "liquidity" && "Liquidity Provision"}
                            {activity.type === "mining" && "Mining Reward"}
                          </p>
                        </div>
                      </div>
                      {index < userStats.activityFeed.length - 1 && (
                        <Separator className="my-4" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}