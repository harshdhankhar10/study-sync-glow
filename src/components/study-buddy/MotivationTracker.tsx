
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Star, Bell, Trophy, Badge, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: 'star' | 'trophy' | 'badge' | 'heart';
  progress: number;
  target: number;
  achieved: boolean;
  date?: Date;
}

interface MotivationTrackerProps {
  userId: string;
  lastActive?: Date;
  milestones?: {
    title: string;
    achieved: boolean;
    date?: Date;
  }[];
  enhancedView?: boolean;
}

export const MotivationTracker: React.FC<MotivationTrackerProps> = ({
  userId,
  lastActive,
  milestones = [],
  enhancedView = false
}) => {
  const [quote, setQuote] = useState("");
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: "1",
      title: "Study Champion",
      description: "Complete 10 study sessions",
      icon: "trophy",
      progress: 7,
      target: 10,
      achieved: false
    },
    {
      id: "2",
      title: "Goal Setter",
      description: "Set and achieve 5 study goals",
      icon: "star",
      progress: 3,
      target: 5,
      achieved: false
    },
    {
      id: "3",
      title: "Consistency King",
      description: "Maintain a 7-day study streak",
      icon: "badge",
      progress: 5,
      target: 7,
      achieved: false
    },
    {
      id: "4",
      title: "Team Player",
      description: "Join 3 study groups",
      icon: "heart",
      progress: 2,
      target: 3,
      achieved: false
    }
  ]);

  const [weeklyProgress, setWeeklyProgress] = useState<{
    sessionsCompleted: number;
    goalsAchieved: number;
    streak: number;
    totalStudyTime: number;
  }>({
    sessionsCompleted: 0,
    goalsAchieved: 0,
    streak: 0,
    totalStudyTime: 0
  });

  const quotes = [
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The secret of getting ahead is getting started.",
    "Don't watch the clock; do what it does. Keep going.",
    "Believe you can and you're halfway there.",
    "Quality is not an act, it's a habit.",
    "The expert in anything was once a beginner.",
    "Your time is limited, don't waste it living someone else's life.",
    "The only way to do great work is to love what you do.",
    "Small progress is still progress.",
    "Your future is created by what you do today, not tomorrow."
  ];

  useEffect(() => {
    // Set random quote and rotate every 24 hours
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);

    // Check inactivity
    if (lastActive) {
      const daysSinceActive = Math.floor((new Date().getTime() - new Date(lastActive).getTime()) / (1000 * 3600 * 24));
      
      if (daysSinceActive >= 3) {
        toast({
          title: "Missing your progress!",
          description: "It's been a few days since your last study session. Keep the momentum going! 📚",
        });
      }
    }

    // Simulate fetching weekly progress (replace with actual data fetching)
    setWeeklyProgress({
      sessionsCompleted: 12,
      goalsAchieved: 5,
      streak: 4,
      totalStudyTime: 840 // minutes
    });
  }, [lastActive, toast]);

  const renderAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'trophy': return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'star': return <Star className="h-5 w-5 text-amber-500" />;
      case 'badge': return <Badge className="h-5 w-5 text-indigo-500" />;
      case 'heart': return <Heart className="h-5 w-5 text-rose-500" />;
      default: return <Award className="h-5 w-5 text-purple-500" />;
    }
  };

  return (
    <div className={`space-y-4 ${enhancedView ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : ''}`}>
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Daily Motivation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <blockquote className="italic text-gray-600">"{quote}"</blockquote>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Weekly Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span>Study Sessions</span>
                <span className="text-indigo-600 font-medium">{weeklyProgress.sessionsCompleted}</span>
              </div>
              <Progress value={Math.min((weeklyProgress.sessionsCompleted / 15) * 100, 100)} />
            </div>
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span>Current Streak</span>
                <span className="text-indigo-600 font-medium">{weeklyProgress.streak} days</span>
              </div>
              <Progress value={Math.min((weeklyProgress.streak / 7) * 100, 100)} />
            </div>
            <div className="text-sm text-gray-600">
              Total Study Time: {Math.floor(weeklyProgress.totalStudyTime / 60)}h {weeklyProgress.totalStudyTime % 60}m
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-full lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-500" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  {renderAchievementIcon(achievement.icon)}
                  <span className="text-sm font-medium">{achievement.title}</span>
                </div>
                <div className="text-xs text-gray-500">{achievement.description}</div>
                <Progress value={(achievement.progress / achievement.target) * 100} />
                <div className="text-xs text-right text-gray-600">
                  {achievement.progress} / {achievement.target}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {enhancedView && (
        <Card className="col-span-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {milestones?.filter(m => m.achieved).map((milestone, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>{milestone.title}</span>
                  {milestone.date && (
                    <span className="text-xs text-gray-500">
                      {format(new Date(milestone.date), 'MMM d')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
