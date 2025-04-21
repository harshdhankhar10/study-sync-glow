
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ForumPost, PostCategory } from '@/types/forum';

export const createDemoForumData = async (userId: string, userName: string) => {
  try {
    // First check if we already have demo posts for this user
    const postsRef = collection(db, 'forumPosts');
    const q = query(postsRef, where('authorId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // User already has posts, don't create demo data
      return;
    }
    
    // Create demo posts
    const demoPosts = [
      {
        title: "What study techniques helped you master difficult concepts?",
        content: "I'm currently struggling with understanding advanced calculus concepts. I've tried watching videos and reading textbooks, but the material isn't sticking. What study techniques have worked for you when tackling challenging subjects? I'm especially interested in active recall methods and spaced repetition approaches. Also, if anyone has specific resources for calculus that they found helpful, please share!",
        category: 'question' as PostCategory,
        authorId: userId,
        authorName: userName,
        tags: [
          { id: 'tag-1', name: 'Study Techniques' },
          { id: 'tag-2', name: 'Calculus' },
          { id: 'tag-3', name: 'Active Learning' }
        ],
        isAIGenerated: false
      },
      {
        title: "Which study environment do you prefer?",
        content: "I'm curious about everyone's preferred study environment. I'm trying to optimize my study space and routine.",
        category: 'poll' as PostCategory,
        authorId: userId,
        authorName: userName,
        tags: [
          { id: 'tag-1', name: 'Study Environment' },
          { id: 'tag-2', name: 'Productivity' }
        ],
        isPoll: true,
        pollOptions: [
          { id: 'option-1', text: 'Library - quiet and structured', votes: 12 },
          { id: 'option-2', text: 'Coffee shop - ambient noise', votes: 8 },
          { id: 'option-3', text: 'Home office - convenient and comfortable', votes: 15 },
          { id: 'option-4', text: 'Outdoors - fresh air and inspiration', votes: 5 }
        ],
        isAIGenerated: false
      },
      {
        title: "How AI helped me analyze my study habits and improve",
        content: "I've been using the AI insights feature for the past month, and it's completely transformed my study routine. The AI analyzed my learning patterns and gave me personalized recommendations that addressed my specific challenges.\n\nSpecifically, the AI pointed out that I was spending too much time on passive learning (just reading) and not enough on active recall. It suggested I integrate more practice problems and self-quizzing into my sessions.\n\nAfter implementing these changes, I've seen my retention improve significantly. The weekly feedback feature has been invaluable in keeping me accountable and tracking my progress over time.\n\nHas anyone else had success with the AI insights feature? I'd love to hear how others are using it!",
        category: 'ai-spotlight' as PostCategory,
        authorId: userId,
        authorName: userName,
        tags: [
          { id: 'tag-1', name: 'AI Learning' },
          { id: 'tag-2', name: 'Study Habits' },
          { id: 'tag-3', name: 'Success Story' }
        ],
        aiSummary: "The user shares how AI insights significantly improved their study habits by analyzing learning patterns and providing personalized recommendations. Specifically, the AI suggested shifting from passive reading to active recall methods, which notably enhanced information retention. The user values the accountability provided by the weekly feedback feature.",
        isAIGenerated: false
      },
      {
        title: "Looking for study partners for CompSci course",
        content: "Hi everyone! I'm taking CS301: Data Structures & Algorithms this semester and looking for study partners. I'm available on weekday evenings and Sunday afternoons. My goal is to form a small group (3-4 people) where we can work through problem sets together, explain concepts to each other, and prepare for exams.\n\nIdeally, I'd like to meet 2-3 times a week, alternating between virtual and in-person sessions at the campus library. I find explaining concepts to others really helps solidify my understanding.\n\nIf you're also taking this course or have a strong interest in the subject and want to join, please comment below with your availability and goals!",
        category: 'collab-request' as PostCategory,
        authorId: userId,
        authorName: userName,
        tags: [
          { id: 'tag-1', name: 'Computer Science' },
          { id: 'tag-2', name: 'Study Group' },
          { id: 'tag-3', name: 'Algorithms' }
        ],
        isAIGenerated: false
      },
      {
        title: "Essential Chrome extensions for students - my top 5",
        content: "After years of trial and error, I've found these Chrome extensions to be absolute game-changers for my productivity as a student:\n\n1. **Forest** - Helps me stay focused by blocking distracting websites during study sessions. I love the gamification aspect where you grow virtual trees when you successfully complete a focus session.\n\n2. **Zotero Connector** - Absolutely essential for research. One-click saving of articles and automatic citation formatting has saved me countless hours.\n\n3. **Grammarly** - Catches writing mistakes in real-time anywhere I type online. The tone suggestions have helped improve my academic writing significantly.\n\n4. **Notion Web Clipper** - I use Notion for all my notes, and this lets me save articles, resources, and ideas directly to my organized notebooks.\n\n5. **Marinara Timer** - A pomodoro timer that helps me implement the 25-5 technique effectively.\n\nWhat extensions do you find most helpful? Any recommendations I should try?",
        category: 'study-tip' as PostCategory,
        authorId: userId,
        authorName: userName,
        tags: [
          { id: 'tag-1', name: 'Productivity Tools' },
          { id: 'tag-2', name: 'Browser Extensions' },
          { id: 'tag-3', name: 'Technology Tips' }
        ],
        isAIGenerated: false
      }
    ];
    
    // Add demo posts to Firestore
    for (const post of demoPosts) {
      await addDoc(collection(db, 'forumPosts'), {
        ...post,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        upvotes: Math.floor(Math.random() * 20),
        downvotes: Math.floor(Math.random() * 5),
        viewCount: Math.floor(Math.random() * 100) + 20,
        commentCount: Math.floor(Math.random() * 10),
        bookmarkedBy: []
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error creating demo forum posts:', error);
    return false;
  }
};
