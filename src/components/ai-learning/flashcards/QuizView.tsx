
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Quiz, QuizQuestion } from "@/types/flashcards";
import { CheckCircle2, XCircle } from "lucide-react";

interface QuizViewProps {
  quiz: Quiz;
  onComplete: (score: number) => void;
}

export function QuizView({ quiz, onComplete }: QuizViewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

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
      setShowResults(true);
      const score = calculateScore();
      onComplete(score);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    quiz.questions.forEach(question => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correct++;
      }
    });
    return (correct / quiz.questions.length) * 100;
  };

  if (showResults) {
    const score = calculateScore();
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
