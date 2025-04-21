
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader, Bot, User, Sparkles, BookOpen, FileText, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  serverTimestamp,
  limit,
  doc,
  getDoc
} from 'firebase/firestore';
import { AnimatedTypingText } from '@/components/study-buddy/AnimatedTypingText';
import { AIMessage, UserMessage } from '@/components/study-buddy/MessageComponents';
import { generateAIResponse } from '@/lib/study-buddy';
import ChatHistory from '@/components/study-buddy/ChatHistory';
import { StudyContext } from '@/components/study-buddy/StudyContext';

export default function StudyBuddy() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [inputMessage, setInputMessage] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [contextData, setContextData] = useState<any>(null);
  const [typingComplete, setTypingComplete] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Fetch user's conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUser) return;
      
      try {
        const conversationsRef = collection(db, 'aiConversations');
        const q = query(
          conversationsRef,
          where('userId', '==', currentUser.uid),
          orderBy('updatedAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const conversationsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setConversations(conversationsData);
        
        // Set the current conversation to the most recent one if exists
        if (conversationsData.length > 0 && !currentConversation) {
          setCurrentConversation(conversationsData[0].id);
          fetchMessages(conversationsData[0].id);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your conversation history',
          variant: 'destructive'
        });
      }
    };
    
    fetchConversations();
  }, [currentUser, toast]);

  // Fetch user context data (skills, goals, notes, etc.)
  useEffect(() => {
    const fetchUserContext = async () => {
      if (!currentUser) return;
      
      try {
        const userData: any = { userId: currentUser.uid };
        
        // Fetch user profile
        const profileRef = doc(db, 'profiles', currentUser.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          userData.profile = profileSnap.data();
        }
        
        // Fetch user skills
        const skillsRef = doc(db, 'skills', currentUser.uid);
        const skillsSnap = await getDoc(skillsRef);
        if (skillsSnap.exists()) {
          userData.skills = skillsSnap.data();
        }
        
        // Fetch user goals
        const goalsRef = doc(db, 'goals', currentUser.uid);
        const goalsSnap = await getDoc(goalsRef);
        if (goalsSnap.exists()) {
          userData.goals = goalsSnap.data();
        }
        
        // Fetch recent notes (limited to 5)
        const notesRef = collection(db, 'notes');
        const notesQuery = query(
          notesRef,
          where('userId', '==', currentUser.uid),
          orderBy('updatedAt', 'desc'),
          limit(5)
        );
        const notesSnap = await getDocs(notesQuery);
        userData.recentNotes = notesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Fetch upcoming study sessions
        const sessionsRef = collection(db, 'studySessions');
        const sessionsQuery = query(
          sessionsRef,
          where('participants', 'array-contains', currentUser.uid),
          orderBy('date', 'asc'),
          limit(3)
        );
        const sessionsSnap = await getDocs(sessionsQuery);
        userData.upcomingSessions = sessionsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setContextData(userData);
      } catch (error) {
        console.error('Error fetching user context:', error);
      }
    };
    
    fetchUserContext();
  }, [currentUser]);

  // Fetch messages for a specific conversation
  const fetchMessages = async (conversationId: string) => {
    if (!currentUser || !conversationId) return;
    
    try {
      setLoading(true);
      
      const messagesRef = collection(db, 'aiMessages');
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const messagesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      
      setMessages(messagesData);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversation messages',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a new conversation
  const createNewConversation = async () => {
    if (!currentUser) return null;
    
    try {
      const newConversation = {
        userId: currentUser.uid,
        title: 'New Conversation',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        messageCount: 0
      };
      
      const docRef = await addDoc(collection(db, 'aiConversations'), newConversation);
      
      // Add to local state
      setConversations(prev => [
        {
          id: docRef.id,
          ...newConversation,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        ...prev
      ]);
      
      setCurrentConversation(docRef.id);
      setMessages([]);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating new conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create a new conversation',
        variant: 'destructive'
      });
      return null;
    }
  };

  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !inputMessage.trim() || isProcessing) return;
    
    // Don't send if previous response is still typing
    if (!typingComplete) return;
    
    setIsProcessing(true);
    
    try {
      // If no conversation is selected, create a new one
      let conversationId = currentConversation;
      if (!conversationId) {
        conversationId = await createNewConversation();
        if (!conversationId) throw new Error('Failed to create conversation');
      }
      
      // Add user message to Firestore
      const userMessage = {
        conversationId,
        senderId: currentUser.uid,
        content: inputMessage,
        isUserMessage: true,
        timestamp: serverTimestamp()
      };
      
      const userMessageRef = await addDoc(collection(db, 'aiMessages'), userMessage);
      
      // Add message to local state immediately (for UI)
      const userMessageWithDate = {
        ...userMessage,
        id: userMessageRef.id,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessageWithDate]);
      setInputMessage('');
      
      // Update conversation info
      const conversationRef = doc(db, 'aiConversations', conversationId);
      
      // Generate AI response
      const userContext = contextData || {};
      const conversationHistory = messages.map(msg => ({
        role: msg.isUserMessage ? 'user' : 'assistant',
        content: msg.content
      }));
      
      // Start with an empty AI message for typing animation
      setTypingComplete(false);
      const tempAiMessage = {
        id: 'temp-' + Date.now(),
        conversationId,
        senderId: 'ai',
        content: '',
        isUserMessage: false,
        isTyping: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, tempAiMessage]);
      scrollToBottom();
      
      // Generate the actual AI response
      const aiResponseText = await generateAIResponse(
        inputMessage, 
        conversationHistory, 
        userContext
      );
      
      // Update typing message with the full response
      setMessages(prev => prev.map(msg => 
        msg.id === tempAiMessage.id 
          ? { ...msg, content: aiResponseText, isTyping: true } 
          : msg
      ));
      
      // Add AI message to Firestore after animation completes
      const aiMessage = {
        conversationId,
        senderId: 'ai',
        content: aiResponseText,
        isUserMessage: false,
        timestamp: serverTimestamp()
      };
      
      await addDoc(collection(db, 'aiMessages'), aiMessage);
      
      // Update conversation with new title if it's the first message
      if (messages.length === 0) {
        // Generate a title using the first message
        const title = inputMessage.length > 30 
          ? `${inputMessage.substring(0, 30)}...` 
          : inputMessage;
        
        await addDoc(collection(db, 'aiConversations'), {
          title,
          updatedAt: serverTimestamp(),
          messageCount: 2 // User message + AI response
        });
        
        // Update local state
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { 
                  ...conv, 
                  title,
                  updatedAt: new Date(),
                  messageCount: 2
                } 
              : conv
          )
        );
      }
      
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send your message',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle selecting a conversation
  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversation(conversationId);
    fetchMessages(conversationId);
  };

  // Scroll to bottom of chat
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

  // Handle typing completion
  const handleTypingComplete = () => {
    setTypingComplete(true);
    setMessages(prev => prev.map(msg => 
      msg.isTyping ? { ...msg, isTyping: false } : msg
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          StudyBuddy AI Coach
        </h2>
        <p className="text-gray-500 mt-1">
          Your personal AI learning assistant that helps you study smarter
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex justify-between items-center">
              <span>Conversations</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => createNewConversation()} 
                disabled={isProcessing}
              >
                <FileText className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChatHistory 
              conversations={conversations}
              currentConversationId={currentConversation}
              onSelectConversation={handleSelectConversation}
            />
          </CardContent>
        </Card>

        <div className="md:col-span-3">
          <Card className="h-[700px] flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 bg-indigo-100">
                  <AvatarImage src="/studybuddy-icon.png" alt="StudyBuddy" />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">StudyBuddy</CardTitle>
                  <CardDescription>AI Learning Assistant</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <div className="flex-1 overflow-hidden">
              <Tabs defaultValue="chat" className="h-full flex flex-col">
                <div className="px-4">
                  <TabsList className="w-full">
                    <TabsTrigger value="chat" className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      <span>Chat</span>
                    </TabsTrigger>
                    <TabsTrigger value="context" className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>Learning Context</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="chat" className="flex-1 pt-4 px-4 overflow-hidden flex flex-col">
                  {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <Loader className="h-8 w-8 animate-spin text-indigo-500 mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading conversation...</p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center max-w-md mx-auto px-4">
                        <Bot className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Welcome to StudyBuddy AI</h3>
                        <p className="text-muted-foreground mb-6">
                          Your personal AI learning assistant. Ask questions about your subjects, get study tips, or request help with your assignments!
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <Button variant="outline" onClick={() => setInputMessage("Can you help me understand the concept of photosynthesis?")}>
                            Explain a concept
                          </Button>
                          <Button variant="outline" onClick={() => setInputMessage("Create flashcards for me about human anatomy")}>
                            Generate flashcards
                          </Button>
                          <Button variant="outline" onClick={() => setInputMessage("How can I improve my study habits?")}>
                            Study tips
                          </Button>
                          <Button variant="outline" onClick={() => setInputMessage("What's the best way to prepare for my upcoming exams?")}>
                            Exam preparation
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <ScrollArea ref={scrollAreaRef} className="pr-4 flex-1 -mr-4">
                      <div className="space-y-4 pb-4">
                        {messages.map((message) => 
                          message.isUserMessage ? (
                            <UserMessage key={message.id} message={message} />
                          ) : (
                            <AIMessage 
                              key={message.id} 
                              message={message} 
                              onTypingComplete={handleTypingComplete}
                            />
                          )
                        )}
                      </div>
                    </ScrollArea>
                  )}
                  
                  <form onSubmit={handleSendMessage} className="pt-4 pb-3">
                    <div className="relative">
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Ask StudyBuddy anything..."
                        className="pr-20"
                        disabled={isProcessing || !typingComplete}
                      />
                      <Button 
                        type="submit" 
                        size="sm" 
                        className="absolute right-1 top-1 h-8"
                        disabled={!inputMessage.trim() || isProcessing || !typingComplete}
                      >
                        {isProcessing ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-1" />
                        )}
                        <span>Ask</span>
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="context" className="flex-1 pt-4 px-4 overflow-hidden">
                  <StudyContext userData={contextData} />
                </TabsContent>
              </Tabs>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
