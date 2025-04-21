
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  orderBy
} from 'firebase/firestore';

interface MatchHistoryItem {
  id: string;
  groupId: string;
  groupName: string;
  matchScore: number;
  reasonsForMatch: string[];
  suggestedAt: Date;
  status: string;
}

export default function MatchHistory() {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState<MatchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMatchHistory = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        
        const suggestionsRef = collection(db, 'groupSuggestions');
        const suggestionsQuery = query(
          suggestionsRef,
          where('userId', '==', currentUser.uid),
          orderBy('suggestedAt', 'desc')
        );
        
        const suggestionsSnapshot = await getDocs(suggestionsQuery);
        const historyItems: MatchHistoryItem[] = [];
        
        for (const suggestionDoc of suggestionsSnapshot.docs) {
          const suggestionData = suggestionDoc.data();
          
          // Get group name
          const groupDoc = await getDoc(doc(db, 'studyGroups', suggestionData.groupId));
          const groupName = groupDoc.exists() ? groupDoc.data().name : 'Unknown Group';
          
          historyItems.push({
            id: suggestionDoc.id,
            groupId: suggestionData.groupId,
            groupName,
            matchScore: suggestionData.matchScore,
            reasonsForMatch: suggestionData.reasonsForMatch || [],
            suggestedAt: suggestionData.suggestedAt?.toDate() || new Date(),
            status: suggestionData.status || 'suggested'
          });
        }
        
        setHistory(historyItems);
      } catch (error) {
        console.error("Error loading match history:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMatchHistory();
  }, [currentUser]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-md"></div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-md">
        <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">No match history found.</p>
        <p className="text-gray-500 text-sm">Generate AI matches to see your history here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium">Your AI Match History</h3>
      
      <div className="space-y-3">
        {history.map(item => (
          <Card key={item.id} className="border-gray-200">
            <CardHeader className="py-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">{item.groupName}</CardTitle>
                <div className="flex gap-2 items-center">
                  <Badge 
                    variant="outline" 
                    className="flex items-center gap-1"
                  >
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                    <span>{Math.round(item.matchScore * 100)}%</span>
                  </Badge>
                  <Badge
                    variant={
                      item.status === 'joined' ? 'default' :
                      item.status === 'requested' ? 'secondary' :
                      item.status === 'rejected' ? 'destructive' : 'outline'
                    }
                  >
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardFooter className="py-2 text-xs text-gray-500 border-t">
              Suggested on {formatDate(item.suggestedAt)}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
