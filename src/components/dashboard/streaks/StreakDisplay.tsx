
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, Trophy, Award, Calendar, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  StreakData, 
  getStreakData,
  recordStudySession,
  hasStudiedToday
} from '@/services/streakService';
import { useToast } from '@/hooks/use-toast';

interface StreakDisplayProps {
  userId: string;
  className?: string;
}

export default function StreakDisplay({ userId, className }: StreakDisplayProps) {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedIn, setCheckedIn] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    const loadStreakData = async () => {
      try {
        setLoading(true);
        const data = await getStreakData(userId);
        setStreakData(data);
        
        // Check if user has already studied today
        const studied = await hasStudiedToday(userId);
        setCheckedIn(studied);
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
  }, [userId, toast]);

  const handleCheckIn = async () => {
    if (!userId || checkedIn || loading) return;

    try {
      setLoading(true);
      const updatedData = await recordStudySession(userId);
      setStreakData(updatedData);
      setCheckedIn(true);
      
      // Check if any new rewards were unlocked
      const newRewards = updatedData.rewards.filter(r => 
        r.unlockedAt && 
        new Date(r.unlockedAt.toDate()).toDateString() === new Date().toDateString()
      );
      
      if (newRewards.length > 0) {
        toast({
          title: "🎉 New reward unlocked!",
          description: `You've unlocked: ${newRewards[0].name}`,
          variant: "default",
        });
      } else {
        toast({
          title: "Streak updated!",
          description: `You're on a ${updatedData.currentStreak}-day streak. Keep it up!`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error updating streak:", error);
      toast({
        title: "Failed to update your streak",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate the next milestone
  const getNextMilestone = () => {
    if (!streakData) return null;
    
    const nextMilestone = streakData.milestones.find(m => !m.achieved);
    if (!nextMilestone) return null;
    
    const progress = (streakData.currentStreak / nextMilestone.streakDays) * 100;
    return {
      ...nextMilestone,
      progress: Math.min(Math.round(progress), 100),
      remaining: nextMilestone.streakDays - streakData.currentStreak
    };
  };

  const nextMilestone = getNextMilestone();

  if (loading && !streakData) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle>Study Streak</CardTitle>
          <CardDescription>Loading your streak data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-24 flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Study Streak</CardTitle>
            <CardDescription>Track your consistent study habits</CardDescription>
          </div>
          <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
            <Flame className="h-6 w-6 text-orange-500" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current streak */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Current Streak</p>
              <p className="text-2xl font-bold">{streakData?.currentStreak || 0} days</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Longest Streak</p>
              <p className="text-2xl font-bold">{streakData?.longestStreak || 0} days</p>
            </div>
          </div>
        </div>

        {/* Total days studied */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium">Total Days Studied</p>
            <p className="text-lg font-semibold">{streakData?.totalDaysStudied || 0} days</p>
          </div>
        </div>

        {/* Next milestone progress */}
        {nextMilestone && (
          <div className="space-y-2 mt-4">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Next milestone: {nextMilestone.streakDays} days</p>
              <p className="text-sm font-medium">{streakData?.currentStreak || 0}/{nextMilestone.streakDays}</p>
            </div>
            <Progress value={nextMilestone.progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {nextMilestone.remaining > 0 
                ? `Keep going! ${nextMilestone.remaining} more day${nextMilestone.remaining > 1 ? 's' : ''} to go.`
                : 'You reached your milestone! Check in to claim it.'}
            </p>
          </div>
        )}

        {/* Most recent rewards */}
        {streakData?.rewards.some(r => r.unlocked) && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Recent Achievements</p>
            <div className="flex flex-wrap gap-2">
              {streakData.rewards
                .filter(r => r.unlocked)
                .slice(0, 3)
                .map(reward => (
                  <div 
                    key={reward.id}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-accent rounded-full"
                  >
                    <Award className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">{reward.name}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Check-in button */}
        <Button 
          onClick={handleCheckIn}
          disabled={checkedIn || loading}
          className="w-full mt-4"
          variant={checkedIn ? "outline" : "default"}
        >
          {checkedIn 
            ? "You've checked in today!" 
            : "Check in for today's study session"}
        </Button>
      </CardContent>
    </Card>
  );
}
