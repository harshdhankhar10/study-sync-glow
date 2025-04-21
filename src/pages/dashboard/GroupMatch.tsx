
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, UserPlus, Heart, Search, X, Star } from 'lucide-react';
import { generateGroupMatches } from '@/lib/ai';
import SuggestedGroups from '@/components/group-match/SuggestedGroups';
import JoinRequests from '@/components/group-match/JoinRequests';
import MatchHistory from '@/components/group-match/MatchHistory';
import { db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';

export default function GroupMatch() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('suggested');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedGroups, setSuggestedGroups] = useState([]);
  const [hasGeneratedSuggestions, setHasGeneratedSuggestions] = useState(false);

  useEffect(() => {
    // Check if there are existing suggestions
    const checkExistingSuggestions = async () => {
      if (!currentUser) return;
      
      try {
        const suggestionsRef = collection(db, 'groupSuggestions');
        const q = query(suggestionsRef, where('userId', '==', currentUser.uid));
        const suggestionsSnapshot = await getDocs(q);
        
        if (!suggestionsSnapshot.empty) {
          const suggestionsData = suggestionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setSuggestedGroups(suggestionsData);
          setHasGeneratedSuggestions(true);
        }
      } catch (error) {
        console.error("Error checking existing suggestions:", error);
      }
    };
    
    checkExistingSuggestions();
  }, [currentUser]);

  const handleGenerateMatches = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      
      // Get the current user's skills, interests, goals
      const skillsDoc = await getDoc(doc(db, 'skills', currentUser.uid));
      const goalsDoc = await getDoc(doc(db, 'goals', currentUser.uid));
      const profileDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
      
      const skillsData = skillsDoc.exists() ? skillsDoc.data() : null;
      const goalsData = goalsDoc.exists() ? goalsDoc.data() : null;
      const profileData = profileDoc.exists() ? profileDoc.data() : null;
      
      // Generate matches with AI
      const matches = await generateGroupMatches(
        currentUser.uid,
        skillsData,
        goalsData,
        profileData
      );
      
      // Store the suggestions in Firestore
      await Promise.all(matches.map(async (match) => {
        await addDoc(collection(db, 'groupSuggestions'), {
          userId: currentUser.uid,
          groupId: match.groupId,
          groupName: match.groupName,
          matchScore: match.matchScore,
          reasonsForMatch: match.reasonsForMatch,
          suggestedAt: serverTimestamp(),
          status: 'suggested' // 'suggested', 'requested', 'joined', 'rejected'
        });
      }));
      
      setSuggestedGroups(matches);
      setHasGeneratedSuggestions(true);
      
      toast({
        title: "AI Group Matching Complete",
        description: `Found ${matches.length} potential study groups for you based on your profile.`,
      });
    } catch (error) {
      console.error("Error generating matches:", error);
      toast({
        title: "Error Generating Matches",
        description: "There was a problem finding study groups. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          AI Group Matching
        </h2>
        <p className="text-gray-500 mt-1">
          Find the perfect study partners with our AI-powered matching system
        </p>
      </div>

      <Card className="border-indigo-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            Study Group Matchmaking
          </CardTitle>
          <CardDescription>
            Our AI analyzes your profile, skills, and learning goals to find compatible study groups
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasGeneratedSuggestions ? (
            <div className="text-center py-12 space-y-4">
              <Sparkles className="h-12 w-12 text-indigo-400 mx-auto" />
              <h3 className="text-lg font-medium">Ready to Find Your Study Match?</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Our AI will analyze your profile, skills, and learning goals to suggest the most compatible study groups for you.
              </p>
              <Button 
                onClick={handleGenerateMatches}
                disabled={isLoading}
                className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600"
              >
                {isLoading ? (
                  <>Generating Matches...</>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate AI Matches
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mt-2">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="suggested" className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  <span className="hidden sm:inline">Suggested</span>
                </TabsTrigger>
                <TabsTrigger value="requests" className="flex items-center gap-1">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Requests</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-1">
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">History</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="suggested">
                <SuggestedGroups 
                  suggestions={suggestedGroups} 
                  onRefresh={handleGenerateMatches} 
                  isRefreshing={isLoading}
                />
              </TabsContent>
              
              <TabsContent value="requests">
                <JoinRequests />
              </TabsContent>
              
              <TabsContent value="history">
                <MatchHistory />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
