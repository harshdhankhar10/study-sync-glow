
import { useState, useEffect } from 'react';
import { PlusCircle, Trash2, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { auth } from '@/lib/firebase';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const db = getFirestore();

interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  priority: 'Low' | 'Medium' | 'High';
  type: 'Short-term' | 'Long-term';
  completed?: boolean; // New optional field for tracking completion
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGoals = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const docRef = doc(db, 'goals', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().goals) {
          setGoals(docSnap.data().goals);
        }
      } catch (error) {
        console.error('Error fetching goals:', error);
      }
    };

    fetchGoals();
  }, []);

  const addNewGoal = () => {
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: '',
      description: '',
      deadline: '',
      priority: 'Medium',
      type: 'Short-term',
      completed: false
    };
    setGoals([...goals, newGoal]);
  };

  const updateGoal = (id: string, field: keyof Goal, value: any) => {
    setGoals(goals.map(goal => 
      goal.id === id ? { ...goal, [field]: value } : goal
    ));
  };

  const toggleGoalCompletion = (id: string) => {
    setGoals(goals.map(goal => 
      goal.id === id ? { ...goal, completed: !goal.completed } : goal
    ));
  };

  const removeGoal = (id: string) => {
    setGoals(goals.filter(goal => goal.id !== id));
  };

  const saveGoals = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');

      // Validate that all goals have at least a title
      if (goals.some(goal => !goal.title.trim())) {
        throw new Error('All goals must have a title');
      }

      await setDoc(doc(db, 'goals', user.uid), {
        goals,
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: 'Goals saved',
        description: 'Your learning goals have been saved successfully',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error saving goals',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate progress stats
  const completedGoals = goals.filter(goal => goal.completed).length;
  const totalGoals = goals.length;
  const progressPercentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  // Get upcoming deadlines for short-term goals
  const upcomingDeadlines = goals
    .filter(goal => !goal.completed && goal.deadline && goal.type === 'Short-term')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Learning Goals
        </h2>
        <p className="text-gray-500 mt-1">
          Define your academic goals to help us personalize your study experience
        </p>
      </div>

      {/* Progress summary */}
      {totalGoals > 0 && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-medium text-gray-700">Progress Overview</h3>
                <div className="mt-2">
                  <Progress value={progressPercentage} className="h-2" />
                  <p className="text-sm text-gray-600 mt-2">
                    {completedGoals} of {totalGoals} goals completed ({progressPercentage}%)
                  </p>
                </div>
              </div>
              <div className="md:col-span-2">
                <h3 className="font-medium text-gray-700">Upcoming Deadlines</h3>
                <div className="mt-2 space-y-2">
                  {upcomingDeadlines.length > 0 ? (
                    upcomingDeadlines.map(goal => (
                      <div key={goal.id} className="flex justify-between items-center text-sm">
                        <span className="truncate max-w-[200px]">{goal.title}</span>
                        <Badge variant={
                          new Date(goal.deadline) < new Date() ? "destructive" : 
                          new Date(goal.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? "outline" : "secondary"
                        }>
                          {new Date(goal.deadline).toLocaleDateString()}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No upcoming deadlines</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Learning Goals</CardTitle>
          <CardDescription>
            Set both short-term and long-term goals to track your progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {goals.map((goal) => (
              <div key={goal.id} className={`p-4 border rounded-lg ${goal.completed ? 'bg-gray-100' : 'bg-gray-50'} space-y-4 transition-colors`}>
                <div className="flex justify-between items-start">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleGoalCompletion(goal.id)}
                        className={`${goal.completed ? 'text-green-500' : 'text-gray-300'} hover:text-green-500`}
                      >
                        <CheckCircle className="h-5 w-5" />
                      </Button>
                      <div className="flex-1">
                        <Label htmlFor={`title-${goal.id}`} className={goal.completed ? 'line-through text-gray-500' : ''}>
                          Goal Title
                        </Label>
                        <Input
                          id={`title-${goal.id}`}
                          value={goal.title}
                          onChange={(e) => updateGoal(goal.id, 'title', e.target.value)}
                          placeholder="E.g., Master calculus, Improve essay writing"
                          className={goal.completed ? 'text-gray-500' : ''}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor={`description-${goal.id}`} className={goal.completed ? 'line-through text-gray-500' : ''}>
                        Description
                      </Label>
                      <Textarea
                        id={`description-${goal.id}`}
                        value={goal.description}
                        onChange={(e) => updateGoal(goal.id, 'description', e.target.value)}
                        placeholder="Describe your goal in detail"
                        className={`min-h-[80px] ${goal.completed ? 'text-gray-500' : ''}`}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`deadline-${goal.id}`} className={goal.completed ? 'line-through text-gray-500' : ''}>
                          Target Completion
                        </Label>
                        <Input
                          id={`deadline-${goal.id}`}
                          type="date"
                          value={goal.deadline}
                          onChange={(e) => updateGoal(goal.id, 'deadline', e.target.value)}
                          className={goal.completed ? 'text-gray-500' : ''}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`priority-${goal.id}`} className={goal.completed ? 'line-through text-gray-500' : ''}>
                          Priority
                        </Label>
                        <Select
                          value={goal.priority}
                          onValueChange={(value) => updateGoal(goal.id, 'priority', value as 'Low' | 'Medium' | 'High')}
                          disabled={goal.completed}
                        >
                          <SelectTrigger id={`priority-${goal.id}`} className={goal.completed ? 'text-gray-500' : ''}>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor={`type-${goal.id}`} className={goal.completed ? 'line-through text-gray-500' : ''}>
                          Goal Type
                        </Label>
                        <Select
                          value={goal.type}
                          onValueChange={(value) => updateGoal(goal.id, 'type', value as 'Short-term' | 'Long-term')}
                          disabled={goal.completed}
                        >
                          <SelectTrigger id={`type-${goal.id}`} className={goal.completed ? 'text-gray-500' : ''}>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Short-term">Short-term</SelectItem>
                            <SelectItem value="Long-term">Long-term</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeGoal(goal.id)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}

            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 border-dashed"
              onClick={addNewGoal}
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add New Goal</span>
            </Button>

            <div className="flex justify-end mt-6">
              <Button 
                onClick={saveGoals} 
                disabled={isLoading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {isLoading ? 'Saving...' : 'Save Goals'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
