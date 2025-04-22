import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  limit, 
  startAfter, 
  Timestamp, 
  increment 
} from "firebase/firestore";
import { db } from '@/lib/firebase';

interface UserData {
  id: string;
  displayName: string;
  email: string;
  photoURL: string | null;
}

const getUserData = async (userId: string): Promise<UserData | null> => {
  try {
    const userDocRef = doc(db, 'profiles', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        displayName: userDoc.data().displayName || 'Unknown User',
        email: userDoc.data().email,
        photoURL: userDoc.data().photoURL || null,
      };
    } else {
      console.log("User document not found");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

export const getLatestPosts = async (limitCount = 5) => {
  try {
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    const latestPosts = [];
    for (const docSnapshot of querySnapshot.docs) {
      const postData = docSnapshot.data();
      const userData = await getUserData(postData.userId);
      
      latestPosts.push({
        id: docSnapshot.id,
        title: postData.title,
        content: postData.content,
        createdAt: postData.createdAt.toDate(),
        updatedAt: postData.updatedAt?.toDate(),
        userId: postData.userId,
        author: userData,
        likes: postData.likes || 0,
        commentCount: postData.commentCount || 0,
        tags: postData.tags || []
      });
    }
    
    return latestPosts;
  } catch (error) {
    console.error("Error getting latest posts:", error);
    throw error;
  }
};

export const getPostById = async (postId: string) => {
  try {
    const postDocRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postDocRef);
    
    if (!postDoc.exists()) {
      console.log("No such document!");
      return null;
    }
    
    const postData = postDoc.data();
    const userData = await getUserData(postData.userId);
    
    return {
      id: postDoc.id,
      title: postData.title,
      content: postData.content,
      createdAt: postData.createdAt.toDate(),
      updatedAt: postData.updatedAt?.toDate(),
      userId: postData.userId,
      author: userData,
      likes: postData.likes || 0,
      commentCount: postData.commentCount || 0,
      tags: postData.tags || []
    };
  } catch (error) {
    console.error("Error getting post:", error);
    throw error;
  }
};

export const createPost = async (userId: string, title: string, content: string, tags: string[]) => {
  try {
    const newPostRef = await addDoc(collection(db, 'posts'), {
      userId: userId,
      title: title,
      content: content,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likes: 0,
      commentCount: 0,
      tags: tags
    });
    
    console.log("Document written with ID: ", newPostRef.id);
    return newPostRef.id;
  } catch (error) {
    console.error("Error adding post:", error);
    throw error;
  }
};

export const updatePost = async (postId: string, title: string, content: string, tags: string[]) => {
  try {
    const postDocRef = doc(db, 'posts', postId);
    
    await updateDoc(postDocRef, {
      title: title,
      content: content,
      updatedAt: serverTimestamp(),
      tags: tags
    });
    
    console.log("Document updated with ID: ", postId);
  } catch (error) {
    console.error("Error updating post:", error);
    throw error;
  }
};

export const deletePost = async (postId: string) => {
  try {
    const postDocRef = doc(db, 'posts', postId);
    await deleteDoc(postDocRef);
    console.log("Document deleted with ID: ", postId);
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
};

export const likePost = async (postId: string, userId: string) => {
  try {
    const postDocRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postDocRef);
    
    if (!postDoc.exists()) {
      console.log("No such document!");
      return;
    }
    
    const postData = postDoc.data();
    const likes = postData.likes || 0;
    
    await updateDoc(postDocRef, {
      likes: increment(1)
    });
    
    console.log(`Post with ID ${postId} liked by user ${userId}`);
  } catch (error) {
    console.error("Error liking post:", error);
    throw error;
  }
};

export const unlikePost = async (postId: string, userId: string) => {
    try {
        const postDocRef = doc(db, 'posts', postId);
        const postDoc = await getDoc(postDocRef);

        if (!postDoc.exists()) {
            console.log("No such document!");
            return;
        }

        const postData = postDoc.data();
        const likes = postData.likes || 0;

        if (likes > 0) {
            await updateDoc(postDocRef, {
                likes: increment(-1)
            });

            console.log(`Post with ID ${postId} unliked by user ${userId}`);
        } else {
            console.log(`Post with ID ${postId} already has 0 likes`);
        }
    } catch (error) {
        console.error("Error unliking post:", error);
        throw error;
    }
};

export const addComment = async (postId: string, userId: string, content: string) => {
  try {
    const newCommentRef = await addDoc(collection(db, `posts/${postId}/comments`), {
      userId: userId,
      content: content,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Increment comment count on the post
    const postDocRef = doc(db, 'posts', postId);
    await updateDoc(postDocRef, {
      commentCount: increment(1)
    });
    
    console.log("Comment added with ID: ", newCommentRef.id);
    return newCommentRef.id;
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
};

export const getComments = async (postId: string) => {
  try {
    const commentsRef = collection(db, `posts/${postId}/comments`);
    const q = query(commentsRef, orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const comments = [];
    for (const docSnapshot of querySnapshot.docs) {
      const commentData = docSnapshot.data();
      const userData = await getUserData(commentData.userId);
      
      comments.push({
        id: docSnapshot.id,
        content: commentData.content,
        createdAt: commentData.createdAt.toDate(),
        updatedAt: commentData.updatedAt?.toDate(),
        userId: commentData.userId,
        author: userData
      });
    }
    
    return comments;
  } catch (error) {
    console.error("Error getting comments:", error);
    throw error;
  }
};

export const updateComment = async (postId: string, commentId: string, content: string) => {
  try {
    const commentDocRef = doc(db, `posts/${postId}/comments`, commentId);
    
    await updateDoc(commentDocRef, {
      content: content,
      updatedAt: serverTimestamp()
    });
    
    console.log("Comment updated with ID: ", commentId);
  } catch (error) {
    console.error("Error updating comment:", error);
    throw error;
  }
};

export const deleteComment = async (postId: string, commentId: string) => {
  try {
    const commentDocRef = doc(db, `posts/${postId}/comments`, commentId);
    
    // Decrement comment count on the post
    const postDocRef = doc(db, 'posts', postId);
    await updateDoc(postDocRef, {
      commentCount: increment(-1)
    });
    
    await deleteDoc(commentDocRef);
    console.log("Comment deleted with ID: ", commentId);
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
};
