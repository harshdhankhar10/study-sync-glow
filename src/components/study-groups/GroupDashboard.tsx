
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  serverTimestamp, 
  Timestamp,
  or,
  setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { BarChart, PersonStanding, UserPlus, Users } from 'lucide-react';
import { StudyGroupMember, StudyGroup } from '@/types/studyGroups';

interface GroupDashboardProps {
  groupId: string;
}

export default function GroupDashboard({ groupId }: GroupDashboardProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [members, setMembers] = useState<StudyGroupMember[]>([]);
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member' | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    async function loadGroupData() {
      if (!currentUser || !groupId) return;
      
      try {
        setLoading(true);
        
        // Fetch group details
        const groupDocRef = doc(db, 'studyGroups', groupId);
        const groupDoc = await getDoc(groupDocRef);
        
        if (!groupDoc.exists()) {
          toast({
            title: "Group not found",
            description: "The study group you're looking for doesn't exist.",
            variant: "destructive"
          });
          return;
        }
        
        const groupData = groupDoc.data();
        setGroup({
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
        
        // Fetch group members
        const membershipsRef = collection(db, 'groupMemberships');
        const membersQuery = query(
          membershipsRef,
          where('groupId', '==', groupId)
        );
        
        const membersSnapshot = await getDocs(membersQuery);
        const membersData = membersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            displayName: data.displayName,
            email: data.email,
            photoURL: data.photoURL,
            role: data.role,
            joinedAt: data.joinedAt.toDate()
          } as StudyGroupMember;
        });
        
        setMembers(membersData);
        
        // Determine current user's role in the group
        const userMembership = membersData.find(m => 
          m.email === currentUser.email || 
          (currentUser.uid && m.id === currentUser.uid)
        );
        
        if (userMembership) {
          setUserRole(userMembership.role);
        }
        
      } catch (error) {
        console.error("Error loading group data:", error);
        toast({
          title: "Failed to load group data",
          description: "There was an error loading the group information. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadGroupData();
  }, [currentUser, groupId, toast]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !groupId || !inviteEmail.trim()) return;
    
    try {
      // Simple email validation
      if (!/^\S+@\S+\.\S+$/.test(inviteEmail)) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid email address.",
          variant: "destructive"
        });
        return;
      }
      
      // Check if user is already a member
      const isAlreadyMember = members.some(m => m.email.toLowerCase() === inviteEmail.toLowerCase());
      if (isAlreadyMember) {
        toast({
          title: "User already a member",
          description: "This user is already a member of the group.",
          variant: "destructive"
        });
        return;
      }
      
      // Create a membership document with a unique ID (email-groupId)
      const membershipId = `${inviteEmail.toLowerCase()}-${groupId}`;
      await setDoc(doc(db, 'groupMemberships', membershipId), {
        groupId,
        email: inviteEmail.toLowerCase(),
        displayName: inviteEmail.split('@')[0], // Default display name from email
        role: 'member',
        joinedAt: serverTimestamp(),
        invitedBy: currentUser.uid,
        userId: null // This will be updated when the user joins
      });
      
      // Create an invitation notification
      await addDoc(collection(db, 'groupInvitations'), {
        groupId,
        groupName: group?.name,
        invitedEmail: inviteEmail.toLowerCase(),
        invitedBy: currentUser.uid,
        inviterName: currentUser.displayName || currentUser.email,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      // Update group members count
      const groupRef = doc(db, 'studyGroups', groupId);
      await updateDoc(groupRef, {
        membersCount: (group?.membersCount || 0) + 1
      });
      
      // Add the new member to local state
      const newMember: StudyGroupMember = {
        id: membershipId,
        displayName: inviteEmail.split('@')[0],
        email: inviteEmail.toLowerCase(),
        role: 'member',
        joinedAt: new Date()
      };
      
      setMembers(prev => [...prev, newMember]);
      
      // Update local group state
      setGroup(prev => prev ? {
        ...prev,
        membersCount: (prev.membersCount || 0) + 1
      } : null);
      
      // Reset form and close dialog
      setInviteEmail('');
      setInviteDialogOpen(false);
      
      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${inviteEmail}`,
      });
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Failed to send invitation",
        description: "There was an error sending the invitation. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-20 bg-gray-200 rounded animate-pulse mt-6"></div>
        <div className="h-40 bg-gray-200 rounded animate-pulse mt-6"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-10">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Group Not Found</h3>
        <p className="text-muted-foreground">
          The study group you're looking for doesn't exist or you don't have access to it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Group Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-baseline">
              <div className="text-2xl font-bold">{group.membersCount}</div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Activity Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-baseline">
              <div className="text-2xl font-bold">Medium</div>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </div>
            <Progress value={65} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Group Purpose</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-baseline">
              <div className="text-lg font-medium truncate">{group.purpose || "General Study"}</div>
              <PersonStanding className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Group Description */}
      {group.description && (
        <Card>
          <CardHeader>
            <CardTitle>About This Group</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-line">{group.description}</p>
          </CardContent>
        </Card>
      )}
      
      {/* Group Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Members</CardTitle>
          {(userRole === 'owner' || userRole === 'admin') && (
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleInvite}>
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Invite New Member
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">
                        Email address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Enter their email address"
                        className="col-span-3"
                        required
                      />
                      <p className="text-sm text-muted-foreground">
                        They'll receive an invitation to join {group?.name}
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
                      Send Invitation
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.photoURL || undefined} alt={member.displayName} />
                    <AvatarFallback>
                      {member.displayName ? member.displayName.substring(0, 2).toUpperCase() : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.displayName}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium capitalize px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {member.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
