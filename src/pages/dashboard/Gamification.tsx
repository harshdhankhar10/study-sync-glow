
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Trophy, Award, Star, Users, Target, Book, Check, 
  Calendar, Zap, Activity, ChevronRight, BarChart2, Shield 
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge as UIBadge } from '@/components/ui/badge';

import { 
  getGamificationProfile, 
  getLeaderboard, 
  getEarnedBadges, 
  GamificationProfile, 
  LeaderboardEntry,
  Badge 
} from '@/services/gamificationService';

export default function Gamification() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);

  // Fetch gamification profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['gamificationProfile', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser?.uid) return null;
      return await getGamificationProfile(currentUser.uid);
    },
    enabled: !!currentUser?.uid,
  });

  // Fetch global leaderboard
  const { data: globalLeaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['globalLeaderboard'],
    queryFn: async () => {
      return await getLeaderboard(undefined, 10);
    },
  });

  // Fetch user's earned badges
  const { data: earnedBadges, isLoading: badgesLoading } = useQuery({
    queryKey: ['earnedBadges', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser?.uid) return [];
      return await getEarnedBadges(currentUser.uid);
    },
    enabled: !!currentUser?.uid,
  });

  // Handle group selection for group leaderboard
  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-t-indigo-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your gamification dashboard...</p>
        </div>
      </div>
    );
  }

  const renderProgressBar = (current: number, target: number) => {
    const percentage = Math.min(Math.round((current / target) * 100), 100);
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span>{current} points</span>
          <span>{target} points</span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Gamification Dashboard
        </h2>
        <p className="text-gray-500 mt-1">
          Track your study achievements, badges, and leaderboard position
        </p>
      </div>

      {profileLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 border-4 border-t-indigo-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading your gamification data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* User Stats Summary */}
          {profile && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-indigo-100 flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-4 border-indigo-100">
                      <AvatarImage src={profile.photoURL || ""} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-600 font-bold text-lg">
                        {profile.displayName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl">{profile.displayName}</CardTitle>
                      <div className="flex items-center mt-1">
                        <Shield className="h-4 w-4 text-indigo-600 mr-1" />
                        <CardDescription className="text-sm">
                          Level {profile.level} Scholar
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">Level Progress</span>
                        <span>{profile.points.total} / {profile.nextLevelPoints}</span>
                      </div>
                      {renderProgressBar(profile.points.total, profile.nextLevelPoints)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="text-center p-3 bg-indigo-50 rounded-lg">
                        <Trophy className="h-5 w-5 text-indigo-600 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">TOTAL POINTS</p>
                        <p className="text-lg font-bold text-indigo-600">{profile.points.total}</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <Award className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">BADGES</p>
                        <p className="text-lg font-bold text-purple-600">
                          {earnedBadges?.length || 0}/{profile.badges.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full border-indigo-100 hover:border-indigo-200 hover:bg-indigo-50"
                    onClick={() => setActiveTab('badges')}
                  >
                    View All Badges
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-indigo-100 md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Activity className="h-5 w-5 text-indigo-600 mr-2" />
                    Points Breakdown
                  </CardTitle>
                  <CardDescription>
                    How you've earned your {profile.points.total} points
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          <span className="text-lg font-bold text-blue-600">
                            {profile.points.sessionAttendance}
                          </span>
                        </div>
                        <p className="text-sm font-medium">Session Attendance</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Target className="h-5 w-5 text-green-600" />
                          <span className="text-lg font-bold text-green-600">
                            {profile.points.goalCompletion}
                          </span>
                        </div>
                        <p className="text-sm font-medium">Goal Completion</p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Zap className="h-5 w-5 text-yellow-600" />
                          <span className="text-lg font-bold text-yellow-600">
                            {profile.points.streakMaintenance}
                          </span>
                        </div>
                        <p className="text-sm font-medium">Streak Maintenance</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Users className="h-5 w-5 text-purple-600" />
                          <span className="text-lg font-bold text-purple-600">
                            {profile.points.helpingPeers}
                          </span>
                        </div>
                        <p className="text-sm font-medium">Helping Peers</p>
                      </div>
                      <div className="p-4 bg-pink-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Book className="h-5 w-5 text-pink-600" />
                          <span className="text-lg font-bold text-pink-600">
                            {profile.points.resourceSharing}
                          </span>
                        </div>
                        <p className="text-sm font-medium">Resource Sharing</p>
                      </div>
                      <div className="p-4 bg-indigo-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Check className="h-5 w-5 text-indigo-600" />
                          <span className="text-lg font-bold text-indigo-600">
                            {profile.points.quizCompletion}
                          </span>
                        </div>
                        <p className="text-sm font-medium">Quiz Completion</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="badges" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span>Badges</span>
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Leaderboard</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Recent Achievements */}
              <Card className="border-indigo-100">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Star className="h-5 w-5 text-amber-500 mr-2" />
                    Recent Achievements
                  </CardTitle>
                  <CardDescription>
                    Your latest badges and milestones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {earnedBadges && earnedBadges.length > 0 ? (
                    <div className="space-y-4">
                      {earnedBadges.slice(0, 3).map((badge) => (
                        <div key={badge.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Award className="h-6 w-6 text-indigo-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{badge.name}</h4>
                            <p className="text-sm text-gray-500">{badge.description}</p>
                          </div>
                          <div className="text-xs text-gray-500">
                            {badge.earnedAt ? format(badge.earnedAt.toDate(), 'MMM d, yyyy') : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <Award className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-700 mb-1">No Badges Yet</h3>
                      <p className="text-gray-500 max-w-md mx-auto mb-4">
                        Complete study sessions, maintain streaks, and help your peers to earn badges!
                      </p>
                      <Button 
                        variant="outline" 
                        className="border-indigo-100 hover:border-indigo-200"
                        onClick={() => navigate('/dashboard/schedule')}
                      >
                        Schedule a Study Session
                      </Button>
                    </div>
                  )}
                </CardContent>
                {earnedBadges && earnedBadges.length > 0 && (
                  <CardFooter>
                    <Button 
                      variant="ghost" 
                      className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                      onClick={() => setActiveTab('badges')}
                    >
                      View All Badges
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardFooter>
                )}
              </Card>
              
              {/* Leaderboard Preview */}
              <Card className="border-indigo-100">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <BarChart2 className="h-5 w-5 text-indigo-600 mr-2" />
                    Global Leaderboard
                  </CardTitle>
                  <CardDescription>
                    Top 5 students by points
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {globalLeaderboard && globalLeaderboard.length > 0 ? (
                    <div className="space-y-3">
                      {globalLeaderboard.slice(0, 5).map((entry, idx) => (
                        <div 
                          key={entry.userId} 
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            entry.userId === currentUser.uid ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50'
                          }`}
                        >
                          <div className={`h-8 w-8 flex items-center justify-center rounded-full font-bold ${
                            idx === 0 ? 'bg-amber-100 text-amber-600' : 
                            idx === 1 ? 'bg-gray-200 text-gray-600' : 
                            idx === 2 ? 'bg-amber-50 text-amber-700' : 
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {entry.rank}
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={entry.photoURL || ""} />
                            <AvatarFallback className="bg-indigo-100 text-indigo-600">
                              {entry.displayName?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {entry.displayName}
                              {entry.userId === currentUser.uid && (
                                <span className="ml-2 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                  You
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center">
                              <Trophy className="h-4 w-4 text-amber-500 mr-1" />
                              <span className="font-medium">{entry.points}</span>
                            </div>
                            <div className="flex items-center">
                              <Award className="h-4 w-4 text-indigo-500 mr-1" />
                              <span className="font-medium">{entry.badges}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <Trophy className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-700 mb-1">Leaderboard Empty</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Be the first to join the leaderboard by earning points!
                      </p>
                    </div>
                  )}
                </CardContent>
                {globalLeaderboard && globalLeaderboard.length > 0 && (
                  <CardFooter>
                    <Button 
                      variant="ghost" 
                      className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                      onClick={() => setActiveTab('leaderboard')}
                    >
                      View Full Leaderboard
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardFooter>
                )}
              </Card>

              {/* How to Earn Points */}
              <Card className="border-indigo-100">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Zap className="h-5 w-5 text-amber-500 mr-2" />
                    How to Earn Points
                  </CardTitle>
                  <CardDescription>
                    Ways to increase your score and level up
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex gap-3 p-4 bg-blue-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium mb-1">Attend Study Sessions</h4>
                          <p className="text-sm text-gray-600">5 points per 15 minutes of study time (max 30 per session)</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 p-4 bg-green-50 rounded-lg">
                        <Target className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium mb-1">Complete Goals</h4>
                          <p className="text-sm text-gray-600">10-30 points per goal, depending on difficulty</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 p-4 bg-yellow-50 rounded-lg">
                        <Zap className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium mb-1">Maintain Streaks</h4>
                          <p className="text-sm text-gray-600">5 points per day of continuous study</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 p-4 bg-purple-50 rounded-lg">
                        <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium mb-1">Help Your Peers</h4>
                          <p className="text-sm text-gray-600">5-15 points per help, depending on type</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 p-4 bg-pink-50 rounded-lg">
                        <Book className="h-5 w-5 text-pink-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium mb-1">Share Resources</h4>
                          <p className="text-sm text-gray-600">10 points per useful resource shared</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 p-4 bg-indigo-50 rounded-lg">
                        <Check className="h-5 w-5 text-indigo-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium mb-1">Complete Quizzes</h4>
                          <p className="text-sm text-gray-600">5-20 points per quiz, based on score</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="badges" className="mt-6">
              <Card className="border-indigo-100">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Award className="h-5 w-5 text-indigo-600 mr-2" />
                    Your Badges Collection
                  </CardTitle>
                  <CardDescription>
                    Achievements earned through your learning journey
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {profile && (
                    <div className="space-y-6">
                      {/* Attendance Badges */}
                      <div>
                        <h3 className="font-medium mb-3 flex items-center text-indigo-700">
                          <Calendar className="h-4 w-4 mr-2" />
                          Session Attendance
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {profile.badges
                            .filter(badge => badge.category === 'attendance')
                            .map(badge => (
                              <div 
                                key={badge.id} 
                                className={`p-4 rounded-lg border ${
                                  badge.earnedAt 
                                    ? 'bg-indigo-50 border-indigo-200' 
                                    : 'bg-gray-50 border-gray-200 opacity-70'
                                }`}
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                    badge.earnedAt ? 'bg-indigo-100' : 'bg-gray-200'
                                  }`}>
                                    <Award className={`h-5 w-5 ${
                                      badge.earnedAt ? 'text-indigo-600' : 'text-gray-500'
                                    }`} />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{badge.name}</h4>
                                    {badge.earnedAt && (
                                      <p className="text-xs text-indigo-600">
                                        Earned {format(badge.earnedAt.toDate(), 'MMM d, yyyy')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600">{badge.description}</p>
                                {!badge.earnedAt && (
                                  <div className="mt-2 text-xs text-gray-500 flex items-center">
                                    <Lock className="h-3 w-3 mr-1" />
                                    <span>Not yet earned</span>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                      
                      {/* Streak Badges */}
                      <div>
                        <h3 className="font-medium mb-3 flex items-center text-indigo-700">
                          <Zap className="h-4 w-4 mr-2" />
                          Study Streaks
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {profile.badges
                            .filter(badge => badge.category === 'streak')
                            .map(badge => (
                              <div 
                                key={badge.id} 
                                className={`p-4 rounded-lg border ${
                                  badge.earnedAt 
                                    ? 'bg-yellow-50 border-yellow-200' 
                                    : 'bg-gray-50 border-gray-200 opacity-70'
                                }`}
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                    badge.earnedAt ? 'bg-yellow-100' : 'bg-gray-200'
                                  }`}>
                                    <Zap className={`h-5 w-5 ${
                                      badge.earnedAt ? 'text-yellow-600' : 'text-gray-500'
                                    }`} />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{badge.name}</h4>
                                    {badge.earnedAt && (
                                      <p className="text-xs text-yellow-600">
                                        Earned {format(badge.earnedAt.toDate(), 'MMM d, yyyy')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600">{badge.description}</p>
                                {!badge.earnedAt && (
                                  <div className="mt-2 text-xs text-gray-500 flex items-center">
                                    <Lock className="h-3 w-3 mr-1" />
                                    <span>Not yet earned</span>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                      
                      {/* Goal Badges */}
                      <div>
                        <h3 className="font-medium mb-3 flex items-center text-indigo-700">
                          <Target className="h-4 w-4 mr-2" />
                          Goal Completion
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {profile.badges
                            .filter(badge => badge.category === 'goals')
                            .map(badge => (
                              <div 
                                key={badge.id} 
                                className={`p-4 rounded-lg border ${
                                  badge.earnedAt 
                                    ? 'bg-green-50 border-green-200' 
                                    : 'bg-gray-50 border-gray-200 opacity-70'
                                }`}
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                    badge.earnedAt ? 'bg-green-100' : 'bg-gray-200'
                                  }`}>
                                    <Target className={`h-5 w-5 ${
                                      badge.earnedAt ? 'text-green-600' : 'text-gray-500'
                                    }`} />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{badge.name}</h4>
                                    {badge.earnedAt && (
                                      <p className="text-xs text-green-600">
                                        Earned {format(badge.earnedAt.toDate(), 'MMM d, yyyy')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600">{badge.description}</p>
                                {!badge.earnedAt && (
                                  <div className="mt-2 text-xs text-gray-500 flex items-center">
                                    <Lock className="h-3 w-3 mr-1" />
                                    <span>Not yet earned</span>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                      
                      {/* Community Badges */}
                      <div>
                        <h3 className="font-medium mb-3 flex items-center text-indigo-700">
                          <Users className="h-4 w-4 mr-2" />
                          Community Contribution
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {profile.badges
                            .filter(badge => badge.category === 'helping')
                            .map(badge => (
                              <div 
                                key={badge.id} 
                                className={`p-4 rounded-lg border ${
                                  badge.earnedAt 
                                    ? 'bg-purple-50 border-purple-200' 
                                    : 'bg-gray-50 border-gray-200 opacity-70'
                                }`}
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                    badge.earnedAt ? 'bg-purple-100' : 'bg-gray-200'
                                  }`}>
                                    <Users className={`h-5 w-5 ${
                                      badge.earnedAt ? 'text-purple-600' : 'text-gray-500'
                                    }`} />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{badge.name}</h4>
                                    {badge.earnedAt && (
                                      <p className="text-xs text-purple-600">
                                        Earned {format(badge.earnedAt.toDate(), 'MMM d, yyyy')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600">{badge.description}</p>
                                {!badge.earnedAt && (
                                  <div className="mt-2 text-xs text-gray-500 flex items-center">
                                    <Lock className="h-3 w-3 mr-1" />
                                    <span>Not yet earned</span>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="leaderboard" className="mt-6">
              <Card className="border-indigo-100">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Trophy className="h-5 w-5 text-amber-500 mr-2" />
                    Global Leaderboard
                  </CardTitle>
                  <CardDescription>
                    Top performers across the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {globalLeaderboard && globalLeaderboard.length > 0 ? (
                    <div className="space-y-4">
                      {/* Top 3 Winners Podium */}
                      <div className="flex items-end justify-center gap-4 mb-8 mt-3">
                        {globalLeaderboard.slice(0, 3).map((entry, idx) => {
                          const heights = ['h-20', 'h-24', 'h-16'];
                          const positions = [1, 0, 2]; // Silver, Gold, Bronze
                          const position = positions[idx];
                          const colors = [
                            'from-gray-300 to-gray-100', // Silver
                            'from-amber-300 to-amber-100', // Gold
                            'from-amber-700 to-amber-500'  // Bronze
                          ];
                          
                          return (
                            <div key={entry.userId} className="flex flex-col items-center">
                              <Avatar className="h-12 w-12 mb-2 border-2 border-white shadow-md">
                                <AvatarImage src={entry.photoURL || ""} />
                                <AvatarFallback className="bg-indigo-100 text-indigo-600 font-bold">
                                  {entry.displayName?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <p className="text-sm font-medium mb-2">
                                {entry.displayName.length > 10 
                                  ? `${entry.displayName.substring(0, 10)}...` 
                                  : entry.displayName}
                              </p>
                              <div className={`rounded-t-lg w-20 flex items-end justify-center ${heights[idx]} bg-gradient-to-t ${colors[position]}`}>
                                <div className="bg-white text-center w-full py-1 font-bold">
                                  {entry.points} pts
                                </div>
                              </div>
                              <div className="bg-gray-800 text-white text-sm py-1 w-20 text-center font-medium">
                                #{position + 1}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <Separator />
                      
                      {/* Full Leaderboard List */}
                      <div className="space-y-3 mt-6">
                        {globalLeaderboard.map((entry) => (
                          <div 
                            key={entry.userId} 
                            className={`flex items-center gap-3 p-3 rounded-lg ${
                              entry.userId === currentUser.uid 
                                ? 'bg-indigo-50 border border-indigo-100' 
                                : entry.rank <= 3 
                                  ? 'bg-amber-50/50 border border-amber-100' 
                                  : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className={`h-8 w-8 flex items-center justify-center rounded-full font-bold ${
                              entry.rank === 1 ? 'bg-amber-200 text-amber-800' : 
                              entry.rank === 2 ? 'bg-gray-200 text-gray-700' : 
                              entry.rank === 3 ? 'bg-amber-600 text-white' : 
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {entry.rank}
                            </div>
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={entry.photoURL || ""} />
                              <AvatarFallback className="bg-indigo-100 text-indigo-600">
                                {entry.displayName?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">
                                {entry.displayName}
                                {entry.userId === currentUser.uid && (
                                  <span className="ml-2 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                    You
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex flex-col items-end sm:flex-row sm:gap-4">
                              <div className="flex items-center">
                                <Trophy className="h-4 w-4 text-amber-500 mr-1" />
                                <span className="font-medium">{entry.points} points</span>
                              </div>
                              <div className="flex items-center">
                                <Award className="h-4 w-4 text-indigo-500 mr-1" />
                                <span className="font-medium">{entry.badges} badges</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <Trophy className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-700 mb-1">Leaderboard Empty</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Be the first to join the leaderboard by earning points!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
