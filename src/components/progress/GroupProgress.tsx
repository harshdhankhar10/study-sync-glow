
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChartContainer } from '@/components/ui/chart';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, Clock, Calendar, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { useQuery } from '@tanstack/react-query';

const COLORS = ['#8B5CF6', '#D946EF', '#F97316', '#0EA5E9'];

export default function GroupProgress() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Fetch group members
  const { data: groupMembers, isLoading: membersLoading } = useQuery({
    queryKey: ['groupMembers', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      try {
        const membersRef = collection(db, 'groupMembers');
        const membersQuery = query(
          membersRef,
          where('groupId', '==', 'default-group') // Assuming a default group
        );
        
        const querySnapshot = await getDocs(membersQuery);
        
        if (querySnapshot.empty) {
          // If no data exists, create initial data
          const initialData = [
            { id: 1, name: "Alex Johnson", avatar: "", contribution: 87, role: "Group Leader" },
            { id: 2, name: "Jamie Smith", avatar: "", contribution: 75, role: "Note Taker" },
            { id: 3, name: "Taylor Wilson", avatar: "", contribution: 92, role: "Research Lead" },
            { id: 4, name: "Morgan Lee", avatar: "", contribution: 68, role: "Discussion Coordinator" }
          ];
          
          // Store initial data in Firestore
          const batch = initialData.map(async (item) => {
            await addDoc(membersRef, {
              groupId: 'default-group',
              name: item.name,
              avatar: item.avatar,
              contribution: item.contribution,
              role: item.role,
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
        console.error("Error fetching group members:", error);
        return [];
      }
    },
    enabled: !!user?.uid,
  });

  // Fetch group progress
  const { data: groupProgress, isLoading: progressLoading } = useQuery({
    queryKey: ['groupProgress', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      try {
        const progressRef = collection(db, 'groupProgress');
        const progressQuery = query(
          progressRef,
          where('groupId', '==', 'default-group'),
          orderBy('monthIndex', 'asc')
        );
        
        const querySnapshot = await getDocs(progressQuery);
        
        if (querySnapshot.empty) {
          // If no data exists, create initial data
          const initialData = [
            { month: 'Jan', monthIndex: 0, groupAvg: 65, yourProgress: 60, classAvg: 55 },
            { month: 'Feb', monthIndex: 1, groupAvg: 68, yourProgress: 65, classAvg: 58 },
            { month: 'Mar', monthIndex: 2, groupAvg: 75, yourProgress: 72, classAvg: 62 },
            { month: 'Apr', monthIndex: 3, groupAvg: 80, yourProgress: 78, classAvg: 67 },
            { month: 'May', monthIndex: 4, groupAvg: 85, yourProgress: 82, classAvg: 70 },
            { month: 'Jun', monthIndex: 5, groupAvg: 90, yourProgress: 88, classAvg: 75 },
          ];
          
          // Store initial data in Firestore
          const batch = initialData.map(async (item) => {
            await addDoc(progressRef, {
              groupId: 'default-group',
              userId: user.uid,
              month: item.month,
              monthIndex: item.monthIndex,
              groupAvg: item.groupAvg,
              yourProgress: item.yourProgress,
              classAvg: item.classAvg,
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
        console.error("Error fetching group progress:", error);
        return [];
      }
    },
    enabled: !!user?.uid,
  });

  // Fetch collaboration data
  const { data: collaborationData, isLoading: collaborationLoading } = useQuery({
    queryKey: ['collaborationData', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      try {
        const collabRef = collection(db, 'collaboration');
        const collabQuery = query(
          collabRef,
          where('groupId', '==', 'default-group')
        );
        
        const querySnapshot = await getDocs(collabQuery);
        
        if (querySnapshot.empty) {
          // If no data exists, create initial data
          const initialData = [
            { name: 'Discussion Participation', value: 75 },
            { name: 'Task Completion', value: 82 },
            { name: 'Resource Sharing', value: 65 },
            { name: 'Meeting Attendance', value: 90 }
          ];
          
          // Store initial data in Firestore
          const batch = initialData.map(async (item) => {
            await addDoc(collabRef, {
              groupId: 'default-group',
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
        console.error("Error fetching collaboration data:", error);
        return [];
      }
    },
    enabled: !!user?.uid,
  });

  // Fetch upcoming meetings
  const { data: upcomingMeetings, isLoading: meetingsLoading } = useQuery({
    queryKey: ['upcomingMeetings', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      try {
        const meetingsRef = collection(db, 'meetings');
        const meetingsQuery = query(
          meetingsRef,
          where('groupId', '==', 'default-group'),
          where('date', '>=', new Date()),
          orderBy('date', 'asc'),
          limit(3)
        );
        
        const querySnapshot = await getDocs(meetingsQuery);
        
        if (querySnapshot.empty) {
          // If no data exists, create initial data
          const initialData = [
            { title: "Group Study: Advanced Calculus", date: "Tomorrow, 3:00 PM" },
            { title: "Project Planning Meeting", date: "Friday, 5:30 PM" },
            { title: "Exam Preparation Session", date: "Sunday, 10:00 AM" }
          ];
          
          // Store initial data in Firestore
          const batch = initialData.map(async (item, index) => {
            const meetingDate = new Date();
            meetingDate.setDate(meetingDate.getDate() + index + 1);
            
            await addDoc(meetingsRef, {
              groupId: 'default-group',
              title: item.title,
              date: meetingDate,
              displayDate: item.date,
              createdAt: serverTimestamp(),
            });
          });
          
          await Promise.all(batch);
          
          return initialData;
        }
        
        return querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            date: data.displayDate || data.date.toDate().toLocaleString(),
            ...data
          };
        });
      } catch (error) {
        console.error("Error fetching upcoming meetings:", error);
        return [];
      }
    },
    enabled: !!user?.uid,
  });

  const inviteNewMember = () => {
    toast({
      title: "Invitation Sent",
      description: "An invitation has been sent to join your study group.",
    });
  };

  const scheduleMeeting = () => {
    toast({
      title: "New Meeting",
      description: "Your new meeting has been scheduled successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Group Performance Comparison</CardTitle>
            <CardDescription>
              Compare your group's performance against class average and your personal progress
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {progressLoading ? (
              <div className="h-full flex items-center justify-center">
                <p>Loading group progress data...</p>
              </div>
            ) : (
              <ChartContainer 
                config={{
                  groupAvg: { theme: { light: "#8B5CF6", dark: "#8B5CF6" } },
                  yourProgress: { theme: { light: "#D946EF", dark: "#D946EF" } },
                  classAvg: { theme: { light: "#9F9EA1", dark: "#9F9EA1" } },
                }}
              >
                <LineChart data={groupProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="groupAvg" 
                    stroke="var(--color-groupAvg)" 
                    strokeWidth={2}
                    name="Group Average"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="yourProgress" 
                    stroke="var(--color-yourProgress)" 
                    strokeWidth={2}
                    name="Your Progress"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="classAvg" 
                    stroke="var(--color-classAvg)" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Class Average"
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Group Members</CardTitle>
            <CardDescription>
              Active members in your study group
            </CardDescription>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="h-full flex items-center justify-center">
                <p>Loading group members...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupMembers?.map((member: any) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <Avatar>
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">{member.name}</h3>
                      <p className="text-gray-500 text-sm">{member.role}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold">{member.contribution}%</span>
                      <p className="text-gray-500 text-xs">Contribution</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              variant="outline"
              onClick={inviteNewMember}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Invite New Member
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Collaboration Metrics</CardTitle>
            <CardDescription>
              Breakdown of your group's collaboration performance
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {collaborationLoading ? (
              <div className="h-full flex items-center justify-center">
                <p>Loading collaboration data...</p>
              </div>
            ) : (
              <ChartContainer config={{}}>
                <PieChart>
                  <Pie
                    data={collaborationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({name, percent}: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {collaborationData?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Group Meetings</CardTitle>
            <CardDescription>
              Schedule of your group's upcoming study sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {meetingsLoading ? (
              <div className="h-full flex items-center justify-center">
                <p>Loading meetings data...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingMeetings?.map((meeting: any, index: number) => (
                  <div key={meeting.id || index} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <Calendar className="h-5 w-5 text-indigo-500 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium">{meeting.title}</h3>
                      <p className="text-gray-500 text-sm">{meeting.date}</p>
                    </div>
                    <Button variant="outline" size="sm">Join</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              onClick={scheduleMeeting}
            >
              <Clock className="mr-2 h-4 w-4" />
              Schedule New Meeting
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
