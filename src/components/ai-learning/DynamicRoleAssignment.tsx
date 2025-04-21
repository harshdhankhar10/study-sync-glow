
import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { GEMINI_API_KEY, GEMINI_ENDPOINT } from '@/lib/ai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { UserRound, Users, BookText, Clock, HelpCircle } from 'lucide-react';

interface DynamicRoleAssignmentProps {
  userData: any;
  refreshData: () => void;
}

// Role definitions with descriptions and icons
const roleDefinitions = {
  'Researcher': {
    description: 'Finds and shares high-quality resources and information',
    icon: BookText,
    color: 'bg-blue-50 text-blue-600 border-blue-200'
  },
  'Summarizer': {
    description: 'Condenses complex information into clear summaries',
    icon: BookText,
    color: 'bg-green-50 text-green-600 border-green-200'
  },
  'Question Asker': {
    description: 'Poses thoughtful questions to deepen understanding',
    icon: HelpCircle,
    color: 'bg-purple-50 text-purple-600 border-purple-200'
  },
  'Time Keeper': {
    description: 'Ensures discussions stay on track and productive',
    icon: Clock,
    color: 'bg-amber-50 text-amber-600 border-amber-200'
  },
  'Facilitator': {
    description: 'Guides discussions and ensures all voices are heard',
    icon: Users,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200'
  }
};

export default function DynamicRoleAssignment({ userData, refreshData }: DynamicRoleAssignmentProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'myRole' | 'groupRoles'>('myRole');

  const generateRoles = async () => {
    if (!currentUser || !userData) return;
    
    try {
      setLoading(true);
      toast({
        title: "Analyzing your learning style",
        description: "AI is determining your optimal learning role...",
      });
      
      // Prepare user data for AI analysis
      const userProfile = {
        skills: userData.skills?.skills || [],
        interests: userData.skills?.interests || [],
        goals: userData.goals?.goals || [],
        studyHabits: userData.profile?.studyHabits || {},
        strengths: userData.insights?.skillGapAnalysis?.map((s: any) => s.skillArea) || []
      };
      
      // Make API call to Gemini
      const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Analyze this learner's profile and assign the most suitable role for them in a study group.
                  
                  User Profile: ${JSON.stringify(userProfile)}
                  
                  Possible roles:
                  - Researcher: Finds and shares information, good for detail-oriented learners
                  - Summarizer: Condenses information, good for analytical thinkers
                  - Question Asker: Poses thoughtful questions, good for critical thinkers
                  - Time Keeper: Ensures discussions stay on track, good for organized learners
                  - Facilitator: Guides discussions, good for social learners
                  
                  For the assigned role, provide:
                  1. The role name (one of the roles above)
                  2. A personalized explanation of why this role fits them
                  3. 2-3 specific strengths they have for this role
                  4. 2-3 specific tips for excelling in this role
                  
                  Return the response as a valid JSON object:
                  {
                    "role": "Role name",
                    "explanation": "Personalized explanation",
                    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
                    "tips": ["Tip 1", "Tip 2", "Tip 3"]
                  }`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract the JSON from the text response
      let jsonText = data.candidates[0].content.parts[0].text;
      
      // Find JSON content (between curly braces)
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not parse AI response");
      }
      
      const roleData = JSON.parse(jsonMatch[0]);
      
      // Save to Firestore
      await setDoc(doc(db, 'userRoles', currentUser.uid), {
        ...roleData,
        assignedAt: new Date(),
        userId: currentUser.uid,
        lastUpdated: new Date()
      });
      
      toast({
        title: "Role assigned!",
        description: `You've been assigned the role of ${roleData.role}`,
      });
      
      refreshData();
    } catch (error: any) {
      console.error("Error generating roles:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign role. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const userRole = userData?.roles;
  const RoleIcon = userRole?.role ? roleDefinitions[userRole.role as keyof typeof roleDefinitions]?.icon || UserRound : UserRound;
  const roleColor = userRole?.role ? roleDefinitions[userRole.role as keyof typeof roleDefinitions]?.color || 'bg-gray-50 text-gray-600 border-gray-200' : 'bg-gray-50 text-gray-600 border-gray-200';

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'myRole' | 'groupRoles')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="myRole">My Role</TabsTrigger>
          <TabsTrigger value="groupRoles">Group Roles</TabsTrigger>
        </TabsList>
        
        <TabsContent value="myRole">
          {userRole ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <Badge className={`${roleColor} py-1 px-3`}>
                        <RoleIcon className="h-4 w-4 mr-1" />
                        <span>{userRole.role}</span>
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-2 text-base">
                      {roleDefinitions[userRole.role as keyof typeof roleDefinitions]?.description || "Your assigned learning role"}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={generateRoles}
                    disabled={loading}
                    className="border-indigo-200 text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50"
                  >
                    Reassign Role
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Why This Role Fits You</h3>
                  <p className="text-gray-600">{userRole.explanation}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Your Strengths</h3>
                  <ul className="space-y-2">
                    {userRole.strengths.map((strength: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center mt-0.5 mr-2">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-gray-600">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Tips for Excelling</h3>
                  <ul className="space-y-2">
                    {userRole.tips.map((tip: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mt-0.5 mr-2">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11h2v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                          </svg>
                        </div>
                        <span className="text-gray-600">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Discover Your Learning Role</CardTitle>
                <CardDescription>
                  Our AI will analyze your learning style, communication preferences, and strengths to assign you the perfect role for group study sessions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(roleDefinitions).map(([role, details]) => (
                    <div key={role} className="border rounded-lg p-4 bg-gray-50/50">
                      <div className="flex items-center gap-2 mb-2">
                        <details.icon className="h-5 w-5 text-indigo-600" />
                        <h3 className="font-medium">{role}</h3>
                      </div>
                      <p className="text-sm text-gray-600">{details.description}</p>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-center">
                  <Button 
                    onClick={generateRoles} 
                    disabled={loading}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    {loading ? "Analyzing..." : "Discover My Role"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="groupRoles">
          <Card>
            <CardHeader>
              <CardTitle>Group Roles Distribution</CardTitle>
              <CardDescription>
                See the roles assigned to members of your study groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userData?.groups && userData.groups.length > 0 ? (
                <div className="space-y-6">
                  <p className="text-sm text-gray-500">
                    Viewing roles for {userData.groups.length} study groups you're a member of
                  </p>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {/* This would ideally fetch and display the roles of other group members */}
                    <div className="border rounded-lg p-4">
                      <p className="text-center text-gray-500 py-4">
                        Connect with your study group members and invite them to discover their roles.
                      </p>
                      
                      <div className="flex justify-center mt-4">
                        <Button variant="outline">
                          <Users className="mr-2 h-4 w-4" />
                          Invite Group Members
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No study groups yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Join or create a study group to see role assignments
                  </p>
                  <div className="mt-6">
                    <Button>
                      Join a Study Group
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
