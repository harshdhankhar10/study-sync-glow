
import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface ChatHistoryProps {
  conversations: any[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ 
  conversations, 
  currentConversationId,
  onSelectConversation
}) => {
  if (conversations.length === 0) {
    return (
      <div className="text-center py-8 px-2">
        <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No conversations yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px] pr-3">
      <div className="space-y-2">
        {conversations.map((conversation) => {
          // Format the date
          let dateDisplay;
          if (conversation.updatedAt) {
            const date = conversation.updatedAt instanceof Date 
              ? conversation.updatedAt 
              : conversation.updatedAt.toDate?.();
            
            dateDisplay = date 
              ? format(date, 'MMM d, h:mm a')
              : 'New';
          } else {
            dateDisplay = 'New';
          }

          return (
            <Button
              key={conversation.id}
              variant={currentConversationId === conversation.id ? "secondary" : "ghost"}
              className={`w-full justify-start h-auto py-3 px-4 ${
                currentConversationId === conversation.id ? 'bg-secondary' : ''
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium truncate w-full text-left">
                  {conversation.title || 'New Conversation'}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {dateDisplay}
                </span>
              </div>
            </Button>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default ChatHistory;
