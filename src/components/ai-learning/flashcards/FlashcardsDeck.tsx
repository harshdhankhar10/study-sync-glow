
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flashcard } from "@/types/flashcards";
import { ArrowLeft, ArrowRight, Rotate3D } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FlashcardsDeckProps {
  flashcards: Flashcard[];
  onUpdateProgress: (cardId: string, difficulty: Flashcard['difficulty']) => void;
}

export function FlashcardsDeck({ flashcards, onUpdateProgress }: FlashcardsDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  if (!flashcards.length) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No flashcards available.</p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleDifficultyRating = (difficulty: Flashcard['difficulty']) => {
    onUpdateProgress(currentCard.id, difficulty);
    handleNext();
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="relative w-full max-w-xl aspect-[4/3]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id + (isFlipped ? 'flipped' : 'front')}
            initial={{ rotateY: isFlipped ? -180 : 0, opacity: 0 }}
            animate={{ rotateY: isFlipped ? 180 : 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <Card className="w-full h-full p-8 flex flex-col items-center justify-center text-center cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
                  onClick={() => setIsFlipped(!isFlipped)}>
              <Rotate3D className="absolute top-4 right-4 w-5 h-5 text-gray-400" />
              <p className="text-xl font-medium">
                {isFlipped ? currentCard.answer : currentCard.question}
              </p>
              <p className="mt-4 text-sm text-gray-500">Click to flip</p>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="text-red-500 hover:bg-red-50"
          onClick={() => handleDifficultyRating('hard')}
        >
          Hard
        </Button>
        <Button
          variant="outline"
          className="text-yellow-500 hover:bg-yellow-50"
          onClick={() => handleDifficultyRating('medium')}
        >
          Medium
        </Button>
        <Button
          variant="outline"
          className="text-green-500 hover:bg-green-50"
          onClick={() => handleDifficultyRating('easy')}
        >
          Easy
        </Button>
      </div>
    </div>
  );
}
