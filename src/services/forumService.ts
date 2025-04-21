
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit, 
  startAfter, 
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';
import { ForumPost, ForumComment, PostCategory, PollOption, PostTag } from '@/types/forum';
import { GEMINI_API_KEY, GEMINI_ENDPOINT } from '@/lib/ai';

// Collection references
const postsCollection = collection(db, 'forumPosts');
const commentsCollection = collection(db, 'forumComments');
const usersCollection = collection(db, 'forumUsers');

// Post CRUD operations
export const createPost = async (postData: Omit<ForumPost, 'id' | 'createdAt' | 'updatedAt' | 'upvotes' | 'downvotes' | 'viewCount' | 'commentCount'>): Promise<string> => {
  try {
    const docRef = await addDoc(postsCollection, {
      ...postData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      upvotes: 0,
      downvotes: 0,
      viewCount: 0,
      commentCount: 0,
      bookmarkedBy: []
    });
    
    // Update user's post count
    const userRef = doc(db, 'forumUsers', postData.authorId);
    await updateDoc(userRef, {
      postCount: increment(1)
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

export const getPost = async (postId: string): Promise<ForumPost | null> => {
  try {
    const docRef = doc(db, 'forumPosts', postId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Increment view count
      await updateDoc(docRef, {
        viewCount: increment(1)
      });
      
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as ForumPost;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting post:', error);
    throw error;
  }
};

export const getPosts = async (
  category?: PostCategory,
  limitCount: number = 10,
  lastPost?: ForumPost
) => {
  try {
    let q = query(postsCollection, orderBy('createdAt', 'desc'));
    
    if (category) {
      q = query(q, where('category', '==', category));
    }
    
    q = query(q, firestoreLimit(limitCount));
    
    if (lastPost) {
      q = query(q, startAfter(lastPost.createdAt));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    } as ForumPost));
  } catch (error) {
    console.error('Error getting posts:', error);
    throw error;
  }
};

export const updatePost = async (postId: string, postData: Partial<ForumPost>): Promise<void> => {
  try {
    const postRef = doc(db, 'forumPosts', postId);
    await updateDoc(postRef, {
      ...postData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

export const deletePost = async (postId: string, authorId: string): Promise<void> => {
  try {
    // Delete all comments on the post
    const commentsQuery = query(commentsCollection, where('postId', '==', postId));
    const commentsSnapshot = await getDocs(commentsQuery);
    for (const comment of commentsSnapshot.docs) {
      await deleteDoc(doc(db, 'forumComments', comment.id));
    }
    
    // Delete the post
    await deleteDoc(doc(db, 'forumPosts', postId));
    
    // Update user's post count
    const userRef = doc(db, 'forumUsers', authorId);
    await updateDoc(userRef, {
      postCount: increment(-1)
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

// Comment CRUD operations
export const createComment = async (commentData: Omit<ForumComment, 'id' | 'createdAt' | 'updatedAt' | 'upvotes' | 'downvotes'>): Promise<string> => {
  try {
    const docRef = await addDoc(commentsCollection, {
      ...commentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      upvotes: 0,
      downvotes: 0
    });
    
    // Update post's comment count
    const postRef = doc(db, 'forumPosts', commentData.postId);
    await updateDoc(postRef, {
      commentCount: increment(1)
    });
    
    // Update user's comment count
    const userRef = doc(db, 'forumUsers', commentData.authorId);
    await updateDoc(userRef, {
      commentCount: increment(1)
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

export const getComments = async (postId: string): Promise<ForumComment[]> => {
  try {
    const q = query(
      commentsCollection, 
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    } as ForumComment));
  } catch (error) {
    console.error('Error getting comments:', error);
    throw error;
  }
};

// Vote operations
export const upvotePost = async (postId: string, userId: string): Promise<void> => {
  try {
    const postRef = doc(db, 'forumPosts', postId);
    await updateDoc(postRef, {
      upvotes: increment(1)
    });
    
    // Add reputation to post author
    const postSnapshot = await getDoc(postRef);
    if (postSnapshot.exists()) {
      const authorId = postSnapshot.data().authorId;
      const userRef = doc(db, 'forumUsers', authorId);
      await updateDoc(userRef, {
        reputationPoints: increment(5)
      });
    }
  } catch (error) {
    console.error('Error upvoting post:', error);
    throw error;
  }
};

export const downvotePost = async (postId: string, userId: string): Promise<void> => {
  try {
    const postRef = doc(db, 'forumPosts', postId);
    await updateDoc(postRef, {
      downvotes: increment(1)
    });
  } catch (error) {
    console.error('Error downvoting post:', error);
    throw error;
  }
};

// Bookmark operations
export const bookmarkPost = async (postId: string, userId: string): Promise<void> => {
  try {
    const postRef = doc(db, 'forumPosts', postId);
    await updateDoc(postRef, {
      bookmarkedBy: arrayUnion(userId)
    });
  } catch (error) {
    console.error('Error bookmarking post:', error);
    throw error;
  }
};

export const unbookmarkPost = async (postId: string, userId: string): Promise<void> => {
  try {
    const postRef = doc(db, 'forumPosts', postId);
    await updateDoc(postRef, {
      bookmarkedBy: arrayRemove(userId)
    });
  } catch (error) {
    console.error('Error unbookmarking post:', error);
    throw error;
  }
};

// Poll operations
export const voteInPoll = async (postId: string, optionId: string, userId: string): Promise<void> => {
  try {
    const postRef = doc(db, 'forumPosts', postId);
    const postSnapshot = await getDoc(postRef);
    
    if (postSnapshot.exists() && postSnapshot.data().isPoll) {
      const pollOptions = postSnapshot.data().pollOptions || [];
      const updatedOptions = pollOptions.map((option: PollOption) => {
        if (option.id === optionId) {
          return {
            ...option,
            votes: option.votes + 1
          };
        }
        return option;
      });
      
      await updateDoc(postRef, {
        pollOptions: updatedOptions
      });
    }
  } catch (error) {
    console.error('Error voting in poll:', error);
    throw error;
  }
};

// AI-powered operations
export const generateAISummary = async (content: string): Promise<string> => {
  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Summarize the following forum post in 2-3 concise sentences highlighting the key points:
                
                ${content}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 256,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error generating AI summary:', error);
    throw error;
  }
};

export const suggestSimilarPosts = async (title: string, content: string): Promise<ForumPost[]> => {
  try {
    // This would use a more sophisticated search in a real app
    // For now, we'll just search for posts with similar titles
    const q = query(
      postsCollection,
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    } as ForumPost));
  } catch (error) {
    console.error('Error suggesting similar posts:', error);
    throw error;
  }
};

export const generateTags = async (title: string, content: string): Promise<PostTag[]> => {
  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Generate 3-5 relevant tags for the following forum post. Return only a JSON array of tag names (no additional text):
                
                Title: ${title}
                Content: ${content}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 256,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const tagsText = data.candidates[0].content.parts[0].text;
    
    // Extract JSON array from response
    const tagsMatch = tagsText.match(/\[(.*)\]/s);
    if (tagsMatch) {
      try {
        const tagsArray = JSON.parse(`[${tagsMatch[1]}]`);
        return tagsArray.map((tag: string, index: number) => ({
          id: `tag-${index}`,
          name: tag.trim().replace(/["']/g, '')
        }));
      } catch (e) {
        console.error('Error parsing tags JSON:', e);
      }
    }
    
    // Fallback if we can't extract proper JSON
    const tagNames = tagsText.split(/[\n,]/).filter(Boolean).map(t => t.trim().replace(/["']/g, ''));
    return tagNames.slice(0, 5).map((name, index) => ({
      id: `tag-${index}`,
      name
    }));
  } catch (error) {
    console.error('Error generating tags:', error);
    return [];
  }
};
