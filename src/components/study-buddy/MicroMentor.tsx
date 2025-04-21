
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Brain, MessageSquare, Book, Star } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { AnimatedTypingText } from './AnimatedTypingText';
import { generateMicroMentorResponse } from '@/lib/micro-mentor';

interface MicroMentorProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

type MentorMode = 'explain' | 'debate' | 'memes' | 'quiz' | 'custom';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

const STARTER_PROMPTS = [
  { text: "Explain this topic like I'm 5", mode: 'explain' as MentorMode },
  { text: "Give me a debate on this topic", mode: 'debate' as MentorMode },
  { text: "Turn this concept into memes", mode: 'memes' as MentorMode },
  { text: "Create a quick quiz for me", mode: 'quiz' as MentorMode }
];

export default function MicroMentor({ isOpen, onClose, userId }: MicroMentorProps) {
  const [topic, setTopic] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [mentorMode, setMentorMode] = useState<MentorMode>('custom');
  const [typingComplete, setTypingComplete] = useState(true);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load recent session if available
  useEffect(() => {
    if (isOpen && userId) {
      const loadRecentSession = async () => {
        try {
          const sessionsRef = collection(db, 'microMentorSessions');
          const q = query(
            sessionsRef,
            where('userId', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(1)
          );
          
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const sessionData = querySnapshot.docs[0].data();
            setTopic(sessionData.topic || '');
            
            // Load messages for this session
            const messagesRef = collection(db, 'microMentorMessages');
            const messagesQuery = query(
              messagesRef,
              where('sessionId', '==', querySnapshot.docs[0].id),
              orderBy('timestamp', 'asc')
            );
            
            const messagesSnapshot = await getDocs(messagesQuery);
            const messagesData = messagesSnapshot.docs.map(doc => ({
              id: doc.id,
              content: doc.data().content,
              isUser: doc.data().isUser,
              timestamp: doc.data().timestamp?.toDate() || new Date()
            }));
            
            if (messagesData.length > 0) {
              setMessages(messagesData);
            }
          }
        } catch (error) {
          console.error('Error loading recent MicroMentor session:', error);
        }
      };
      
      loadRecentSession();
    }
  }, [isOpen, userId]);
  
  // Timer functionality
  useEffect(() => {
    if (sessionStarted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionStarted]);
  
  useEffect(() => {
    if (timeLeft === 0) {
      toast({
        title: "Time's up!",
        description: "Your 5-minute MicroMentor session has ended.",
        variant: "default"
      });
      endSession();
    }
  }, [timeLeft]);
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const startSession = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a study topic to begin your MicroMentor session.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Create session in database
      const sessionRef = await addDoc(collection(db, 'microMentorSessions'), {
        userId,
        topic,
        timestamp: serverTimestamp(),
        duration: 300, // 5 minutes
        mentorMode
      });
      
      // Add welcome message
      const welcomeMessage = {
        id: 'welcome',
        content: `I'm your MicroMentor for the next 5 minutes! How can I help you understand "${topic}"?`,
        isUser: false,
        timestamp: new Date()
      };
      
      await addDoc(collection(db, 'microMentorMessages'), {
        sessionId: sessionRef.id,
        content: welcomeMessage.content,
        isUser: false,
        timestamp: serverTimestamp()
      });
      
      setMessages([welcomeMessage]);
      setSessionStarted(true);
      setTimeLeft(300);
      scrollToBottom();
    } catch (error) {
      console.error('Error starting MicroMentor session:', error);
      toast({
        title: "Error",
        description: "Failed to start MicroMentor session. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const endSession = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setSessionStarted(false);
    onClose();
  };
  
  const sendMessage = async (messageText: string = inputMessage, mode: MentorMode = mentorMode) => {
    if (!messageText.trim() || isProcessing || !typingComplete) return;
    
    setIsProcessing(true);
    
    try {
      // Add user message
      const userMessage = {
        id: `user-${Date.now()}`,
        content: messageText,
        isUser: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      
      // Find session ID
      const sessionsRef = collection(db, 'microMentorSessions');
      const q = query(
        sessionsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error('No active session found');
      }
      
      const sessionId = querySnapshot.docs[0].id;
      
      // Save user message to database
      await addDoc(collection(db, 'microMentorMessages'), {
        sessionId,
        content: messageText,
        isUser: true,
        timestamp: serverTimestamp()
      });
      
      // Add AI thinking message
      const tempAiMessage = {
        id: `ai-temp-${Date.now()}`,
        content: '',
        isUser: false,
        isTyping: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, tempAiMessage]);
      scrollToBottom();
      setTypingComplete(false);
      
      // Generate AI response
      const aiResponseText = await generateMicroMentorResponse(
        topic,
        messageText,
        mode,
        messages.filter(m => !m.id.includes('temp')).map(m => ({
          role: m.isUser ? 'user' : 'assistant',
          content: m.content
        }))
      );
      
      // Update AI message with response
      setMessages(prev => prev.map(msg => 
        msg.id === tempAiMessage.id 
          ? { ...msg, content: aiResponseText, isTyping: true } 
          : msg
      ));
      
      // Save AI response to database
      await addDoc(collection(db, 'microMentorMessages'), {
        sessionId,
        content: aiResponseText,
        isUser: false,
        timestamp: serverTimestamp()
      });
      
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send your message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };
  
  const useStarterPrompt = (prompt: string, mode: MentorMode) => {
    setMentorMode(mode);
    sendMessage(prompt, mode);
  };
  
  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  };
  
  const handleTypingComplete = () => {
    setTypingComplete(true);
    setMessages(prev => prev.map(msg => 
      msg.isTyping ? { ...msg, isTyping: false } : msg
    ));
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-indigo-500" />
            <span>MicroMentor</span>
            {sessionStarted && (
              <span className="ml-auto text-sm font-normal bg-red-100 text-red-700 px-2 py-1 rounded-full">
                {formatTime(timeLeft)}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {!sessionStarted ? (
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="topic" className="block text-sm font-medium mb-1">
                What topic are you studying?
              </label>
              <Input
                id="topic"
                placeholder="e.g., Quantum Physics, French Revolution, React Hooks..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">How would you like me to help?</label>
              <div className="grid grid-cols-2 gap-2">
                {STARTER_PROMPTS.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="justify-start h-auto py-2"
                    onClick={() => {
                      setMentorMode(prompt.mode);
                      startSession();
                    }}
                  >
                    {prompt.text}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="pt-2">
              <Button className="w-full" onClick={() => startSession()}>
                Start 5-Minute MicroMentor Session
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-[300px] border rounded-md overflow-hidden flex flex-col">
              <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!message.isUser && (
                        <Avatar className="h-8 w-8 mr-2 bg-indigo-100">
                          <AvatarFallback className="bg-indigo-100 text-indigo-700">
                            <Brain className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div 
                        className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                          message.isUser 
                            ? 'bg-primary text-primary-foreground rounded-tr-none' 
                            : 'bg-accent rounded-tl-none'
                        }`}
                      >
                        {message.isTyping ? (
                          <AnimatedTypingText
                            text={message.content}
                            className="text-sm whitespace-pre-wrap"
                            onComplete={handleTypingComplete}
                          />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                      
                      {message.isUser && (
                        <Avatar className="h-8 w-8 ml-2">
                          <AvatarFallback>
                            <MessageSquare className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <form onSubmit={handleSubmit} className="p-2 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask your MicroMentor..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    disabled={isProcessing || !typingComplete}
                  />
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={!inputMessage.trim() || isProcessing || !typingComplete}
                  >
                    Send
                  </Button>
                </div>
              </form>
            </div>
            
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-2">Quick prompts:</p>
              <div className="flex gap-2 flex-wrap">
                {STARTER_PROMPTS.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => useStarterPrompt(prompt.text, prompt.mode)}
                    disabled={isProcessing || !typingComplete}
                    className="text-xs"
                  >
                    {prompt.text}
                  </Button>
                ))}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="destructive" onClick={endSession}>
                End Session
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
