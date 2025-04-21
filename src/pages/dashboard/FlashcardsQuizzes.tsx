
import { FlashcardsAndQuizzes } from '@/components/ai-learning/FlashcardsAndQuizzes';

export default function FlashcardsQuizzes() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        AI-Powered Flashcards & Quizzes
      </h1>
      <FlashcardsAndQuizzes />
    </div>
  );
}
