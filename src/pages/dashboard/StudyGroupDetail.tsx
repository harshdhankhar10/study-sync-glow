
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Users, Book, MessageSquare, Sparkles } from 'lucide-react';
import { StudyGroup } from '@/types/studyGroups';

import GroupDashboard from '@/components/study-groups/GroupDashboard';
import GroupResources from '@/components/study-groups/GroupResources';
import GroupSummary from '@/components/study-groups/GroupSummary';
import GroupChat from '@/components/study-groups/GroupChat';

export default function StudyGroupDetail() {
  const { currentUser } = useAuth();
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [currentGroup, setCurrentGroup] = useState<StudyGroup | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    async function loadGroupData() {
      if (!currentUser || !groupId) {
        navigate('/dashboard/study-groups');
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch group details
        const groupDocRef = doc(db, 'studyGroups', groupId);
        const groupDoc = await getDoc(groupDocRef);
        
        if (!groupDoc.exists()) {
          toast({
            title: "Group not found",
            description: "The study group you're looking for doesn't exist or you don't have access to it.",
            variant: "destructive"
          });
          navigate('/dashboard/study-groups');
          return;
        }
        
        // Check if the user is a member of this group
        const membershipsRef = collection(db, 'groupMemberships');
        const membershipByUserIdQuery = query(
          membershipsRef,
          where('groupId', '==', groupId),
          where('userId', '==', currentUser.uid)
        );
        
        const membershipByEmailQuery = query(
          membershipsRef,
          where('groupId', '==', groupId),
          where('email', '==', currentUser.email)
        );
        
        const [userIdMembership, emailMembership] = await Promise.all([
          getDocs(membershipByUserIdQuery),
          getDocs(membershipByEmailQuery)
        ]);
        
        if (userIdMembership.empty && emailMembership.empty) {
          // User doesn't have access to this group
          toast({
            title: "Access denied",
            description: "You don't have access to this study group.",
            variant: "destructive"
          });
          navigate('/dashboard/study-groups');
          return;
        }
        
        const groupData = groupDoc.data();
        setCurrentGroup({
          id: groupDoc.id,
          name: groupData.name,
          description: groupData.description,
          subject: groupData.subject,
          purpose: groupData.purpose,
          createdAt: groupData.createdAt.toDate(),
          updatedAt: groupData.updatedAt?.toDate() || groupData.createdAt.toDate(),
          membersCount: groupData.membersCount || 0,
          ownerId: groupData.ownerId,
          isPublic: groupData.isPublic
        });
        
      } catch (error) {
        console.error("Error loading group data:", error);
        toast({
          title: "Failed to load group data",
          description: "There was an error loading the group information. Please try again.",
          variant: "destructive"
        });
        navigate('/dashboard/study-groups');
      } finally {
        setLoading(false);
      }
    }
    
    loadGroupData();
  }, [currentUser, groupId, navigate, toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Loading Study Group...
          </h2>
          <p className="text-gray-500 mt-1">
            Please wait while we fetch the study group details
          </p>
        </div>
        <div className="h-[400px] animate-pulse bg-gray-100 rounded-lg"></div>
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Study Group Not Found
          </h2>
          <p className="text-gray-500 mt-1">
            The study group you're looking for doesn't exist or you don't have access to it
          </p>
        </div>
        <Card className="border-indigo-100">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No Group Found</h3>
            <p className="text-muted-foreground mb-6 max-w-md text-center">
              The study group you're looking for doesn't exist or you don't have access to it.
            </p>
            <button 
              onClick={() => navigate('/dashboard/study-groups')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Back to Study Groups
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {currentGroup.name}
        </h2>
        <p className="text-gray-500 mt-1">
          {currentGroup.subject || "Study Group"} • {currentGroup.membersCount} {currentGroup.membersCount === 1 ? 'member' : 'members'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{currentGroup.name}</CardTitle>
          <CardDescription>
            {currentGroup.subject && `${currentGroup.subject} • `}
            {currentGroup.membersCount} {currentGroup.membersCount === 1 ? 'member' : 'members'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex items-center gap-2">
                <Book className="h-4 w-4" />
                <span className="hidden sm:inline">Resources</span>
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">AI Summary</span>
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Group Chat</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
              <GroupDashboard groupId={currentGroup.id} />
            </TabsContent>
            
            <TabsContent value="resources">
              <GroupResources groupId={currentGroup.id} />
            </TabsContent>
            
            <TabsContent value="summary">
              <GroupSummary groupId={currentGroup.id} />
            </TabsContent>
            
            <TabsContent value="chat">
              <GroupChat 
                groupId={currentGroup.id} 
                groupName={currentGroup.name} 
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
