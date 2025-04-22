
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FocusTimeline } from "@/components/ai-learning/FocusTimeline";
import { FlashcardsAndQuizzes } from "@/components/ai-learning/FlashcardsAndQuizzes";
import { DailyDigest } from "@/components/ai-learning/DailyDigest";
import { QuizPlatform } from "@/components/ai-learning/QuizPlatform";
import { DynamicRoleAssignment } from "@/components/ai-learning/DynamicRoleAssignment";
import { SmartSessionBuilder } from "@/components/ai-learning/SmartSessionBuilder";

export default function AILearningHub() {
  const [activeTab, setActiveTab] = useState('focus');

  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">AI Learning Hub</h1>
        <p className="text-muted-foreground">
          Advanced AI-powered tools to enhance your learning experience
        </p>
      </header>

      <Tabs defaultValue="focus" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
          <TabsTrigger value="focus">Focus Timeline</TabsTrigger>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="digest">Daily Digest</TabsTrigger>
          <TabsTrigger value="quiz">Quiz Maker</TabsTrigger>
          <TabsTrigger value="roles">Role Assignment</TabsTrigger>
          <TabsTrigger value="session">Session Builder</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="focus">
            <FocusTimeline />
          </TabsContent>
          
          <TabsContent value="flashcards">
            <FlashcardsAndQuizzes />
          </TabsContent>
          
          <TabsContent value="digest">
            <DailyDigest />
          </TabsContent>
          
          <TabsContent value="quiz">
            <QuizPlatform />
          </TabsContent>
          
          <TabsContent value="roles">
            <DynamicRoleAssignment />
          </TabsContent>
          
          <TabsContent value="session">
            <SmartSessionBuilder />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
