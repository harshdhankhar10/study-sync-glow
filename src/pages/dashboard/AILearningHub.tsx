
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FocusTimeline from "@/components/ai-learning/FocusTimeline";
import { FlashcardsAndQuizzes } from "@/components/ai-learning/FlashcardsAndQuizzes";
import DailyDigest from "@/components/ai-learning/DailyDigest";
import { QuizPlatform } from "@/components/ai-learning/QuizPlatform";
import DynamicRoleAssignment from "@/components/ai-learning/DynamicRoleAssignment";
import { SmartSessionBuilder } from "@/components/ai-learning/SmartSessionBuilder";
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

export default function AILearningHub() {
  const [activeTab, setActiveTab] = useState('focus');
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  // Fetch user data for the components
  const fetchUserData = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      
      // Fetch the main user document
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      // Fetch additional data the AI components might need
      const timelineDoc = await getDoc(doc(db, 'focusTimelines', currentUser.uid));
      const digestDoc = await getDoc(doc(db, 'dailyDigests', currentUser.uid));
      const roleDoc = await getDoc(doc(db, 'userRoles', currentUser.uid));
      
      // Fetch recent study sessions
      const sessionsQuery = query(
        collection(db, 'studySessions'), 
        where('userId', '==', currentUser.uid)
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = sessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Combine all user data
      setUserData({
        ...userDoc.data(),
        timeline: timelineDoc.exists() ? timelineDoc.data() : null,
        digest: digestDoc.exists() ? digestDoc.data() : null,
        roles: roleDoc.exists() ? roleDoc.data() : null,
        sessions: sessions,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refresh data function to pass to components
  const refreshData = () => {
    fetchUserData();
  };
  
  // Load data on initial render
  useEffect(() => {
    fetchUserData();
  }, [currentUser]);

  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">AI Learning Hub</h1>
        <p className="text-muted-foreground">
          Advanced AI-powered tools to enhance your learning experience
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <Tabs defaultValue="focus" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
            <TabsTrigger value="focus">Focus Timeline</TabsTrigger>
            <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
            <TabsTrigger value="digest">Daily Digest</TabsTrigger>
            <TabsTrigger value="quiz">Quiz Maker</TabsTrigger>
            <TabsTrigger value="roles">Role Assignment</TabsTrigger>
            <TabsTrigger value="session">Session Builder</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="focus">
              <FocusTimeline userData={userData} refreshData={refreshData} />
            </TabsContent>
            
            <TabsContent value="flashcards">
              <FlashcardsAndQuizzes />
            </TabsContent>
            
            <TabsContent value="digest">
              <DailyDigest userData={userData} refreshData={refreshData} />
            </TabsContent>
            
            <TabsContent value="quiz">
              <QuizPlatform />
            </TabsContent>
            
            <TabsContent value="roles">
              <DynamicRoleAssignment userData={userData} refreshData={refreshData} />
            </TabsContent>
            
            <TabsContent value="session">
              <SmartSessionBuilder />
            </TabsContent>
          </div>
        </Tabs>
      )}
    </div>
  );
}
