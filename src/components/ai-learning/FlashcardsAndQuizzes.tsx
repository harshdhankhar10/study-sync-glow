
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FlashcardsDeck } from './flashcards/FlashcardsDeck';
import { QuizView } from './flashcards/QuizView';
import { Flashcard, Quiz } from '@/types/flashcards';
import { useToast } from '@/hooks/use-toast';
import { Brain, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';

export function FlashcardsAndQuizzes() {
  const [activeTab, setActiveTab] = useState('flashcards');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  useEffect(() => {
    loadUserContent();
  }, [currentUser]);

  const loadUserContent = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Load flashcards
      const flashcardsRef = collection(db, 'flashcards');
      const flashcardsQuery = query(flashcardsRef, where('userId', '==', currentUser.uid));
      const flashcardsSnap = await getDocs(flashcardsQuery);
      const flashcardsData = flashcardsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastReviewed: doc.data().lastReviewed?.toDate(),
        nextReview: doc.data().nextReview?.toDate(),
      })) as Flashcard[];

      // Load quizzes
      const quizzesRef = collection(db, 'quizzes');
      const quizzesQuery = query(quizzesRef, where('userId', '==', currentUser.uid));
      const quizzesSnap = await getDocs(quizzesQuery);
      const quizzesData = quizzesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Quiz[];

      setFlashcards(flashcardsData);
      setQuizzes(quizzesData);
    } catch (error) {
      console.error('Error loading content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your flashcards and quizzes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!currentUser) return;

    try {
      setGenerating(true);
      toast({
        title: 'Generating content',
        description: 'AI is creating personalized flashcards and quizzes...',
      });

      // Get user's study data for context
      const profileRef = doc(db, 'profiles', currentUser.uid);
      const skillsRef = doc(db, 'skills', currentUser.uid);
      const goalsRef = doc(db, 'goals', currentUser.uid);

      const [profileSnap, skillsSnap, goalsSnap] = await Promise.all([
        getDocs(query(collection(db, 'profiles'), where('userId', '==', currentUser.uid))),
        getDocs(query(collection(db, 'skills'), where('userId', '==', currentUser.uid))),
        getDocs(query(collection(db, 'goals'), where('userId', '==', currentUser.uid)))
      ]);

      // Generate content using AI
      // This would typically call your AI service
      // For now, let's add some sample data
      const newFlashcard: Flashcard = {
        id: `flashcard-${Date.now()}`,
        question: "What is spaced repetition?",
        answer: "A learning technique that involves reviewing information at gradually increasing intervals.",
        topic: "Study Methods",
        difficulty: "medium",
        timesReviewed: 0,
        lastReviewed: new Date(),
        nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      };

      await setDoc(doc(collection(db, 'flashcards'), newFlashcard.id), {
        ...newFlashcard,
        userId: currentUser.uid,
        createdAt: Timestamp.now(),
      });

      toast({
        title: 'Success',
        description: 'New flashcards and quizzes have been generated!',
      });

      // Reload content
      loadUserContent();
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate new content.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateFlashcardProgress = async (cardId: string, difficulty: Flashcard['difficulty']) => {
    if (!currentUser) return;

    try {
      const flashcard = flashcards.find(f => f.id === cardId);
      if (!flashcard) return;

      // Calculate next review date based on difficulty and spaced repetition algorithm
      const now = new Date();
      let daysToAdd = 1;
      switch (difficulty) {
        case 'easy':
          daysToAdd = flashcard.timesReviewed * 2 + 3;
          break;
        case 'medium':
          daysToAdd = flashcard.timesReviewed + 1;
          break;
        case 'hard':
          daysToAdd = 1;
          break;
      }

      const nextReview = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

      await setDoc(doc(db, 'flashcards', cardId), {
        ...flashcard,
        lastReviewed: now,
        nextReview,
        timesReviewed: flashcard.timesReviewed + 1,
        difficulty,
      }, { merge: true });

      loadUserContent();
    } catch (error) {
      console.error('Error updating flashcard:', error);
      toast({
        title: 'Error',
        description: 'Failed to update flashcard progress.',
        variant: 'destructive',
      });
    }
  };

  const handleQuizComplete = async (score: number) => {
    toast({
      title: 'Quiz Complete!',
      description: `You scored ${score.toFixed(1)}%`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Flashcards & Quizzes</h3>
          <p className="text-sm text-gray-500">
            Review your knowledge with AI-generated learning materials
          </p>
        </div>
        <Button
          onClick={handleGenerateContent}
          disabled={generating}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Brain className="w-4 h-4 mr-2" />
          )}
          Generate New Content
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
        </TabsList>

        <TabsContent value="flashcards" className="mt-6">
          {flashcards.length > 0 ? (
            <FlashcardsDeck
              flashcards={flashcards}
              onUpdateProgress={handleUpdateFlashcardProgress}
            />
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-500">No flashcards available. Generate some!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="quizzes" className="mt-6">
          {quizzes.length > 0 ? (
            <QuizView
              quiz={quizzes[0]}
              onComplete={handleQuizComplete}
            />
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-500">No quizzes available. Generate some!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
