
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BookCheck, Clock, Target, Brain } from 'lucide-react';

interface StatisticsData {
  dailyScores: { date: string; score: number }[];
  topicBreakdown: { name: string; value: number }[];
  totalQuizzes: number;
  averageScore: number;
  totalStudyTime: number;
  strongestTopic: string;
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

const COLORS = ['#4F46E5', '#7C3AED', '#2563EB', '#EC4899', '#8B5CF6'];

export function StudyStatistics() {
  const { currentUser } = useAuth();
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatistics = async () => {
      if (!currentUser) return;

      try {
        const attemptsRef = collection(db, 'quizAttempts');
        const attemptsQuery = query(attemptsRef, where('userId', '==', currentUser.uid));
        const attemptsSnap = await getDocs(attemptsQuery);
        const attempts = attemptsSnap.docs.map(doc => {
          const data = doc.data() as QuizAttemptData;
          return {
            ...data,
            date: data.completedAt?.toDate() || new Date(),
          };
        });

        // Process data for charts
        const dailyScores = attempts.map(attempt => ({
          date: new Date(attempt.date).toLocaleDateString(),
          score: attempt.score,
        }));

        const topics = attempts.reduce((acc, attempt) => {
          const topic = attempt.topic || 'General';
          acc[topic] = (acc[topic] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const topicBreakdown = Object.entries(topics).map(([name, value]) => ({
          name,
          value,
        }));

        const averageScore = attempts.length > 0 
          ? attempts.reduce((acc, curr) => acc + curr.score, 0) / attempts.length
          : 0;
          
        const totalStudyTime = attempts.reduce((acc, curr) => acc + (curr.timeSpent || 0), 0);
        
        const strongestTopic = Object.entries(topics).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

        setStatistics({
          dailyScores,
          topicBreakdown,
          totalQuizzes: attempts.length,
          averageScore,
          totalStudyTime,
          strongestTopic,
        });
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [currentUser]);

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
        <p className="text-lg text-gray-500">No statistics available yet. Take some quizzes to see your progress!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Study Statistics</h2>
      
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
                <p className="text-2xl font-bold">{Math.round(statistics.totalStudyTime / 60)}m</p>
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
      </div>
    </div>
  );
}
