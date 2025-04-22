
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
  limit as firestoreLimit,
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
import { MessageSquare, Send, Info, Video, VideoOff, Mic, MicOff, PhoneCall, Pencil } from 'lucide-react';
import { StudyGroupMessage } from '@/types/studyGroups';
import { io } from 'socket.io-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GEMINI_API_KEY, GEMINI_ENDPOINT } from '@/lib/ai';
import { CollaborativeWhiteboard } from './whiteboard/CollaborativeWhiteboard';

interface GroupChatProps {
  groupId: string;
  groupName: string;
}

export default function GroupChat({ groupId, groupName }: GroupChatProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<StudyGroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  
  const [activeTab, setActiveTab] = useState<'chat' | 'whiteboard'>('chat');
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  // Initialize WebRTC
  const initializeWebRTC = async (withVideo: boolean) => {
    try {
      console.log("Initializing WebRTC with video:", withVideo);
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: withVideo ? { width: 640, height: 480 } : false,
        audio: true
      });
      
      console.log("Got media stream:", stream.getTracks().length, "tracks");
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play().catch(e => console.error("Error playing local video:", e));
      }
      
      // Create peer connection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      };
      
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;
      
      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      
      // Handle incoming tracks
      peerConnection.ontrack = (event) => {
        console.log("Received remote track");
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };
      
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.emit('ice-candidate', {
            candidate: event.candidate,
            groupId
          });
        }
      };
      
      return peerConnection;
    } catch (error) {
      console.error("Error initializing WebRTC:", error);
      toast({
        title: "Failed to start call",
        description: "Could not access camera or microphone. Please check permissions.",
        variant: "destructive"
      });
      return null;
    }
  };

  // Socket.io connection
  useEffect(() => {
    const SOCKET_URL = 'https://studysync-sockets.onrender.com';
    
    socketRef.current = io(SOCKET_URL, {
      query: {
        groupId,
        userId: currentUser?.uid || 'anonymous',
        userName: currentUser?.displayName || currentUser?.email
      }
    });
    
    socketRef.current.on('offer', async (offer: RTCSessionDescriptionInit) => {
      if (!peerConnectionRef.current) {
        await initializeWebRTC(isVideoCall);
      }
      
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socketRef.current.emit('answer', { answer, groupId });
      }
    });
    
    socketRef.current.on('answer', async (answer: RTCSessionDescriptionInit) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });
    
    socketRef.current.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      }
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [groupId, currentUser, isVideoCall]);

  // AI Chat Function
  const generateAIResponse = async (prompt: string): Promise<string> => {
    try {
      const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a helpful study group assistant. Respond to this message from a study group: ${prompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        }),
      });

      if (!response.ok) throw new Error('AI response failed');
      
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Error generating AI response:", error);
      return "I apologize, but I'm having trouble processing your request right now. Please try again later.";
    }
  };

  // Handle sending messages
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !groupId || !newMessage.trim()) return;
    
    try {
      setIsSending(true);
      
      // Check if message is directed to AI
      const isAIMessage = newMessage.trim().toLowerCase().startsWith('@ai');
      let messageContent = newMessage.trim();
      let aiResponse = '';
      
      if (isAIMessage) {
        // Remove @ai prefix and get AI response
        const prompt = messageContent.substring(3).trim();
        aiResponse = await generateAIResponse(prompt);
      }
      
      // Send user message
      const messageData = {
        groupId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        content: messageContent,
        timestamp: serverTimestamp(),
        isSystemMessage: false
      };
      
      await addDoc(collection(db, 'groupMessages'), messageData);
      
      // If AI response exists, send it as a new message
      if (aiResponse) {
        const aiMessageData = {
          groupId,
          senderId: 'ai',
          senderName: 'AI Assistant',
          content: aiResponse,
          timestamp: serverTimestamp(),
          isSystemMessage: false
        };
        
        await addDoc(collection(db, 'groupMessages'), aiMessageData);
      }
      
      setNewMessage('');
      
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

  useEffect(() => {
    async function loadMessages() {
      if (!currentUser || !groupId) return;
      
      try {
        setLoading(true);
        
        const messagesRef = collection(db, 'groupMessages');
        const messagesQuery = query(
          messagesRef,
          where('groupId', '==', groupId),
          orderBy('timestamp', 'desc'),
          firestoreLimit(50)
        );
        
        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
          const messagesData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              senderId: data.senderId,
              senderName: data.senderName,
              content: data.content,
              timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
              isSystemMessage: data.isSystemMessage || false
            } as StudyGroupMessage;
          });
          
          messagesData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          
          setMessages(messagesData);
          setLoading(false);
          
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

  const startCall = async (withVideo: boolean) => {
    setIsVideoCall(withVideo);
    setIsCallDialogOpen(true);
    
    const peerConnection = await initializeWebRTC(withVideo);
    if (!peerConnection) return;
    
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socketRef.current.emit('offer', { offer, groupId });
    } catch (error) {
      console.error("Error creating offer:", error);
      toast({
        title: "Call Failed",
        description: "Could not establish call connection. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    setIsCallDialogOpen(false);
    setLocalStream(null);
  };

  const toggleWhiteboard = () => {
    setWhiteboardOpen(!whiteboardOpen);
    
    // If opening whiteboard, send system message
    if (!whiteboardOpen && currentUser && groupId) {
      const whiteboardMessage = {
        groupId,
        senderId: 'system',
        senderName: 'System',
        content: `${currentUser.displayName || currentUser.email} opened the collaborative whiteboard.`,
        timestamp: serverTimestamp(),
        isSystemMessage: true
      };
      
      addDoc(collection(db, 'groupMessages'), whiteboardMessage).catch(error => {
        console.error("Error sending whiteboard notification:", error);
      });
    }
  };

  return (
    <>
      <Card className="flex flex-col h-[600px]">
        <CardHeader className="pb-3 pt-5">
          <CardTitle className="text-base flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {groupName} Chat
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className={`flex items-center gap-1 text-xs ${whiteboardOpen ? 'bg-primary/20' : ''}`}
                onClick={toggleWhiteboard}
              >
                <Pencil className="h-3 w-3" />
                Whiteboard
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1 text-xs"
                onClick={() => startCall(true)}
              >
                <Video className="h-3 w-3" />
                Video Call
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1 text-xs"
                onClick={() => startCall(false)}
              >
                <PhoneCall className="h-3 w-3" />
                Audio Call
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="flex-1 p-0 overflow-hidden">
          {whiteboardOpen ? (
            <div className="h-full p-4">
              <CollaborativeWhiteboard 
                groupId={groupId} 
                socket={socketRef.current} 
              />
            </div>
          ) : loading ? (
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
              disabled={!currentUser || isSending || whiteboardOpen}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!newMessage.trim() || isSending || whiteboardOpen}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
      
      <Dialog open={isCallDialogOpen} onOpenChange={setIsCallDialogOpen}>
        <DialogContent className="sm:max-w-[80vw] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {isVideoCall ? 'Video Call' : 'Audio Call'} - {groupName}
            </DialogTitle>
            <DialogDescription>
              Call in progress
            </DialogDescription>
          </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative bg-slate-800 rounded-lg overflow-hidden">
              {isVideoCall ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover min-h-[240px]"
                />
              ) : (
                <div className="w-full h-full min-h-[240px] flex items-center justify-center">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-3xl">
                      {currentUser?.displayName 
                        ? currentUser.displayName.substring(0, 2).toUpperCase() 
                        : currentUser?.email?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              <div className="absolute bottom-2 left-2 text-white bg-black/50 px-2 py-1 rounded text-sm">
                You {!isAudioEnabled && '(muted)'}
              </div>
            </div>
            
            <div className="relative bg-slate-800 rounded-lg overflow-hidden">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover min-h-[240px]"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-center gap-4 my-4">
          <Button 
            onClick={toggleVideo} 
            variant="outline" 
            className={!isVideoEnabled ? "bg-red-100" : ""}
            disabled={!isVideoCall}
          >
            {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>
          <Button 
            onClick={toggleAudio} 
            variant="outline"
            className={!isAudioEnabled ? "bg-red-100" : ""}
          >
            {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>
          <Button variant="destructive" onClick={endCall}>
            End Call
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
