
import { QuizPlatform } from '@/components/ai-learning/QuizPlatform';

export default function FlashcardsQuizzes() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        AI-Powered Quiz Platform
      </h1>
      <QuizPlatform />
    </div>
  );
}
