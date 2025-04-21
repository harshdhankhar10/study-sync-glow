
import React from 'react';
import { MotivationTracker } from '@/components/study-buddy/MotivationTracker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';

export default function MotivationCenter() {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Motivation Center
        </h2>
        <p className="text-gray-500 mt-1">
          Track your progress, celebrate achievements, and stay motivated
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <MotivationTracker 
            userId={currentUser?.uid || ''} 
            enhancedView={true}
          />
        </TabsContent>
        <TabsContent value="achievements" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Achievement cards will be populated here */}
          </div>
        </TabsContent>
        <TabsContent value="insights" className="mt-6">
          <div className="space-y-4">
            {/* Insights content will be shown here */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
