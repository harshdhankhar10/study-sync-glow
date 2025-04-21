
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  BookOpen, 
  Clock, 
  Target, 
  Calendar, 
  User,
  Loader
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

interface StudyContextProps {
  userData: any;
}

export const StudyContext: React.FC<StudyContextProps> = ({ userData }) => {
  if (!userData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your study context...</p>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'No date';
    
    const date = timestamp instanceof Date 
      ? timestamp 
      : timestamp.toDate?.() || new Date(timestamp);
      
    return date ? format(date, 'MMM d, yyyy') : 'Invalid date';
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date 
      ? timestamp 
      : timestamp.toDate?.() || new Date(timestamp);
      
    return date ? format(date, 'h:mm a') : '';
  };

  return (
    <ScrollArea className="h-full pr-4 -mr-4">
      <div className="space-y-6 pb-6">
        {/* Profile Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-500" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Name:</span>
                <span>{userData.profile?.fullName || 'Not set'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Major:</span>
                <span>{userData.profile?.major || 'Not set'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">School:</span>
                <span>{userData.profile?.school || 'Not set'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Year:</span>
                <span>{userData.profile?.year || 'Not set'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-500" />
              Skills & Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userData.skills?.skills?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userData.skills.skills.map((skill: string, i: number) => (
                  <Badge key={i} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No skills added yet</p>
            )}
            
            {userData.skills?.subjects?.length > 0 && (
              <>
                <Separator className="my-3" />
                <div className="mt-2">
                  <h4 className="text-sm font-medium mb-2">Current Subjects</h4>
                  <div className="flex flex-wrap gap-2">
                    {userData.skills.subjects.map((subject: string, i: number) => (
                      <Badge key={i} variant="outline" className="bg-indigo-50">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Goals Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-500" />
              Learning Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userData.goals?.goals?.length > 0 ? (
              <ul className="space-y-2 pl-5 list-disc text-sm">
                {userData.goals.goals.map((goal: any, i: number) => (
                  <li key={i}>{typeof goal === 'string' ? goal : goal.title || 'Unnamed goal'}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No goals set yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Notes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-500" />
              Recent Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userData.recentNotes?.length > 0 ? (
              <div className="space-y-3">
                {userData.recentNotes.map((note: any) => (
                  <div key={note.id} className="border rounded-lg p-3">
                    <div className="flex justify-between">
                      <h4 className="text-sm font-medium">{note.title}</h4>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(note.updatedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No notes yet</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-500" />
              Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userData.upcomingSessions?.length > 0 ? (
              <div className="space-y-3">
                {userData.upcomingSessions.map((session: any) => (
                  <div key={session.id} className="border rounded-lg p-3">
                    <h4 className="text-sm font-medium">{session.title}</h4>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {formatDate(session.date)} · {session.startTime} - {session.endTime}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {session.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming sessions</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};
