
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc,
  getDoc,
  serverTimestamp, 
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, AlertTriangle, Book } from 'lucide-react';
import { StudyGroupSummary } from '@/types/studyGroups';

interface GroupSummaryProps {
  groupId: string;
}

export default function GroupSummary({ groupId }: GroupSummaryProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<StudyGroupSummary[]>([]);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // Load summaries
  useEffect(() => {
    async function loadSummaries() {
      if (!currentUser || !groupId) return;
      
      try {
        setLoading(true);
        
        // Fetch summaries
        const summariesRef = collection(db, 'groupSummaries');
        const summariesQuery = query(
          summariesRef,
          where('groupId', '==', groupId),
          orderBy('generatedAt', 'desc'),
          limit(10)
        );
        
        const summariesSnapshot = await getDocs(summariesQuery);
        const summariesData = summariesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            content: data.content,
            topicsCovered: data.topicsCovered || [],
            generatedAt: data.generatedAt.toDate(),
            period: data.period
          } as StudyGroupSummary;
        });
        
        setSummaries(summariesData);
      } catch (error) {
        console.error("Error loading summaries:", error);
        toast({
          title: "Failed to load summaries",
          description: "There was an error loading the group summaries. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadSummaries();
  }, [currentUser, groupId, toast]);

  // Generate new AI summary
  const handleGenerateSummary = async () => {
    if (!currentUser || !groupId) return;
    
    try {
      setGeneratingSummary(true);
      
      // Get group details
      const groupDoc = await getDoc(doc(db, 'studyGroups', groupId));
      if (!groupDoc.exists()) {
        throw new Error("Group not found");
      }
      
      const groupData = groupDoc.data();
      
      // Get recent messages
      const messagesRef = collection(db, 'groupMessages');
      const messagesQuery = query(
        messagesRef,
        where('groupId', '==', groupId),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const messages = messagesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          content: data.content,
          senderName: data.senderName,
          timestamp: data.timestamp.toDate()
        };
      });
      
      // Get recent resources
      const resourcesRef = collection(db, 'groupResources');
      const resourcesQuery = query(
        resourcesRef,
        where('groupId', '==', groupId),
        orderBy('addedAt', 'desc'),
        limit(10)
      );
      
      const resourcesSnapshot = await getDocs(resourcesQuery);
      const resources = resourcesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          title: data.title,
          type: data.type,
          description: data.description
        };
      });
      
      // Use the Gemini integration from lib/ai.ts to generate a summary
      const inputData = {
        groupName: groupData.name,
        groupPurpose: groupData.purpose,
        groupSubject: groupData.subject,
        messages: messages,
        resources: resources
      };

      // Import the Gemini API key
      const GEMINI_API_KEY = "AIzaSyDSRbZYHWLdncHiadycyFvKyyuMu_BPIv8";
      const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
      
      // Make the AI call
      const aiResponse = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate a summary of the study group activity for the "${groupData.name}" group.
                  
                  Group Information:
                  - Name: ${groupData.name}
                  - Subject: ${groupData.subject || "Not specified"}
                  - Purpose: ${groupData.purpose || "General study"}
                  
                  Recent Messages (${messages.length}):
                  ${messages.map(m => `- ${m.senderName}: "${m.content}"`).join("\n")}
                  
                  Recent Resources (${resources.length}):
                  ${resources.map(r => `- ${r.title} (${r.type}): "${r.description || "No description"}"`).join("\n")}
                  
                  Based on this information, please provide:
                  1. A concise summary of what the group has been discussing (2-3 paragraphs)
                  2. A list of 3-5 key topics that were covered
                  3. Suggestions for what the group might focus on next
                  
                  Format the response as plain text with clear section breaks.`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          }
        }),
      });
      
      if (!aiResponse.ok) {
        throw new Error(`API error: ${aiResponse.status}`);
      }
      
      const aiData = await aiResponse.json();
      const summaryText = aiData.candidates[0].content.parts[0].text;
      
      // Extract topics from the summary
      const topicsRegex = /key topics that were covered:?\s*([\s\S]*?)(?:\n\n|$)/i;
      const topicsMatch = summaryText.match(topicsRegex);
      
      let extractedTopics: string[] = [];
      if (topicsMatch && topicsMatch[1]) {
        extractedTopics = topicsMatch[1]
          .split('\n')
          .map(line => line.replace(/^[•\-*]\s*/, '').trim())
          .filter(topic => topic.length > 0);
      }
      
      // Create a new summary document
      const newSummaryRef = await addDoc(collection(db, 'groupSummaries'), {
        groupId,
        content: summaryText,
        topicsCovered: extractedTopics,
        period: 'weekly',
        generatedAt: serverTimestamp(),
        generatedBy: currentUser.uid
      });
      
      // Get the complete new summary
      const newSummaryDoc = await getDoc(newSummaryRef);
      const newSummaryData = newSummaryDoc.data();
      
      // Add to state
      const newSummary: StudyGroupSummary = {
        id: newSummaryRef.id,
        content: newSummaryData?.content,
        topicsCovered: newSummaryData?.topicsCovered || [],
        generatedAt: new Date(),
        period: newSummaryData?.period
      };
      
      setSummaries(prev => [newSummary, ...prev]);
      
      toast({
        title: "Summary generated",
        description: "A new AI summary has been generated for your group."
      });
    } catch (error) {
      console.error("Error generating summary:", error);
      toast({
        title: "Failed to generate summary",
        description: "There was an error generating the summary. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGeneratingSummary(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-40 bg-gray-200 rounded animate-pulse mt-6"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">AI-Generated Summaries</h3>
        <Button 
          size="sm" 
          onClick={handleGenerateSummary}
          disabled={generatingSummary}
        >
          {generatingSummary ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate New Summary
            </>
          )}
        </Button>
      </div>
      
      {summaries.length === 0 ? (
        <div className="text-center py-10">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Summaries Yet</h3>
          <p className="text-muted-foreground mb-6">
            Generate an AI summary of your group's recent activity.
          </p>
          <Button 
            onClick={handleGenerateSummary}
            disabled={generatingSummary}
          >
            {generatingSummary ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate First Summary
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {summaries.map((summary) => (
            <Card key={summary.id} className="border-indigo-100">
              <CardHeader className="pb-2 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    AI Summary
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {formatDate(summary.generatedAt)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="prose prose-sm max-w-none">
                  {summary.content.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-4 whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}
                </div>
                
                {summary.topicsCovered.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-sm mb-2">Key Topics Covered:</h4>
                    <div className="flex flex-wrap gap-2">
                      {summary.topicsCovered.map((topic, idx) => (
                        <Badge key={idx} variant="secondary">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground border-t pt-3">
                <Alert variant="info" className="bg-blue-50 border-blue-100">
                  <AlertTriangle className="h-4 w-4 text-blue-500" />
                  <AlertTitle>AI-Generated Content</AlertTitle>
                  <AlertDescription>
                    This summary was automatically generated and may not be completely accurate.
                  </AlertDescription>
                </Alert>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
