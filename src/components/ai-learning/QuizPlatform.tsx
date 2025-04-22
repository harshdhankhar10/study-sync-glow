
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, orderBy, limit } from 'firebase/firestore';
import { Quiz, QuizAnalytics, QuizAnswer, QuizAttempt } from '@/types/quiz';
import { generateQuiz, generateQuizAnalytics } from '@/lib/quiz-generator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, Clock, Target, Trophy, BarChart2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QuizView } from './QuizView';
import { QuizCreationDialog } from './QuizCreationDialog';
import { Skeleton } from '@/components/ui/skeleton';

interface QuizPlatformProps {
  onQuizCreated?: () => void;
}

export function QuizPlatform({ onQuizCreated }: QuizPlatformProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [userContext, setUserContext] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
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
      // Load latest quiz first
      const quizzesRef = collection(db, 'quizzes');
      const quizzesQuery = query(
        quizzesRef, 
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
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
        quizId: doc.data().quizId,
        userId: doc.data().userId,
        score: doc.data().score,
        answers: doc.data().answers,
        timeSpent: doc.data().timeSpent,
        startedAt: doc.data().startedAt?.toDate(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as QuizAttempt[];

      const quizAnalytics = await generateQuizAnalytics(attemptsData);
      setAnalytics(quizAnalytics);
      
      if (onQuizCreated) {
        onQuizCreated();
      }
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

  const handleCreateQuiz = async (topic: string, difficulty: Quiz['difficulty'], questionCount: number, timeLimit: number) => {
    if (!currentUser || !userContext) return;

    try {
      toast({
        title: 'Generating quiz',
        description: `AI is creating a ${difficulty} level quiz about ${topic}...`,
      });

      const newQuiz = await generateQuiz(topic, difficulty, {
        ...userContext,
        questionCount,
        timeLimit
      });

      const quizData = {
        ...newQuiz,
        userId: currentUser.uid,
        createdAt: new Date()
      };

      await setDoc(doc(collection(db, 'quizzes'), newQuiz.id), quizData);

      toast({
        title: 'Success',
        description: 'New quiz has been generated!',
      });

      await loadUserContent();
      setShowResults(false);
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate new quiz.',
        variant: 'destructive',
      });
    }
  };

  const handleQuizComplete = async (score: number, timeSpent: number, answers: QuizAnswer[]) => {
    if (!currentUser || !quizzes[0]) return;
    setShowResults(true);

    try {
      const attemptData: QuizAttempt = {
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
      <div className="space-y-6">
        <div className="flex justify-center items-center">
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-medium">AI-Powered Quiz Platform</h3>
          <p className="text-sm text-gray-500">
            Test your knowledge with personalized AI-generated quizzes
          </p>
        </div>
        <QuizCreationDialog onCreateQuiz={handleCreateQuiz} />
      </div>

      {analytics && analytics.totalAttempts > 0 && (
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
              showResults={showResults}
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
