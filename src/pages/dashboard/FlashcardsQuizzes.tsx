
import { useState, useEffect } from 'react';
import { QuizPlatform } from '@/components/ai-learning/QuizPlatform';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Quiz } from '@/types/quiz';
import { QuizView } from '@/components/ai-learning/QuizView';
import { Loader2 } from 'lucide-react';

export default function FlashcardsQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

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
      const quizzesQuery = query(quizzesRef, where('userId', '==', currentUser.uid));
      const quizzesSnap = await getDocs(quizzesQuery);
      const quizzesData = quizzesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Quiz[];

      setQuizzes(quizzesData);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = (score: number, timeSpent: number, answers: any[]) => {
    // We'll just log quiz completion in this page, but the QuizPlatform component
    // handles saving results to Firebase
    console.log('Quiz completed with score:', score);
    loadQuizzes(); // Refresh quizzes after completion
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        AI-Powered Quiz Platform
      </h1>
      
      <Tabs defaultValue="quiz-platform" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="quiz-platform">Quiz Platform</TabsTrigger>
          <TabsTrigger value="quick-quiz">Quick Quiz</TabsTrigger>
        </TabsList>
        
        <TabsContent value="quiz-platform">
          <QuizPlatform />
        </TabsContent>
        
        <TabsContent value="quick-quiz">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center items-center p-10">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : quizzes.length > 0 ? (
                <QuizView
                  quiz={quizzes[0]}
                  onComplete={handleQuizComplete}
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
