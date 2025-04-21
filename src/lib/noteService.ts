
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { generateNoteSummary } from '@/lib/ai';

export interface Note {
  id?: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  summary?: string;
  createdAt: any;
  updatedAt: any;
}

// Maximum file size: 5MB
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Add a new note
export const addNote = async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const noteWithTimestamp = {
      ...note,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'notes'), noteWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error('Error adding note:', error);
    throw error;
  }
};

// Get all notes for a user
export const getUserNotes = async (userId: string): Promise<Note[]> => {
  try {
    const q = query(collection(db, 'notes'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Note;
    });
  } catch (error) {
    console.error('Error getting notes:', error);
    throw error;
  }
};

// Delete a note
export const deleteNote = async (noteId: string, fileUrl?: string): Promise<void> => {
  try {
    // Delete the file from storage if it exists
    if (fileUrl) {
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
    }
    
    // Delete the note document
    await deleteDoc(doc(db, 'notes', noteId));
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

// Upload a file to Firebase Storage
export const uploadNoteFile = async (userId: string, file: File): Promise<string> => {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds the maximum limit of 5MB`);
  }
  
  try {
    const storageRef = ref(storage, `notes/${userId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Update a note
export const updateNote = async (noteId: string, updates: Partial<Note>): Promise<void> => {
  try {
    const noteRef = doc(db, 'notes', noteId);
    await updateDoc(noteRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

// Generate summary for a note
export const generateSummaryForNote = async (noteId: string): Promise<void> => {
  try {
    // Get the note
    const noteRef = doc(db, 'notes', noteId);
    const noteSnap = await getDoc(noteRef);
    
    if (!noteSnap.exists()) {
      throw new Error('Note not found');
    }
    
    const noteData = noteSnap.data() as Note;
    
    // Generate summary using AI
    const summary = await generateNoteSummary(noteData.content, noteData.title);
    
    // Update the note with the summary
    await updateDoc(noteRef, {
      summary,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
};
