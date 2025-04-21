
import { useState, useEffect } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { auth } from '@/lib/firebase';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const db = getFirestore();

interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  priority: 'Low' | 'Medium' | 'High';
  type: 'Short-term' | 'Long-term';
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
      type: 'Short-term'
    };
    setGoals([...goals, newGoal]);
  };

  const updateGoal = (id: string, field: keyof Goal, value: string) => {
    setGoals(goals.map(goal => 
      goal.id === id ? { ...goal, [field]: value } : goal
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
              <div key={goal.id} className="p-4 border rounded-lg bg-gray-50 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-4 flex-1">
                    <div>
                      <Label htmlFor={`title-${goal.id}`}>Goal Title</Label>
                      <Input
                        id={`title-${goal.id}`}
                        value={goal.title}
                        onChange={(e) => updateGoal(goal.id, 'title', e.target.value)}
                        placeholder="E.g., Master calculus, Improve essay writing"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`description-${goal.id}`}>Description</Label>
                      <Textarea
                        id={`description-${goal.id}`}
                        value={goal.description}
                        onChange={(e) => updateGoal(goal.id, 'description', e.target.value)}
                        placeholder="Describe your goal in detail"
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`deadline-${goal.id}`}>Target Completion</Label>
                        <Input
                          id={`deadline-${goal.id}`}
                          type="date"
                          value={goal.deadline}
                          onChange={(e) => updateGoal(goal.id, 'deadline', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`priority-${goal.id}`}>Priority</Label>
                        <Select
                          value={goal.priority}
                          onValueChange={(value) => updateGoal(goal.id, 'priority', value as 'Low' | 'Medium' | 'High')}
                        >
                          <SelectTrigger id={`priority-${goal.id}`}>
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
                        <Label htmlFor={`type-${goal.id}`}>Goal Type</Label>
                        <Select
                          value={goal.type}
                          onValueChange={(value) => updateGoal(goal.id, 'type', value as 'Short-term' | 'Long-term')}
                        >
                          <SelectTrigger id={`type-${goal.id}`}>
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
