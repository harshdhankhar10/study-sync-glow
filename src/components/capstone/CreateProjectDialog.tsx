
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { GEMINI_API_KEY, GEMINI_ENDPOINT } from "@/lib/ai";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: () => void;
}

export default function CreateProjectDialog({
  open,
  onOpenChange,
  onProjectCreated
}: CreateProjectDialogProps) {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const currentUser = auth.currentUser;

  const generateProjectDetails = async (topic: string) => {
    try {
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
                  text: `Generate a capstone project plan for the following topic: ${topic}
                  
                  Please provide a structured response including:
                  1. Project title (concise but descriptive)
                  2. Project description (2-3 sentences)
                  3. Main goals (3-5 bullet points)
                  4. Recommended technologies (4-6 items)
                  5. Timeline with milestones (3-month plan)
                  
                  Format as JSON with this structure:
                  {
                    "title": "string",
                    "description": "string",
                    "goals": ["string"],
                    "technologies": ["string"],
                    "timeline": {
                      "milestones": [
                        {
                          "title": "string",
                          "weekNumber": number
                        }
                      ]
                    }
                  }`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate project details');
      }

      const data = await response.json();
      const jsonMatch = data.candidates[0].content.parts[0].text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error generating project details:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !topic.trim()) return;

    setIsLoading(true);
    try {
      const projectDetails = await generateProjectDetails(topic);
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);

      const milestones = projectDetails.timeline.milestones.map(
        (milestone: { title: string; weekNumber: number }) => ({
          title: milestone.title,
          date: new Date(startDate.getTime() + milestone.weekNumber * 7 * 24 * 60 * 60 * 1000),
          completed: false
        })
      );

      await addDoc(collection(db, 'capstone_projects'), {
        title: projectDetails.title,
        description: projectDetails.description,
        goals: projectDetails.goals,
        technologies: projectDetails.technologies,
        timeline: {
          startDate: Timestamp.fromDate(startDate),
          endDate: Timestamp.fromDate(endDate),
          milestones: milestones.map(m => ({
            ...m,
            date: Timestamp.fromDate(m.date)
          }))
        },
        status: 'planning',
        userId: currentUser.uid,
        createdAt: Timestamp.now()
      });

      toast({
        title: "Project created!",
        description: "Your AI-guided capstone project has been created successfully.",
      });

      onProjectCreated();
      onOpenChange(false);
      setTopic('');
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error creating project",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Capstone Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="topic" className="text-sm font-medium text-gray-700">
              What topic would you like to explore?
            </label>
            <Textarea
              id="topic"
              placeholder="e.g., A real-time collaborative drawing application using WebSocket"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Generating Project Plan..." : "Create Project"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
