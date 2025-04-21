
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChevronRight, Clock, UserPlus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { auth } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const setupTasks = [
    { 
      id: 'profile', 
      title: 'Complete your profile', 
      description: 'Add your personal and academic details', 
      path: '/dashboard/profile',
      completed: false 
    },
    { 
      id: 'skills', 
      title: 'Add skills & interests', 
      description: 'Tell us what you're good at and interested in learning', 
      path: '/dashboard/skills',
      completed: false 
    },
    { 
      id: 'availability', 
      title: 'Set your availability', 
      description: 'Let us know when you can join study sessions', 
      path: '/dashboard/availability',
      completed: false 
    },
    { 
      id: 'goals', 
      title: 'Define learning goals', 
      description: 'Set clear objectives for your study journey', 
      path: '/dashboard/goals',
      completed: false 
    }
  ];

  const progressPercentage = Math.round((setupTasks.filter(task => task.completed).length / setupTasks.length) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Dashboard
        </h2>
        <p className="text-gray-500 mt-1">
          Welcome back{user?.displayName ? `, ${user.displayName}` : ''}! Track your progress and manage your study groups
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              Finish setting up your profile to get matched with study groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Profile completion</span>
                <span className="text-sm font-medium">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            <div className="space-y-4">
              {setupTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  {task.completed ? (
                    <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                  ) : (
                    <Clock className="h-6 w-6 text-amber-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">{task.title}</h3>
                    <p className="text-gray-500 text-sm">{task.description}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => navigate(task.path)}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Study Groups</CardTitle>
            <CardDescription>
              Your current and upcoming study groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 h-48">
              <UserPlus className="h-10 w-10 text-gray-400" />
              <div>
                <h3 className="font-medium">No study groups yet</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Complete your profile to get matched with groups
                </p>
              </div>
              <Button 
                variant="outline"
                className="mt-2"
                onClick={() => navigate('/dashboard/profile')}
              >
                Complete Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
