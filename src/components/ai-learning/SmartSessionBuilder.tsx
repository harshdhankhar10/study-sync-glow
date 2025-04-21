
import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { GEMINI_API_KEY, GEMINI_ENDPOINT } from '@/lib/ai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Calendar as CalendarIcon, Clock, BookText, MessageSquare, ListChecks, CalendarRange } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

interface SmartSessionBuilderProps {
  userData: any;
  refreshData: () => void;
}

export default function SmartSessionBuilder({ userData, refreshData }: SmartSessionBuilderProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [viewing, setViewing] = useState<any>(null);
  const [sessionData, setSessionData] = useState({
    topic: '',
    subtopics: '',
    duration: '60',
    date: new Date(),
    startTime: '14:00',
    location: 'Online',
  });
  const [generatedSession, setGeneratedSession] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSessionData(prev => ({ ...prev, [name]: value }));
  };

  const generateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !userData) return;
    
    if (!sessionData.topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a main topic for your study session",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      toast({
        title: "Generating study session",
        description: "AI is creating your structured study session...",
      });
      
      // Prepare data for AI analysis
      const userContext = {
        skills: userData.skills?.skills || [],
        interests: userData.skills?.interests || [],
        goals: userData.goals?.goals || [],
        mainTopic: sessionData.topic,
        subtopics: sessionData.subtopics,
        duration: parseInt(sessionData.duration),
        date: format(sessionData.date, 'yyyy-MM-dd'),
        startTime: sessionData.startTime,
        location: sessionData.location
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
                  text: `Create a structured study session based on the following information:
                  
                  User Context: ${JSON.stringify(userContext)}
                  
                  Generate a complete study session plan with the following components:
                  1. Session title (brief but descriptive)
                  2. Introduction (2-3 sentences explaining the topic's importance)
                  3. Learning objectives (3-5 specific, measurable goals)
                  4. Required materials (list of resources, readings, tools)
                  5. Session outline with time allocation (introduction, main activities, breaks, discussion, closing)
                  6. Discussion questions (3-5 thoughtful questions)
                  7. Assessment/quiz (5 questions with answers to gauge understanding)
                  8. Follow-up activities (2-3 suggestions for continued learning)
                  
                  The session should be designed to fit within ${sessionData.duration} minutes.
                  
                  Return the response as a valid JSON object:
                  {
                    "title": "Session title",
                    "introduction": "Introduction text",
                    "learningObjectives": ["Objective 1", "Objective 2", ...],
                    "materials": ["Material 1", "Material 2", ...],
                    "outline": [
                      {"activity": "Activity name", "duration": "X mins", "description": "Description"}
                    ],
                    "discussionQuestions": ["Question 1", "Question 2", ...],
                    "assessment": [
                      {"question": "Question text", "answer": "Answer text"}
                    ],
                    "followUp": ["Activity 1", "Activity 2", ...]
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
      
      const sessionPlan = JSON.parse(jsonMatch[0]);
      setGeneratedSession({
        ...sessionPlan,
        topic: sessionData.topic,
        date: sessionData.date,
        startTime: sessionData.startTime,
        duration: sessionData.duration,
        location: sessionData.location
      });
      
      toast({
        title: "Session created!",
        description: "Your structured study session has been generated",
      });
    } catch (error: any) {
      console.error("Error generating session:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSession = async () => {
    if (!currentUser || !generatedSession) return;
    
    try {
      setLoading(true);
      
      // Calculate end time
      const startParts = generatedSession.startTime.split(':').map(Number);
      const durationMins = parseInt(generatedSession.duration);
      
      let endHour = startParts[0] + Math.floor(durationMins / 60);
      let endMinute = startParts[1] + (durationMins % 60);
      
      if (endMinute >= 60) {
        endHour += 1;
        endMinute -= 60;
      }
      
      endHour = endHour % 24;
      
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      // Save to studySessions collection
      const sessionRef = await addDoc(collection(db, 'studySessions'), {
        title: generatedSession.title,
        description: generatedSession.introduction,
        date: generatedSession.date,
        startTime: generatedSession.startTime,
        endTime: endTime,
        topic: generatedSession.topic,
        location: generatedSession.location,
        participants: [currentUser.uid],
        createdAt: serverTimestamp(),
        isAiGenerated: true,
        isSmartSession: true
      });
      
      // Save detailed session plan
      await setDoc(doc(db, 'smartSessions', sessionRef.id), {
        ...generatedSession,
        sessionId: sessionRef.id,
        userId: currentUser.uid,
        createdAt: serverTimestamp()
      });
      
      toast({
        title: "Session scheduled!",
        description: "Your study session has been added to your schedule",
      });
      
      setGeneratedSession(null);
      setSessionData({
        topic: '',
        subtopics: '',
        duration: '60',
        date: new Date(),
        startTime: '14:00',
        location: 'Online',
      });
      
      refreshData();
    } catch (error: any) {
      console.error("Error saving session:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const pastSessions = userData?.sessions?.filter((s: any) => s.isSmartSession) || [];

  return (
    <div className="space-y-6">
      {viewing ? (
        <Card>
          <CardHeader className="border-b pb-3">
            <div className="flex justify-between">
              <div>
                <CardTitle>{viewing.title}</CardTitle>
                <CardDescription className="mt-1">
                  {format(viewing.date.toDate?.() || viewing.date, 'PPP')} • {viewing.startTime}
                </CardDescription>
              </div>
              <Button variant="ghost" onClick={() => setViewing(null)}>
                Back to sessions
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-2">Introduction</h3>
              <p className="text-gray-600">{viewing.introduction}</p>
            </div>
            
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-2">Learning Objectives</h3>
              <ul className="space-y-1 list-disc list-inside text-gray-600">
                {viewing.learningObjectives.map((obj: string, i: number) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-2">Materials Needed</h3>
              <ul className="space-y-1 list-disc list-inside text-gray-600">
                {viewing.materials.map((mat: string, i: number) => (
                  <li key={i}>{mat}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-2">Session Outline</h3>
              <div className="space-y-3">
                {viewing.outline.map((item: any, i: number) => (
                  <div key={i} className="border rounded-md p-3 bg-gray-50">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-medium text-gray-800">{item.activity}</h4>
                      <span className="text-sm text-indigo-600 font-medium">{item.duration}</span>
                    </div>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-2">Discussion Questions</h3>
              <ul className="space-y-2 text-gray-600">
                {viewing.discussionQuestions.map((q: string, i: number) => (
                  <li key={i} className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mt-0.5 mr-2">
                      <span className="text-xs font-bold">{i+1}</span>
                    </div>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-2">Assessment</h3>
              <div className="space-y-4">
                {viewing.assessment.map((item: any, i: number) => (
                  <div key={i} className="border rounded-md p-3">
                    <p className="font-medium text-gray-800 mb-2">Q{i+1}: {item.question}</p>
                    <p className="text-sm text-gray-600"><span className="font-medium">Answer:</span> {item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-2">Follow-up Activities</h3>
              <ul className="space-y-1 list-disc list-inside text-gray-600">
                {viewing.followUp.map((act: string, i: number) => (
                  <li key={i}>{act}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : generatedSession ? (
        <Card>
          <CardHeader className="border-b pb-3">
            <CardTitle>{generatedSession.title}</CardTitle>
            <CardDescription className="mt-1">
              Generated for {format(generatedSession.date, 'PPP')} • {generatedSession.startTime}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Introduction</h3>
                <p className="text-gray-700">{generatedSession.introduction}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Learning Objectives</h3>
                  <ul className="space-y-1 list-disc list-inside text-gray-700">
                    {generatedSession.learningObjectives.map((obj: string, i: number) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Materials Needed</h3>
                  <ul className="space-y-1 list-disc list-inside text-gray-700">
                    {generatedSession.materials.map((mat: string, i: number) => (
                      <li key={i}>{mat}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Session Outline</h3>
                <div className="space-y-3">
                  {generatedSession.outline.map((item: any, i: number) => (
                    <div key={i} className="border rounded-md p-3 bg-gray-50">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-medium text-gray-800">{item.activity}</h4>
                        <span className="text-sm text-indigo-600 font-medium">{item.duration}</span>
                      </div>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={() => setGeneratedSession(null)}>
              Create Another
            </Button>
            <Button onClick={saveSession} disabled={loading}>
              Schedule This Session
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Smart Session Builder</CardTitle>
                <CardDescription>
                  Enter your topic, and our AI will generate a complete structured study session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={generateSession} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic">Main Topic</Label>
                    <Input 
                      id="topic" 
                      name="topic" 
                      value={sessionData.topic} 
                      onChange={handleInputChange}
                      placeholder="e.g. Introduction to Machine Learning" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subtopics">Key Subtopics (optional)</Label>
                    <Textarea 
                      id="subtopics" 
                      name="subtopics" 
                      value={sessionData.subtopics} 
                      onChange={handleInputChange}
                      placeholder="e.g. Supervised learning, Decision trees, Model evaluation" 
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Session Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {sessionData.date ? format(sessionData.date, 'PPP') : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={sessionData.date}
                            onSelect={(date) => setSessionData(prev => ({ ...prev, date: date || new Date() }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input 
                        id="startTime" 
                        name="startTime"
                        type="time" 
                        value={sessionData.startTime} 
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input 
                        id="duration" 
                        name="duration"
                        type="number" 
                        min="15"
                        max="180"
                        value={sessionData.duration} 
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input 
                        id="location" 
                        name="location"
                        value={sessionData.location} 
                        onChange={handleInputChange}
                        placeholder="e.g. Library, Zoom meeting, etc." 
                      />
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      disabled={loading}
                    >
                      <BookText className="mr-2 h-4 w-4" />
                      {loading ? "Generating..." : "Generate Study Session"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Past Smart Sessions</CardTitle>
                <CardDescription>
                  Your previously generated study sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pastSessions.length > 0 ? (
                  <div className="space-y-3">
                    {pastSessions.map((session: any) => (
                      <button
                        key={session.id}
                        className="w-full text-left border rounded-md p-3 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors group"
                        onClick={() => setViewing(session)}
                      >
                        <div className="font-medium text-gray-800 group-hover:text-indigo-700">{session.title}</div>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <CalendarRange className="h-3.5 w-3.5 mr-1 text-gray-400" />
                          <span>
                            {format(session.date instanceof Date ? session.date : session.date.toDate(), 'PP')}
                          </span>
                          <span className="mx-1">•</span>
                          <Clock className="h-3.5 w-3.5 mr-1 text-gray-400" />
                          <span>{session.startTime}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookText className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-4 text-sm font-medium text-gray-500">No sessions yet</h3>
                    <p className="mt-1 text-xs text-gray-400">
                      Generate your first smart study session
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
