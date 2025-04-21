import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Calendar as CalendarIcon, UserPlus, Plus, BookText } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import StudySessionCard from '@/components/dashboard/StudySessionCard';
import WeeklyScheduleView from '@/components/dashboard/WeeklyScheduleView';
import CalendarSyncDialog from '@/components/dashboard/CalendarSyncDialog';
import CreateSessionDialog from '@/components/dashboard/CreateSessionDialog';
import StudyPlanList from '@/components/dashboard/StudyPlanList';
import { generateStudyPlan } from '@/lib/ai';

const db = getFirestore();

export interface StudySession {
  id: string;
  title: string;
  description: string;
  date: Date;
  startTime: string;
  endTime: string;
  participants: string[];
  topic: string;
  location: string;
  isAiGenerated?: boolean;
}

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showCalendarSync, setShowCalendarSync] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => auth.currentUser,
  });

  const { data: availabilityData } = useQuery({
    queryKey: ['availability', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      const docRef = doc(db, 'availability', user.uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    },
    enabled: !!user?.uid,
  });

  const { data: studySessions, refetch: refetchSessions } = useQuery({
    queryKey: ['studySessions', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      const sessionsRef = collection(db, 'studySessions');
      const q = query(sessionsRef, where('participants', 'array-contains', user.uid));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate(),
        } as StudySession;
      });
    },
    enabled: !!user?.uid,
  });

  const upcomingSessions = studySessions?.filter(session => {
    const sessionDate = new Date(session.date);
    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(now.getDate() + 7);
    return sessionDate >= now && sessionDate <= sevenDaysLater;
  }).sort((a, b) => a.date.getTime() - b.date.getTime());

  const sessionsForSelectedDate = studySessions?.filter(session => {
    if (!selectedDate) return false;
    const sessionDate = new Date(session.date);
    return sessionDate.toDateString() === selectedDate.toDateString();
  }).sort((a, b) => {
    const aTime = a.startTime.split(':').map(Number);
    const bTime = b.startTime.split(':').map(Number);
    if (aTime[0] !== bTime[0]) return aTime[0] - bTime[0];
    return aTime[1] - bTime[1];
  });

  const hasAvailability = availabilityData?.timeSlots?.some(slot => slot.selected);

  const handleGenerateStudyPlan = async () => {
    if (!user?.uid || !availabilityData?.timeSlots) {
      toast({
        title: "Cannot generate study plan",
        description: "Please set your availability first",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingPlan(true);
    try {
      await generateStudyPlan(user.uid, availabilityData.timeSlots);
      toast({
        title: "Study plan generated",
        description: "AI has created a personalized study plan based on your availability",
      });
      refetchSessions();
    } catch (error: any) {
      toast({
        title: "Error generating study plan",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Study Schedule
          </h2>
          <p className="text-gray-500 mt-1">
            Manage your study sessions and sync with your calendar
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowCalendarSync(true)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            Sync Calendar
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowCreateSession(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Session
          </Button>
          <Button 
            onClick={handleGenerateStudyPlan}
            disabled={isGeneratingPlan || !hasAvailability}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {isGeneratingPlan ? "Generating..." : "Generate AI Study Plan"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weekly">Weekly View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="study-plans">AI Study Plans</TabsTrigger>
        </TabsList>
        
        <TabsContent value="weekly" className="mt-4">
          <WeeklyScheduleView sessions={studySessions || []} onCreateSession={() => setShowCreateSession(true)} />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>
                  View and manage your study sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                  <div className="col-span-1 md:col-span-5">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <h3 className="font-medium mb-2">
                      {selectedDate ? selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'Select a date'}
                    </h3>
                    {sessionsForSelectedDate && sessionsForSelectedDate.length > 0 ? (
                      <div className="space-y-2">
                        {sessionsForSelectedDate.map(session => (
                          <div key={session.id} className="p-2 border rounded-md">
                            <div className="font-medium">{session.title}</div>
                            <div className="text-sm text-gray-500">
                              {session.startTime} - {session.endTime}
                            </div>
                            <div className="text-xs mt-1 text-gray-400">
                              {session.location} • {session.topic}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 text-center space-y-2">
                        <p className="text-sm text-gray-500">No sessions scheduled for this day</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => setShowCreateSession(true)}
                        >
                          <Plus className="mr-2 h-3 w-3" />
                          Add Session
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
                <CardDescription>Your next 7 days study sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingSessions && upcomingSessions.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingSessions.map(session => (
                      <StudySessionCard key={session.id} session={session} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                    <Clock className="h-10 w-10 text-gray-400" />
                    <div>
                      <h3 className="font-medium">No upcoming sessions</h3>
                      <p className="text-gray-500 text-sm mt-1">
                        Generate a study plan or create sessions manually
                      </p>
                    </div>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() => setShowCreateSession(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Session
                      </Button>
                      <Button
                        className="mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                        onClick={handleGenerateStudyPlan}
                        disabled={isGeneratingPlan || !hasAvailability}
                      >
                        Generate AI Plan
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="study-plans" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>AI Generated Study Plans</CardTitle>
                  <CardDescription>
                    Your personalized study sessions created by AI
                  </CardDescription>
                </div>
                <Button
                  onClick={handleGenerateStudyPlan}
                  disabled={isGeneratingPlan || !hasAvailability}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <BookText className="mr-2 h-4 w-4" />
                  {isGeneratingPlan ? "Generating..." : "Generate New Plan"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <StudyPlanList sessions={studySessions || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showCalendarSync && (
        <CalendarSyncDialog open={showCalendarSync} onOpenChange={setShowCalendarSync} />
      )}
      
      {showCreateSession && (
        <CreateSessionDialog 
          open={showCreateSession} 
          onOpenChange={setShowCreateSession} 
          onSessionCreated={refetchSessions}
        />
      )}
    </div>
  );
}
