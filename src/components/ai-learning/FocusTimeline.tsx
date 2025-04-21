
import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { GEMINI_API_KEY, GEMINI_ENDPOINT } from '@/lib/ai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format, subWeeks, addWeeks } from 'date-fns';
import { Calendar, BookText, Brain, ArrowLeft, ArrowRight, Check, Clock, ArrowUpRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface FocusTimelineProps {
  userData: any;
  refreshData: () => void;
}

export default function FocusTimeline({ userData, refreshData }: FocusTimelineProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<'past' | 'present' | 'future'>('present');

  const generateTimeline = async () => {
    if (!currentUser || !userData) return;
    
    try {
      setLoading(true);
      toast({
        title: "Generating your learning timeline",
        description: "AI is analyzing your data to create your personalized learning journey...",
      });
      
      // Prepare user data for AI analysis
      const userContext = {
        skills: userData.skills?.skills || [],
        interests: userData.skills?.interests || [],
        goals: userData.goals?.goals || [],
        recentSessions: userData.sessions?.map((s: any) => ({
          title: s.title,
          topic: s.topic,
          date: s.date instanceof Date ? format(s.date, 'yyyy-MM-dd') : format(s.date.toDate(), 'yyyy-MM-dd')
        })) || [],
        skillGaps: userData.insights?.skillGapAnalysis || [],
        strengths: userData.insights?.weeklyFeedback?.strengths || [],
        improvements: userData.insights?.weeklyFeedback?.improvements || [],
      };
      
      // Make API call to Gemini
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
                  text: `Generate a personalized learning journey timeline for a student based on the following data:
                  
                  User Context: ${JSON.stringify(userContext)}
                  Current Date: ${format(new Date(), 'yyyy-MM-dd')}
                  
                  Create a learning timeline with three sections:
                  
                  1. PAST (What you've learned): 
                     - Key topics/skills they've covered
                     - Milestones achieved
                     - Areas of strength
                  
                  2. PRESENT (What you're working on):
                     - Current focus areas
                     - Active challenges 
                     - Key skills being developed
                  
                  3. FUTURE (What to tackle next):
                     - Recommended next topics
                     - Skills to develop
                     - Long-term goals alignment
                  
                  For each section, provide 3-5 items with title, description, and status/priority.
                  
                  Return the response as a valid JSON object:
                  {
                    "generated": "YYYY-MM-DD",
                    "past": [
                      {
                        "title": "Item title",
                        "description": "Description of what was learned",
                        "status": "completed",
                        "date": "YYYY-MM-DD",
                        "confidence": "high|medium|low"
                      }
                    ],
                    "present": [
                      {
                        "title": "Item title",
                        "description": "Description of what is being worked on",
                        "status": "in-progress",
                        "priority": "high|medium|low",
                        "estimatedCompletion": "YYYY-MM-DD"
                      }
                    ],
                    "future": [
                      {
                        "title": "Item title",
                        "description": "Description of what to learn next",
                        "priority": "high|medium|low",
                        "recommendedStartDate": "YYYY-MM-DD",
                        "prerequisites": ["prerequisite 1", "prerequisite 2"]
                      }
                    ],
                    "insights": {
                      "strengths": ["Strength 1", "Strength 2"],
                      "challenges": ["Challenge 1", "Challenge 2"],
                      "recommendations": ["Recommendation 1", "Recommendation 2"]
                    }
                  }`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1536,
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract the JSON from the text response
      let jsonText = data.candidates[0].content.parts[0].text;
      
      // Find JSON content (between curly braces)
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not parse AI response");
      }
      
      const timelineData = JSON.parse(jsonMatch[0]);
      
      // Save to Firestore
      await setDoc(doc(db, 'focusTimelines', currentUser.uid), {
        ...timelineData,
        lastUpdated: new Date(),
        userId: currentUser.uid
      });
      
      toast({
        title: "Timeline created!",
        description: "Your personalized learning journey has been mapped out",
      });
      
      refreshData();
    } catch (error: any) {
      console.error("Error generating timeline:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate timeline. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const timeline = userData?.timeline;
  
  // Functions to render status/priority badges
  const renderStatus = (status: string) => {
    if (status === 'completed') {
      return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Completed</Badge>;
    } else if (status === 'in-progress') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">In Progress</Badge>;
    } else {
      return <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">{status}</Badge>;
    }
  };
  
  const renderPriority = (priority: string) => {
    if (priority === 'high') {
      return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">High Priority</Badge>;
    } else if (priority === 'medium') {
      return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Medium Priority</Badge>;
    } else {
      return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Low Priority</Badge>;
    }
  };
  
  const renderConfidence = (confidence: string) => {
    if (confidence === 'high') {
      return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">High Confidence</Badge>;
    } else if (confidence === 'medium') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Medium Confidence</Badge>;
    } else {
      return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Low Confidence</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {timeline ? (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    Your Learning Journey
                    <Badge variant="outline" className="ml-2 bg-indigo-50 text-indigo-600 border-indigo-200">
                      Updated {format(new Date(timeline.lastUpdated?.toDate?.() || timeline.lastUpdated), 'MMM d, yyyy')}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    AI-powered visualization of your personalized learning path
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={generateTimeline}
                  disabled={loading}
                  className="border-indigo-200 text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50"
                >
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Update Timeline
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-around mb-6">
                <Button 
                  variant={timeframe === 'past' ? 'default' : 'outline'}
                  onClick={() => setTimeframe('past')}
                  className={timeframe === 'past' ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : ''}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  What You've Learned
                </Button>
                <Button 
                  variant={timeframe === 'present' ? 'default' : 'outline'}
                  onClick={() => setTimeframe('present')}
                  className={timeframe === 'present' ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : ''}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Current Focus
                </Button>
                <Button 
                  variant={timeframe === 'future' ? 'default' : 'outline'}
                  onClick={() => setTimeframe('future')}
                  className={timeframe === 'future' ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : ''}
                >
                  What's Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              
              {timeframe === 'past' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-800">Past Learning Achievements</h3>
                  {timeline.past.map((item: any, i: number) => (
                    <div key={i} className="relative border-l-2 border-indigo-200 pl-6 pb-6">
                      <div className="absolute -left-2.5 top-0 h-5 w-5 rounded-full bg-indigo-100 border-2 border-indigo-300"></div>
                      <div className="mb-1 text-sm text-gray-500">
                        {item.date && format(new Date(item.date), 'MMMM d, yyyy')}
                      </div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-md font-medium text-gray-800">{item.title}</h4>
                        <div className="flex gap-2">
                          {renderStatus(item.status)}
                          {item.confidence && renderConfidence(item.confidence)}
                        </div>
                      </div>
                      <p className="mt-1 text-gray-600 text-sm">{item.description}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {timeframe === 'present' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-800">Current Focus Areas</h3>
                  {timeline.present.map((item: any, i: number) => (
                    <div key={i} className="relative border-l-2 border-indigo-400 pl-6 pb-6">
                      <div className="absolute -left-2.5 top-0 h-5 w-5 rounded-full bg-indigo-500 border-2 border-white shadow-sm"></div>
                      <div className="mb-1 text-sm text-gray-500">
                        Estimated completion: {item.estimatedCompletion && format(new Date(item.estimatedCompletion), 'MMMM d, yyyy')}
                      </div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-md font-medium text-gray-800">{item.title}</h4>
                        <div className="flex gap-2">
                          {renderStatus(item.status)}
                          {item.priority && renderPriority(item.priority)}
                        </div>
                      </div>
                      <p className="mt-1 text-gray-600 text-sm">{item.description}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {timeframe === 'future' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-800">What to Learn Next</h3>
                  {timeline.future.map((item: any, i: number) => (
                    <div key={i} className="relative border-l-2 border-gray-200 pl-6 pb-6">
                      <div className="absolute -left-2.5 top-0 h-5 w-5 rounded-full bg-gray-100 border-2 border-gray-300"></div>
                      <div className="mb-1 text-sm text-gray-500">
                        Recommended start: {item.recommendedStartDate && format(new Date(item.recommendedStartDate), 'MMMM d, yyyy')}
                      </div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-md font-medium text-gray-800">{item.title}</h4>
                        {item.priority && renderPriority(item.priority)}
                      </div>
                      <p className="mt-1 text-gray-600 text-sm">{item.description}</p>
                      
                      {item.prerequisites && item.prerequisites.length > 0 && (
                        <div className="mt-2">
                          <h5 className="text-xs font-medium text-gray-500">Prerequisites:</h5>
                          <ul className="mt-1 space-y-1">
                            {item.prerequisites.map((prereq: string, idx: number) => (
                              <li key={idx} className="text-xs text-gray-600 flex items-center">
                                <div className="h-1.5 w-1.5 rounded-full bg-gray-400 mr-2"></div>
                                {prereq}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Learning Insights</CardTitle>
              <CardDescription>
                Key observations about your learning journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h3 className="font-medium text-green-600 flex items-center gap-2">
                    <div className="p-1.5 bg-green-100 rounded-full">
                      <Check className="h-4 w-4" />
                    </div>
                    Your Strengths
                  </h3>
                  <ul className="space-y-2">
                    {timeline.insights.strengths.map((item: string, i: number) => (
                      <li key={i} className="flex items-start">
                        <div className="flex-shrink-0 h-4 w-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center mt-0.5 mr-2">
                          <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-medium text-amber-600 flex items-center gap-2">
                    <div className="p-1.5 bg-amber-100 rounded-full">
                      <Clock className="h-4 w-4" />
                    </div>
                    Current Challenges
                  </h3>
                  <ul className="space-y-2">
                    {timeline.insights.challenges.map((item: string, i: number) => (
                      <li key={i} className="flex items-start">
                        <div className="flex-shrink-0 h-4 w-4 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mt-0.5 mr-2">
                          <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-medium text-blue-600 flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-full">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {timeline.insights.recommendations.map((item: string, i: number) => (
                      <li key={i} className="flex items-start">
                        <div className="flex-shrink-0 h-4 w-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mt-0.5 mr-2">
                          <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Learning Journey Timeline</CardTitle>
            <CardDescription>
              Get a personalized roadmap of your past, present, and future learning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border rounded-lg p-4 bg-indigo-50/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-indigo-100 rounded-full">
                      <ArrowLeft className="h-4 w-4 text-indigo-600" />
                    </div>
                    <h3 className="font-medium">What You've Learned</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Track your completed learning milestones, achievements, and areas of strength.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4 bg-indigo-50/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-indigo-100 rounded-full">
                      <Check className="h-4 w-4 text-indigo-600" />
                    </div>
                    <h3 className="font-medium">Current Focus</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Understand what you're currently working on and track active challenges.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4 bg-indigo-50/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-indigo-100 rounded-full">
                      <ArrowRight className="h-4 w-4 text-indigo-600" />
                    </div>
                    <h3 className="font-medium">What's Next</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    See AI-recommended next steps aligned with your learning goals.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-center pt-4">
                <div className="flex justify-center items-center space-x-2 text-gray-500 text-sm mb-4">
                  <Clock className="h-4 w-4" />
                  <span>Updates weekly based on your performance and feedback</span>
                </div>
                
                <Button 
                  onClick={generateTimeline} 
                  disabled={loading}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {loading ? "Generating..." : "Generate My Learning Timeline"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
