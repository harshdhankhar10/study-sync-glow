
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import { AnimatedTypingText } from './AnimatedTypingText';
import { formatDistanceToNow } from 'date-fns';

interface MessageProps {
  message: any;
  onTypingComplete?: () => void;
}

export const UserMessage: React.FC<MessageProps> = ({ message }) => {
  return (
    <div className="flex items-start gap-3 justify-end">
      <div className="flex flex-col items-end">
        <div className="bg-primary text-primary-foreground px-4 py-2 rounded-2xl rounded-tr-none max-w-[85%]">
          <p className="text-sm">{message.content}</p>
        </div>
        {message.timestamp && (
          <span className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </span>
        )}
      </div>
      <Avatar className="h-8 w-8">
        <AvatarImage src={message.senderPhotoURL} />
        <AvatarFallback className="bg-primary/10">
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
    </div>
  );
};

export const AIMessage: React.FC<MessageProps> = ({ message, onTypingComplete }) => {
  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-8 w-8 bg-indigo-100">
        <AvatarImage src="/studybuddy-icon.png" alt="StudyBuddy" />
        <AvatarFallback className="bg-indigo-100 text-indigo-700">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <div className="bg-accent px-4 py-2 rounded-2xl rounded-tl-none max-w-[85%]">
          {message.isTyping ? (
            <AnimatedTypingText 
              text={message.content} 
              className="text-sm whitespace-pre-wrap"
              onComplete={onTypingComplete}
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
        {message.timestamp && (
          <span className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </span>
        )}
      </div>
    </div>
  );
};
