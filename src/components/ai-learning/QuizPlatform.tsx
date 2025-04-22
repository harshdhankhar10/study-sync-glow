import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { Quiz, QuizAnalytics, QuizAnswer } from '@/types/quiz';
import { generateQuiz, generateQuizAnalytics } from '@/lib/quiz-generator';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Clock, Target, Trophy, Loader2, BarChart2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QuizView } from './flashcards/QuizView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STUDY_TOPICS = [
  "Critical Thinking & Analysis",
  "Research Methodology",
  "Academic Writing",
  "Data Analysis",
  "Problem Solving",
  "Scientific Method",
  "Study Techniques",
  "Learning Strategies",
  "Time Management",
  "Project Planning"
];

export function QuizPlatform() {
  const [selectedTopic, setSelectedTopic] = useState(STUDY_TOPICS[0]);
  const [difficulty, setDifficulty] = useState<Quiz['difficulty']>('beginner');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [userContext, setUserContext] = useState<any>(null);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      loadUserContent();
      loadUserContext();
    }
  }, [currentUser]);

  const loadUserContent = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const quizzesRef = collection(db, 'quizzes');
      const quizzesQuery = query(quizzesRef, where('userId', '==', currentUser.uid));
      const quizzesSnap = await getDocs(quizzesQuery);
      const quizzesData = quizzesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Quiz[];

      setQuizzes(quizzesData);

      const attemptsRef = collection(db, 'quizAttempts');
      const attemptsQuery = query(attemptsRef, where('userId', '==', currentUser.uid));
      const attemptsSnap = await getDocs(attemptsQuery);
      const attemptsData = attemptsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startedAt: doc.data().startedAt?.toDate(),
        completedAt: doc.data().completedAt?.toDate(),
      }));

      const quizAnalytics = await generateQuizAnalytics(attemptsData);
      setAnalytics(quizAnalytics);
    } catch (error) {
      console.error('Error loading content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your quizzes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserContext = async () => {
    if (!currentUser) return;

    try {
      const [profileDoc, skillsDoc, goalsDoc] = await Promise.all([
        getDocs(query(collection(db, 'profiles'), where('userId', '==', currentUser.uid))),
        getDocs(query(collection(db, 'skills'), where('userId', '==', currentUser.uid))),
        getDocs(query(collection(db, 'goals'), where('userId', '==', currentUser.uid)))
      ]);

      setUserContext({
        major: profileDoc.docs[0]?.data()?.major,
        skills: skillsDoc.docs[0]?.data()?.skills || [],
        goals: goalsDoc.docs[0]?.data()?.goals || []
      });
    } catch (error) {
      console.error('Error loading user context:', error);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!currentUser || !userContext) return;

    try {
      setGenerating(true);
      toast({
        title: 'Generating quiz',
        description: `AI is creating a ${difficulty} level quiz about ${selectedTopic}...`,
      });

      const newQuiz = await generateQuiz(selectedTopic, difficulty, userContext);

      await setDoc(doc(collection(db, 'quizzes'), newQuiz.id), {
        ...newQuiz,
        userId: currentUser.uid,
      });

      toast({
        title: 'Success',
        description: 'New quiz has been generated!',
      });

      loadUserContent();
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate new quiz.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleQuizComplete = async (score: number, timeSpent: number, answers: QuizAnswer[]) => {
    if (!currentUser) return;

    try {
      const attemptData = {
        id: `attempt-${Date.now()}`,
        quizId: quizzes[0].id,
        userId: currentUser.uid,
        score,
        answers,
        startedAt: new Date(Date.now() - timeSpent * 1000),
        completedAt: new Date(),
        timeSpent,
      };

      await setDoc(doc(collection(db, 'quizAttempts'), attemptData.id), attemptData);

      toast({
        title: 'Quiz Complete!',
        description: `You scored ${score.toFixed(1)}% in ${Math.floor(timeSpent / 60)} minutes`,
      });

      loadUserContent();
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-medium">AI-Powered Quiz Platform</h3>
          <p className="text-sm text-gray-500">
            Test your knowledge with personalized AI-generated quizzes
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedTopic} onValueChange={setSelectedTopic}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select a topic" />
            </SelectTrigger>
            <SelectContent>
              {STUDY_TOPICS.map((topic) => (
                <SelectItem key={topic} value={topic}>
                  {topic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={difficulty} onValueChange={(value: Quiz['difficulty']) => setDifficulty(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleGenerateQuiz}
            disabled={generating}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Brain className="w-4 h-4 mr-2" />
            )}
            Generate Quiz
          </Button>
        </div>
      </div>

      {analytics && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-lg">Your Learning Analytics</CardTitle>
            <CardDescription>Track your progress and improvement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 text-blue-600">
                  <Target className="w-5 h-5" />
                  <span className="font-medium">Total Attempts</span>
                </div>
                <p className="text-2xl font-bold mt-2">{analytics.totalAttempts}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 text-green-600">
                  <Trophy className="w-5 h-5" />
                  <span className="font-medium">Average Score</span>
                </div>
                <p className="text-2xl font-bold mt-2">{analytics.averageScore.toFixed(1)}%</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 text-orange-600">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Avg Time</span>
                </div>
                <p className="text-2xl font-bold mt-2">{Math.floor(analytics.averageTimeSpent / 60)}m</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 text-purple-600">
                  <BarChart2 className="w-5 h-5" />
                  <span className="font-medium">Improvement</span>
                </div>
                <p className="text-2xl font-bold mt-2">{analytics.improvement.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Available Quizzes</CardTitle>
        </CardHeader>
        <CardContent>
          {quizzes.length > 0 ? (
            <QuizView
              quiz={quizzes[0]}
              onComplete={handleQuizComplete}
            />
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-500">No quizzes available. Generate one to get started!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
