
import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Quiz, QuizAnswer } from '@/types/quiz';
import { CheckCircle2, XCircle, BarChart2, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

interface QuizViewProps {
  quiz: Quiz;
  onComplete: (score: number, timeSpent: number, answers: QuizAnswer[]) => void;
  showResults?: boolean;
}

export function QuizView({ quiz, onComplete, showResults: externalShowResults }: QuizViewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [startTime] = useState(Date.now());
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  const [quizScore, setQuizScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (externalShowResults !== undefined) {
      setShowResults(externalShowResults);
    }
  }, [externalShowResults]);

  // Early return if quiz or quiz.questions is undefined or empty
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">No quiz questions available.</p>
      </Card>
    );
  }

  // Ensure we have a valid currentQuestion
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  const handleSelectAnswer = (answer: string) => {
    if (!currentQuestion) return; // Safety check
    
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  };

  const handleNext = async () => {
    if (!currentQuestion) return; // Safety check
    
    if (isLastQuestion) {
      setIsSubmitting(true);
      try {
        const timeSpent = (Date.now() - startTime) / 1000; // Convert to seconds
        
        // Create answers array with safety checks
        const answers: QuizAnswer[] = quiz.questions.map(question => {
          const selectedAnswer = selectedAnswers[question.id] || '';
          return {
            questionId: question.id,
            selectedAnswer,
            isCorrect: selectedAnswer === question.correctAnswer,
            timeSpent: timeSpent / quiz.questions.length // Average time per question
          };
        });

        const correctAnswers = answers.filter(a => a.isCorrect).length;
        const score = (correctAnswers / answers.length) * 100;
        
        setQuizScore(score);
        setQuizAnswers(answers);
        setShowResults(true);
        
        // Call the callback
        onComplete(score, timeSpent, answers);
      } catch (error) {
        console.error('Error completing quiz:', error);
        toast({
          title: 'Error',
          description: 'There was a problem saving your quiz results.',
          variant: 'destructive'
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const getStrengthsAndWeaknesses = () => {
    if (quizAnswers.length === 0 || !quiz.questions) return { strengths: [], weaknesses: [] };
    
    // Group questions by correct/incorrect
    const correct = quizAnswers.filter(a => a.isCorrect);
    const incorrect = quizAnswers.filter(a => !a.isCorrect);
    
    // Match answers with questions to get topics
    const strengths = correct.map(a => {
      const question = quiz.questions.find(q => q.id === a.questionId);
      return question?.question.substring(0, 30) + '...';
    }).filter(Boolean);
    
    const weaknesses = incorrect.map(a => {
      const question = quiz.questions.find(q => q.id === a.questionId);
      return question?.question.substring(0, 30) + '...';
    }).filter(Boolean);
    
    return {
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 3)
    };
  };

  if (showResults) {
    const { strengths, weaknesses } = getStrengthsAndWeaknesses();
    
    return (
      <Card className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold mb-4">Quiz Complete!</h3>
          <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full mb-6">
            <p className="text-xl font-bold">Your score: {quizScore.toFixed(1)}%</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-700 mb-2 flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Strengths
              </h4>
              {strengths.length > 0 ? (
                <ul className="text-left">
                  {strengths.map((item, i) => (
                    <li key={i} className="mb-1 text-sm">• {item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic">Keep practicing to develop strengths!</p>
              )}
            </div>
            
            <div className="border border-red-200 bg-red-50 rounded-lg p-4">
              <h4 className="font-semibold text-red-700 mb-2 flex items-center">
                <XCircle className="w-5 h-5 mr-2" />
                Areas to Improve
              </h4>
              {weaknesses.length > 0 ? (
                <ul className="text-left">
                  {weaknesses.map((item, i) => (
                    <li key={i} className="mb-1 text-sm">• {item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic">Great job! No significant weaknesses.</p>
              )}
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-semibold mb-2 flex items-center justify-center">
              <BarChart2 className="w-5 h-5 mr-2" />
              Question Analysis
            </h4>
            <div className="rounded-lg border p-4">
              <div className="space-y-4">
                {quiz.questions.map((question, index) => {
                  if (!question) return null; // Safety check
                  
                  const userAnswer = selectedAnswers[question.id];
                  const isCorrect = userAnswer === question.correctAnswer;
                  
                  return (
                    <div key={question.id} className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className="font-medium">Question {index + 1}</span>
                      </div>
                      <p className="mb-2">{question.question}</p>
                      <p className="text-sm">
                        Your answer: <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                          {userAnswer || "No answer provided"}
                        </span>
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-green-600">
                          Correct answer: {question.correctAnswer}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mt-2">{question.explanation}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Safety check to ensure current question exists
  if (!currentQuestion || !currentQuestion.options) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">Quiz question data is invalid.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Question {currentQuestionIndex + 1} of {quiz.questions.length}</h3>
          <span className="text-sm text-gray-500">{quiz.duration} min</span>
        </div>
        <p className="text-xl mb-6">{currentQuestion.question}</p>
        <div className="space-y-3">
          {Array.isArray(currentQuestion.options) && currentQuestion.options.map((option) => (
            <Button
              key={option}
              variant="outline"
              className={`w-full justify-start p-4 ${
                selectedAnswers[currentQuestion.id] === option
                  ? 'border-indigo-500 bg-indigo-50'
                  : ''
              }`}
              onClick={() => handleSelectAnswer(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      </div>
      <Button
        className="w-full"
        disabled={!selectedAnswers[currentQuestion.id] || isSubmitting}
        onClick={handleNext}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : isLastQuestion ? (
          'Finish Quiz'
        ) : (
          'Next Question'
        )}
      </Button>
    </Card>
  );
}
