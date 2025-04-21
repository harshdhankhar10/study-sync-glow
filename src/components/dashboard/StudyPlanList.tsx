
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StudySession } from '@/pages/dashboard/Schedule';
import { FlashCard, BookText } from 'lucide-react';

interface StudyPlanListProps {
  sessions: StudySession[];
}

export default function StudyPlanList({ sessions }: StudyPlanListProps) {
  // Filter only AI-generated sessions
  const aiGeneratedSessions = sessions.filter(session => session.isAiGenerated);

  if (aiGeneratedSessions.length === 0) {
    return (
      <Card className="text-center p-6">
        <CardHeader>
          <CardTitle className="text-xl">No AI Study Plans Yet</CardTitle>
          <CardDescription>
            Generate a personalized study plan based on your profile and availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BookText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-500">
            Click the "Generate AI Study Plan" button to create your personalized study schedule
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {aiGeneratedSessions.map((session) => (
        <Card key={session.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 m-2">
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              AI Generated
            </Badge>
          </div>
          <CardHeader>
            <CardTitle className="text-lg">{session.title}</CardTitle>
            <CardDescription>
              {new Date(session.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <FlashCard className="h-4 w-4 text-indigo-600" />
                <span className="font-medium">Topic:</span> {session.topic}
              </div>
              <div className="text-sm text-gray-600">
                <div>Time: {session.startTime} - {session.endTime}</div>
                <div>Location: {session.location}</div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{session.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
