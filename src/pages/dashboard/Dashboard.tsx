
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronRight } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import StudyMetrics from '@/components/dashboard/overview/StudyMetrics';
import RecentActivity from '@/components/dashboard/overview/RecentActivity';

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

  // Fetch study metrics
  const { data: metricsData } = useQuery({
    queryKey: ['studyMetrics', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      const metricsRef = doc(db, 'metrics', user.uid);
      const metricsSnap = await getDoc(metricsRef);
      return metricsSnap.exists() ? metricsSnap.data() : {
        studyTime: 0,
        completedTasks: 0,
        activeGroups: 0
      };
    },
    enabled: !!user?.uid,
  });

  // Fetch recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ['recentActivity', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const activityRef = collection(db, 'activity');
      const activityQuery = query(
        activityRef,
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      const snapshot = await getDocs(activityQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        type: doc.data().type || 'study',
        title: doc.data().title || 'Study session',
        timestamp: doc.data().timestamp || new Date().toISOString(),
        ...doc.data()
      }));
    },
    enabled: !!user?.uid,
  });

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

  // If there's no activity data, provide some placeholder data
  const formattedActivity = recentActivity && recentActivity.length > 0 
    ? recentActivity 
    : [
        {
          id: '1',
          type: 'study',
          title: 'Completed a study session',
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          type: 'achievement',
          title: 'Earned a new badge',
          timestamp: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '3',
          type: 'group',
          title: 'Joined a new study group',
          timestamp: new Date(Date.now() - 172800000).toISOString()
        }
      ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Welcome back{profileData?.fullName ? `, ${profileData.fullName}` : ''}!
        </h2>
        <p className="text-gray-500 mt-1">
          Here's your learning progress overview
        </p>
      </div>

      {/* Study Metrics */}
      <StudyMetrics 
        studyTime={metricsData?.studyTime || 0}
        completedTasks={metricsData?.completedTasks || 0}
        activeGroups={groupsData?.count || 0}
        goalsProgress={progress}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Setup Progress Card */}
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

        {/* Recent Activity */}
        <div className="md:col-span-2">
          <RecentActivity activities={formattedActivity} />
        </div>
      </div>
    </div>
  );
}
