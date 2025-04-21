
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateAIInsights } from '@/lib/ai';
import WeeklyFeedback from '@/components/ai-insights/WeeklyFeedback';
import SkillGapAnalysis from '@/components/ai-insights/SkillGapAnalysis';
import LearningTips from '@/components/ai-insights/LearningTips';
import { Lightbulb, BookOpen, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function AIInsights() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: insights, isLoading, error, refetch } = useQuery({
    queryKey: ['aiInsights', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser?.uid) return null;
      
      const insightsRef = doc(db, 'aiInsights', currentUser.uid);
      const insightsSnap = await getDoc(insightsRef);
      
      if (insightsSnap.exists()) {
        return insightsSnap.data();
      }
      
      return null;
    },
    enabled: !!currentUser?.uid,
  });

  const handleGenerateInsights = async () => {
    if (!currentUser) return;
    
    try {
      setIsGenerating(true);
      toast({
        title: "Generating AI insights",
        description: "This may take a moment as we analyze your data...",
      });
      
      await generateAIInsights(currentUser.uid);
      await refetch();
      
      toast({
        title: "AI insights generated",
        description: "Your personalized insights are now ready to view.",
      });
    } catch (error: any) {
      toast({
        title: "Error generating insights",
        description: error.message || "There was a problem generating your insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const hasInsights = insights && 
    insights.weeklyFeedback && 
    insights.skillGapAnalysis && 
    insights.learningTips;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            AI Insights
          </h2>
          <p className="text-gray-500 mt-1">
            Personalized learning feedback and suggestions powered by AI
          </p>
        </div>
        
        <Button 
          onClick={handleGenerateInsights} 
          disabled={isGenerating}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          <Lightbulb className="mr-2 h-4 w-4" />
          {insights ? "Refresh Insights" : "Generate Insights"}
        </Button>
      </div>

      {(isLoading || isGenerating) && (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-[250px] w-full rounded-lg" />
            <Skeleton className="h-[250px] w-full rounded-lg" />
          </div>
        </div>
      )}

      {error && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <p className="text-red-500">Error loading your insights. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isGenerating && !hasInsights && !error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10 space-y-4">
              <Lightbulb className="h-16 w-16 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-medium">No insights available yet</h3>
                <p className="text-muted-foreground mt-1 max-w-md mx-auto">
                  Generate your first AI insights to receive personalized feedback on your study habits
                  and learning progress.
                </p>
              </div>
              <Button
                onClick={handleGenerateInsights}
                className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                Generate My First Insights
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isGenerating && hasInsights && (
        <Tabs defaultValue="weekly" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
            <TabsTrigger value="weekly">Weekly Feedback</TabsTrigger>
            <TabsTrigger value="skills">Skill Gaps</TabsTrigger>
            <TabsTrigger value="tips">Learning Tips</TabsTrigger>
          </TabsList>
          
          <TabsContent value="weekly" className="space-y-4">
            <WeeklyFeedback feedback={insights?.weeklyFeedback} />
          </TabsContent>
          
          <TabsContent value="skills" className="space-y-4">
            <SkillGapAnalysis analysis={insights?.skillGapAnalysis} />
          </TabsContent>
          
          <TabsContent value="tips" className="space-y-4">
            <LearningTips tips={insights?.learningTips} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
