
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import StreakDisplay from '@/components/dashboard/streaks/StreakDisplay';
import { StreakData, getStreakData } from '@/services/streakService';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Award, Gift, Calendar, Target, Trophy, TrendingUp, Flame } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Streaks() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user?.uid) return;

    const loadStreakData = async () => {
      try {
        setLoading(true);
        const data = await getStreakData(user.uid);
        setStreakData(data);
      } catch (error) {
        console.error("Error loading streak data:", error);
        toast({
          title: "Failed to load your streak data",
          description: "Please try refreshing the page",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadStreakData();
  }, [user?.uid, toast]);

  // Function to format timestamps
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Not yet achieved';
    
    try {
      if (timestamp.toDate) {
        return format(timestamp.toDate(), 'MMMM d, yyyy');
      }
      return format(new Date(timestamp), 'MMMM d, yyyy');
    } catch (error) {
      return 'Date unavailable';
    }
  };

  if (loading && !streakData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Study Streaks & Achievements</h2>
        <p className="text-muted-foreground">Track your study consistency and earn rewards</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current streak card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="text-center py-6">
                <div className="h-24 w-24 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                  <Flame className="h-12 w-12 text-orange-500" />
                </div>
                <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  {streakData?.currentStreak || 0}
                </div>
                <p className="text-sm text-muted-foreground">days in a row</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-purple-500" />
                  <span className="text-sm">Longest Streak</span>
                </div>
                <span className="font-semibold">{streakData?.longestStreak || 0} days</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <span className="text-sm">Total Days Studied</span>
                </div>
                <span className="font-semibold">{streakData?.totalDaysStudied || 0} days</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  <span className="text-sm">Achievements Unlocked</span>
                </div>
                <span className="font-semibold">
                  {streakData?.rewards.filter(r => r.unlocked).length || 0} / {streakData?.rewards.length || 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Milestones Reached</span>
                </div>
                <span className="font-semibold">
                  {streakData?.milestones.filter(m => m.achieved).length || 0} / {streakData?.milestones.length || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Check-in card */}
        <StreakDisplay userId={user?.uid} />
      </div>

      <Tabs defaultValue="rewards" className="mt-8">
        <TabsList>
          <TabsTrigger value="rewards">Rewards & Badges</TabsTrigger>
          <TabsTrigger value="milestones">Streak Milestones</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rewards" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {streakData?.rewards.map(reward => (
              <Card key={reward.id} className={!reward.unlocked ? "opacity-70" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">{reward.name}</CardTitle>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      reward.unlocked ? "bg-green-500/20" : "bg-gray-200"
                    }`}>
                      {reward.type === 'badge' ? (
                        <Award className={`h-5 w-5 ${reward.unlocked ? "text-green-500" : "text-gray-400"}`} />
                      ) : (
                        <Gift className={`h-5 w-5 ${reward.unlocked ? "text-green-500" : "text-gray-400"}`} />
                      )}
                    </div>
                  </div>
                  <CardDescription>{reward.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={reward.unlocked ? "text-green-500 font-medium" : "text-muted-foreground"}>
                        {reward.unlocked ? "Unlocked" : "Locked"}
                      </span>
                    </div>
                    {reward.unlocked && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Achieved:</span>
                        <span>{formatTimestamp(reward.unlockedAt)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="milestones" className="mt-4">
          <div className="space-y-4">
            {streakData?.milestones.map((milestone, index) => (
              <Card key={index} className={!milestone.achieved ? "opacity-70" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      milestone.achieved ? "bg-primary/20" : "bg-gray-200"
                    }`}>
                      <TrendingUp className={`h-6 w-6 ${milestone.achieved ? "text-primary" : "text-gray-400"}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{milestone.streakDays}-Day Streak</h4>
                      <p className="text-sm text-muted-foreground">
                        {milestone.achieved 
                          ? `Achieved on ${formatTimestamp(milestone.achievedAt)}` 
                          : `${milestone.streakDays - (streakData?.currentStreak || 0)} days to go`}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      milestone.achieved ? "bg-green-500/20 text-green-700" : "bg-gray-200 text-gray-500"
                    }`}>
                      {milestone.achieved ? "Achieved" : "In Progress"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
