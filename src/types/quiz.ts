
export interface Quiz {
  id: string;
  title: string;
  topic: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questions: QuizQuestion[];
  createdAt: Date;
  duration: number; // in minutes
  userId: string;
  attempts?: QuizAttempt[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  type: 'multiple-choice' | 'true-false';
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  answers: QuizAnswer[];
  startedAt: Date;
  completedAt: Date;
  timeSpent: number; // in seconds
}

export interface QuizAnswer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpent: number; // in seconds
}

export interface QuizAnalytics {
  totalAttempts: number;
  averageScore: number;
  averageTimeSpent: number;
  weakestTopics: string[];
  strongestTopics: string[];
  recommendedTopics: string[];
  improvement: number;
}
