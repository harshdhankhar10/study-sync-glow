
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChartContainer } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, ChevronRight, CheckCircle, BookOpen } from 'lucide-react';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

export default function PersonalProgress() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Fetch progress data
  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ['progressData', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      try {
        const progressRef = collection(db, 'progress');
        const progressQuery = query(
          progressRef,
          where('userId', '==', user.uid),
          orderBy('week', 'asc')
        );
        
        const querySnapshot = await getDocs(progressQuery);
        
        if (querySnapshot.empty) {
          // If no data exists, create initial data
          const initialData = [
            { week: 'Week 1', progress: 20, goal: 30 },
            { week: 'Week 2', progress: 35, goal: 35 },
            { week: 'Week 3', progress: 40, goal: 40 },
            { week: 'Week 4', progress: 55, goal: 45 },
            { week: 'Week 5', progress: 65, goal: 50 },
            { week: 'Week 6', progress: 75, goal: 55 },
            { week: 'Current', progress: 85, goal: 60 },
          ];
          
          // Store initial data in Firestore
          const batch = initialData.map(async (item) => {
            await addDoc(progressRef, {
              userId: user.uid,
              week: item.week,
              progress: item.progress,
              goal: item.goal,
              createdAt: serverTimestamp(),
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
        console.error("Error fetching progress data:", error);
        return [];
      }
    },
    enabled: !!user?.uid,
  });

  // Fetch skill data
  const { data: skillData, isLoading: skillLoading } = useQuery({
    queryKey: ['skillData', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      try {
        const skillRef = collection(db, 'skills');
        const skillQuery = query(
          skillRef,
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(skillQuery);
        
        if (querySnapshot.empty) {
          // If no data exists, create initial data
          const initialData = [
            { name: 'Math', value: 78 },
            { name: 'Science', value: 65 },
            { name: 'History', value: 82 },
            { name: 'Language', value: 90 },
            { name: 'Programming', value: 72 },
          ];
          
          // Store initial data in Firestore
          const batch = initialData.map(async (item) => {
            await addDoc(skillRef, {
              userId: user.uid,
              name: item.name,
              value: item.value,
              createdAt: serverTimestamp(),
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
        console.error("Error fetching skill data:", error);
        return [];
      }
    },
    enabled: !!user?.uid,
  });

  // Fetch completion rates
  const { data: completionRates, isLoading: completionLoading } = useQuery({
    queryKey: ['completionRates', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      try {
        const ratesRef = collection(db, 'completionRates');
        const ratesQuery = query(
          ratesRef,
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(ratesQuery);
        
        if (querySnapshot.empty) {
          // If no data exists, create initial data
          const initialData = [
            { subject: 'Task Completion', rate: 85 },
            { subject: 'Study Goals', rate: 72 },
            { subject: 'Note Taking', rate: 90 },
            { subject: 'Group Participation', rate: 68 },
          ];
          
          // Store initial data in Firestore
          const batch = initialData.map(async (item) => {
            await addDoc(ratesRef, {
              userId: user.uid,
              subject: item.subject,
              rate: item.rate,
              createdAt: serverTimestamp(),
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
        console.error("Error fetching completion rates:", error);
        return [];
      }
    },
    enabled: !!user?.uid,
  });

  // Fetch milestones
  const { data: milestones, isLoading: milestonesLoading } = useQuery({
    queryKey: ['milestones', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      try {
        const milestonesRef = collection(db, 'milestones');
        const milestonesQuery = query(
          milestonesRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const querySnapshot = await getDocs(milestonesQuery);
        
        if (querySnapshot.empty) {
          // If no data exists, create initial data
          const initialData = [
            { title: "Completed 10 study sessions", date: "2 days ago" },
            { title: "Achieved 85% on Math quiz", date: "1 week ago" },
            { title: "Contributed to 5 group discussions", date: "2 weeks ago" },
            { title: "Created 15 comprehensive notes", date: "3 weeks ago" },
            { title: "Reached 75% of quarterly goals", date: "1 month ago" },
          ];
          
          // Store initial data in Firestore
          const batch = initialData.map(async (item, index) => {
            const date = new Date();
            date.setDate(date.getDate() - (index * 7 + Math.floor(Math.random() * 3)));
            
            await addDoc(milestonesRef, {
              userId: user.uid,
              title: item.title,
              date: item.date,
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
        console.error("Error fetching milestones:", error);
        return [];
      }
    },
    enabled: !!user?.uid,
  });

  const generateProgressReport = () => {
    toast({
      title: "Report Generated",
      description: "Your progress report has been generated and is available for download.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Learning Progress Over Time</CardTitle>
            <CardDescription>
              Track your weekly learning progress against your goals
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {progressLoading ? (
              <div className="h-full flex items-center justify-center">
                <p>Loading progress data...</p>
              </div>
            ) : (
              <ChartContainer 
                config={{
                  progress: { theme: { light: "#8B5CF6", dark: "#8B5CF6" } },
                  goal: { theme: { light: "#D946EF", dark: "#D946EF" } },
                }}
              >
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="progress" 
                    stroke="var(--color-progress)" 
                    strokeWidth={2} 
                    dot={{ r: 4 }}
                    name="Your Progress"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="goal" 
                    stroke="var(--color-goal)" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    name="Target Goal"
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
            <CardDescription>
              Your current academic progress summary
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {completionLoading ? (
              <div className="h-full flex items-center justify-center">
                <p>Loading completion rates...</p>
              </div>
            ) : (
              completionRates?.map((item: any) => (
                <div key={item.id || item.subject} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{item.subject}</span>
                    <span className="text-sm font-medium">{item.rate}%</span>
                  </div>
                  <Progress value={item.rate} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              onClick={generateProgressReport}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Generate Progress Report
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Skill Proficiency</CardTitle>
            <CardDescription>
              Your proficiency levels across different subjects
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {skillLoading ? (
              <div className="h-full flex items-center justify-center">
                <p>Loading skill data...</p>
              </div>
            ) : (
              <ChartContainer 
                config={{
                  default: { theme: { light: "#8B5CF6", dark: "#8B5CF6" } },
                }}
              >
                <BarChart data={skillData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    fill="var(--color-default)" 
                    name="Proficiency %"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Milestones</CardTitle>
            <CardDescription>
              Your recently achieved learning milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            {milestonesLoading ? (
              <div className="h-full flex items-center justify-center">
                <p>Loading milestones...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {milestones?.map((milestone: any, index: number) => (
                  <div key={milestone.id || index} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium">{milestone.title}</h3>
                      <p className="text-gray-500 text-sm">{milestone.date}</p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
