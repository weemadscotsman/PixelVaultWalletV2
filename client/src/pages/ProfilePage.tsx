import { useState, useEffect } from "react";
import { AnimatedPageLayout } from "@/components/layout/AnimatedPageLayout";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Award, 
  BadgeCheck, 
  Code, 
  CreditCard, 
  Eye,
  EyeOff,
  Flame, 
  Github, 
  Globe, 
  Loader2,
  Medal, 
  PlusCircle, 
  RefreshCw,
  Share2, 
  Shield, 
  Star, 
  Trophy, 
  Users, 
  Wallet
} from "lucide-react";
import { formatTokenAmount } from "@/lib/format";

export default function ProfilePage() {
  const { 
    wallet, 
    activeWallet, 
    createWalletMutation, 
    importWalletMutation,
    exportWalletKeysMutation,
    setActiveWalletAddress,
    getAllWallets
  } = useWallet();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Form state for create/import wallet
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [isImportingWallet, setIsImportingWallet] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  
  // Get all wallets
  const { data: wallets = [], isLoading: isLoadingWallets } = getAllWallets();
  
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
    <AnimatedPageLayout isConnected={!!wallet} variant="slide">
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
          <TabsList className="grid grid-cols-5 lg:w-auto">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
              Overview
            </TabsTrigger>
            <TabsTrigger value="wallets" className="data-[state=active]:bg-blue-600">
              Wallets
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
          
          {/* Wallets Tab */}
          <TabsContent value="wallets" className="space-y-4 mt-4">
            <Card className="bg-black/80 backdrop-blur-lg border-slate-800">
              <CardHeader>
                <CardTitle className="flex justify-between">
                  <span>Your PVX Wallets</span>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {setIsCreatingWallet(true); setIsImportingWallet(false);}}
                      className="text-xs"
                    >
                      <PlusCircle className="h-3.5 w-3.5 mr-1" />
                      Create Wallet
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {setIsImportingWallet(true); setIsCreatingWallet(false);}}
                      className="text-xs"
                    >
                      <Wallet className="h-3.5 w-3.5 mr-1" />
                      Import Wallet
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Manage your PVX wallets and private keys securely
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isCreatingWallet && (
                  <Card className="mb-6 border-blue-600/50 bg-blue-950/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Create New Wallet</CardTitle>
                      <CardDescription>
                        Create a new PVX wallet with a secure passphrase
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="passphrase">Wallet Passphrase (required)</Label>
                          <div className="flex">
                            <Input
                              id="passphrase"
                              type={showPassphrase ? "text" : "password"}
                              value={passphrase}
                              onChange={(e) => setPassphrase(e.target.value)}
                              className="bg-slate-900/50 border-slate-700/50"
                              placeholder="Enter a secure passphrase"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="ml-2"
                              onClick={() => setShowPassphrase(!showPassphrase)}
                            >
                              {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          <p className="text-xs text-yellow-400 flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            This passphrase will be used to secure your wallet. Store it safely!
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setIsCreatingWallet(false);
                          setPassphrase("");
                          setShowPassphrase(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-blue-600 to-violet-600"
                        disabled={!passphrase || createWalletMutation.isPending}
                        onClick={() => {
                          if (passphrase) {
                            createWalletMutation.mutate(
                              { passphrase },
                              {
                                onSuccess: () => {
                                  setIsCreatingWallet(false);
                                  setPassphrase("");
                                  setShowPassphrase(false);
                                }
                              }
                            );
                          }
                        }}
                      >
                        {createWalletMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>Create Wallet</>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                )}
                
                {isImportingWallet && (
                  <Card className="mb-6 border-blue-600/50 bg-blue-950/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Import Existing Wallet</CardTitle>
                      <CardDescription>
                        Import a PVX wallet using your private key
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="privateKey">Private Key</Label>
                          <div className="flex">
                            <Input
                              id="privateKey"
                              type={showPrivateKey ? "text" : "password"}
                              value={privateKey}
                              onChange={(e) => setPrivateKey(e.target.value)}
                              className="bg-slate-900/50 border-slate-700/50 font-mono"
                              placeholder="Enter your wallet private key"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="ml-2"
                              onClick={() => setShowPrivateKey(!showPrivateKey)}
                            >
                              {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="importPassphrase">New Passphrase</Label>
                          <div className="flex">
                            <Input
                              id="importPassphrase"
                              type={showPassphrase ? "text" : "password"}
                              value={passphrase}
                              onChange={(e) => setPassphrase(e.target.value)}
                              className="bg-slate-900/50 border-slate-700/50"
                              placeholder="Create a new passphrase for this wallet"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="ml-2"
                              onClick={() => setShowPassphrase(!showPassphrase)}
                            >
                              {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setIsImportingWallet(false);
                          setPassphrase("");
                          setPrivateKey("");
                          setShowPassphrase(false);
                          setShowPrivateKey(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-blue-600 to-violet-600"
                        disabled={!privateKey || !passphrase || importWalletMutation.isPending}
                        onClick={() => {
                          if (privateKey && passphrase) {
                            importWalletMutation.mutate(
                              { privateKey, passphrase },
                              {
                                onSuccess: () => {
                                  setIsImportingWallet(false);
                                  setPassphrase("");
                                  setPrivateKey("");
                                  setShowPassphrase(false);
                                  setShowPrivateKey(false);
                                }
                              }
                            );
                          }
                        }}
                      >
                        {importWalletMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>Import Wallet</>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                )}
                
                {isLoadingWallets ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : wallets.length === 0 ? (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 mx-auto text-slate-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No wallets found</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Create a new wallet or import an existing one to get started
                    </p>
                    <div className="flex justify-center space-x-4">
                      <Button 
                        onClick={() => {setIsCreatingWallet(true); setIsImportingWallet(false);}}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create Wallet
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {wallets.map((wallet: any) => (
                      <div 
                        key={wallet.address} 
                        className={`p-4 rounded-lg border ${activeWallet === wallet.address ? 'bg-blue-900/20 border-blue-600' : 'bg-slate-900/50 border-slate-800'}`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <h3 className="font-semibold text-lg mr-2">{wallet.address}</h3>
                              {activeWallet === wallet.address && (
                                <Badge className="bg-blue-600">Active</Badge>
                              )}
                            </div>
                            <div className="flex items-center text-sm text-slate-400">
                              <span className="mr-4">Balance: {formatTokenAmount(wallet.balance, 6)} PVX</span>
                              <span>Created: {new Date(wallet.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            {activeWallet !== wallet.address && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setActiveWalletAddress(wallet.address)}
                              >
                                Set Active
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // Open export dialog or modal
                                toast({
                                  title: "Export Keys",
                                  description: "Coming soon - key export functionality",
                                });
                              }}
                            >
                              Export Keys
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
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
    </AnimatedPageLayout>
  );
}