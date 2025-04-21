
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { StudySession } from '@/pages/dashboard/Schedule';

interface StudySessionCardProps {
  session: StudySession;
}

export default function StudySessionCard({ session }: StudySessionCardProps) {
  // Calculate time remaining
  const getTimeRemaining = () => {
    const now = new Date();
    const sessionTime = new Date(session.date);
    const diffTime = sessionTime.getTime() - now.getTime();
    
    if (diffTime <= 0) return 'Starting soon';
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ${diffHours} hr${diffHours !== 1 ? 's' : ''}`;
    }
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} remaining`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <Card className="p-3 hover:shadow-md transition-shadow border-l-4 border-l-indigo-600">
      <div className="flex items-start gap-2">
        <div className="bg-indigo-100 text-indigo-800 p-2 rounded">
          <Clock className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between">
            <h3 className="font-medium text-sm">{session.title}</h3>
            {session.isAiGenerated && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                AI Generated
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-500">{formatDate(session.date)} • {session.startTime} - {session.endTime}</p>
          <div className="mt-1 flex items-center gap-1">
            <div className="text-xs font-medium text-indigo-600">{getTimeRemaining()}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
