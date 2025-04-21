
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, UserMinus, Check, X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  serverTimestamp,
  orderBy,
  arrayUnion
} from 'firebase/firestore';

interface JoinRequest {
  id: string;
  groupId: string;
  groupName?: string;
  userId: string;
  displayName: string;
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: Date;
  message?: string;
}

export default function JoinRequests() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [sentRequests, setSentRequests] = useState<JoinRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('sent');

  useEffect(() => {
    const loadRequests = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        
        // Load sent requests
        const sentRequestsRef = collection(db, 'groupJoinRequests');
        const sentRequestsQuery = query(
          sentRequestsRef, 
          where('userId', '==', currentUser.uid),
          orderBy('requestedAt', 'desc')
        );
        
        const sentRequestsSnapshot = await getDocs(sentRequestsQuery);
        const sentRequestsData: JoinRequest[] = [];
        
        for (const requestDoc of sentRequestsSnapshot.docs) {
          const requestData = requestDoc.data();
          
          // Get group name
          const groupDoc = await getDoc(doc(db, 'studyGroups', requestData.groupId));
          const groupName = groupDoc.exists() ? groupDoc.data().name : 'Unknown Group';
          
          sentRequestsData.push({
            id: requestDoc.id,
            groupId: requestData.groupId,
            groupName,
            userId: requestData.userId,
            displayName: requestData.displayName,
            status: requestData.status,
            requestedAt: requestData.requestedAt?.toDate() || new Date(),
            message: requestData.message
          });
        }
        
        setSentRequests(sentRequestsData);
        
        // Load received requests - for groups the user owns
        const ownedGroupsRef = collection(db, 'studyGroups');
        const ownedGroupsQuery = query(ownedGroupsRef, where('ownerId', '==', currentUser.uid));
        const ownedGroupsSnapshot = await getDocs(ownedGroupsQuery);
        
        if (!ownedGroupsSnapshot.empty) {
          const groupIds = ownedGroupsSnapshot.docs.map(doc => doc.id);
          const groupNames = ownedGroupsSnapshot.docs.reduce((acc, doc) => {
            acc[doc.id] = doc.data().name;
            return acc;
          }, {} as Record<string, string>);
          
          const receivedRequestsPromises = groupIds.map(async (groupId) => {
            const requestsRef = collection(db, 'groupJoinRequests');
            const requestsQuery = query(
              requestsRef, 
              where('groupId', '==', groupId),
              where('status', '==', 'pending'),
              orderBy('requestedAt', 'desc')
            );
            
            return getDocs(requestsQuery);
          });
          
          const receivedRequestsSnapshots = await Promise.all(receivedRequestsPromises);
          const receivedRequestsData: JoinRequest[] = [];
          
          receivedRequestsSnapshots.forEach(snapshot => {
            snapshot.docs.forEach(requestDoc => {
              const requestData = requestDoc.data();
              
              receivedRequestsData.push({
                id: requestDoc.id,
                groupId: requestData.groupId,
                groupName: groupNames[requestData.groupId],
                userId: requestData.userId,
                displayName: requestData.displayName,
                status: requestData.status,
                requestedAt: requestData.requestedAt?.toDate() || new Date(),
                message: requestData.message
              });
            });
          });
          
          setReceivedRequests(receivedRequestsData);
        }
      } catch (error) {
        console.error("Error loading requests:", error);
        toast({
          title: "Error Loading Requests",
          description: "There was a problem loading your join requests.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRequests();
  }, [currentUser, toast]);

  const handleAcceptRequest = async (request: JoinRequest) => {
    if (!currentUser) return;
    
    try {
      setProcessingRequest(prev => ({ ...prev, [request.id]: true }));
      
      // Update the request status
      await updateDoc(doc(db, 'groupJoinRequests', request.id), {
        status: 'accepted',
        respondedAt: serverTimestamp(),
        respondedBy: currentUser.uid
      });
      
      // Add the user to the group members
      const membershipRef = collection(db, 'groupMemberships');
      await addDoc(membershipRef, {
        groupId: request.groupId,
        userId: request.userId,
        role: 'member',
        displayName: request.displayName,
        joinedAt: serverTimestamp()
      });
      
      // Update the group's member count
      const groupRef = doc(db, 'studyGroups', request.groupId);
      await updateDoc(groupRef, {
        membersCount: arrayUnion(1)
      });
      
      toast({
        title: "Request Accepted",
        description: `${request.displayName} has been added to ${request.groupName}.`
      });
      
      // Update local state
      setReceivedRequests(prev => 
        prev.filter(r => r.id !== request.id)
      );
    } catch (error) {
      console.error("Error accepting request:", error);
      toast({
        title: "Error Accepting Request",
        description: "There was a problem accepting the join request.",
        variant: "destructive"
      });
    } finally {
      setProcessingRequest(prev => ({ ...prev, [request.id]: false }));
    }
  };

  const handleRejectRequest = async (request: JoinRequest) => {
    if (!currentUser) return;
    
    try {
      setProcessingRequest(prev => ({ ...prev, [request.id]: true }));
      
      await updateDoc(doc(db, 'groupJoinRequests', request.id), {
        status: 'rejected',
        respondedAt: serverTimestamp(),
        respondedBy: currentUser.uid
      });
      
      toast({
        title: "Request Rejected",
        description: `Join request from ${request.displayName} has been rejected.`
      });
      
      // Update local state
      setReceivedRequests(prev => 
        prev.filter(r => r.id !== request.id)
      );
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast({
        title: "Error Rejecting Request",
        description: "There was a problem rejecting the join request.",
        variant: "destructive"
      });
    } finally {
      setProcessingRequest(prev => ({ ...prev, [request.id]: false }));
    }
  };

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
        {[1, 2].map(i => (
          <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-md"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="sent">
            Sent Requests ({sentRequests.length})
          </TabsTrigger>
          <TabsTrigger value="received">
            Received Requests ({receivedRequests.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="sent">
          {sentRequests.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-md">
              <UserPlus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">You haven't sent any join requests yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sentRequests.map(request => (
                <Card key={request.id} className="border-indigo-100">
                  <CardHeader className="py-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">{request.groupName}</CardTitle>
                      <Badge 
                        variant={
                          request.status === 'accepted' ? 'default' : 
                          request.status === 'rejected' ? 'destructive' : 'outline'
                        }
                      >
                        {request.status === 'pending' ? 'Pending' : 
                         request.status === 'accepted' ? 'Accepted' : 'Rejected'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardFooter className="py-2 text-sm text-gray-500 flex justify-between border-t">
                    <span>Requested on {formatDate(request.requestedAt)}</span>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="received">
          {receivedRequests.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-md">
              <UserMinus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">You don't have any pending join requests to review.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {receivedRequests.map(request => (
                <Card key={request.id} className="border-indigo-100">
                  <CardHeader className="py-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">
                        {request.displayName} → {request.groupName}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2">
                    {request.message && (
                      <p className="text-sm text-gray-600 italic">"{request.message}"</p>
                    )}
                  </CardContent>
                  <CardFooter className="py-3 border-t flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Requested on {formatDate(request.requestedAt)}
                    </span>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleRejectRequest(request)}
                        disabled={processingRequest[request.id]}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleAcceptRequest(request)}
                        disabled={processingRequest[request.id]}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
