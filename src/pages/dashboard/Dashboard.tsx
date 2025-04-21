
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Clock, UserPlus, Calendar, TrendingUp, Users, BookOpen, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { auth } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';

const db = getFirestore();

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Fetch user profile data
  const { data: profileData } = useQuery({
    queryKey: ['profile', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      const docRef = doc(db, 'profiles', user.uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    },
    enabled: !!user?.uid,
  });

  // Fetch upcoming study sessions
  const { data: upcomingSessions } = useQuery({
    queryKey: ['upcomingSessions', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const sessionsRef = collection(db, 'sessions');
      const sessionsQuery = query(
        sessionsRef,
        where('userId', '==', user.uid),
        where('date', '>=', new Date()),
        orderBy('date', 'asc'),
        limit(3)
      );
      const snapshot = await getDocs(sessionsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!user?.uid,
  });

  // Fetch study groups count
  const { data: groupsData } = useQuery({
    queryKey: ['studyGroups', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return { count: 0, recent: [] };
      const groupsRef = collection(db, 'groups');
      const groupsQuery = query(
        groupsRef,
        where('members', 'array-contains', user.uid),
        limit(3)
      );
      const snapshot = await getDocs(groupsQuery);
      return {
        count: snapshot.size,
        recent: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      };
    },
    enabled: !!user?.uid,
  });

  // Fetch goals progress
  const { data: goalsData } = useQuery({
    queryKey: ['goals', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const goalsRef = collection(db, 'goals');
      const goalsQuery = query(
        goalsRef,
        where('userId', '==', user.uid),
        where('completed', '==', false),
        limit(3)
      );
      const snapshot = await getDocs(goalsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!user?.uid,
  });

  const setupTasks = [
    { 
      id: 'profile', 
      title: 'Complete your profile', 
      description: 'Add your personal and academic details', 
      path: '/dashboard/profile',
      completed: !!profileData?.fullName && !!profileData?.school 
    },
    { 
      id: 'goals', 
      title: 'Set your learning goals', 
      description: 'Define what you want to achieve', 
      path: '/dashboard/goals',
      completed: !!goalsData?.length 
    },
    { 
      id: 'groups', 
      title: 'Join study groups', 
      description: 'Connect with other learners', 
      path: '/dashboard/study-groups',
      completed: !!groupsData?.count 
    }
  ];

  const progress = Math.round((setupTasks.filter(task => task.completed).length / setupTasks.length) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Welcome back{profileData?.fullName ? `, ${profileData.fullName}` : ''}!
        </h2>
        <p className="text-gray-500 mt-1">
          Here's an overview of your learning journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Setup</CardTitle>
            <CardDescription>Complete these steps to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Setup Progress</span>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="space-y-4">
              {setupTasks.map((task) => (
                <Button
                  key={task.id}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => navigate(task.path)}
                >
                  <div className="flex items-center gap-3">
                    {task.completed ? (
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-gray-300" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-gray-500">{task.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>Your next study sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingSessions?.length ? (
              <div className="space-y-4">
                {upcomingSessions.map((session: any) => (
                  <div key={session.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <Calendar className="h-5 w-5 text-indigo-500 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium">{session.title}</h3>
                      <p className="text-gray-500 text-sm">
                        {new Date(session.date.seconds * 1000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Clock className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No upcoming sessions</p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => navigate('/dashboard/schedule')}
                >
                  Schedule a Session
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Study Groups */}
        <Card>
          <CardHeader>
            <CardTitle>Study Groups</CardTitle>
            <CardDescription>Your learning communities</CardDescription>
          </CardHeader>
          <CardContent>
            {groupsData?.count ? (
              <div className="space-y-4">
                {groupsData.recent.map((group: any) => (
                  <div key={group.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <Users className="h-5 w-5 text-indigo-500 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium">{group.name}</h3>
                      <p className="text-gray-500 text-sm">
                        {group.members?.length || 0} members
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No study groups joined yet</p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => navigate('/dashboard/study-groups')}
                >
                  Find Groups
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
