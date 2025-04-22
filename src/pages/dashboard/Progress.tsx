
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Award, Trophy, ChevronRight } from 'lucide-react';
import { getFirestore } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PersonalProgress from '@/components/progress/PersonalProgress';
import GroupProgress from '@/components/progress/GroupProgress';
import Achievements from '@/components/progress/Achievements';
import { getGamificationProfile, getEarnedBadges } from '@/services/gamificationService';
import { useQuery } from '@tanstack/react-query';

export default function Progress() {
  const [activeTab, setActiveTab] = useState('personal');
  const { toast } = useToast();
  const db = getFirestore();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Fetch user's gamification profile
  const { data: gamificationProfile } = useQuery({
    queryKey: ['gamificationProfile', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser?.uid) return null;
      return await getGamificationProfile(currentUser.uid);
    },
    enabled: !!currentUser?.uid,
  });

  // Fetch user's earned badges
  const { data: earnedBadges } = useQuery({
    queryKey: ['earnedBadges', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser?.uid) return [];
      return await getEarnedBadges(currentUser.uid);
    },
    enabled: !!currentUser?.uid,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Progress Tracker
        </h2>
        <p className="text-gray-500 mt-1">
          Track your learning journey, monitor group progress, and earn achievements
        </p>
      </div>

      {/* Gamification Summary Card */}
      {gamificationProfile && (
        <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="w-full md:w-auto">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-md mx-auto">
                  {gamificationProfile.level}
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold mb-1">Level {gamificationProfile.level} Scholar</h3>
                <p className="text-gray-600 mb-2">
                  You've earned {gamificationProfile.points.total} points and {earnedBadges?.length || 0} badges
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                  <div 
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(Math.round((gamificationProfile.points.total / gamificationProfile.nextLevelPoints) * 100), 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Current: {gamificationProfile.points.total}</span>
                  <span>Next level: {gamificationProfile.nextLevelPoints}</span>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <Button 
                  variant="outline"
                  className="border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 whitespace-nowrap"
                  onClick={() => navigate('/dashboard/gamification')}
                >
                  <Trophy className="h-4 w-4 mr-1.5 text-amber-500" />
                  View Leaderboard
                </Button>
                <Button
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white whitespace-nowrap"
                  onClick={() => navigate('/dashboard/gamification')}
                >
                  <Award className="h-4 w-4 mr-1.5" />
                  View All Badges
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="personal" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Personal Progress</span>
          </TabsTrigger>
          <TabsTrigger value="group" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Group Progress</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span>Achievements</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="personal" className="mt-6">
          <PersonalProgress />
        </TabsContent>
        
        <TabsContent value="group" className="mt-6">
          <GroupProgress />
        </TabsContent>
        
        <TabsContent value="achievements" className="mt-6">
          <Achievements />
          
          {/* Gamification Upsell */}
          {earnedBadges && earnedBadges.length > 0 && (
            <Card className="mt-6 border-indigo-100">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Trophy className="h-5 w-5 text-amber-500 mr-2" />
                  Gamification System
                </CardTitle>
                <CardDescription>
                  Earn points, collect badges, and compete on the leaderboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  You've already earned {earnedBadges.length} badges! Visit the complete Gamification Dashboard to:
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span>View your position on the global leaderboard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span>Track your progress towards the next level</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span>Discover all available badges and how to earn them</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  onClick={() => navigate('/dashboard/gamification')}
                >
                  Go to Gamification Dashboard
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Missing imports for the component
function Lock(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function Check(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
