
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, Star, Lock, BookOpen, Clock, Lightbulb, Users, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface AchievementProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  unlocked: boolean;
  category: string;
  date?: string;
  reward?: string;
}

const Achievement = ({ title, description, icon, progress, unlocked, category, date, reward }: AchievementProps) => {
  return (
    <Card className={`transition-all duration-200 ${unlocked ? 'border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50' : 'border-gray-200'}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${unlocked ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
            {icon}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{title}</h3>
              {unlocked ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Unlocked {date && `· ${date}`}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-500">
                  <Lock className="h-3 w-3 mr-1" />
                  Locked
                </Badge>
              )}
            </div>
            <p className="text-gray-500 text-sm">{description}</p>
            
            <div className="pt-2">
              <div className="flex justify-between mb-1 text-xs">
                <span className="font-medium">Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>

            {reward && unlocked && (
              <div className="mt-3 pt-3 border-t border-indigo-100">
                <p className="text-xs font-medium text-indigo-700">
                  <Star className="h-3 w-3 inline mr-1" />
                  Reward: {reward}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Achievements() {
  const { toast } = useToast();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", name: "All Achievements" },
    { id: "academic", name: "Academic" },
    { id: "consistency", name: "Consistency" },
    { id: "collaboration", name: "Collaboration" },
    { id: "milestones", name: "Milestones" }
  ];

  const achievements: AchievementProps[] = [
    {
      title: "First Steps Scholar",
      description: "Complete your first 5 study sessions",
      icon: <BookOpen className="h-5 w-5" />,
      progress: 100,
      unlocked: true,
      category: "academic",
      date: "2 weeks ago",
      reward: "Bronze Scholar Badge"
    },
    {
      title: "Consistency Champion",
      description: "Study for 7 consecutive days",
      icon: <Clock className="h-5 w-5" />,
      progress: 100,
      unlocked: true,
      category: "consistency",
      date: "1 week ago",
      reward: "Silver Consistency Badge"
    },
    {
      title: "Knowledge Explorer",
      description: "Create 10 detailed notes on different topics",
      icon: <Lightbulb className="h-5 w-5" />,
      progress: 70,
      unlocked: false,
      category: "academic"
    },
    {
      title: "Team Player",
      description: "Participate in 5 group study sessions",
      icon: <Users className="h-5 w-5" />,
      progress: 60,
      unlocked: false,
      category: "collaboration"
    },
    {
      title: "Goal Getter",
      description: "Complete 3 learning goals ahead of schedule",
      icon: <TrendingUp className="h-5 w-5" />,
      progress: 100,
      unlocked: true,
      category: "milestones",
      date: "3 days ago",
      reward: "Gold Achievement Badge"
    },
    {
      title: "Discussion Leader",
      description: "Start and lead 3 group discussions",
      icon: <Users className="h-5 w-5" />,
      progress: 33,
      unlocked: false,
      category: "collaboration"
    },
    {
      title: "Note Taking Pro",
      description: "Use AI to generate summaries for 5 notes",
      icon: <CheckCircle2 className="h-5 w-5" />,
      progress: 80,
      unlocked: false,
      category: "academic"
    },
    {
      title: "Monthly Milestone",
      description: "Complete all your study goals for a month",
      icon: <Award className="h-5 w-5" />,
      progress: 25,
      unlocked: false,
      category: "milestones"
    }
  ];

  const filteredAchievements = selectedCategory === "all" 
    ? achievements 
    : achievements.filter(achievement => achievement.category === selectedCategory);

  const unlockedAchievements = achievements.filter(a => a.unlocked).length;
  const totalAchievements = achievements.length;
  const progressPercentage = Math.round((unlockedAchievements / totalAchievements) * 100);

  const shareAchievements = () => {
    setIsShareDialogOpen(false);
    toast({
      title: "Achievements Shared",
      description: "Your achievements have been shared with your study groups.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Achievement Progress</CardTitle>
            <CardDescription>
              You've unlocked {unlockedAchievements} out of {totalAchievements} achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Overall Achievement Progress</span>
                <span className="text-sm font-medium">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
            
            <div className="flex overflow-x-auto pb-2 -mx-2 px-2 space-x-2">
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={selectedCategory === category.id ? "bg-gradient-to-r from-indigo-600 to-purple-600" : ""}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Badge Showcase</CardTitle>
            <CardDescription>
              Your earned achievement badges
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4">
            {unlockedAchievements > 0 ? (
              <div className="grid grid-cols-2 gap-4 w-full">
                {achievements
                  .filter(a => a.unlocked)
                  .map((achievement, i) => (
                    <div key={i} className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                        {achievement.icon}
                      </div>
                      <span className="text-xs mt-2 font-medium">{achievement.title}</span>
                    </div>
                  ))
                }
              </div>
            ) : (
              <div className="text-center py-4">
                <Award className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No badges earned yet</p>
              </div>
            )}
            
            <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  Share Achievements
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Your Achievements</DialogTitle>
                  <DialogDescription>
                    Choose which achievements to share with your study groups.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 my-4">
                  {achievements
                    .filter(a => a.unlocked)
                    .map((achievement, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <input type="checkbox" id={`share-${i}`} defaultChecked className="rounded" />
                        <label htmlFor={`share-${i}`} className="text-sm">{achievement.title}</label>
                      </div>
                    ))
                  }
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>Cancel</Button>
                  <Button onClick={shareAchievements}>Share</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredAchievements.map((achievement, index) => (
          <Achievement
            key={index}
            title={achievement.title}
            description={achievement.description}
            icon={achievement.icon}
            progress={achievement.progress}
            unlocked={achievement.unlocked}
            category={achievement.category}
            date={achievement.date}
            reward={achievement.reward}
          />
        ))}
      </div>
    </div>
  );
}
