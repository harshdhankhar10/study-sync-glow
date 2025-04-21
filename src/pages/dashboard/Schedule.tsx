
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
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            Sync Calendar
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowCreateSession(true)}
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Session
          </Button>
          <Button 
            onClick={handleGenerateStudyPlan}
            disabled={isGeneratingPlan || !hasAvailability}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-sm hover:shadow transition-all"
          >
            <BookText className="mr-2 h-4 w-4" />
            {isGeneratingPlan ? "Generating..." : "Generate AI Study Plan"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100/80 dark:bg-gray-900/50 p-1 rounded-lg">
          <TabsTrigger value="weekly" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            Weekly View
          </TabsTrigger>
          <TabsTrigger value="calendar" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="study-plans" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            AI Study Plans
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="weekly" className="mt-4">
          <WeeklyScheduleView sessions={studySessions || []} onCreateSession={() => setShowCreateSession(true)} />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border border-gray-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Calendar</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
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
                    <h3 className="font-medium mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {selectedDate ? selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'Select a date'}
                    </h3>
                    {sessionsForSelectedDate && sessionsForSelectedDate.length > 0 ? (
                      <div className="space-y-2">
                        {sessionsForSelectedDate.map(session => (
                          <div key={session.id} className="p-3 border rounded-md border-gray-200 hover:border-indigo-200 hover:shadow-sm transition-all dark:border-gray-800 dark:hover:border-indigo-800/50">
                            <div className="font-medium text-gray-800 dark:text-gray-200">{session.title}</div>
                            <div className="flex items-center text-sm text-gray-500 gap-1 mt-1">
                              <Clock className="h-3.5 w-3.5 text-indigo-500" />
                              <span>{session.startTime} - {session.endTime}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant="outline" className="text-xs bg-gray-50">{session.location}</Badge>
                              {session.isAiGenerated && (
                                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">AI</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center space-y-3 bg-gray-50 dark:bg-gray-900/30 rounded-md">
                        <CalendarIcon className="h-10 w-10 text-gray-400" />
                        <p className="text-sm text-gray-500">No sessions scheduled for this day</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 border-indigo-200 hover:border-indigo-300"
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

            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Upcoming Sessions</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Your next 7 days study sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingSessions && upcomingSessions.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingSessions.map(session => (
                      <StudySessionCard key={session.id} session={session} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 bg-gray-50 dark:bg-gray-900/30 rounded-md">
                    <Clock className="h-10 w-10 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-gray-700 dark:text-gray-300">No upcoming sessions</h3>
                      <p className="text-gray-500 text-sm mt-1">
                        Generate a study plan or create sessions manually
                      </p>
                    </div>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        className="mt-2 border-indigo-200 hover:border-indigo-300"
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
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">AI Generated Study Plans</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Your personalized study sessions created by AI
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <StudyPlanList 
                sessions={studySessions || []} 
                onGeneratePlan={handleGenerateStudyPlan}
                isGenerating={isGeneratingPlan}
                hasAvailability={!!hasAvailability}
              />
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
