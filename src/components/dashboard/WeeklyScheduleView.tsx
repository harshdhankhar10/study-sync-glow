
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StudySession } from '@/pages/dashboard/Schedule';

interface WeeklyScheduleViewProps {
  sessions: StudySession[];
}

export default function WeeklyScheduleView({ sessions }: WeeklyScheduleViewProps) {
  const [currentWeek, setCurrentWeek] = useState<Date[]>([]);
  
  // Generate the days for the current week
  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(today);
    
    // Adjust to start the week with Monday (1)
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(today.getDate() - diff);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }
    
    setCurrentWeek(weekDays);
  }, []);

  // Group sessions by day
  const getSessionsForDay = (date: Date) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate.toDateString() === date.toDateString();
    }).sort((a, b) => {
      const aTime = a.startTime.split(':').map(Number);
      const bTime = b.startTime.split(':').map(Number);
      if (aTime[0] !== bTime[0]) return aTime[0] - bTime[0];
      return aTime[1] - bTime[1];
    });
  };

  // Format the day header
  const formatDayHeader = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    return (
      <div className="text-center mb-2">
        <div className="text-xs text-gray-500">
          {date.toLocaleDateString('en-US', { weekday: 'short' })}
        </div>
        <div className={`text-lg font-semibold ${isToday ? 'bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
          {date.getDate()}
        </div>
      </div>
    );
  };

  // Navigation controls
  const navigateWeek = (direction: 'prev' | 'next') => {
    if (currentWeek.length === 0) return;
    
    const newStartOfWeek = new Date(currentWeek[0]);
    const daysToAdd = direction === 'next' ? 7 : -7;
    newStartOfWeek.setDate(newStartOfWeek.getDate() + daysToAdd);
    
    const newWeek = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(newStartOfWeek);
      day.setDate(newStartOfWeek.getDate() + i);
      newWeek.push(day);
    }
    
    setCurrentWeek(newWeek);
  };

  // Format the week header (Month Year)
  const getWeekHeader = () => {
    if (currentWeek.length === 0) return '';
    
    const firstDay = currentWeek[0];
    const lastDay = currentWeek[6];
    
    // If the week spans two months
    if (firstDay.getMonth() !== lastDay.getMonth()) {
      return `${firstDay.toLocaleDateString('en-US', { month: 'short' })} - ${lastDay.toLocaleDateString('en-US', { month: 'short' })} ${lastDay.getFullYear()}`;
    }
    
    return `${firstDay.toLocaleDateString('en-US', { month: 'long' })} ${firstDay.getFullYear()}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Weekly Schedule</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>Next</Button>
          </div>
        </div>
        <CardDescription>{getWeekHeader()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 overflow-x-auto min-w-full">
          {currentWeek.map((day, index) => (
            <div key={index} className="min-w-[100px]">
              {formatDayHeader(day)}
              <div className="border-t pt-2 mt-2 space-y-2 h-[400px] overflow-y-auto">
                {getSessionsForDay(day).map((session) => (
                  <div 
                    key={session.id} 
                    className={`p-2 rounded-md text-xs border-l-2 ${session.isAiGenerated ? 'border-l-purple-500 bg-purple-50' : 'border-l-indigo-500 bg-indigo-50'}`}
                  >
                    <div className="font-medium truncate">{session.title}</div>
                    <div className="text-gray-600">{session.startTime} - {session.endTime}</div>
                  </div>
                ))}
                {getSessionsForDay(day).length === 0 && (
                  <div className="text-center text-gray-400 text-xs py-2">No sessions</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
