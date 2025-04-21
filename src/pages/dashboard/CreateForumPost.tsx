
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from '@/components/ui/select';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Search, X, Star, Plus, Brain } from 'lucide-react';
import { PostCategory, PostTag, ForumPost, PollOption } from '@/types/forum';
import { createPost, generateTags, suggestSimilarPosts, generateAISummary } from '@/services/forumService';

const postSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters'),
  category: z.enum(['announcement', 'question', 'study-tip', 'resource', 'collab-request', 'brainstorm', 'poll', 'ai-spotlight'] as const),
  allowComments: z.boolean().default(true),
  notifyGroupMembers: z.boolean().default(false),
  isPoll: z.boolean().default(false),
  generateAISummary: z.boolean().default(false),
  pollOptions: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof postSchema>;

const CreateForumPost = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<PostTag[]>([]);
  const [similarPosts, setSimilarPosts] = useState<ForumPost[]>([]);
  const [showSimilarPosts, setShowSimilarPosts] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isCheckingSimilar, setIsCheckingSimilar] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      content: '',
      category: 'question',
      allowComments: true,
      notifyGroupMembers: false,
      isPoll: false,
      generateAISummary: false,
      pollOptions: ['', ''],
    },
  });

  const watchTitle = form.watch('title');
  const watchContent = form.watch('content');
  const watchCategory = form.watch('category');
  const watchIsPoll = form.watch('isPoll');
  const watchPollOptions = form.watch('pollOptions');
  const watchGenerateAISummary = form.watch('generateAISummary');

  useEffect(() => {
    // Check for similar posts when title has significant content
    if (watchTitle.length > 10) {
      handleCheckSimilarPosts();
    }
  }, [watchTitle]);

  useEffect(() => {
    // Auto-generate tags when both title and content have significant content
    if (watchTitle.length > 10 && watchContent.length > 30) {
      handleGenerateTags();
    }
  }, [watchTitle, watchContent]);

  useEffect(() => {
    // Generate AI summary when toggled on and there's sufficient content
    if (watchGenerateAISummary && watchContent.length > 50 && !aiSummary) {
      handleGenerateAISummary();
    }
  }, [watchGenerateAISummary, watchContent]);

  const handleGenerateTags = async () => {
    if (isGeneratingTags || watchTitle.length < 10 || watchContent.length < 30) return;

    setIsGeneratingTags(true);
    try {
      const generatedTags = await generateTags(watchTitle, watchContent);
      setTags(generatedTags);
    } catch (error) {
      console.error('Error generating tags:', error);
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const handleCheckSimilarPosts = async () => {
    if (isCheckingSimilar || watchTitle.length < 10) return;

    setIsCheckingSimilar(true);
    try {
      const posts = await suggestSimilarPosts(watchTitle, watchContent);
      setSimilarPosts(posts);
      setShowSimilarPosts(posts.length > 0);
    } catch (error) {
      console.error('Error checking similar posts:', error);
    } finally {
      setIsCheckingSimilar(false);
    }
  };

  const handleGenerateAISummary = async () => {
    if (isGeneratingSummary || watchContent.length < 50) return;

    setIsGeneratingSummary(true);
    try {
      const summary = await generateAISummary(watchContent);
      setAiSummary(summary);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      toast.error('Failed to generate AI summary');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!currentUser) {
      toast.error('You must be logged in to create a post');
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare poll options if it's a poll
      let pollOptions: PollOption[] | undefined;
      if (values.isPoll && values.pollOptions) {
        pollOptions = values.pollOptions
          .filter(option => option.trim() !== '')
          .map((option, index) => ({
            id: `option-${index}`,
            text: option,
            votes: 0
          }));
      }

      // Create the post
      const postId = await createPost({
        title: values.title,
        content: values.content,
        category: values.category,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        authorPhotoURL: currentUser.photoURL || undefined,
        tags: tags,
        isPoll: values.isPoll,
        pollOptions: pollOptions,
        aiSummary: aiSummary || undefined,
        isAIGenerated: false,
      });

      toast.success('Post created successfully!');
      navigate(`/dashboard/community-forum/post/${postId}`);
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addPollOption = () => {
    const currentOptions = form.getValues('pollOptions') || [];
    form.setValue('pollOptions', [...currentOptions, '']);
  };

  const removePollOption = (index: number) => {
    const currentOptions = form.getValues('pollOptions') || [];
    if (currentOptions.length <= 2) return; // Keep at least 2 options
    form.setValue('pollOptions', currentOptions.filter((_, i) => i !== index));
  };

  const addTag = (tag: PostTag) => {
    if (!tags.some(t => t.id === tag.id)) {
      setTags([...tags, tag]);
    }
  };

  const removeTag = (tagId: string) => {
    setTags(tags.filter(tag => tag.id !== tagId));
  };

  const renderCategories = () => {
    return (
      <Select
        value={watchCategory}
        onValueChange={value => form.setValue('category', value as PostCategory)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="question">Q&A / Help Zone</SelectItem>
          <SelectItem value="study-tip">Study Tips</SelectItem>
          <SelectItem value="resource">Resources</SelectItem>
          <SelectItem value="collab-request">Group Collab Requests</SelectItem>
          <SelectItem value="brainstorm">Brainstorm Corner</SelectItem>
          <SelectItem value="poll">Polls & Opinions</SelectItem>
          <SelectItem value="ai-spotlight">AI Spotlights</SelectItem>
          <SelectItem value="announcement">Announcements</SelectItem>
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="container max-w-4xl py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Create New Post</h1>
          <p className="text-gray-500">Share your thoughts, questions, or resources with the community</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/dashboard/community-forum')}>
          Cancel
        </Button>
      </div>

      {showSimilarPosts && similarPosts.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Search className="mr-2 h-5 w-5 text-amber-500" />
              Similar posts found
            </CardTitle>
            <CardDescription>
              We found some posts that might be similar to what you're about to post.
              Consider checking them out before creating a new post.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {similarPosts.slice(0, 3).map(post => (
                <div key={post.id} className="p-3 bg-white rounded-lg border">
                  <h4 className="font-medium text-blue-600 hover:underline cursor-pointer"
                    onClick={() => navigate(`/dashboard/community-forum/post/${post.id}`)}>
                    {post.title}
                  </h4>
                  <p className="text-sm text-gray-500 line-clamp-1">{post.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" size="sm" onClick={() => setShowSimilarPosts(false)}>
              Dismiss
            </Button>
          </CardFooter>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create Post</CardTitle>
          <CardDescription>
            Fill out the form below to create your post. Add details to help others understand and engage with your content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a clear, specific title" {...field} />
                    </FormControl>
                    <FormDescription>
                      A good title helps others find your post
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      {renderCategories()}
                    </FormControl>
                    <FormDescription>
                      Select the most relevant category for your post
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Write your post content here..." 
                        className="min-h-[200px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      You can use markdown for formatting
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchGenerateAISummary && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                  <div className="flex items-center mb-2">
                    <Brain className="h-5 w-5 text-purple-500 mr-2" />
                    <h4 className="font-medium">AI Summary</h4>
                  </div>
                  
                  {isGeneratingSummary ? (
                    <div className="flex items-center text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating summary...
                    </div>
                  ) : aiSummary ? (
                    <div className="text-sm text-gray-700">{aiSummary}</div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Write more content to generate a summary
                    </div>
                  )}
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tags.map(tag => (
                      <Badge key={tag.id} variant="secondary" className="px-3 py-1">
                        {tag.name}
                        <X 
                          className="ml-1 h-3 w-3 text-gray-500 cursor-pointer hover:text-gray-700"
                          onClick={() => removeTag(tag.id)}
                        />
                      </Badge>
                    ))}
                    {tags.length === 0 && (
                      <span className="text-sm text-gray-500">
                        {isGeneratingTags ? 'Generating tags...' : 'No tags yet. Tags will be generated based on your content.'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={handleGenerateTags}
                      disabled={isGeneratingTags || watchTitle.length < 10 || watchContent.length < 30}
                    >
                      {isGeneratingTags ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Star className="mr-2 h-4 w-4" />
                          Generate Tags
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {watchCategory === 'poll' && (
                  <FormField
                    control={form.control}
                    name="isPoll"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Create a poll</FormLabel>
                          <FormDescription>
                            Allow users to vote on different options
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                {watchIsPoll && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Poll Options</h4>
                    {watchPollOptions?.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(watchPollOptions || [])];
                            newOptions[index] = e.target.value;
                            form.setValue('pollOptions', newOptions);
                          }}
                          placeholder={`Option ${index + 1}`}
                        />
                        {watchPollOptions && watchPollOptions.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePollOption(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPollOption}
                      className="mt-2"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Option
                    </Button>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="generateAISummary"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Generate AI Summary</FormLabel>
                        <FormDescription>
                          Create a concise summary of your post using AI
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allowComments"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Allow Comments</FormLabel>
                        <FormDescription>
                          Let others comment on your post
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notifyGroupMembers"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Notify Group Members</FormLabel>
                        <FormDescription>
                          Send notification to your study group members
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard/community-forum')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Post'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateForumPost;
