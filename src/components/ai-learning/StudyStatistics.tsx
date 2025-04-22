
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { BookCheck, Clock, Target, Brain, Calendar, TrendingUp, Zap, BarChart2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { GEMINI_API_KEY, GEMINI_ENDPOINT } from '@/lib/ai';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StatisticsData {
  dailyScores: { date: string; score: number }[];
  topicBreakdown: { name: string; value: number }[];
  totalQuizzes: number;
  averageScore: number;
  totalStudyTime: number;
  strongestTopic: string;
  studyWeekdayDistribution: { name: string; value: number }[];
  subjectPerformance: { name: string; score: number }[];
  recentActivity: { type: string; title: string; date: Date; score?: number }[];
  aiInsights: AIStudyInsight[];
  timeOfDayPerformance: { time: string; score: number; count: number }[];
  progressOverTime: { month: string; score: number; time: number }[];
}

// Define interface for quiz attempt data from Firestore
interface QuizAttemptData {
  userId: string;
  quizId: string;
  score: number;
  completedAt: {
    toDate: () => Date;
  };
  topic?: string;
  timeSpent?: number;
  date?: Date;
}

// Study session data from Firestore
interface StudySessionData {
  userId: string;
  title: string;
  description: string;
  date: {
    toDate: () => Date;
  };
  startTime: string;
  endTime: string;
  topic?: string;
  timeSpent?: number;
  completed?: boolean;
}

// Note data from Firestore
interface NoteData {
  userId: string;
  title: string;
  content: string;
  createdAt: {
    toDate: () => Date;
  };
  updatedAt: {
    toDate: () => Date;
  };
  tags?: string[];
  subject?: string;
}

// AI Insight interface
interface AIStudyInsight {
  type: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionItems?: string[];
}

const COLORS = ['#4F46E5', '#7C3AED', '#2563EB', '#EC4899', '#8B5CF6', '#0EA5E9', '#10B981', '#F59E0B'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_PERIODS = ['Morning (5-11)', 'Afternoon (12-16)', 'Evening (17-21)', 'Night (22-4)'];

export function StudyStatistics() {
  const { currentUser } = useAuth();
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  const getTimePeriod = (hours: number): string => {
    if (hours >= 5 && hours < 12) return 'Morning (5-11)';
    if (hours >= 12 && hours < 17) return 'Afternoon (12-16)';
    if (hours >= 17 && hours < 22) return 'Evening (17-21)';
    return 'Night (22-4)';
  };

  const generateAIInsights = async (studyData: any) => {
    setAiLoading(true);
    try {
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
                  text: `Generate study insights based on this data:
                  
                  Quiz Performance: ${JSON.stringify(studyData.dailyScores || [])}
                  Topic Breakdown: ${JSON.stringify(studyData.topicBreakdown || [])}
                  Total Quizzes: ${studyData.totalQuizzes || 0}
                  Average Score: ${studyData.averageScore || 0}
                  Total Study Time: ${studyData.totalStudyTime || 0} minutes
                  Strongest Topic: ${studyData.strongestTopic || 'None'}
                  Weekday Distribution: ${JSON.stringify(studyData.studyWeekdayDistribution || [])}
                  Subject Performance: ${JSON.stringify(studyData.subjectPerformance || [])}
                  Time of Day Performance: ${JSON.stringify(studyData.timeOfDayPerformance || [])}
                  
                  Provide 4-5 actionable insights about:
                  1. Performance patterns
                  2. Study habits
                  3. Focus areas for improvement
                  4. Optimal study times
                  5. Content mastery
                  
                  Return as JSON array in this format:
                  [
                    {
                      "type": "pattern|improvement|habit|time|strength",
                      "title": "Brief insight title",
                      "description": "1-2 sentence explanation",
                      "priority": "high|medium|low",
                      "actionItems": ["1-2 specific action items"]
                    }
                  ]`
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
        throw new Error('Failed to generate AI insights');
      }

      const data = await response.json();
      const jsonMatch = data.candidates[0].content.parts[0].text.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const aiInsights = JSON.parse(jsonMatch[0]);
        setStatistics(prev => prev ? { ...prev, aiInsights } : null);
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    const fetchStatistics = async () => {
      if (!currentUser) return;

      try {
        // Fetch quiz attempts
        const attemptsRef = collection(db, 'quizAttempts');
        const attemptsQuery = query(attemptsRef, where('userId', '==', currentUser.uid));
        const attemptsSnap = await getDocs(attemptsQuery);
        const attempts = attemptsSnap.docs.map(doc => {
          const data = doc.data() as QuizAttemptData;
          return {
            ...data,
            date: data.completedAt?.toDate() || new Date(),
            type: 'quiz'
          };
        });

        // Fetch study sessions
        const sessionsRef = collection(db, 'studySessions');
        const sessionsQuery = query(sessionsRef, where('participants', 'array-contains', currentUser.uid));
        const sessionsSnap = await getDocs(sessionsQuery);
        const sessions = sessionsSnap.docs.map(doc => {
          const data = doc.data() as StudySessionData;
          const sessionDate = data.date?.toDate() || new Date();
          
          // Calculate time spent in minutes from startTime and endTime
          let timeSpent = 0;
          if (data.startTime && data.endTime) {
            const [startHour, startMin] = data.startTime.split(':').map(Number);
            const [endHour, endMin] = data.endTime.split(':').map(Number);
            timeSpent = ((endHour * 60 + endMin) - (startHour * 60 + startMin));
            if (timeSpent < 0) timeSpent += 24 * 60; // Handle overnight sessions
          }
          
          return {
            ...data,
            date: sessionDate,
            timeSpent: data.timeSpent || timeSpent || 0,
            type: 'session'
          };
        });

        // Fetch notes
        const notesRef = collection(db, 'notes');
        const notesQuery = query(notesRef, where('userId', '==', currentUser.uid));
        const notesSnap = await getDocs(notesQuery);
        const notes = notesSnap.docs.map(doc => {
          const data = doc.data() as NoteData;
          return {
            ...data,
            date: data.createdAt?.toDate() || new Date(),
            type: 'note'
          };
        });

        // Combine all activity for timeline
        const allActivity = [
          ...attempts.map(a => ({ 
            type: 'quiz', 
            title: a.topic || 'Quiz', 
            date: a.date, 
            score: a.score 
          })),
          ...sessions.map(s => ({ 
            type: 'session', 
            title: s.title || s.topic || 'Study Session', 
            date: s.date 
          })),
          ...notes.map(n => ({ 
            type: 'note', 
            title: n.title || 'Note', 
            date: n.date 
          }))
        ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

        // Process data for charts
        const dailyScores = attempts.map(attempt => ({
          date: new Date(attempt.date).toLocaleDateString(),
          score: attempt.score,
        }));

        // Topic breakdown
        const topics = attempts.reduce((acc, attempt) => {
          const topic = attempt.topic || 'General';
          acc[topic] = (acc[topic] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const topicBreakdown = Object.entries(topics).map(([name, value]) => ({
          name,
          value,
        }));

        // Weekday distribution
        const weekdayCount = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
        [...attempts, ...sessions].forEach(item => {
          const day = new Date(item.date).getDay();
          weekdayCount[day]++;
        });

        const studyWeekdayDistribution = weekdayCount.map((count, index) => ({
          name: WEEKDAYS[index],
          value: count
        }));

        // Subject performance
        const subjectScores: Record<string, { total: number, count: number }> = {};
        attempts.forEach(attempt => {
          const subject = attempt.topic || 'General';
          if (!subjectScores[subject]) {
            subjectScores[subject] = { total: 0, count: 0 };
          }
          subjectScores[subject].total += attempt.score;
          subjectScores[subject].count += 1;
        });

        const subjectPerformance = Object.entries(subjectScores).map(([name, data]) => ({
          name,
          score: data.count > 0 ? Math.round(data.total / data.count) : 0
        }));

        // Time of day performance
        const timePerformance: Record<string, { total: number, count: number }> = {};
        attempts.forEach(attempt => {
          const hours = new Date(attempt.date).getHours();
          const period = getTimePeriod(hours);
          
          if (!timePerformance[period]) {
            timePerformance[period] = { total: 0, count: 0 };
          }
          timePerformance[period].total += attempt.score;
          timePerformance[period].count += 1;
        });

        const timeOfDayPerformance = Object.entries(timePerformance).map(([time, data]) => ({
          time,
          score: data.count > 0 ? Math.round(data.total / data.count) : 0,
          count: data.count
        }));

        // Monthly progress
        const monthlyData: Record<string, { score: number, count: number, time: number }> = {};
        attempts.forEach(attempt => {
          const date = new Date(attempt.date);
          const month = `${date.getFullYear()}-${date.getMonth() + 1}`;
          
          if (!monthlyData[month]) {
            monthlyData[month] = { score: 0, count: 0, time: 0 };
          }
          monthlyData[month].score += attempt.score;
          monthlyData[month].count += 1;
          monthlyData[month].time += attempt.timeSpent || 0;
        });

        const progressOverTime = Object.entries(monthlyData)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([month, data]) => {
            const [year, monthNum] = month.split('-');
            const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'short' });
            return {
              month: `${monthName} ${year}`,
              score: data.count > 0 ? Math.round(data.score / data.count) : 0,
              time: Math.round(data.time / 60) // Convert to hours
            };
          });

        const totalStudyTime = [
          ...attempts.map(a => a.timeSpent || 0),
          ...sessions.map(s => s.timeSpent || 0)
        ].reduce((sum, time) => sum + time, 0);

        const strongestTopic = Object.entries(topics)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

        const averageScore = attempts.length > 0 
          ? attempts.reduce((acc, curr) => acc + curr.score, 0) / attempts.length
          : 0;

        // Create the statistics object
        const statsData: StatisticsData = {
          dailyScores,
          topicBreakdown,
          totalQuizzes: attempts.length,
          averageScore,
          totalStudyTime,
          strongestTopic,
          studyWeekdayDistribution,
          subjectPerformance,
          recentActivity: allActivity,
          aiInsights: [],
          timeOfDayPerformance,
          progressOverTime
        };

        setStatistics(statsData);
        
        // Generate AI insights after data is processed
        generateAIInsights(statsData);
      } catch (error) {
        console.error('Error fetching statistics:', error);
        toast({
          title: "Error",
          description: "Failed to load study statistics. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [currentUser]);

  const regenerateInsights = () => {
    if (statistics) {
      generateAIInsights(statistics);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-10">
        <p className="text-lg text-gray-500">Loading your statistics...</p>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="flex justify-center items-center p-10">
        <p className="text-lg text-gray-500">No statistics available yet. Take some quizzes or create study sessions to see your progress!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Study Statistics</h2>
        <Button 
          onClick={regenerateInsights} 
          variant="outline" 
          disabled={aiLoading}
          className="flex items-center gap-2"
        >
          <Zap className="h-4 w-4" />
          {aiLoading ? "Generating Insights..." : "Regenerate AI Insights"}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookCheck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Quizzes</p>
                <p className="text-2xl font-bold">{statistics.totalQuizzes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Score</p>
                <p className="text-2xl font-bold">{statistics.averageScore.toFixed(1)}%</p>
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
                <p className="text-sm text-gray-500">Study Time</p>
                <p className="text-2xl font-bold">{Math.round(statistics.totalStudyTime / 60)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Brain className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Strongest Topic</p>
                <p className="text-2xl font-bold truncate">{statistics.strongestTopic}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="patterns">Study Patterns</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Score Progress</CardTitle>
                <CardDescription>Your quiz scores over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={statistics.dailyScores}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Progress Over Time</CardTitle>
                <CardDescription>Monthly scores and study hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statistics.progressOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Bar yAxisId="left" dataKey="score" name="Avg Score" fill="#8884d8" />
                      <Bar yAxisId="right" dataKey="time" name="Hours" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="patterns" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Weekly Study Pattern</CardTitle>
                <CardDescription>Activity distribution by day of week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statistics.studyWeekdayDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" name="Activities" fill="#0EA5E9" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Time of Day Performance</CardTitle>
                <CardDescription>When you perform best</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statistics.timeOfDayPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="score" name="Avg Score" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="subjects" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Topic Distribution</CardTitle>
                <CardDescription>Quiz attempts by topic</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statistics.topicBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statistics.topicBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {statistics.topicBreakdown.map((topic, index) => (
                      <div key={topic.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-sm text-gray-600 truncate">{topic.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Subject Performance</CardTitle>
                <CardDescription>Average scores by subject</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={statistics.subjectPerformance}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#F59E0B" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-6">
          {aiLoading ? (
            <div className="flex justify-center items-center p-10">
              <p className="text-lg text-gray-500">Generating AI insights...</p>
            </div>
          ) : statistics.aiInsights && statistics.aiInsights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {statistics.aiInsights.map((insight, index) => (
                <Card key={index} className="col-span-1">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        insight.priority === 'high' ? 'bg-red-100 text-red-800' :
                        insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {insight.priority}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{insight.description}</p>
                    {insight.actionItems && insight.actionItems.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Action items:</p>
                        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                          {insight.actionItems.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center p-10">
              <p className="text-lg text-gray-500">No AI insights available yet. Click "Regenerate AI Insights" to analyze your study patterns.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your most recent study activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statistics.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                <div className={`p-2 rounded-full ${
                  activity.type === 'quiz' ? 'bg-blue-100' :
                  activity.type === 'session' ? 'bg-green-100' : 'bg-purple-100'
                }`}>
                  {activity.type === 'quiz' ? (
                    <BookCheck className="h-5 w-5 text-blue-600" />
                  ) : activity.type === 'session' ? (
                    <Calendar className="h-5 w-5 text-green-600" />
                  ) : (
                    <BarChart2 className="h-5 w-5 text-purple-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {activity.type === 'quiz' && activity.score !== undefined
                      ? `Quiz completed with score: ${activity.score}%`
                      : activity.type === 'session'
                      ? 'Study session'
                      : 'Note created'
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
