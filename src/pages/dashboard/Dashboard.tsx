
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, Book, Calendar, Clock, FileText } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import StudyMetrics from '@/components/dashboard/overview/StudyMetrics';
import RecentActivity, { ActivityItem } from '@/components/dashboard/overview/RecentActivity';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        // Redirect to login if not authenticated
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Fetch study metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
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

  // Fetch study groups with a more comprehensive approach
  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['studyGroups', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return { count: 0, recent: [] };
      
      try {
        const membershipsRef = collection(db, 'groupMemberships');
        const userMembershipsQuery = query(
          membershipsRef,
          where('userId', '==', user.uid)
        );
        
        const emailMembershipsQuery = query(
          membershipsRef,
          where('email', '==', user.email)
        );
        
        const [userIdResults, emailResults] = await Promise.all([
          getDocs(userMembershipsQuery),
          getDocs(emailMembershipsQuery)
        ]);
        
        const uniqueGroupIds = new Set<string>();
        
        userIdResults.docs.forEach(doc => {
          uniqueGroupIds.add(doc.data().groupId);
        });
        
        emailResults.docs.forEach(doc => {
          uniqueGroupIds.add(doc.data().groupId);
        });
        
        const groupCount = uniqueGroupIds.size;
        
        const groupIds = Array.from(uniqueGroupIds).slice(0, 3);
        const recentGroups = [];
        
        for (const groupId of groupIds) {
          const groupRef = doc(db, 'studyGroups', groupId);
          const groupSnap = await getDoc(groupRef);
          if (groupSnap.exists()) {
            const data = groupSnap.data();
            recentGroups.push({
              id: groupSnap.id,
              name: data.name || 'Unnamed Group',
              subject: data.subject || 'General',
              membersCount: data.membersCount || 1,
              lastActivity: data.updatedAt || data.createdAt || new Date(),
              ...data
            });
          }
        }
        
        // Log successful group retrieval
        console.log(`Found ${groupCount} groups for user`, user.uid);
        
        return {
          count: groupCount,
          recent: recentGroups
        };
      } catch (error) {
        console.error('Error fetching study groups:', error);
        toast({
          title: "Failed to load study groups",
          description: "We'll try again shortly. Please refresh if the issue persists.",
          variant: "destructive"
        });
        return { count: 0, recent: [] };
      }
    },
    enabled: !!user?.uid,
  });

  // Fetch recent activity with error handling
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['recentActivity', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      try {
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
          timestamp: doc.data().timestamp?.toDate?.() || new Date().toISOString(),
          details: doc.data().details || '',
          ...doc.data()
        })) as ActivityItem[];
      } catch (error) {
        console.error('Error fetching activity:', error);
        return [] as ActivityItem[];
      }
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

  // Fetch recent notes
  const { data: recentNotes } = useQuery({
    queryKey: ['recentNotes', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const notesRef = collection(db, 'notes');
      const notesQuery = query(
        notesRef,
        where('userId', '==', user.uid),
        orderBy('updatedAt', 'desc'),
        limit(3)
      );
      try {
        const snapshot = await getDocs(notesQuery);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title || 'Untitled Note',
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error fetching notes:', error);
        return [];
      }
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
      completed: !!(groupsData?.count && groupsData.count > 0)
    }
  ];

  const progress = Math.round((setupTasks.filter(task => task.completed).length / setupTasks.length) * 100);

  // If there's no activity data, provide some placeholder data
  const formattedActivity = recentActivity && recentActivity.length > 0 
    ? recentActivity as ActivityItem[]
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

  // Loading state - prevent white screen
  if (!user && !auth.currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-t-indigo-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

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

      {/* Additional Dashboard Sections - Recent Notes & Upcoming Sessions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Recent Notes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Recent Notes</CardTitle>
              <CardDescription>Your latest study materials</CardDescription>
            </div>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {recentNotes && recentNotes.length > 0 ? (
              <div className="space-y-4">
                {recentNotes.map((note: any) => (
                  <div 
                    key={note.id} 
                    className="flex items-center p-3 rounded-md border hover:bg-accent cursor-pointer"
                    onClick={() => navigate('/dashboard/notes')}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{note.title}</h4>
                      <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                        {note.content?.substring(0, 60) || 'No content'}...
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {note.updatedAt instanceof Date 
                        ? note.updatedAt.toLocaleDateString() 
                        : new Date(note.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Book className="h-8 w-8 text-muted-foreground mb-2" />
                <h4 className="font-medium mb-1">No notes yet</h4>
                <p className="text-xs text-muted-foreground mb-4">Start creating study notes</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/dashboard/notes')}
                >
                  Create a note
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Upcoming Sessions</CardTitle>
              <CardDescription>Your scheduled study time</CardDescription>
            </div>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {upcomingSessions && upcomingSessions.length > 0 ? (
              <div className="space-y-4">
                {upcomingSessions.map((session: any) => (
                  <div 
                    key={session.id} 
                    className="flex items-center p-3 rounded-md border hover:bg-accent cursor-pointer"
                    onClick={() => navigate('/dashboard/schedule')}
                  >
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{session.title || 'Study Session'}</h4>
                      <p className="text-xs text-muted-foreground">
                        {session.date?.toDate ? 
                          session.date.toDate().toLocaleString() : 
                          new Date(session.date).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                      {session.duration || 60} min
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                <h4 className="font-medium mb-1">No upcoming sessions</h4>
                <p className="text-xs text-muted-foreground mb-4">Schedule your next study time</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/dashboard/schedule')}
                >
                  Create a session
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
