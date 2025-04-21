
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StudySession } from '@/pages/dashboard/Schedule';
import { cn } from '@/lib/utils';

interface WeeklyScheduleViewProps {
  sessions: StudySession[];
  onCreateSession?: () => void;
}

export default function WeeklyScheduleView({ sessions, onCreateSession }: WeeklyScheduleViewProps) {
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

  // Calculate the time slots for the daily timeline (8am-8pm by default)
  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const timeSlots = getTimeSlots();

  // Check if a session falls within a specific time slot
  const getSessionsForTimeSlot = (day: Date, timeSlot: string) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    
    const [hour] = timeSlot.split(':').map(Number);
    
    return getSessionsForDay(day).filter(session => {
      const [startHour] = session.startTime.split(':').map(Number);
      const [endHour, endMinute] = session.endTime.split(':').map(Number);
      
      return startHour <= hour && (endHour > hour || (endHour === hour && endMinute > 0));
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Weekly Schedule</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>Next</Button>
            {onCreateSession && (
              <Button 
                size="sm" 
                onClick={onCreateSession}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Session
              </Button>
            )}
          </div>
        </div>
        <CardDescription>{getWeekHeader()}</CardDescription>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Timeline view */}
          <div className="grid grid-cols-8 gap-px bg-gray-200">
            {/* Time column */}
            <div className="bg-white pt-10">
              {timeSlots.map((time, index) => (
                <div key={`time-${index}`} className="h-12 border-t pr-2 text-right text-xs text-gray-500">
                  {time}
                </div>
              ))}
            </div>
            
            {/* Day columns */}
            {currentWeek.map((day, dayIndex) => (
              <div key={`day-${dayIndex}`} className="bg-white">
                {/* Day header */}
                <div className="py-2 text-center sticky top-0 bg-white z-10">
                  {formatDayHeader(day)}
                </div>
                
                {/* Time slots */}
                <div className="relative">
                  {timeSlots.map((time, timeIndex) => {
                    const sessions = getSessionsForTimeSlot(day, time);
                    
                    return (
                      <div 
                        key={`slot-${dayIndex}-${timeIndex}`} 
                        className={cn(
                          "h-12 border-t relative",
                          sessions.length > 0 ? "bg-gray-50" : "bg-white"
                        )}
                      >
                        {sessions.map((session, sessionIndex) => {
                          // Calculate position and height based on start/end times
                          const [startHour, startMinute] = session.startTime.split(':').map(Number);
                          const [endHour, endMinute] = session.endTime.split(':').map(Number);
                          const currentHour = parseInt(time.split(':')[0]);
                          
                          // Only render if this is the first occurrence of the session
                          const isFirstOccurrence = !getSessionsForTimeSlot(day, 
                            timeIndex > 0 ? timeSlots[timeIndex - 1] : "00:00"
                          ).some(s => s.id === session.id);
                          
                          if (!isFirstOccurrence) return null;
                          
                          // Calculate duration in hours
                          const durationHours = (endHour - startHour) + (endMinute - startMinute) / 60;
                          
                          // Position from top of current hour slot
                          const topOffset = startHour === currentHour 
                            ? (startMinute / 60) * 48 // 48px is the height of the time slot
                            : 0;
                            
                          // Height based on duration
                          const height = Math.max(48, durationHours * 48); // Minimum height of 36px
                          
                          // Only show if start time is visible
                          if (startHour < currentHour || startHour > currentHour) return null;
                          
                          return (
                            <div
                              key={`session-${session.id}-${sessionIndex}`}
                              className={cn(
                                "absolute left-1 right-1 rounded-md p-1 overflow-hidden text-xs z-10 border shadow-sm",
                                session.isAiGenerated 
                                  ? "bg-purple-100 border-purple-300"
                                  : "bg-indigo-100 border-indigo-300"
                              )}
                              style={{
                                top: `${topOffset}px`,
                                height: `${height}px`,
                                zIndex: 20
                              }}
                            >
                              <div className="font-medium truncate">{session.title}</div>
                              <div className="truncate text-xs">{session.startTime} - {session.endTime}</div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
