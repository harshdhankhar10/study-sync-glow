
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PlusCircle, X } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const db = getFirestore();

interface SkillsData {
  skills: string[];
  interests: string[];
  subjects: string[];
}

const suggestedSkills = [
  'Math', 'Programming', 'Essay Writing', 'Research', 'Public Speaking',
  'Statistics', 'Chemistry', 'Biology', 'Physics', 'History',
  'Literature', 'Foreign Languages', 'Graphic Design', 'Data Analysis'
];

const suggestedInterests = [
  'AI & Machine Learning', 'Environmental Science', 'Creative Writing',
  'Quantum Physics', 'Ancient History', 'Web Development', 'Robotics',
  'Psychology', 'Philosophy', 'Art & Design', 'Music Theory', 'Economics'
];

const suggestedSubjects = [
  'Calculus', 'Computer Science', 'Organic Chemistry', 'World History',
  'English Literature', 'Microbiology', 'Economics', 'Psychology',
  'Physics', 'Political Science', 'Sociology', 'Spanish', 'French'
];

export default function Skills() {
  const [skillsData, setSkillsData] = useState<SkillsData>({
    skills: [],
    interests: [],
    subjects: []
  });
  const [newItem, setNewItem] = useState('');
  const [activeTab, setActiveTab] = useState('skills');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSkillsData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const docRef = doc(db, 'skills', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSkillsData(docSnap.data() as SkillsData);
        }
      } catch (error) {
        console.error('Error fetching skills data:', error);
      }
    };

    fetchSkillsData();
  }, []);

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    
    setSkillsData(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab as keyof SkillsData], newItem.trim()]
    }));
    setNewItem('');
  };

  const handleAddSuggestion = (item: string) => {
    const items = skillsData[activeTab as keyof SkillsData] as string[];
    if (!items.includes(item)) {
      setSkillsData(prev => ({
        ...prev,
        [activeTab]: [...prev[activeTab as keyof SkillsData], item]
      }));
    }
  };

  const handleRemoveItem = (item: string) => {
    setSkillsData(prev => ({
      ...prev,
      [activeTab]: (prev[activeTab as keyof SkillsData] as string[]).filter(i => i !== item)
    }));
  };

  const saveSkillsData = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');

      await setDoc(doc(db, 'skills', user.uid), {
        ...skillsData,
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: 'Skills & Interests saved',
        description: 'Your data has been updated successfully',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error saving data',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSuggestedItems = () => {
    switch (activeTab) {
      case 'skills':
        return suggestedSkills;
      case 'interests':
        return suggestedInterests;
      case 'subjects':
        return suggestedSubjects;
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Skills & Interests
        </h2>
        <p className="text-gray-500 mt-1">
          Tell us about your strengths and interests to help match you with the right study partners
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Skills & Interests</CardTitle>
          <CardDescription>
            Add skills you excel at, subjects you're studying, and academic interests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="skills" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="interests">Interests</TabsTrigger>
              <TabsTrigger value="subjects">Subjects</TabsTrigger>
            </TabsList>
            
            <TabsContent value="skills" className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {skillsData.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="pl-2 pr-1 py-1 text-sm flex items-center gap-1">
                    {skill}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 rounded-full hover:bg-gray-200" 
                      onClick={() => handleRemoveItem(skill)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="interests" className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {skillsData.interests.map((interest) => (
                  <Badge key={interest} variant="secondary" className="pl-2 pr-1 py-1 text-sm flex items-center gap-1">
                    {interest}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 rounded-full hover:bg-gray-200" 
                      onClick={() => handleRemoveItem(interest)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="subjects" className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {skillsData.subjects.map((subject) => (
                  <Badge key={subject} variant="secondary" className="pl-2 pr-1 py-1 text-sm flex items-center gap-1">
                    {subject}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 rounded-full hover:bg-gray-200" 
                      onClick={() => handleRemoveItem(subject)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </TabsContent>

            <div className="mt-6 flex gap-2">
              <Input
                placeholder={`Add a new ${activeTab.slice(0, -1)}...`}
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                className="flex-1"
              />
              <Button onClick={handleAddItem} className="flex gap-2 items-center">
                <PlusCircle className="h-4 w-4" />
                <span>Add</span>
              </Button>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Suggestions</h4>
              <div className="flex flex-wrap gap-2">
                {getSuggestedItems().map((item) => (
                  <Badge 
                    key={item} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleAddSuggestion(item)}
                  >
                    + {item}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <Button 
                onClick={saveSkillsData} 
                disabled={isLoading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
