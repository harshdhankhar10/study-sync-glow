
export type PostCategory = 
  | 'announcement' 
  | 'question' 
  | 'study-tip' 
  | 'resource' 
  | 'collab-request' 
  | 'brainstorm' 
  | 'poll' 
  | 'ai-spotlight';

export interface PostTag {
  id: string;
  name: string;
  color?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: PostCategory;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  upvotes: number;
  downvotes: number;
  viewCount: number;
  commentCount: number;
  tags: PostTag[];
  isSticky?: boolean;
  isPoll?: boolean;
  pollOptions?: PollOption[];
  aiSummary?: string;
  attachmentURL?: string;
  attachmentType?: string;
  isSolved?: boolean; // For questions
  isAIGenerated?: boolean;
  bookmarkedBy?: string[];
}

export interface ForumComment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  upvotes: number;
  downvotes: number;
  isAcceptedAnswer?: boolean; // For comments on questions
  parentCommentId?: string; // For nested replies
}

export interface ForumUser {
  id: string;
  displayName: string;
  photoURL?: string;
  postCount: number;
  commentCount: number;
  reputationPoints: number;
  badges: string[];
  joinedAt: Date;
  lastActive?: Date;
  role: 'user' | 'moderator' | 'admin';
}
