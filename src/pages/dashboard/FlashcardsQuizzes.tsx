
import { useState, useEffect } from 'react';
import { QuizPlatform } from '@/components/ai-learning/QuizPlatform';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Quiz } from '@/types/quiz';
import { QuizView } from '@/components/ai-learning/QuizView';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function FlashcardsQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('quiz-platform');
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser) {
      loadQuizzes();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const quizzesRef = collection(db, 'quizzes');
      const quizzesQuery = query(
        quizzesRef, 
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const quizzesSnap = await getDocs(quizzesQuery);
      const quizzesData = quizzesSnap.docs.map(doc => {
        const data = doc.data();
        // Ensure questions array exists and has the correct format
        const questions = Array.isArray(data.questions) 
          ? data.questions.map(q => ({
              ...q,
              options: Array.isArray(q.options) ? q.options : [],
            })) 
          : [];
          
        return {
          id: doc.id,
          ...data,
          questions,
          createdAt: data.createdAt?.toDate(),
        };
      }) as Quiz[];

      // Validate quiz data before setting state
      const validQuizzes = quizzesData.filter(quiz => 
        quiz && quiz.questions && Array.isArray(quiz.questions) && 
        quiz.questions.length > 0 && 
        quiz.questions.every(q => q && q.options && Array.isArray(q.options))
      );

      setQuizzes(validQuizzes);
      
      if (validQuizzes.length === 0 && quizzesData.length > 0) {
        // We had quizzes but they were invalid
        toast({
          title: 'Warning',
          description: 'Some quizzes had invalid data and were filtered out.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error loading quizzes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quizzes. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = (score: number, timeSpent: number, answers: any[]) => {
    // Set showResults to true to display quiz results after completion
    setShowResults(true);
    console.log('Quiz completed with score:', score);
    loadQuizzes(); // Refresh quizzes after completion
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        AI-Powered Quiz Platform
      </h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="quiz-platform">Quiz Platform</TabsTrigger>
          <TabsTrigger value="quick-quiz">Quick Quiz</TabsTrigger>
        </TabsList>
        
        <TabsContent value="quiz-platform">
          <QuizPlatform onQuizCreated={loadQuizzes} />
        </TabsContent>
        
        <TabsContent value="quick-quiz">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="space-y-4 p-6">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : quizzes.length > 0 ? (
                <QuizView
                  quiz={quizzes[0]}
                  onComplete={handleQuizComplete}
                  showResults={showResults}
                />
              ) : (
                <div className="text-center p-8">
                  <p className="text-gray-500">No quizzes available. Generate some from the Quiz Platform tab!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
