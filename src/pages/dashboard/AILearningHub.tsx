
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UserRound, Clock, Calendar, Mail, Brain, BookOpen, Book } from 'lucide-react';
import DynamicRoleAssignment from '@/components/ai-learning/DynamicRoleAssignment';
import SmartSessionBuilder from '@/components/ai-learning/SmartSessionBuilder';
import DailyDigest from '@/components/ai-learning/DailyDigest';
import FocusTimeline from '@/components/ai-learning/FocusTimeline';
import { FlashcardsAndQuizzes } from '@/components/ai-learning/FlashcardsAndQuizzes';
import { generateAIInsights } from '@/lib/ai';

export default function AILearningHub() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('roles');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      if (!currentUser) return;

      try {
        setLoading(true);
        
        // Fetch profile data
        const profileRef = doc(db, 'profiles', currentUser.uid);
        const profileSnap = await getDoc(profileRef);
        const profileData = profileSnap.exists() ? profileSnap.data() : null;
        
        // Fetch skills data
        const skillsRef = doc(db, 'skills', currentUser.uid);
        const skillsSnap = await getDoc(skillsRef);
        const skillsData = skillsSnap.exists() ? skillsSnap.data() : null;
        
        // Fetch goals data
        const goalsRef = doc(db, 'goals', currentUser.uid);
        const goalsSnap = await getDoc(goalsRef);
        const goalsData = goalsSnap.exists() ? goalsSnap.data() : null;

        // Fetch study sessions
        const sessionsRef = collection(db, 'studySessions');
        const sessionsQuery = query(sessionsRef, where('participants', 'array-contains', currentUser.uid));
        const sessionsSnap = await getDocs(sessionsQuery);
        const sessionsData = sessionsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate()
        }));
        
        // Fetch AI insights if they exist
        const insightsRef = doc(db, 'aiInsights', currentUser.uid);
        const insightsSnap = await getDoc(insightsRef);
        const insightsData = insightsSnap.exists() ? insightsSnap.data() : null;

        // Fetch group memberships
        const membershipsRef = collection(db, 'groupMemberships');
        const membershipQuery = query(membershipsRef, where('userId', '==', currentUser.uid));
        const membershipSnap = await getDocs(membershipQuery);
        const groups = membershipSnap.docs.map(doc => doc.data().groupId);

        // Fetch roles if they exist
        const rolesRef = doc(db, 'userRoles', currentUser.uid);
        const rolesSnap = await getDoc(rolesRef);
        const rolesData = rolesSnap.exists() ? rolesSnap.data() : null;

        // Get digest data if it exists
        const digestRef = doc(db, 'dailyDigests', currentUser.uid);
        const digestSnap = await getDoc(digestRef);
        const digestData = digestSnap.exists() ? digestSnap.data() : null;

        // Get focus timeline data if it exists
        const timelineRef = doc(db, 'focusTimelines', currentUser.uid);
        const timelineSnap = await getDoc(timelineRef);
        const timelineData = timelineSnap.exists() ? timelineSnap.data() : null;

        setUserData({
          profile: profileData,
          skills: skillsData,
          goals: goalsData,
          sessions: sessionsData,
          insights: insightsData,
          groups,
          roles: rolesData,
          digest: digestData,
          timeline: timelineData
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Error",
          description: "Failed to load your data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [currentUser, toast, refreshing]);

  const refreshData = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 100);
  };

  const handleGenerateInsights = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      toast({
        title: "Generating insights",
        description: "AI is analyzing your data to generate personalized insights...",
      });

      await generateAIInsights(currentUser.uid);
      
      toast({
        title: "Success",
        description: "Your personalized AI insights have been generated!",
      });
      
      refreshData();
    } catch (error: any) {
      console.error("Error generating insights:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !userData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your learning hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            AI Learning Hub
          </h2>
          <p className="text-gray-500 mt-1">
            Smart AI-powered tools to enhance your learning journey
          </p>
        </div>
        <Button
          onClick={handleGenerateInsights}
          disabled={loading}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          <Brain className="mr-2 h-4 w-4" />
          Generate New Insights
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <UserRound className="h-4 w-4" />
            <span>Dynamic Roles</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span>Smart Sessions</span>
          </TabsTrigger>
          <TabsTrigger value="digest" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>Daily Digest</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Focus Timeline</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <DynamicRoleAssignment userData={userData} refreshData={refreshData} />
        </TabsContent>

        <TabsContent value="sessions">
          <SmartSessionBuilder userData={userData} refreshData={refreshData} />
        </TabsContent>

        <TabsContent value="digest">
          <DailyDigest userData={userData} refreshData={refreshData} />
        </TabsContent>

        <TabsContent value="timeline">
          <FocusTimeline userData={userData} refreshData={refreshData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
