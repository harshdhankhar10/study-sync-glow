
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudyPlanInput, generateStudyPlan, getUserStudyPlans, StudyPlan } from '@/lib/studyPromptGenerator';
import { StudyPlanForm } from '@/components/study-generator/StudyPlanForm';
import { StudyPlansList } from '@/components/study-generator/StudyPlansList';
import { StudyPlanDetail } from '@/components/study-generator/StudyPlanDetail';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { CalendarDays, Book, BookOpen, Lightbulb, Clock } from 'lucide-react';

export default function StudyPromptGenerator() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('create');
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);
  const [isDetailView, setIsDetailView] = useState(false);

  // Fetch user's study plans
  useEffect(() => {
    if (currentUser) {
      loadPlans();
    }
  }, [currentUser]);

  const loadPlans = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const userPlans = await getUserStudyPlans(currentUser.uid);
      setPlans(userPlans);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load study plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (input: Omit<StudyPlanInput, 'userId'>) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to create a study plan",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const planInput: StudyPlanInput = {
        ...input,
        userId: currentUser.uid,
      };
      
      const plan = await generateStudyPlan(planInput);
      setPlans(prev => [plan, ...prev]);
      setSelectedPlan(plan);
      setIsDetailView(true);
      setActiveTab('plans');
      
      toast({
        title: "Success!",
        description: "Your personalized study plan has been created",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create study plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewPlan = (plan: StudyPlan) => {
    setSelectedPlan(plan);
    setIsDetailView(true);
  };

  const handleBackToList = () => {
    setIsDetailView(false);
    setSelectedPlan(null);
  };

  const planUpdated = (updatedPlan: StudyPlan) => {
    // Update the plan in the list
    setPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
    // Update the selected plan if it's the one being viewed
    if (selectedPlan?.id === updatedPlan.id) {
      setSelectedPlan(updatedPlan);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Study Prompt Generator</h1>
          <p className="text-muted-foreground">
            Create personalized study plans and track your progress with AI assistance
          </p>
        </div>

        {/* Features Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Lightbulb className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Smart</p>
                  <p className="text-lg font-semibold">AI Planning</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CalendarDays className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Personalized</p>
                  <p className="text-lg font-semibold">Day-by-Day</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Curated</p>
                  <p className="text-lg font-semibold">Resources</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Real-time</p>
                  <p className="text-lg font-semibold">Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="shadow-md">
          <CardHeader className="pb-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="create">Create New Plan</TabsTrigger>
                <TabsTrigger value="plans">
                  My Plans {plans.length > 0 && `(${plans.length})`}
                </TabsTrigger>
              </TabsList>
              <div className="pt-6">
                <TabsContent value="create" className="m-0">
                  <StudyPlanForm onSubmit={handleCreatePlan} isLoading={loading} />
                </TabsContent>
                
                <TabsContent value="plans" className="m-0">
                  {isDetailView && selectedPlan ? (
                    <StudyPlanDetail 
                      plan={selectedPlan} 
                      onBack={handleBackToList} 
                      onPlanUpdated={planUpdated}
                    />
                  ) : (
                    <StudyPlansList 
                      plans={plans} 
                      isLoading={loading} 
                      onViewPlan={handleViewPlan} 
                      onRefresh={loadPlans}
                    />
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Content is now rendered within TabsContent above */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
