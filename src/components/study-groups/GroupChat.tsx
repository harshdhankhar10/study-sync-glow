
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
import { MessageSquare, Send, Info, Video, VideoOff, Mic, MicOff, PhoneCall } from 'lucide-react';
import { StudyGroupMessage } from '@/types/studyGroups';
import { io } from 'socket.io-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';

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
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [activeParticipants, setActiveParticipants] = useState<string[]>([]);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const remoteVideoRefs = useRef<{ [key: string]: React.RefObject<HTMLVideoElement> }>({});

  // Connect local video stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isCallDialogOpen]);

  useEffect(() => {
    const SOCKET_URL = 'https://studysync-sockets.onrender.com';
    
    socketRef.current = io(SOCKET_URL, {
      query: {
        groupId,
        userId: currentUser?.uid || 'anonymous',
        userName: currentUser?.displayName || currentUser?.email
      }
    });
    
    socketRef.current.on('connect', () => {
      console.log('Socket connected to group:', groupId);
    });
    
    socketRef.current.on('error', (error: any) => {
      console.error('Socket error:', error);
      toast({
        title: "Connection error",
        description: "There was an error connecting to the chat. Please refresh the page.",
        variant: "destructive"
      });
    });
    
    socketRef.current.on('new-message', (newMsg: any) => {
      if (newMsg.senderId !== currentUser?.uid) {
        setMessages(prev => [...prev, {
          id: newMsg.id,
          senderId: newMsg.senderId,
          senderName: newMsg.senderName,
          content: newMsg.content,
          timestamp: new Date(newMsg.timestamp)
        }]);
        
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
    
    socketRef.current.on('user-joined-call', (userId: string, username: string) => {
      setActiveParticipants(prev => [...prev, userId]);
      
      const joinMessage = `${username} joined the call`;
      sendSystemMessage(joinMessage);
      
      if (localStream) {
        createPeerConnection(userId);
        createOffer(userId);
      }
    });
    
    socketRef.current.on('user-left-call', (userId: string, username: string) => {
      setActiveParticipants(prev => prev.filter(id => id !== userId));
      
      const leaveMessage = `${username} left the call`;
      sendSystemMessage(leaveMessage);
      
      if (peerConnectionsRef.current[userId]) {
        peerConnectionsRef.current[userId].close();
        delete peerConnectionsRef.current[userId];
      }
      
      setRemoteStreams(prev => {
        const newStreams = { ...prev };
        delete newStreams[userId];
        return newStreams;
      });
    });
    
    socketRef.current.on('call-offer', async (offer: RTCSessionDescriptionInit, senderUserId: string) => {
      console.log('Received offer from:', senderUserId);
      
      if (!localStream) {
        await initializeLocalStream(isVideoCall);
      }
      
      const peerConnection = createPeerConnection(senderUserId);
      
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        socketRef.current.emit('call-answer', answer, senderUserId, currentUser?.uid);
      } catch (error) {
        console.error('Error creating answer:', error);
      }
    });
    
    socketRef.current.on('call-answer', async (answer: RTCSessionDescriptionInit, senderUserId: string) => {
      console.log('Received answer from:', senderUserId);
      
      const peerConnection = peerConnectionsRef.current[senderUserId];
      if (peerConnection) {
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
          console.error('Error setting remote description:', error);
        }
      }
    });
    
    socketRef.current.on('call-ice-candidate', (candidate: RTCIceCandidateInit, senderUserId: string) => {
      console.log('Received ICE candidate from:', senderUserId);
      
      const peerConnection = peerConnectionsRef.current[senderUserId];
      if (peerConnection) {
        try {
          peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });
    
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      Object.values(peerConnectionsRef.current).forEach(connection => {
        connection.close();
      });
      
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [groupId, currentUser, toast, isVideoCall]);

  useEffect(() => {
    if (isCallDialogOpen && localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    
    return () => {
      if (!isCallDialogOpen && localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
        
        if (socketRef.current) {
          socketRef.current.emit('leave-call', groupId, currentUser?.uid, currentUser?.displayName || currentUser?.email);
        }
        
        Object.values(peerConnectionsRef.current).forEach(connection => {
          connection.close();
        });
        peerConnectionsRef.current = {};
        setRemoteStreams({});
        setActiveParticipants([]);
      }
    };
  }, [isCallDialogOpen, localStream, groupId, currentUser]);

  // Added useEffect to handle remote video streams
  useEffect(() => {
    Object.entries(remoteStreams).forEach(([userId, stream]) => {
      if (!remoteVideoRefs.current[userId]) {
        remoteVideoRefs.current[userId] = React.createRef<HTMLVideoElement>();
      }
      
      const videoElement = remoteVideoRefs.current[userId]?.current;
      if (videoElement && videoElement.srcObject !== stream) {
        videoElement.srcObject = stream;
      }
    });
  }, [remoteStreams]);

  const initializeLocalStream = async (withVideo: boolean) => {
    try {
      console.log("Attempting to access media devices with video:", withVideo);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: withVideo,
        audio: true
      });
      
      console.log("Media access successful:", stream.getTracks().length, "tracks");
      setLocalStream(stream);
      
      // Explicitly set the stream to the video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast({
        title: "Media Error",
        description: "Could not access camera or microphone. Please check permissions.",
        variant: "destructive"
      });
      return null;
    }
  };

  const createPeerConnection = (userId: string) => {
    if (peerConnectionsRef.current[userId]) {
      return peerConnectionsRef.current[userId];
    }
    
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
    
    const peerConnection = new RTCPeerConnection(configuration);
    
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }
    
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('call-ice-candidate', event.candidate, userId, currentUser?.uid);
      }
    };
    
    peerConnection.ontrack = (event) => {
      console.log('Received remote track from:', userId);
      
      if (event.streams && event.streams[0]) {
        setRemoteStreams(prev => ({
          ...prev,
          [userId]: event.streams[0]
        }));
      }
    };
    
    peerConnectionsRef.current[userId] = peerConnection;
    return peerConnection;
  };

  const createOffer = async (userId: string) => {
    const peerConnection = peerConnectionsRef.current[userId];
    
    if (peerConnection) {
      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        socketRef.current.emit('call-offer', offer, userId, currentUser?.uid);
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    }
  };

  const startCall = async (withVideo: boolean) => {
    setIsVideoCall(withVideo);
    
    console.log("Starting call with video:", withVideo);
    const stream = await initializeLocalStream(withVideo);
    if (!stream) return;
    
    setIsCallDialogOpen(true);
    
    socketRef.current.emit('join-call', groupId, currentUser?.uid, currentUser?.displayName || currentUser?.email, withVideo);
    
    const callType = withVideo ? 'video' : 'audio';
    sendSystemMessage(`${currentUser?.displayName || currentUser?.email} started a ${callType} call`);
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
    setIsCallDialogOpen(false);
  };

  const sendSystemMessage = async (content: string) => {
    try {
      const messageData = {
        groupId,
        senderId: 'system',
        senderName: 'System',
        content,
        timestamp: serverTimestamp(),
        isSystemMessage: true
      };
      
      await addDoc(collection(db, 'groupMessages'), messageData);
    } catch (error) {
      console.error("Error sending system message:", error);
    }
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !groupId || !newMessage.trim()) return;
    
    try {
      setIsSending(true);
      
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
      
      if (socketRef.current) {
        socketRef.current.emit('send-message', {
          id: messageRef.id,
          ...messageData,
          timestamp: new Date().toISOString(),
        });
      }
      
      setNewMessage('');
      
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
      
      <Dialog open={isCallDialogOpen} onOpenChange={setIsCallDialogOpen}>
        <DialogContent className="sm:max-w-[80vw] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {isVideoCall ? 'Video Call' : 'Audio Call'} - {groupName}
            </DialogTitle>
            <DialogDescription>
              {activeParticipants.length > 0 
                ? `${activeParticipants.length + 1} participants in this call` 
                : 'Waiting for others to join...'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
              
              {Object.entries(remoteStreams).map(([userId, stream]) => {
                if (!remoteVideoRefs.current[userId]) {
                  remoteVideoRefs.current[userId] = React.createRef<HTMLVideoElement>();
                }
                
                return (
                  <div key={userId} className="relative bg-slate-800 rounded-lg overflow-hidden">
                    <video
                      ref={remoteVideoRefs.current[userId]}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover min-h-[240px]"
                    />
                    <div className="absolute bottom-2 left-2 text-white bg-black/50 px-2 py-1 rounded text-sm">
                      {userId}
                    </div>
                  </div>
                );
              })}
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
