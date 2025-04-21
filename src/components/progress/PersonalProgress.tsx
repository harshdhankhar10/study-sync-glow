
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChartContainer } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, ChevronRight, CheckCircle, BookOpen } from 'lucide-react';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

const mockProgressData = [
  { week: 'Week 1', progress: 20, goal: 30 },
  { week: 'Week 2', progress: 35, goal: 35 },
  { week: 'Week 3', progress: 40, goal: 40 },
  { week: 'Week 4', progress: 55, goal: 45 },
  { week: 'Week 5', progress: 65, goal: 50 },
  { week: 'Week 6', progress: 75, goal: 55 },
  { week: 'Current', progress: 85, goal: 60 },
];

const mockSkillData = [
  { name: 'Math', value: 78 },
  { name: 'Science', value: 65 },
  { name: 'History', value: 82 },
  { name: 'Language', value: 90 },
  { name: 'Programming', value: 72 },
];

const mockCompletionRates = [
  { subject: 'Task Completion', rate: 85 },
  { subject: 'Study Goals', rate: 72 },
  { subject: 'Note Taking', rate: 90 },
  { subject: 'Group Participation', rate: 68 },
];

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
            <ChartContainer 
              config={{
                progress: { theme: { light: "#8B5CF6", dark: "#8B5CF6" } },
                goal: { theme: { light: "#D946EF", dark: "#D946EF" } },
              }}
            >
              <LineChart data={mockProgressData}>
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
            {mockCompletionRates.map((item) => (
              <div key={item.subject} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{item.subject}</span>
                  <span className="text-sm font-medium">{item.rate}%</span>
                </div>
                <Progress value={item.rate} className="h-2" />
              </div>
            ))}
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
            <ChartContainer 
              config={{
                default: { theme: { light: "#8B5CF6", dark: "#8B5CF6" } },
              }}
            >
              <BarChart data={mockSkillData}>
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
            <div className="space-y-4">
              {[
                { title: "Completed 10 study sessions", date: "2 days ago" },
                { title: "Achieved 85% on Math quiz", date: "1 week ago" },
                { title: "Contributed to 5 group discussions", date: "2 weeks ago" },
                { title: "Created 15 comprehensive notes", date: "3 weeks ago" },
                { title: "Reached 75% of quarterly goals", date: "1 month ago" },
              ].map((milestone, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
