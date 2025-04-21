
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, RefreshCw, UserPlus, Users, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  getDoc 
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

interface SuggestedGroup {
  id?: string;
  groupId: string;
  groupName: string;
  matchScore: number;
  reasonsForMatch: string[];
  status?: string;
}

interface SuggestedGroupsProps {
  suggestions: SuggestedGroup[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function SuggestedGroups({ suggestions, onRefresh, isRefreshing }: SuggestedGroupsProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [requestingGroups, setRequestingGroups] = useState<Record<string, boolean>>({});

  const handleRequestToJoin = async (suggestion: SuggestedGroup) => {
    if (!currentUser) return;
    
    try {
      setRequestingGroups(prev => ({ ...prev, [suggestion.groupId]: true }));
      
      // Get user profile
      const profileRef = doc(db, 'profiles', currentUser.uid);
      const profileSnap = await getDoc(profileRef);
      const profileData = profileSnap.exists() ? profileSnap.data() : null;
      
      // Create a join request
      await addDoc(collection(db, 'groupJoinRequests'), {
        groupId: suggestion.groupId,
        userId: currentUser.uid,
        displayName: currentUser.displayName || profileData?.fullName || 'Anonymous User',
        email: currentUser.email,
        status: 'pending', // 'pending', 'accepted', 'rejected'
        message: `I was matched with your group through AI matching and would like to join.`,
        requestedAt: serverTimestamp(),
        matchScore: suggestion.matchScore,
        reasonsForMatch: suggestion.reasonsForMatch
      });
      
      // Update the suggestion status
      if (suggestion.id) {
        await updateDoc(doc(db, 'groupSuggestions', suggestion.id), {
          status: 'requested'
        });
      }
      
      toast({
        title: "Join Request Sent",
        description: `Your request to join ${suggestion.groupName} has been sent.`
      });
      
      // Update local state - this would be better with a local state update
      const updatedSuggestions = suggestions.map(s => 
        s.groupId === suggestion.groupId ? { ...s, status: 'requested' } : s
      );
      
    } catch (error) {
      console.error("Error sending join request:", error);
      toast({
        title: "Error Sending Request",
        description: "There was a problem sending your join request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRequestingGroups(prev => ({ ...prev, [suggestion.groupId]: false }));
    }
  };

  const viewGroupDetails = (groupId: string) => {
    navigate(`/dashboard/study-groups/${groupId}`);
  };

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No group suggestions available.</p>
        <Button onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Suggestions
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">AI-Suggested Study Groups</h3>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {suggestions.map((suggestion) => (
          <Card key={suggestion.groupId} className="border-indigo-100 overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-500" />
                  {suggestion.groupName}
                </CardTitle>
                <Badge 
                  variant="outline" 
                  className="bg-white flex items-center gap-1"
                >
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                  <span>{Math.round(suggestion.matchScore * 100)}% Match</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-indigo-500" />
                Why We Matched You:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-5 list-disc">
                {suggestion.reasonsForMatch.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="border-t pt-3 flex justify-between gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => viewGroupDetails(suggestion.groupId)}
              >
                View Group
              </Button>
              <Button 
                size="sm"
                disabled={requestingGroups[suggestion.groupId] || suggestion.status === 'requested'}
                onClick={() => handleRequestToJoin(suggestion)}
              >
                {requestingGroups[suggestion.groupId] ? (
                  <>Sending Request...</>
                ) : suggestion.status === 'requested' ? (
                  <>Request Sent</>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Request to Join
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
