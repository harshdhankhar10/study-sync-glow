
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface MicroMentorSession {
  id: string;
  userId: string;
  topic: string;
  mentorMode: 'explain' | 'debate' | 'memes' | 'quiz' | 'custom';
  timestamp: Timestamp;
  duration: number;
}

export interface MicroMentorMessage {
  id: string;
  sessionId: string;
  content: string;
  isUser: boolean;
  timestamp: Timestamp;
}

export async function getMicroMentorSessions(userId: string): Promise<MicroMentorSession[]> {
  try {
    const sessionsRef = collection(db, 'microMentorSessions');
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MicroMentorSession));
  } catch (error) {
    console.error('Error fetching MicroMentor sessions:', error);
    throw new Error('Failed to fetch MicroMentor sessions');
  }
}

export async function getMicroMentorMessages(sessionId: string): Promise<MicroMentorMessage[]> {
  try {
    const messagesRef = collection(db, 'microMentorMessages');
    const q = query(
      messagesRef,
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MicroMentorMessage));
  } catch (error) {
    console.error('Error fetching MicroMentor messages:', error);
    throw new Error('Failed to fetch MicroMentor messages');
  }
}

export async function createMicroMentorSession(
  userId: string, 
  topic: string, 
  mentorMode: 'explain' | 'debate' | 'memes' | 'quiz' | 'custom'
): Promise<string> {
  try {
    const sessionData = {
      userId,
      topic,
      mentorMode,
      timestamp: serverTimestamp(),
      duration: 300 // 5 minutes in seconds
    };
    
    const docRef = await addDoc(collection(db, 'microMentorSessions'), sessionData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating MicroMentor session:', error);
    throw new Error('Failed to create MicroMentor session');
  }
}

export async function addMicroMentorMessage(
  sessionId: string, 
  content: string, 
  isUser: boolean
): Promise<string> {
  try {
    const messageData = {
      sessionId,
      content,
      isUser,
      timestamp: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'microMentorMessages'), messageData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding MicroMentor message:', error);
    throw new Error('Failed to add MicroMentor message');
  }
}
