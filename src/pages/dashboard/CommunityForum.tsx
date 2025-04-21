
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MessageSquare, 
  Users, 
  Bell, 
  Star, 
  ThumbsUp, 
  Bookmark, 
  Flag, 
  Search,
  Edit, 
  Upload, 
  Link, 
  Filter, 
  Plus
} from 'lucide-react';
import { ForumPost, PostCategory } from '@/types/forum';
import { getPosts } from '@/services/forumService';
import { toast } from 'sonner';

const CommunityForum = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PostCategory | 'all'>('all');
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const category = activeTab !== 'all' ? activeTab as PostCategory : undefined;
        const fetchedPosts = await getPosts(category, 10);
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast.error('Failed to load forum posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [activeTab]);

  const handleCreatePost = () => {
    navigate('/dashboard/community-forum/create-post');
  };

  const handleViewPost = (postId: string) => {
    navigate(`/dashboard/community-forum/post/${postId}`);
  };

  const getCategoryIcon = (category: PostCategory) => {
    switch (category) {
      case 'announcement':
        return <Bell className="text-blue-500" />;
      case 'question':
        return <MessageSquare className="text-purple-500" />;
      case 'study-tip':
        return <Star className="text-amber-500" />;
      case 'resource':
        return <Link className="text-green-500" />;
      case 'collab-request':
        return <Users className="text-indigo-500" />;
      case 'brainstorm':
        return <Edit className="text-orange-500" />;
      case 'poll':
        return <Filter className="text-red-500" />;
      case 'ai-spotlight':
        return <Star className="text-violet-500" />;
      default:
        return <MessageSquare className="text-gray-500" />;
    }
  };

  const getCategoryLabel = (category: PostCategory) => {
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

  const getCategoryColor = (category: PostCategory) => {
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

  const renderPostCards = () => {
    if (loading) {
      return Array(5).fill(0).map((_, index) => (
        <Card key={index} className="mb-4">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/4 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
          <CardFooter className="pt-0">
            <Skeleton className="h-6 w-full" />
          </CardFooter>
        </Card>
      ));
    }

    if (posts.length === 0) {
      return (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium text-gray-600">No posts found</h3>
          <p className="text-gray-500 mt-2">Be the first to post in this category!</p>
          <Button onClick={handleCreatePost} className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> Create Post
          </Button>
        </div>
      );
    }

    return posts
      .filter(post => post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      post.content.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(post => (
        <Card key={post.id} className="mb-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewPost(post.id)}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className={getCategoryColor(post.category)}>
                  {getCategoryLabel(post.category)}
                </Badge>
                {post.isPoll && <Badge variant="outline">Poll</Badge>}
                {post.isAIGenerated && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                    AI Generated
                  </Badge>
                )}
              </div>
              {post.isSticky && (
                <Badge variant="outline" className="text-xs">
                  Pinned
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg mt-2">{post.title}</CardTitle>
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <span>By {post.authorName}</span>
              <span>•</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 line-clamp-3">{post.content}</p>
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {post.tags.map(tag => (
                  <Badge key={tag.id} variant="outline" className="text-xs">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0">
            <div className="flex items-center space-x-4 text-gray-500 text-sm w-full">
              <div className="flex items-center">
                <ThumbsUp className="h-4 w-4 mr-1" />
                <span>{post.upvotes - post.downvotes}</span>
              </div>
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-1" />
                <span>{post.commentCount}</span>
              </div>
              <div className="flex items-center">
                <Bookmark className="h-4 w-4 mr-1" />
                <span>{post.bookmarkedBy?.length || 0}</span>
              </div>
              {post.viewCount > 0 && (
                <div className="flex items-center ml-auto">
                  <span>{post.viewCount} views</span>
                </div>
              )}
            </div>
          </CardFooter>
        </Card>
      ));
  };

  return (
    <div className="container py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-3/4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Community Forum</h1>
              <p className="text-gray-500 mt-1">Discuss, share, and learn together</p>
            </div>
            <Button onClick={handleCreatePost} className="mt-4 sm:mt-0">
              <Plus className="mr-2 h-4 w-4" /> Create Post
            </Button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search posts..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="mb-4 w-full overflow-x-auto flex flex-nowrap">
              <TabsTrigger value="all">All Posts</TabsTrigger>
              <TabsTrigger value="announcement">Announcements</TabsTrigger>
              <TabsTrigger value="question">Q&A</TabsTrigger>
              <TabsTrigger value="study-tip">Study Tips</TabsTrigger>
              <TabsTrigger value="resource">Resources</TabsTrigger>
              <TabsTrigger value="collab-request">Collab Requests</TabsTrigger>
              <TabsTrigger value="brainstorm">Brainstorm</TabsTrigger>
              <TabsTrigger value="poll">Polls</TabsTrigger>
              <TabsTrigger value="ai-spotlight">AI Spotlights</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-2">
              {renderPostCards()}
            </TabsContent>
          </Tabs>
        </div>

        <div className="w-full lg:w-1/4">
          <Card>
            <CardHeader>
              <CardTitle>Community Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Posts</span>
                <span className="font-medium">143</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Active Discussions</span>
                <span className="font-medium">27</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Members</span>
                <span className="font-medium">312</span>
              </div>
              <Separator />
              <h4 className="font-medium">Top Contributors</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-gray-200 mr-2"></div>
                  <div>
                    <p className="font-medium">Sarah J.</p>
                    <p className="text-xs text-gray-500">42 posts</p>
                  </div>
                  <Badge className="ml-auto">Pro</Badge>
                </div>
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-gray-200 mr-2"></div>
                  <div>
                    <p className="font-medium">Michael T.</p>
                    <p className="text-xs text-gray-500">36 posts</p>
                  </div>
                  <Badge className="ml-auto">Mentor</Badge>
                </div>
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-gray-200 mr-2"></div>
                  <div>
                    <p className="font-medium">Alex W.</p>
                    <p className="text-xs text-gray-500">29 posts</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View All Members
              </Button>
            </CardFooter>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Forum Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>• Be respectful and constructive in your feedback</p>
              <p>• Stay on topic and use appropriate categories</p>
              <p>• No spamming or self-promotion without context</p>
              <p>• Give credit when sharing resources</p>
              <p>• Report inappropriate content</p>
            </CardContent>
            <CardFooter>
              <Button variant="link" className="px-0">Read Full Guidelines</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CommunityForum;
