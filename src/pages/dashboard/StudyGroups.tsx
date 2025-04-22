
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, Plus, Sparkles } from 'lucide-react';
import { StudyGroup } from '@/types/studyGroups';

import GroupsList from '@/components/study-groups/GroupsList';

export default function StudyGroups() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    purpose: '',
    isPublic: true
  });

  useEffect(() => {
    async function loadUserGroups() {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        const groupsRef = collection(db, 'studyGroups');
        const membershipsRef = collection(db, 'groupMemberships');
        
        // Query memberships based on both user ID and email
        const membershipQuery = query(
          membershipsRef,
          where('userId', '==', currentUser.uid)
        );
        
        const emailMembershipQuery = query(
          membershipsRef,
          where('email', '==', currentUser.email)
        );
        
        // Get results from both queries
        const [userIdResults, emailResults] = await Promise.all([
          getDocs(membershipQuery),
          getDocs(emailMembershipQuery)
        ]);
        
        // Combine results, ensuring no duplicates
        const groupIdsSet = new Set<string>();
        
        userIdResults.docs.forEach(doc => {
          groupIdsSet.add(doc.data().groupId);
        });
        
        emailResults.docs.forEach(doc => {
          groupIdsSet.add(doc.data().groupId);
        });
        
        const groupIds = Array.from(groupIdsSet);
        
        const fetchedGroups: StudyGroup[] = [];
        
        for (const gid of groupIds) {
          const groupDocRef = doc(db, 'studyGroups', gid);
          const groupDoc = await getDoc(groupDocRef);
          
          if (groupDoc.exists()) {
            const groupData = groupDoc.data();
            fetchedGroups.push({
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
          }
        }
        
        setMyGroups(fetchedGroups);
      } catch (error) {
        console.error("Error loading study groups:", error);
        toast({
          title: "Failed to load study groups",
          description: "There was an error loading your study groups. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadUserGroups();
  }, [currentUser, toast]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    try {
      if (!formData.name.trim()) {
        toast({
          title: "Group name required",
          description: "Please provide a name for your study group.",
          variant: "destructive"
        });
        return;
      }
      
      const newGroupRef = await addDoc(collection(db, 'studyGroups'), {
        name: formData.name,
        description: formData.description,
        subject: formData.subject,
        purpose: formData.purpose,
        ownerId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        membersCount: 1,
        isPublic: formData.isPublic
      });
      
      await addDoc(collection(db, 'groupMemberships'), {
        groupId: newGroupRef.id,
        userId: currentUser.uid,
        role: 'owner',
        displayName: currentUser.displayName || currentUser.email,
        email: currentUser.email,
        photoURL: currentUser.photoURL || null,
        joinedAt: serverTimestamp()
      });
      
      setFormData({
        name: '',
        description: '',
        subject: '',
        purpose: '',
        isPublic: true
      });
      setCreateDialogOpen(false);
      
      const newGroup: StudyGroup = {
        id: newGroupRef.id,
        name: formData.name,
        description: formData.description,
        subject: formData.subject,
        purpose: formData.purpose,
        ownerId: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        membersCount: 1,
        isPublic: formData.isPublic
      };
      
      setMyGroups(prev => [...prev, newGroup]);
      
      navigate(`/dashboard/study-groups/${newGroupRef.id}`);
      
      toast({
        title: "Study group created!",
        description: `Your study group "${formData.name}" has been created successfully.`
      });
    } catch (error) {
      console.error("Error creating study group:", error);
      toast({
        title: "Failed to create study group",
        description: "There was an error creating your study group. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSelectGroup = (group: StudyGroup) => {
    navigate(`/dashboard/study-groups/${group.id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          My Study Groups
        </h2>
        <p className="text-gray-500 mt-1">
          Collaborate with peers in AI-formed study groups
        </p>
      </div>

      <div className="flex justify-end mb-4 gap-2">
        <Button variant="outline" onClick={() => navigate('/dashboard/group-match')}>
          <Sparkles className="h-4 w-4 mr-2" />
          AI Group Matching
        </Button>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Study Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <form onSubmit={handleCreateGroup}>
              <DialogHeader>
                <DialogTitle>Create New Study Group</DialogTitle>
                <DialogDescription>
                  Fill out the form below to create a new study group. You'll be the owner and can invite others later.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Group name"
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="subject" className="text-right">
                    Subject
                  </Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="e.g. Mathematics, Computer Science"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="purpose" className="text-right">
                    Purpose
                  </Label>
                  <Input
                    id="purpose"
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    placeholder="e.g. Exam preparation, Research"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right pt-2">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your study group's goals, activities, etc."
                    className="col-span-3"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isPublic" className="text-right">
                    Visibility
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      name="isPublic"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <Label htmlFor="isPublic" className="font-normal">
                      Make this group visible in public listings
                    </Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Group</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Groups</span>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GroupsList 
              groups={myGroups} 
              onSelectGroup={handleSelectGroup}
              loading={loading}
            />
          </CardContent>
        </Card>

        <div className="md:col-span-3">
          <Card className="h-full flex flex-col items-center justify-center p-8 text-center bg-muted/50">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Select a Study Group</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {myGroups.length > 0 
                ? "Select a group from the list to view details and interact with your study partners."
                : "You haven't joined any study groups yet. Create your first group to get started with collaborative learning."}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Study Group
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
