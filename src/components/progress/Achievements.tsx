
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, Star, Lock, BookOpen, Clock, Lightbulb, Users, TrendingUp, CheckCircle2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { getFirestore, collection, query, where, getDocs, addDoc, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface AchievementProps {
  id?: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  unlocked: boolean;
  category: string;
  date?: string;
  reward?: string;
}

const Achievement = ({ title, description, icon, progress, unlocked, category, date, reward, id }: AchievementProps) => {
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

const iconOptions = [
  { name: "Book", component: <BookOpen className="h-5 w-5" /> },
  { name: "Clock", component: <Clock className="h-5 w-5" /> },
  { name: "Lightbulb", component: <Lightbulb className="h-5 w-5" /> },
  { name: "Users", component: <Users className="h-5 w-5" /> },
  { name: "TrendingUp", component: <TrendingUp className="h-5 w-5" /> },
  { name: "Award", component: <Award className="h-5 w-5" /> },
  { name: "CheckCircle", component: <CheckCircle2 className="h-5 w-5" /> },
];

export default function Achievements() {
  const { toast } = useToast();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isAddAchievementOpen, setIsAddAchievementOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [user, setUser] = useState<any>(null);
  const db = getFirestore();
  const queryClient = useQueryClient();

  // Form state for adding new achievement
  const [newAchievement, setNewAchievement] = useState({
    title: "",
    description: "",
    icon: "Book",
    category: "academic",
    progress: 0,
    reward: ""
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const categories = [
    { id: "all", name: "All Achievements" },
    { id: "academic", name: "Academic" },
    { id: "consistency", name: "Consistency" },
    { id: "collaboration", name: "Collaboration" },
    { id: "milestones", name: "Milestones" }
  ];

  // Fetch achievements
  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['achievements', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      try {
        const achievementsRef = collection(db, 'achievements');
        const achievementsQuery = query(
          achievementsRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(achievementsQuery);
        
        if (querySnapshot.empty) {
          // If no data exists, create initial data
          const initialData = [
            {
              title: "First Steps Scholar",
              description: "Complete your first 5 study sessions",
              icon: "Book",
              progress: 100,
              unlocked: true,
              category: "academic",
              date: "2 weeks ago",
              reward: "Bronze Scholar Badge"
            },
            {
              title: "Consistency Champion",
              description: "Study for 7 consecutive days",
              icon: "Clock",
              progress: 100,
              unlocked: true,
              category: "consistency",
              date: "1 week ago",
              reward: "Silver Consistency Badge"
            },
            {
              title: "Knowledge Explorer",
              description: "Create 10 detailed notes on different topics",
              icon: "Lightbulb",
              progress: 70,
              unlocked: false,
              category: "academic"
            },
            {
              title: "Team Player",
              description: "Participate in 5 group study sessions",
              icon: "Users",
              progress: 60,
              unlocked: false,
              category: "collaboration"
            },
            {
              title: "Goal Getter",
              description: "Complete 3 learning goals ahead of schedule",
              icon: "TrendingUp",
              progress: 100,
              unlocked: true,
              category: "milestones",
              date: "3 days ago",
              reward: "Gold Achievement Badge"
            },
            {
              title: "Discussion Leader",
              description: "Start and lead 3 group discussions",
              icon: "Users",
              progress: 33,
              unlocked: false,
              category: "collaboration"
            },
            {
              title: "Note Taking Pro",
              description: "Use AI to generate summaries for 5 notes",
              icon: "CheckCircle",
              progress: 80,
              unlocked: false,
              category: "academic"
            },
            {
              title: "Monthly Milestone",
              description: "Complete all your study goals for a month",
              icon: "Award",
              progress: 25,
              unlocked: false,
              category: "milestones"
            }
          ];
          
          // Store initial data in Firestore
          const batch = initialData.map(async (item, index) => {
            const date = new Date();
            date.setDate(date.getDate() - (index * 3 + Math.floor(Math.random() * 5)));
            
            await addDoc(achievementsRef, {
              userId: user.uid,
              title: item.title,
              description: item.description,
              icon: item.icon,
              progress: item.progress,
              unlocked: item.unlocked,
              category: item.category,
              date: item.date || null, // Ensure date is never undefined
              reward: item.reward || null, // Ensure reward is never undefined
              createdAt: date,
            });
          });
          
          await Promise.all(batch);
          
          return initialData;
        }
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
      } catch (error) {
        console.error("Error fetching achievements:", error);
        return [];
      }
    },
    enabled: !!user?.uid,
  });

  const handleAddAchievement = async () => {
    if (!user?.uid) return;
    
    try {
      const achievementsRef = collection(db, 'achievements');
      
      // Calculate if achievement is unlocked based on progress
      const isUnlocked = parseInt(newAchievement.progress.toString()) === 100;
      
      await addDoc(achievementsRef, {
        userId: user.uid,
        title: newAchievement.title,
        description: newAchievement.description,
        icon: newAchievement.icon,
        progress: parseInt(newAchievement.progress.toString()),
        unlocked: isUnlocked,
        category: newAchievement.category,
        date: isUnlocked ? "Just now" : null, // Provide null instead of undefined
        reward: isUnlocked && newAchievement.reward ? newAchievement.reward : null, // Provide null instead of undefined
        createdAt: serverTimestamp(),
      });
      
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      
      setNewAchievement({
        title: "",
        description: "",
        icon: "Book",
        category: "academic",
        progress: 0,
        reward: ""
      });
      
      setIsAddAchievementOpen(false);
      
      toast({
        title: "Achievement Added",
        description: "Your new achievement has been created successfully.",
      });
    } catch (error) {
      console.error("Error adding achievement:", error);
      toast({
        title: "Error",
        description: "Failed to add achievement. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredAchievements = selectedCategory === "all" 
    ? achievements 
    : achievements?.filter((achievement: any) => achievement.category === selectedCategory);

  const unlockedAchievements = achievements?.filter((a: any) => a.unlocked).length || 0;
  const totalAchievements = achievements?.length || 0;
  const progressPercentage = totalAchievements > 0 ? Math.round((unlockedAchievements / totalAchievements) * 100) : 0;

  const shareAchievements = () => {
    setIsShareDialogOpen(false);
    toast({
      title: "Achievements Shared",
      description: "Your achievements have been shared with your study groups.",
    });
  };

  const getIconComponent = (iconName: string) => {
    const icon = iconOptions.find(i => i.name === iconName);
    return icon ? icon.component : <BookOpen className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Achievement Progress</CardTitle>
              <CardDescription>
                You've unlocked {unlockedAchievements} out of {totalAchievements} achievements
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddAchievementOpen(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600">
              <Plus className="mr-2 h-4 w-4" />
              Add Achievement
            </Button>
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
            {achievementsLoading ? (
              <div className="h-40 flex items-center justify-center">
                <p>Loading badges...</p>
              </div>
            ) : unlockedAchievements > 0 ? (
              <div className="grid grid-cols-2 gap-4 w-full">
                {achievements
                  ?.filter((a: any) => a.unlocked)
                  .map((achievement: any, i: number) => (
                    <div key={achievement.id || i} className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                        {getIconComponent(achievement.icon)}
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
                    ?.filter((a: any) => a.unlocked)
                    .map((achievement: any, i: number) => (
                      <div key={achievement.id || i} className="flex items-center gap-3">
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

      {/* Add Achievement Dialog - Improved UI, centered on page */}
      <Dialog open={isAddAchievementOpen} onOpenChange={setIsAddAchievementOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Create New Achievement</DialogTitle>
            <DialogDescription>
              Track your progress towards your learning goals
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="font-medium">Achievement Title</Label>
              <Input 
                id="title" 
                value={newAchievement.title} 
                onChange={(e) => setNewAchievement({...newAchievement, title: e.target.value})}
                placeholder="Enter achievement title" 
                className="border-indigo-100 focus-visible:ring-indigo-500"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description" className="font-medium">Description</Label>
              <Textarea 
                id="description" 
                value={newAchievement.description} 
                onChange={(e) => setNewAchievement({...newAchievement, description: e.target.value})}
                placeholder="What needs to be accomplished?" 
                className="border-indigo-100 focus-visible:ring-indigo-500"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="category" className="font-medium">Category</Label>
              <select 
                id="category"
                className="flex h-10 w-full rounded-md border border-indigo-100 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newAchievement.category}
                onChange={(e) => setNewAchievement({...newAchievement, category: e.target.value})}
              >
                <option value="academic">Academic</option>
                <option value="consistency">Consistency</option>
                <option value="collaboration">Collaboration</option>
                <option value="milestones">Milestones</option>
              </select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="icon" className="font-medium">Icon</Label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {iconOptions.map(icon => (
                  <div
                    key={icon.name}
                    onClick={() => setNewAchievement({...newAchievement, icon: icon.name})}
                    className={`flex flex-col items-center justify-center p-2 rounded-md cursor-pointer transition-colors border ${newAchievement.icon === icon.name ? 'bg-indigo-50 border-indigo-200' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-1">
                      {icon.component}
                    </div>
                    <span className="text-xs">{icon.name}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="progress" className="font-medium">Current Progress</Label>
                <span className="text-sm font-medium text-indigo-600">{newAchievement.progress}%</span>
              </div>
              <Input 
                id="progress" 
                type="range" 
                min="0" 
                max="100" 
                value={newAchievement.progress} 
                onChange={(e) => setNewAchievement({...newAchievement, progress: parseInt(e.target.value)})}
                className="accent-indigo-600 w-full" 
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Not Started</span>
                <span>In Progress</span>
                <span>Completed</span>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="reward" className="font-medium">Reward (when completed)</Label>
              <Input 
                id="reward" 
                value={newAchievement.reward} 
                onChange={(e) => setNewAchievement({...newAchievement, reward: e.target.value})}
                placeholder="e.g. Gold Scholar Badge" 
                className="border-indigo-100 focus-visible:ring-indigo-500"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsAddAchievementOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={handleAddAchievement} 
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              disabled={!newAchievement.title || !newAchievement.description}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Achievement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {achievementsLoading ? (
          <div className="col-span-2 h-40 flex items-center justify-center">
            <p>Loading achievements...</p>
          </div>
        ) : (
          filteredAchievements?.map((achievement: any, index: number) => (
            <Achievement
              key={achievement.id || index}
              id={achievement.id}
              title={achievement.title}
              description={achievement.description}
              icon={getIconComponent(achievement.icon)}
              progress={achievement.progress}
              unlocked={achievement.unlocked}
              category={achievement.category}
              date={achievement.date}
              reward={achievement.reward}
            />
          ))
        )}
      </div>
    </div>
  );
}
