
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Quiz, QuizAnswer } from '@/types/quiz';
import { CheckCircle2, XCircle } from "lucide-react";

interface QuizViewProps {
  quiz: Quiz;
  onComplete: (score: number, timeSpent: number, answers: QuizAnswer[]) => void;
}

export function QuizView({ quiz, onComplete }: QuizViewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [startTime] = useState(Date.now());

  // Early return if quiz or quiz.questions is undefined or empty
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">No quiz questions available.</p>
      </Card>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      const timeSpent = (Date.now() - startTime) / 1000; // Convert to seconds
      const answers: QuizAnswer[] = quiz.questions.map(question => ({
        questionId: question.id,
        selectedAnswer: selectedAnswers[question.id] || '',
        isCorrect: selectedAnswers[question.id] === question.correctAnswer,
        timeSpent: timeSpent / quiz.questions.length // Average time per question
      }));

      const score = (answers.filter(a => a.isCorrect).length / answers.length) * 100;
      setShowResults(true);
      onComplete(score, timeSpent, answers);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  if (showResults) {
    const score = (quiz.questions.filter(question => 
      selectedAnswers[question.id] === question.correctAnswer
    ).length / quiz.questions.length) * 100;

    return (
      <Card className="p-6 text-center">
        <h3 className="text-2xl font-bold mb-4">Quiz Complete!</h3>
        <p className="text-xl mb-4">Your score: {score.toFixed(1)}%</p>
        <div className="space-y-4">
          {quiz.questions.map((question, index) => {
            const isCorrect = selectedAnswers[question.id] === question.correctAnswer;
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
                    {selectedAnswers[question.id]}
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
          {currentQuestion.options.map((option) => (
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
        disabled={!selectedAnswers[currentQuestion.id]}
        onClick={handleNext}
      >
        {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
      </Button>
    </Card>
  );
}
