
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TrendingUp, Users, Award } from 'lucide-react';
import { getFirestore } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import PersonalProgress from '@/components/progress/PersonalProgress';
import GroupProgress from '@/components/progress/GroupProgress';
import Achievements from '@/components/progress/Achievements';

export default function Progress() {
  const [activeTab, setActiveTab] = useState('personal');
  const { toast } = useToast();
  const db = getFirestore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Progress Tracker
        </h2>
        <p className="text-gray-500 mt-1">
          Track your learning journey, monitor group progress, and earn achievements
        </p>
      </div>

      <Tabs defaultValue="personal" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Personal Progress</span>
          </TabsTrigger>
          <TabsTrigger value="group" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Group Progress</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span>Achievements</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="personal" className="mt-6">
          <PersonalProgress />
        </TabsContent>
        
        <TabsContent value="group" className="mt-6">
          <GroupProgress />
        </TabsContent>
        
        <TabsContent value="achievements" className="mt-6">
          <Achievements />
        </TabsContent>
      </Tabs>
    </div>
  );
}
