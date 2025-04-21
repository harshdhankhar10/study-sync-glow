
import React, { useState, useEffect, useRef } from 'react';

interface AnimatedTypingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

export const AnimatedTypingText: React.FC<AnimatedTypingTextProps> = ({
  text,
  speed = 30,
  onComplete,
  className = "",
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Reset when text changes
    setDisplayedText("");
    setCurrentIndex(0);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text]);
  
  useEffect(() => {
    if (currentIndex < text.length) {
      timeoutRef.current = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
        
        // Random slight variation in typing speed for realism
        const variableSpeed = speed * (0.8 + Math.random() * 0.4);
        
        // Pause a bit longer at punctuation
        const char = text[currentIndex];
        if (['.', '!', '?', ',', ';', ':'].includes(char)) {
          timeoutRef.current = setTimeout(() => {
            setCurrentIndex(prev => prev + 1);
          }, variableSpeed * 5);
        }
      }, speed);
    } else if (onComplete) {
      onComplete();
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, text, speed, onComplete]);
  
  // Convert newlines to <br> elements
  const formattedText = displayedText.split('\n').map((line, i) => (
    <React.Fragment key={i}>
      {line}
      {i < displayedText.split('\n').length - 1 && <br />}
    </React.Fragment>
  ));
  
  return (
    <div className={className}>
      {formattedText}
      <span className="animate-pulse">|</span>
    </div>
  );
};
