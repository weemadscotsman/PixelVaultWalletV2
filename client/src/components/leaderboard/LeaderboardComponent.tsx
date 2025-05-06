import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Clock, BarChart, Users, Hash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GameLeaderboardEntry {
  id: number;
  user_id: number;
  wallet_address: string;
  username: string;
  game_type: string;
  score: number;
  difficulty: number;
  time_spent: number;
  blocks_mined?: number | null;
  gas_saved?: number | null;
  staking_rewards?: number | null;
  created_at: Date;
}

interface GameStats {
  totalPlayers: number;
  highestScore: number;
  averageScore: number;
  totalGamesPlayed: number;
}

const LeaderboardComponent = ({ gameType = 'hashlord' }: { gameType?: string }) => {
  const [selectedTab, setSelectedTab] = useState<string>('leaderboard');
  const [selectedGameType, setSelectedGameType] = useState<string>(gameType);
  const [limit, setLimit] = useState<number>(10);

  const { 
    data: leaderboards,
    isLoading: isLoadingLeaderboards
  } = useQuery<GameLeaderboardEntry[]>({
    queryKey: [`/api/leaderboards/top/${selectedGameType}`, limit],
    staleTime: 60000, // Refresh every minute
  });

  const { 
    data: recentScores,
    isLoading: isLoadingRecentScores
  } = useQuery<GameLeaderboardEntry[]>({
    queryKey: ['/api/leaderboards/recent', limit],
    staleTime: 60000,
    enabled: selectedTab === 'recent'
  });

  const { 
    data: gameStats,
    isLoading: isLoadingStats
  } = useQuery<GameStats>({
    queryKey: [`/api/leaderboards/stats/${selectedGameType}`],
    staleTime: 60000,
    enabled: selectedTab === 'stats'
  });

  // Helper function to get style based on rank
  const getRankStyle = (index: number) => {
    if (index === 0) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (index === 1) return 'bg-slate-100 text-slate-800 border-slate-300';
    if (index === 2) return 'bg-amber-100 text-amber-800 border-amber-300';
    return '';
  };

  // Helper function to render rank icon
  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Trophy className="h-5 w-5 text-slate-500" />;
    if (index === 2) return <Trophy className="h-5 w-5 text-amber-600" />;
    return <Medal className="h-5 w-5 text-blue-500" />;
  };

  // Helper function to format time
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Switch game type handler
  const handleGameTypeChange = (newGameType: string) => {
    setSelectedGameType(newGameType);
  };

  return (
    <Card className="w-full bg-black/80 text-white border-blue-500 shadow-lg shadow-blue-500/20">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              PVX Leaderboards
            </CardTitle>
            <CardDescription className="text-slate-300">
              Top players mining and grinding the PIXELVAULT Network
            </CardDescription>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={selectedGameType} onValueChange={handleGameTypeChange}>
              <SelectTrigger className="w-[180px] bg-black/50 text-white border-blue-500">
                <SelectValue placeholder="Select Game" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 text-white border-blue-500">
                <SelectItem value="hashlord">Hashlord</SelectItem>
                <SelectItem value="gasescape">Gas Escape</SelectItem>
                <SelectItem value="stakingwars">Staking Wars</SelectItem>
              </SelectContent>
            </Select>
            <Input 
              type="number" 
              value={limit}
              min={5}
              max={50}
              onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
              className="w-20 bg-black/50 text-white border-blue-500"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="leaderboard" onValueChange={setSelectedTab}>
          <TabsList className="grid grid-cols-3 bg-black/30 border border-blue-500/50 mb-6">
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-blue-900/50">
              Top Scores
            </TabsTrigger>
            <TabsTrigger value="recent" className="data-[state=active]:bg-blue-900/50">
              Recent Plays
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-blue-900/50">
              Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard">
            {isLoadingLeaderboards ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboards?.map((entry, index) => (
                  <div 
                    key={entry.id} 
                    className={`flex justify-between items-center p-3 border rounded-md ${getRankStyle(index)}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-900/30 border border-blue-500">
                        {getRankIcon(index)}
                      </div>
                      <div>
                        <p className="font-medium">{entry.username}</p>
                        <p className="text-xs text-slate-300">
                          {entry.wallet_address.substring(0, 10)}...{entry.wallet_address.substring(entry.wallet_address.length - 5)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                          {entry.score.toLocaleString()}
                        </p>
                        <div className="flex items-center text-xs text-slate-300">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(entry.time_spent)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <Badge variant="outline" className="bg-blue-900/30">
                          Lv{entry.difficulty}
                        </Badge>
                        <span className="text-xs text-slate-300 mt-1">
                          {entry.blocks_mined ? `${entry.blocks_mined} blocks` : ''}
                          {entry.gas_saved ? `${entry.gas_saved} gas` : ''}
                          {entry.staking_rewards ? `${entry.staking_rewards} PVX` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent">
            {isLoadingRecentScores ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {recentScores?.map((entry) => (
                  <div 
                    key={entry.id} 
                    className="flex justify-between items-center p-3 border border-blue-500/30 rounded-md bg-blue-900/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-900/30 border border-blue-500">
                        {entry.game_type === 'hashlord' && <Hash className="h-5 w-5 text-blue-400" />}
                        {entry.game_type === 'gasescape' && <BarChart className="h-5 w-5 text-green-400" />}
                        {entry.game_type === 'stakingwars' && <Users className="h-5 w-5 text-purple-400" />}
                      </div>
                      <div>
                        <p className="font-medium">{entry.username}</p>
                        <div className="flex items-center text-xs text-slate-300">
                          <Badge 
                            variant="outline" 
                            className={`mr-2 ${
                              entry.game_type === 'hashlord' ? 'bg-blue-900/30' : 
                              entry.game_type === 'gasescape' ? 'bg-green-900/30' : 
                              'bg-purple-900/30'
                            }`}
                          >
                            {entry.game_type}
                          </Badge>
                          {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                          {entry.score.toLocaleString()}
                        </p>
                        <div className="flex items-center text-xs text-slate-300">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(entry.time_spent)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <Badge variant="outline" className="bg-blue-900/30">
                          Lv{entry.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats">
            {isLoadingStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-blue-900/20 border-blue-500/50">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-300">Total Players</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                        {gameStats?.totalPlayers.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-900/20 border-blue-500/50">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-300">Highest Score</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                        {gameStats?.highestScore.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-900/20 border-blue-500/50">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-300">Average Score</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                        {gameStats?.averageScore.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-900/20 border-blue-500/50">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-300">Games Played</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                        {gameStats?.totalGamesPlayed.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="text-center p-4 border border-blue-500/30 rounded-md bg-blue-900/10">
                  <p className="text-slate-300 mb-2">
                    Want to see your name on the leaderboard?
                  </p>
                  <Button 
                    variant="default" 
                    className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300"
                  >
                    Play {selectedGameType.charAt(0).toUpperCase() + selectedGameType.slice(1)}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LeaderboardComponent;