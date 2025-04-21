
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Bookmark, 
  BookmarkCheck,
  Flag, 
  ArrowLeft,
  Share,
  Brain,
  Calendar
} from 'lucide-react';
import { ForumPost, ForumComment, PollOption } from '@/types/forum';
import { 
  getPost, 
  getComments, 
  createComment, 
  upvotePost, 
  downvotePost, 
  bookmarkPost, 
  unbookmarkPost,
  voteInPoll
} from '@/services/forumService';

const ForumPostDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [selectedPollOption, setSelectedPollOption] = useState<string>('');
  const [hasVoted, setHasVoted] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    if (!postId) return;
    
    const fetchPostData = async () => {
      try {
        setLoading(true);
        const postData = await getPost(postId);
        if (postData) {
          setPost(postData);
          setBookmarked(postData.bookmarkedBy?.includes(currentUser?.uid || '') || false);
          
          // Calculate total votes for poll
          if (postData.isPoll && postData.pollOptions) {
            const total = postData.pollOptions.reduce((sum, option) => sum + option.votes, 0);
            setTotalVotes(total);
            
            // Check if user has voted (simple check - in real app would be tracked in DB)
            setHasVoted(total > 0);
          }
          
          const commentsData = await getComments(postId);
          setComments(commentsData);
        } else {
          toast.error('Post not found');
          navigate('/dashboard/community-forum');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        toast.error('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPostData();
  }, [postId, navigate, currentUser?.uid]);

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !currentUser || !postId) return;
    
    setSubmittingComment(true);
    try {
      await createComment({
        postId,
        content: commentText,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        authorPhotoURL: currentUser.photoURL || undefined,
      });
      
      setCommentText('');
      
      // Refresh comments
      const commentsData = await getComments(postId);
      setComments(commentsData);
      
      toast.success('Comment posted');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUpvote = async () => {
    if (!currentUser || !postId) return;
    
    try {
      await upvotePost(postId, currentUser.uid);
      
      // Update post in local state
      setPost(prev => {
        if (!prev) return null;
        return {
          ...prev,
          upvotes: prev.upvotes + 1
        };
      });
      
      toast.success('Post upvoted');
    } catch (error) {
      console.error('Error upvoting post:', error);
      toast.error('Failed to upvote post');
    }
  };

  const handleDownvote = async () => {
    if (!currentUser || !postId) return;
    
    try {
      await downvotePost(postId, currentUser.uid);
      
      // Update post in local state
      setPost(prev => {
        if (!prev) return null;
        return {
          ...prev,
          downvotes: prev.downvotes + 1
        };
      });
      
      toast.success('Post downvoted');
    } catch (error) {
      console.error('Error downvoting post:', error);
      toast.error('Failed to downvote post');
    }
  };

  const handleBookmark = async () => {
    if (!currentUser || !postId) return;
    
    try {
      if (bookmarked) {
        await unbookmarkPost(postId, currentUser.uid);
        setBookmarked(false);
        toast.success('Bookmark removed');
      } else {
        await bookmarkPost(postId, currentUser.uid);
        setBookmarked(true);
        toast.success('Post bookmarked');
      }
    } catch (error) {
      console.error('Error bookmarking/unbookmarking post:', error);
      toast.error('Failed to update bookmark');
    }
  };

  const handleVoteInPoll = async () => {
    if (!currentUser || !postId || !selectedPollOption || hasVoted) return;
    
    try {
      await voteInPoll(postId, selectedPollOption, currentUser.uid);
      
      // Update poll options in local state
      setPost(prev => {
        if (!prev || !prev.pollOptions) return prev;
        
        const updatedOptions = prev.pollOptions.map(option => {
          if (option.id === selectedPollOption) {
            return {
              ...option,
              votes: option.votes + 1
            };
          }
          return option;
        });
        
        return {
          ...prev,
          pollOptions: updatedOptions
        };
      });
      
      setHasVoted(true);
      setTotalVotes(prev => prev + 1);
      toast.success('Vote recorded');
    } catch (error) {
      console.error('Error voting in poll:', error);
      toast.error('Failed to record vote');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title || 'Shared post',
        text: `Check out this post: ${post?.title}`,
        url: window.location.href,
      })
        .then(() => console.log('Successful share'))
        .catch((error) => console.log('Error sharing:', error));
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success('Link copied to clipboard'))
        .catch(() => toast.error('Failed to copy link'));
    }
  };

  const handleReport = () => {
    toast.info('Report functionality will be implemented soon');
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'announcement':
        return 'Announcement';
      case 'question':
        return 'Question';
      case 'study-tip':
        return 'Study Tip';
      case 'resource':
        return 'Resource';
      case 'collab-request':
        return 'Collab Request';
      case 'brainstorm':
        return 'Brainstorm';
      case 'poll':
        return 'Poll';
      case 'ai-spotlight':
        return 'AI Spotlight';
      default:
        return 'Post';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'announcement':
        return 'bg-blue-100 text-blue-800';
      case 'question':
        return 'bg-purple-100 text-purple-800';
      case 'study-tip':
        return 'bg-amber-100 text-amber-800';
      case 'resource':
        return 'bg-green-100 text-green-800';
      case 'collab-request':
        return 'bg-indigo-100 text-indigo-800';
      case 'brainstorm':
        return 'bg-orange-100 text-orange-800';
      case 'poll':
        return 'bg-red-100 text-red-800';
      case 'ai-spotlight':
        return 'bg-violet-100 text-violet-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderPoll = () => {
    if (!post?.isPoll || !post.pollOptions) return null;
    
    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
        <h3 className="font-medium mb-3">Poll: {post.title}</h3>
        <RadioGroup 
          value={selectedPollOption} 
          onValueChange={setSelectedPollOption} 
          className="space-y-3"
          disabled={hasVoted}
        >
          {post.pollOptions.map(option => {
            const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
            
            return (
              <div key={option.id} className="space-y-1">
                <div className="flex items-center">
                  <RadioGroupItem 
                    value={option.id} 
                    id={option.id} 
                    disabled={hasVoted}
                  />
                  <label 
                    htmlFor={option.id} 
                    className="ml-2 text-sm font-medium cursor-pointer"
                  >
                    {option.text}
                  </label>
                  {hasVoted && (
                    <span className="ml-auto text-sm font-medium">
                      {option.votes} votes ({percentage}%)
                    </span>
                  )}
                </div>
                {hasVoted && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </RadioGroup>
        
        {!hasVoted && (
          <Button 
            onClick={handleVoteInPoll} 
            className="mt-4"
            disabled={!selectedPollOption}
          >
            Submit Vote
          </Button>
        )}
        
        <p className="text-sm text-gray-500 mt-2">
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} so far
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container max-w-4xl py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full mb-4" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container max-w-4xl py-6">
        <div className="text-center">
          <h2 className="text-xl font-bold">Post not found</h2>
          <p className="text-gray-500 mt-2">The post you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/dashboard/community-forum')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forum
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard/community-forum')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Forum
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge className={getCategoryColor(post.category)}>
              {getCategoryLabel(post.category)}
            </Badge>
            {post.isPoll && <Badge variant="outline">Poll</Badge>}
            {post.isAIGenerated && (
              <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                AI Generated
              </Badge>
            )}
            {post.isSticky && (
              <Badge variant="outline" className="text-xs">
                Pinned
              </Badge>
            )}
          </div>
          
          <CardTitle className="text-2xl">{post.title}</CardTitle>
          
          <div className="flex items-center mt-2">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src={post.authorPhotoURL} />
              <AvatarFallback>
                {post.authorName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{post.authorName}</p>
              <p className="text-xs text-gray-500 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {post.aiSummary && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100 mb-4">
              <div className="flex items-center mb-2">
                <Brain className="h-5 w-5 text-purple-500 mr-2" />
                <h4 className="font-medium">AI Summary</h4>
              </div>
              <p className="text-sm text-gray-700">{post.aiSummary}</p>
            </div>
          )}
          
          <div className="prose max-w-none">
            <p className="whitespace-pre-line">{post.content}</p>
          </div>
          
          {renderPoll()}
          
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {post.tags.map(tag => (
                <Badge key={tag.id} variant="outline" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
          
          {post.attachmentURL && (
            <div className="p-3 bg-gray-50 rounded-lg border flex items-center">
              <div className="flex-1 truncate">
                <p className="text-sm font-medium">Attachment</p>
                <p className="text-xs text-blue-600 truncate">{post.attachmentURL}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={post.attachmentURL} target="_blank" rel="noopener noreferrer">
                  View
                </a>
              </Button>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-wrap justify-between items-center gap-2 pt-2">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handleUpvote}>
              <ThumbsUp className="h-4 w-4 mr-1" />
              {post.upvotes}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownvote}>
              <ThumbsDown className="h-4 w-4 mr-1" />
              {post.downvotes}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleBookmark}>
              {bookmarked ? (
                <BookmarkCheck className="h-4 w-4 mr-1 text-blue-500" />
              ) : (
                <Bookmark className="h-4 w-4 mr-1" />
              )}
              {bookmarked ? 'Saved' : 'Save'}
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share className="h-4 w-4 mr-1" />
              Share
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReport}>
              <Flag className="h-4 w-4 mr-1" />
              Report
            </Button>
          </div>
        </CardFooter>
      </Card>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">
            Comments ({comments.length})
          </h3>
        </div>

        {currentUser && (
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.photoURL || undefined} />
                <AvatarFallback>
                  {currentUser.displayName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleCommentSubmit} 
                    disabled={!commentText.trim() || submittingComment}
                  >
                    Post Comment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto" />
            <h3 className="text-lg font-medium text-gray-600 mt-2">No comments yet</h3>
            <p className="text-gray-500 mt-1">Be the first to comment on this post</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.authorPhotoURL} />
                    <AvatarFallback>
                      {comment.authorName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{comment.authorName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {comment.isAcceptedAnswer && (
                    <Badge className="ml-auto bg-green-100 text-green-800">
                      Accepted Answer
                    </Badge>
                  )}
                </div>
                <div className="mt-2 whitespace-pre-line">
                  {comment.content}
                </div>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <Button variant="ghost" size="sm">
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    {comment.upvotes}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ThumbsDown className="h-3 w-3 mr-1" />
                    {comment.downvotes}
                  </Button>
                  <Button variant="ghost" size="sm">
                    Reply
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumPostDetail;
