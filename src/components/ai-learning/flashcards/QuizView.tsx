
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Quiz, QuizQuestion } from "@/types/flashcards";
import { CheckCircle2, XCircle, BarChart2 } from "lucide-react";

interface QuizViewProps {
  quiz: Quiz;
  onComplete: (score: number) => void;
}

export function QuizView({ quiz, onComplete }: QuizViewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  // Safe check to ensure quiz is valid
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No quiz questions available.</p>
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

  // Get strengths and weaknesses based on quiz results
  const getStrengthsAndWeaknesses = () => {
    if (!showResults) return { strengths: [], weaknesses: [] };
    
    const strengths = [];
    const weaknesses = [];
    
    for (const question of quiz.questions) {
      // Extract a shorter version of the question for display
      const shortQuestion = question.question.split(' ').slice(0, 3).join(' ') + '...';
      
      if (selectedAnswers[question.id] === question.correctAnswer) {
        strengths.push(shortQuestion);
      } else {
        weaknesses.push(shortQuestion);
      }
    }
    
    return {
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 3)
    };
  };

  if (showResults) {
    const score = calculateScore();
    const { strengths, weaknesses } = getStrengthsAndWeaknesses();
    
    return (
      <Card className="p-6 text-center">
        <h3 className="text-2xl font-bold mb-4">Quiz Complete!</h3>
        <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full mb-6">
          <p className="text-xl font-bold">Your score: {score.toFixed(1)}%</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border border-green-200 bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-700 mb-2 flex items-center justify-center">
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
            <h4 className="font-semibold text-red-700 mb-2 flex items-center justify-center">
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
        
        <div className="space-y-4">
          <h4 className="font-semibold mb-2 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 mr-2" />
            Question Analysis
          </h4>
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
                    {selectedAnswers[question.id] || "Not answered"}
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

  // Safe check to ensure current question exists and has options
  if (!currentQuestion || !currentQuestion.options) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">Quiz question data is invalid.</p>
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
          {currentQuestion.options && currentQuestion.options.map((option) => (
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
