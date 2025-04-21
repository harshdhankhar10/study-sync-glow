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
import { collection, query, where, getDocs, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { generateFlashcardsForTopic, generateQuizForTopic } from '@/lib/flashcards-ai';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STUDY_TOPICS = [
  "Study Techniques & Time Management",
  "Research & Academic Writing",
  "Critical Thinking & Analysis",
  "Goal Setting & Academic Planning",
  "Exam Preparation Strategies",
  "Note-Taking Methods",
  "Memory & Retention Techniques",
  "Academic Productivity Tools",
  "Stress Management for Students",
  "Group Study Dynamics"
];

export function FlashcardsAndQuizzes() {
  const [activeTab, setActiveTab] = useState('flashcards');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(STUDY_TOPICS[0]);
  const [userContext, setUserContext] = useState<any>(null);
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

  const loadUserContext = async () => {
    if (!currentUser) return;

    try {
      const [profileDoc, skillsDoc, goalsDoc] = await Promise.all([
        getDoc(doc(db, 'profiles', currentUser.uid)),
        getDoc(doc(db, 'skills', currentUser.uid)),
        getDoc(doc(db, 'goals', currentUser.uid))
      ]);

      setUserContext({
        major: profileDoc.data()?.major,
        skills: skillsDoc.data()?.skills || [],
        goals: goalsDoc.data()?.goals || []
      });
    } catch (error) {
      console.error('Error loading user context:', error);
    }
  };

  const handleGenerateContent = async () => {
    if (!currentUser || !userContext) return;

    try {
      setGenerating(true);
      toast({
        title: 'Generating content',
        description: `AI is creating personalized content for ${selectedTopic}...`,
      });

      const [newFlashcards, newQuiz] = await Promise.all([
        generateFlashcardsForTopic(selectedTopic, userContext),
        generateQuizForTopic(selectedTopic, userContext)
      ]);

      // Save flashcards to Firebase
      await Promise.all(newFlashcards.map(flashcard =>
        setDoc(doc(collection(db, 'flashcards'), flashcard.id), {
          ...flashcard,
          userId: currentUser.uid,
          createdAt: Timestamp.now(),
        })
      ));

      // Save quiz to Firebase
      await setDoc(doc(collection(db, 'quizzes'), newQuiz.id), {
        ...newQuiz,
        userId: currentUser.uid,
        createdAt: Timestamp.now(),
      });

      toast({
        title: 'Success',
        description: 'New learning materials have been generated!',
      });

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-medium">Flashcards & Quizzes</h3>
          <p className="text-sm text-gray-500">
            Review your knowledge with AI-generated learning materials
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
            Generate Content
          </Button>
        </div>
      </div>

      <Tabs defaultValue="flashcards" className="w-full">
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
