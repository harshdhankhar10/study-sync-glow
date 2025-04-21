
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  Timestamp,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Send, Info } from 'lucide-react';
import { StudyGroupMessage } from '@/types/studyGroups';
import { io } from 'socket.io-client';

interface GroupChatProps {
  groupId: string;
  groupName: string;
}

// Add socket.io dependency 
<lov-add-dependency>socket.io-client@4.7.2</lov-add-dependency>

export default function GroupChat({ groupId, groupName }: GroupChatProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<StudyGroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  
  // Initialize socket connection
  useEffect(() => {
    // This would be replaced with your real socket.io server URL
    const SOCKET_URL = 'https://studysync-sockets.onrender.com';
    
    socketRef.current = io(SOCKET_URL, {
      query: {
        groupId,
        userId: currentUser?.uid || 'anonymous'
      }
    });
    
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
    });
    
    socketRef.current.on('new-message', (newMsg: any) => {
      // Only add the message if it's not from the current user
      if (newMsg.senderId !== currentUser?.uid) {
        setMessages(prev => [
          ...prev, 
          {
            id: newMsg.id,
            senderId: newMsg.senderId,
            senderName: newMsg.senderName,
            content: newMsg.content,
            timestamp: new Date(newMsg.timestamp)
          }
        ]);
        
        // Scroll to bottom on new message
        if (scrollAreaRef.current) {
          setTimeout(() => {
            scrollAreaRef.current?.scrollTo({ 
              top: scrollAreaRef.current.scrollHeight, 
              behavior: 'smooth' 
            });
          }, 100);
        }
      }
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [groupId, currentUser]);

  // Load initial messages
  useEffect(() => {
    async function loadMessages() {
      if (!currentUser || !groupId) return;
      
      try {
        setLoading(true);
        
        // Set up real-time listener for messages
        const messagesRef = collection(db, 'groupMessages');
        const messagesQuery = query(
          messagesRef,
          where('groupId', '==', groupId),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
        
        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
          const messagesData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              senderId: data.senderId,
              senderName: data.senderName,
              content: data.content,
              timestamp: data.timestamp.toDate(),
              isSystemMessage: data.isSystemMessage || false
            } as StudyGroupMessage;
          });
          
          // Sort messages by timestamp (oldest first)
          messagesData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          
          setMessages(messagesData);
          setLoading(false);
          
          // Scroll to bottom on initial load
          if (scrollAreaRef.current) {
            setTimeout(() => {
              scrollAreaRef.current?.scrollTo({ 
                top: scrollAreaRef.current.scrollHeight, 
                behavior: 'auto' 
              });
            }, 100);
          }
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error("Error loading messages:", error);
        toast({
          title: "Failed to load messages",
          description: "There was an error loading the chat messages. Please try again.",
          variant: "destructive"
        });
        setLoading(false);
      }
    }
    
    loadMessages();
  }, [currentUser, groupId, toast]);

  // Handle sending new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !groupId || !newMessage.trim()) return;
    
    try {
      setIsSending(true);
      
      // Create message document
      const messageData = {
        groupId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        senderPhotoURL: currentUser.photoURL || null,
        content: newMessage.trim(),
        timestamp: serverTimestamp(),
        isSystemMessage: false
      };
      
      const messageRef = await addDoc(collection(db, 'groupMessages'), messageData);
      
      // Broadcast through socket.io
      if (socketRef.current) {
        socketRef.current.emit('send-message', {
          id: messageRef.id,
          ...messageData,
          timestamp: new Date().toISOString(),
        });
      }
      
      // Clear input field
      setNewMessage('');
      
      // This immediate update is useful for the current user to see their message right away
      // The real-time listener will update with the server timestamp later
      setMessages(prev => [
        ...prev, 
        {
          id: messageRef.id,
          senderId: currentUser.uid,
          senderName: currentUser.displayName || currentUser.email || '',
          content: newMessage.trim(),
          timestamp: new Date(),
          isSystemMessage: false
        }
      ]);
      
      // Scroll to bottom
      if (scrollAreaRef.current) {
        setTimeout(() => {
          scrollAreaRef.current?.scrollTo({ 
            top: scrollAreaRef.current.scrollHeight, 
            behavior: 'smooth' 
          });
        }, 100);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send message",
        description: "There was an error sending your message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3 pt-5">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          {groupName} Chat
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="flex-1 p-0 overflow-hidden">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-pulse text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Messages Yet</h3>
              <p className="text-muted-foreground mb-6 px-10">
                Start the conversation by sending the first message to your study group.
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea 
            ref={scrollAreaRef}
            className="h-full px-6 py-4"
          >
            <div className="space-y-4">
              {/* Welcome message at the top */}
              <div className="flex justify-center">
                <div className="bg-muted px-4 py-2 rounded-lg text-sm text-center">
                  <p className="font-medium">Welcome to the {groupName} chat!</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Messages are updated in real-time for all group members.
                  </p>
                </div>
              </div>
              
              {messages.map((message) => (
                <div 
                  key={message.id}
                  className={`flex ${
                    message.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.isSystemMessage ? (
                    <div className="flex justify-center w-full">
                      <div className="bg-muted px-3 py-1.5 rounded-md text-xs text-center flex items-center text-muted-foreground">
                        <Info className="h-3 w-3 mr-1.5" />
                        {message.content}
                      </div>
                    </div>
                  ) : message.senderId === currentUser?.uid ? (
                    <div className="flex flex-col items-end max-w-[80%]">
                      <div className="bg-primary text-primary-foreground px-4 py-2 rounded-2xl rounded-tr-none">
                        <p className="text-sm break-words">{message.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimestamp(message.timestamp)}
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-2 max-w-[80%]">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={undefined} alt={message.senderName} />
                        <AvatarFallback>
                          {message.senderName ? message.senderName.substring(0, 2).toUpperCase() : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="bg-accent px-4 py-2 rounded-2xl rounded-tl-none">
                          <p className="text-sm font-medium mb-1">{message.senderName}</p>
                          <p className="text-sm break-words">{message.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimestamp(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Add some padding at the bottom */}
              <div className="h-2" />
            </div>
          </ScrollArea>
        )}
      </CardContent>
      <Separator />
      <CardFooter className="p-4">
        <form onSubmit={handleSendMessage} className="flex items-center w-full gap-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
            disabled={!currentUser || isSending}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!newMessage.trim() || isSending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
