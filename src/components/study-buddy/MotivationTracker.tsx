
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Star, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface MotivationTrackerProps {
  userId: string;
  lastActive?: Date;
  milestones?: {
    title: string;
    achieved: boolean;
    date?: Date;
  }[];
}

export const MotivationTracker: React.FC<MotivationTrackerProps> = ({
  userId,
  lastActive,
  milestones = []
}) => {
  const [quote, setQuote] = useState("");
  const { toast } = useToast();
  const [weeklyProgress, setWeeklyProgress] = useState<{
    sessionsCompleted: number;
    goalsAchieved: number;
    streak: number;
  }>({
    sessionsCompleted: 0,
    goalsAchieved: 0,
    streak: 0
  });

  // Motivational quotes
  const quotes = [
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The secret of getting ahead is getting started.",
    "Don't watch the clock; do what it does. Keep going.",
    "Believe you can and you're halfway there.",
    "Quality is not an act, it's a habit."
  ];

  useEffect(() => {
    // Set random quote
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
  }, [lastActive, toast]);

  return (
    <div className="space-y-4">
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
            <Award className="h-5 w-5 text-indigo-500" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {milestones.filter(m => m.achieved).map((milestone, idx) => (
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-500" />
            Study Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            {lastActive ? (
              `Last active: ${format(new Date(lastActive), 'MMM d, yyyy')}`
            ) : (
              "Start your study journey today!"
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
