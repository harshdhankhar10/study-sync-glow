
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { GEMINI_API_KEY, GEMINI_ENDPOINT } from '@/lib/ai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Mail, BookText, Brain, Calendar, ArrowRight, Bell } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface DailyDigestProps {
  userData: any;
  refreshData: () => void;
}

export default function DailyDigest({ userData, refreshData }: DailyDigestProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    enabled: true,
    emailDelivery: true,
    pushNotifications: false,
    deliveryTime: '08:00',
    includeFlashcards: true,
    includeQuiz: true,
    includeQuote: true,
  });

  useEffect(() => {
    // Load settings if they exist
    if (userData?.digest?.settings) {
      setSettings(userData.digest.settings);
    }
  }, [userData]);

  const generateDigest = async () => {
    if (!currentUser || !userData) return;
    
    try {
      setLoading(true);
      toast({
        title: "Generating your daily digest",
        description: "AI is creating your personalized digest...",
      });
      
      // Prepare user data for AI analysis
      const userContext = {
        skills: userData.skills?.skills || [],
        interests: userData.skills?.interests || [],
        goals: userData.goals?.goals || [],
        recentSessions: userData.sessions?.slice(0, 5).map((s: any) => ({
          title: s.title,
          topic: s.topic,
          date: s.date instanceof Date ? format(s.date, 'yyyy-MM-dd') : format(s.date.toDate(), 'yyyy-MM-dd')
        })) || [],
        skillGaps: userData.insights?.skillGapAnalysis || [],
        settings: settings,
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
                  text: `Generate a personalized daily learning digest for a student based on the following data:
                  
                  User Context: ${JSON.stringify(userContext)}
                  Current Date: ${format(new Date(), 'yyyy-MM-dd')}
                  
                  Create a complete daily digest with the following components:
                  1. Daily focus topic (something they should prioritize today)
                  2. Study tip of the day (practical advice for effective learning)
                  3. Revision flashcards (3-5 question/answer pairs on topics they're learning)
                  4. Motivational quote (relevant to their learning journey)
                  5. Quick challenge (a small, interesting problem to solve related to their studies)
                  
                  Return the response as a valid JSON object:
                  {
                    "date": "YYYY-MM-DD",
                    "dailyFocus": {
                      "topic": "Focus topic",
                      "description": "Description of why this is important",
                      "suggestedTimeAllocation": "XX minutes"
                    },
                    "studyTip": {
                      "title": "Tip title",
                      "description": "Detailed explanation of the tip"
                    },
                    "flashcards": [
                      {"question": "Question text", "answer": "Answer text"}
                    ],
                    "motivationalQuote": {
                      "quote": "The quote text",
                      "author": "Author name"
                    },
                    "dailyChallenge": {
                      "title": "Challenge title",
                      "description": "Challenge description",
                      "hint": "Optional hint"
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
      
      const digestData = JSON.parse(jsonMatch[0]);
      
      // Save to Firestore
      await setDoc(doc(db, 'dailyDigests', currentUser.uid), {
        ...digestData,
        settings: settings,
        generatedAt: new Date(),
        userId: currentUser.uid
      });
      
      toast({
        title: "Digest created!",
        description: "Your personalized daily digest is ready",
      });
      
      refreshData();
    } catch (error: any) {
      console.error("Error generating digest:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate digest. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      // Check if digest document exists
      const digestRef = doc(db, 'dailyDigests', currentUser.uid);
      const digestSnap = await getDoc(digestRef);
      
      if (digestSnap.exists()) {
        // Update existing document
        await setDoc(digestRef, {
          ...digestSnap.data(),
          settings: settings,
          updatedAt: new Date()
        }, { merge: true });
      } else {
        // Create new document with just settings
        await setDoc(digestRef, {
          settings: settings,
          userId: currentUser.uid,
          createdAt: new Date()
        });
      }
      
      toast({
        title: "Settings saved",
        description: "Your daily digest preferences have been updated",
      });
      
      refreshData();
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (name: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const digest = userData?.digest;
  const today = format(new Date(), 'yyyy-MM-dd');
  const isToday = digest?.date === today;

  return (
    <div className="space-y-6">
      {digest && isToday ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold">
                      Today's Learning Digest
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {format(new Date(), 'EEEE, MMMM d, yyyy')}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={generateDigest}
                    disabled={loading}
                    className="border-indigo-200 text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50"
                  >
                    Refresh Digest
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100">
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-100 rounded-full p-2 mt-1">
                      <BookText className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-indigo-800">
                        Today's Focus: {digest.dailyFocus.topic}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        {digest.dailyFocus.description}
                      </p>
                      <div className="mt-2 text-sm text-indigo-600 font-medium">
                        Suggested time: {digest.dailyFocus.suggestedTimeAllocation}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="h-5 w-5 text-indigo-600" />
                    <h3 className="font-medium text-lg">Study Tip</h3>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-800">{digest.studyTip.title}</h4>
                    <p className="text-gray-600 mt-1">{digest.studyTip.description}</p>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    <h3 className="font-medium text-lg">Revision Flashcards</h3>
                  </div>
                  <div className="space-y-3">
                    {digest.flashcards.map((card: any, i: number) => (
                      <details key={i} className="group border rounded-lg overflow-hidden">
                        <summary className="flex justify-between items-center p-4 cursor-pointer list-none bg-gray-50 hover:bg-gray-100">
                          <span className="font-medium text-gray-800">{card.question}</span>
                          <ArrowRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform" />
                        </summary>
                        <div className="p-4 border-t">
                          <p className="text-gray-600">{card.answer}</p>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-amber-500">✨</div>
                      <h3 className="font-medium text-gray-800">Daily Motivation</h3>
                    </div>
                    <div className="border rounded-lg p-4 bg-amber-50/50">
                      <blockquote className="text-gray-700 italic">
                        "{digest.motivationalQuote.quote}"
                      </blockquote>
                      <p className="text-right text-sm text-gray-500 mt-2">
                        — {digest.motivationalQuote.author}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-indigo-500">🧩</div>
                      <h3 className="font-medium text-gray-800">Daily Challenge</h3>
                    </div>
                    <div className="border rounded-lg p-4 bg-indigo-50/50">
                      <h4 className="font-medium text-indigo-800">{digest.dailyChallenge.title}</h4>
                      <p className="text-gray-600 mt-1 text-sm">
                        {digest.dailyChallenge.description}
                      </p>
                      {digest.dailyChallenge.hint && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-xs text-indigo-600 font-medium">Need a hint?</summary>
                          <p className="mt-1 text-xs text-gray-600">{digest.dailyChallenge.hint}</p>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Digest Settings</CardTitle>
                <CardDescription>
                  Configure your daily digest preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enabled">Enable Daily Digest</Label>
                    <p className="text-xs text-gray-500">Receive personalized daily learning content</p>
                  </div>
                  <Switch
                    id="enabled"
                    checked={settings.enabled}
                    onCheckedChange={(value) => handleSettingChange('enabled', value)}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Delivery Method</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <Label htmlFor="emailDelivery" className="font-normal">Email Notifications</Label>
                    </div>
                    <Switch
                      id="emailDelivery"
                      checked={settings.emailDelivery}
                      onCheckedChange={(value) => handleSettingChange('emailDelivery', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-gray-400" />
                      <Label htmlFor="pushNotifications" className="font-normal">Push Notifications</Label>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={settings.pushNotifications}
                      onCheckedChange={(value) => handleSettingChange('pushNotifications', value)}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Content Preferences</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeFlashcards"
                        checked={settings.includeFlashcards}
                        onChange={(e) => handleSettingChange('includeFlashcards', e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                      <Label htmlFor="includeFlashcards" className="font-normal">Flashcards</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeQuiz"
                        checked={settings.includeQuiz}
                        onChange={(e) => handleSettingChange('includeQuiz', e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                      <Label htmlFor="includeQuiz" className="font-normal">Daily Challenge</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeQuote"
                        checked={settings.includeQuote}
                        onChange={(e) => handleSettingChange('includeQuote', e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                      <Label htmlFor="includeQuote" className="font-normal">Motivation Quote</Label>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button 
                    onClick={saveSettings} 
                    disabled={loading}
                    className="w-full"
                  >
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8">
            <Card>
              <CardHeader>
                <CardTitle>Generate Your Daily Digest</CardTitle>
                <CardDescription>
                  Get AI-powered learning recommendations, flashcards, and more
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-indigo-100 rounded-full p-2">
                          <BookText className="h-4 w-4 text-indigo-600" />
                        </div>
                        <h3 className="font-medium">Daily Focus</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Get a personalized recommendation on what to prioritize in your studies today.
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-indigo-100 rounded-full p-2">
                          <Calendar className="h-4 w-4 text-indigo-600" />
                        </div>
                        <h3 className="font-medium">Revision Flashcards</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Quick-review flashcards based on your current learning topics to reinforce knowledge.
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-indigo-100 rounded-full p-2">
                          <Brain className="h-4 w-4 text-indigo-600" />
                        </div>
                        <h3 className="font-medium">Study Tip</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Practical advice to improve your learning effectiveness and retention.
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-indigo-100 rounded-full p-2">
                          <Mail className="h-4 w-4 text-indigo-600" />
                        </div>
                        <h3 className="font-medium">Daily Challenge</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        A small but interesting challenge related to your studies to test your knowledge.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button 
                      onClick={generateDigest} 
                      disabled={loading}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {loading ? "Generating..." : "Generate Today's Digest"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Digest Settings</CardTitle>
                <CardDescription>
                  Configure your daily digest preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enabled">Enable Daily Digest</Label>
                    <p className="text-xs text-gray-500">Receive personalized daily learning content</p>
                  </div>
                  <Switch
                    id="enabled"
                    checked={settings.enabled}
                    onCheckedChange={(value) => handleSettingChange('enabled', value)}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Delivery Method</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <Label htmlFor="emailDelivery" className="font-normal">Email Notifications</Label>
                    </div>
                    <Switch
                      id="emailDelivery"
                      checked={settings.emailDelivery}
                      onCheckedChange={(value) => handleSettingChange('emailDelivery', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-gray-400" />
                      <Label htmlFor="pushNotifications" className="font-normal">Push Notifications</Label>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={settings.pushNotifications}
                      onCheckedChange={(value) => handleSettingChange('pushNotifications', value)}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Content Preferences</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeFlashcards"
                        checked={settings.includeFlashcards}
                        onChange={(e) => handleSettingChange('includeFlashcards', e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                      <Label htmlFor="includeFlashcards" className="font-normal">Flashcards</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeQuiz"
                        checked={settings.includeQuiz}
                        onChange={(e) => handleSettingChange('includeQuiz', e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                      <Label htmlFor="includeQuiz" className="font-normal">Daily Challenge</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeQuote"
                        checked={settings.includeQuote}
                        onChange={(e) => handleSettingChange('includeQuote', e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                      <Label htmlFor="includeQuote" className="font-normal">Motivation Quote</Label>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button 
                    onClick={saveSettings} 
                    disabled={loading}
                    className="w-full"
                  >
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
