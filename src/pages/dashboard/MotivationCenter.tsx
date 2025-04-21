
import React, { useEffect, useState } from 'react';
import { MotivationTracker } from '@/components/study-buddy/MotivationTracker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { getStreakData, StreakData } from '@/services/streakService';
import { generateAIInsights } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';
import { Flame, Brain, Trophy, Star, Book } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import MicroMentor from '@/components/study-buddy/MicroMentor';

interface AIInsights {
  weeklyFeedback: {
    summary: string;
    strengths: string[];
    improvements: string[];
    nextSteps: string[];
  };
  skillGapAnalysis: Array<{
    skillArea: string;
    currentLevel: number;
    targetLevel: number;
    gap: number;
    suggestions: string[];
  }>;
  learningTips: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    resourceLinks?: string[];
  }>;
}

export default function MotivationCenter() {
  const { currentUser } = useAuth();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [aiInsights, setAIInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [microMentorOpen, setMicroMentorOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.uid) return;

      try {
        setLoading(true);
        // Load streak data
        const streak = await getStreakData(currentUser.uid);
        setStreakData(streak);

        // Generate AI insights
        const insights = await generateAIInsights(currentUser.uid);
        setAIInsights(insights);
      } catch (error) {
        console.error("Error loading motivation data:", error);
        toast({
          title: "Error loading data",
          description: "Failed to load your motivation data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser?.uid, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Motivation Center
          </h2>
          <p className="text-gray-500 mt-1">
            Track your progress, celebrate achievements, and stay motivated with AI-powered insights
          </p>
        </div>
        <Button 
          onClick={() => setMicroMentorOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600"
        >
          <Brain className="h-4 w-4" />
          <span>MicroMentor</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Streak Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500">
                {streakData?.currentStreak || 0}
              </div>
              <p className="text-sm text-gray-500 mt-1">days in a row</p>
              <p className="text-xs text-gray-400 mt-2">
                Longest streak: {streakData?.longestStreak || 0} days
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights Summary Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-500" />
              AI Study Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {aiInsights?.weeklyFeedback.summary || "No insights available yet"}
            </p>
            {aiInsights?.weeklyFeedback.nextSteps && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500">Next Steps:</p>
                <ul className="text-xs text-gray-600 list-disc list-inside mt-1">
                  {aiInsights.weeklyFeedback.nextSteps.slice(0, 2).map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievements Overview Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {streakData?.rewards
                .filter(reward => reward.unlocked)
                .slice(0, 3)
                .map((reward, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm">{reward.name}</span>
                    {reward.unlockedAt && (
                      <span className="text-xs text-gray-500 ml-auto">
                        {format(reward.unlockedAt.toDate(), 'MMM d')}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Progress Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <MotivationTracker 
            userId={currentUser?.uid || ''} 
            enhancedView={true}
            lastActive={streakData?.lastStudyDate?.toDate()}
            milestones={streakData?.milestones.map(m => ({
              title: `${m.streakDays} Day Streak`,
              achieved: m.achieved,
              date: m.achievedAt?.toDate()
            }))}
          />
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {streakData?.rewards.map((reward, index) => (
              <Card key={index} className={!reward.unlocked ? "opacity-70" : ""}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
                      reward.unlocked ? 'bg-green-500/10' : 'bg-gray-200'
                    }`}>
                      <Trophy className={`h-6 w-6 ${
                        reward.unlocked ? 'text-green-500' : 'text-gray-400'
                      }`} />
                    </div>
                    <h3 className="mt-4 font-medium">{reward.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{reward.description}</p>
                    {reward.unlocked && reward.unlockedAt && (
                      <p className="text-xs text-green-600 mt-2">
                        Achieved on {format(reward.unlockedAt.toDate(), 'MMMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          {aiInsights && (
            <div className="space-y-6">
              {/* Weekly Feedback Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Learning Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm">Strengths</h4>
                      <ul className="mt-2 space-y-2">
                        {aiInsights.weeklyFeedback.strengths.map((strength, index) => (
                          <li key={index} className="text-sm text-gray-600 flex gap-2">
                            <span className="text-green-500">•</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Areas for Improvement</h4>
                      <ul className="mt-2 space-y-2">
                        {aiInsights.weeklyFeedback.improvements.map((improvement, index) => (
                          <li key={index} className="text-sm text-gray-600 flex gap-2">
                            <span className="text-orange-500">•</span>
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skill Gap Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Skill Development Opportunities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {aiInsights.skillGapAnalysis.map((skill, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-sm">{skill.skillArea}</h4>
                          <span className="text-xs text-gray-500">
                            Gap: {skill.gap} levels
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{
                              width: `${(skill.currentLevel / skill.targetLevel) * 100}%`
                            }}
                          />
                        </div>
                        <ul className="mt-2">
                          {skill.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex gap-2">
                              <span className="text-indigo-500">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Learning Tips */}
              <Card>
                <CardHeader>
                  <CardTitle>Personalized Learning Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {aiInsights.learningTips.map((tip, index) => (
                      <div key={index} className="p-4 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{tip.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            tip.priority === 'high' 
                              ? 'bg-red-100 text-red-700'
                              : tip.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {tip.priority} priority
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{tip.description}</p>
                        {tip.resourceLinks && tip.resourceLinks.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-500">Resources:</p>
                            <ul className="mt-1 space-y-1">
                              {tip.resourceLinks.map((link, idx) => (
                                <li key={idx}>
                                  <a 
                                    href={link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-indigo-600 hover:text-indigo-800"
                                  >
                                    Resource {idx + 1}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* MicroMentor Modal */}
      <MicroMentor 
        isOpen={microMentorOpen} 
        onClose={() => setMicroMentorOpen(false)} 
        userId={currentUser?.uid || ''}
      />
    </div>
  );
}
