
import { StudyStatistics } from '@/components/ai-learning/StudyStatistics';
import { SmartSessionBuilder } from '@/components/ai-learning/SmartSessionBuilder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StudyStatisticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="statistics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="session-builder">Smart Session Builder</TabsTrigger>
        </TabsList>
        
        <TabsContent value="statistics">
          <StudyStatistics />
        </TabsContent>
        
        <TabsContent value="session-builder">
          <SmartSessionBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}
