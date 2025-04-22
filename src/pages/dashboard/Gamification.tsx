
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Award, Star, Lock as LockIcon } from 'lucide-react';
import { getGamificationProfile, getLeaderboard, type LeaderboardEntry } from '@/services/gamificationService';
import { useAuth } from '@/contexts/AuthContext';

const Gamification = () => {
  const { currentUser } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['gamificationProfile', currentUser?.uid],
    queryFn: () => currentUser?.uid ? getGamificationProfile(currentUser.uid) : null,
    enabled: !!currentUser?.uid,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => getLeaderboard(),
  });

  const { data: groupLeaderboard } = useQuery({
    queryKey: ['groupLeaderboard'],
    queryFn: () => currentUser?.uid ? getLeaderboard('current-group-id', 10) : [],
    enabled: !!currentUser?.uid,
  });

  return (
    <div className="space-y-6 p-6">
      {/* Profile Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Trophy className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.points.total || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Level</CardTitle>
            <Star className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Level {profile?.level || 1}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profile?.badges.filter(b => b.earnedAt).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-rose-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Rank</CardTitle>
            <Trophy className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              #{leaderboard?.findIndex(entry => entry.userId === currentUser?.uid) + 1 || '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Global Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Global Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {leaderboard?.map((entry, index) => (
                      <div
                        key={entry.userId}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          entry.userId === currentUser?.uid ? 'bg-indigo-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg w-8">{index + 1}</span>
                          <div>
                            <p className="font-medium">{entry.displayName}</p>
                            <p className="text-sm text-gray-500">{entry.points} points</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {entry.badges > 0 && (
                            <Badge variant="secondary">
                              <Award className="h-3 w-3 mr-1" />
                              {entry.badges}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Group Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Group Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {groupLeaderboard?.map((entry, index) => (
                      <div
                        key={entry.userId}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          entry.userId === currentUser?.uid ? 'bg-indigo-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg w-8">{index + 1}</span>
                          <div>
                            <p className="font-medium">{entry.displayName}</p>
                            <p className="text-sm text-gray-500">{entry.points} points</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {entry.badges > 0 && (
                            <Badge variant="secondary">
                              <Award className="h-3 w-3 mr-1" />
                              {entry.badges}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="badges" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {profile?.badges.map((badge) => (
              <Card key={badge.id} className={`relative ${!badge.earnedAt ? 'opacity-75' : ''}`}>
                {!badge.earnedAt && (
                  <div className="absolute inset-0 bg-gray-100/90 backdrop-blur-sm flex items-center justify-center rounded-lg">
                    <div className="flex items-center gap-2">
                      <LockIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-500">Locked</span>
                    </div>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className={`h-5 w-5 ${badge.earnedAt ? 'text-amber-500' : 'text-gray-400'}`} />
                    {badge.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">{badge.description}</p>
                  {badge.earnedAt && (
                    <p className="text-xs text-gray-400 mt-2">
                      Earned on {badge.earnedAt.toDate().toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Points Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Points Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Session Attendance</span>
                    <span className="font-medium">{profile?.points.sessionAttendance || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Goal Completion</span>
                    <span className="font-medium">{profile?.points.goalCompletion || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Streak Maintenance</span>
                    <span className="font-medium">{profile?.points.streakMaintenance || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Helping Peers</span>
                    <span className="font-medium">{profile?.points.helpingPeers || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Level Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Level Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress to Level {(profile?.level || 1) + 1}</span>
                      <span>{profile?.points.total || 0} / {profile?.nextLevelPoints || 100}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            ((profile?.points.total || 0) / (profile?.nextLevelPoints || 100)) * 100,
                            100
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {Math.max(
                      (profile?.nextLevelPoints || 100) - (profile?.points.total || 0),
                      0
                    )} points needed for next level
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Gamification;
