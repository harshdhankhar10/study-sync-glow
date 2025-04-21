
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StudySession } from '@/pages/dashboard/Schedule';
import { FileText, BookText, Calendar, Clock, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface StudyPlanListProps {
  sessions: StudySession[];
  onGeneratePlan: () => void;
  isGenerating: boolean;
  hasAvailability: boolean;
}

export default function StudyPlanList({ 
  sessions, 
  onGeneratePlan, 
  isGenerating, 
  hasAvailability 
}: StudyPlanListProps) {
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  
  // Filter only AI-generated sessions
  const aiGeneratedSessions = sessions.filter(session => session.isAiGenerated);

  const handleViewDetails = (session: StudySession) => {
    setSelectedSession(session);
  };

  const handleShowInfo = () => {
    setShowInfoDialog(true);
  };

  if (aiGeneratedSessions.length === 0) {
    return (
      <Card className="text-center p-6 border border-gray-200 shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
        <CardHeader>
          <CardTitle className="text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">No AI Study Plans Yet</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Generate a personalized study plan based on your profile and availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-6">
            <div className="p-4 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30">
              <BookText className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Click the "Generate AI Study Plan" button to create your personalized study schedule based on your profile, goals, and availability
            </p>
            <div className="flex gap-3">
              <Button
                onClick={onGeneratePlan}
                disabled={isGenerating || !hasAvailability}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
              >
                {isGenerating ? "Generating..." : "Generate AI Study Plan"}
              </Button>
              <Button
                variant="outline"
                onClick={handleShowInfo}
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
              >
                How It Works
              </Button>
            </div>
            {!hasAvailability && (
              <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md border border-amber-100 dark:border-amber-800/30 max-w-md">
                Please set your availability in the Availability tab before generating a study plan
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Your AI-Generated Study Plans
        </h3>
        <Button
          onClick={onGeneratePlan}
          disabled={isGenerating || !hasAvailability}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm"
        >
          <BookText className="mr-2 h-4 w-4" />
          {isGenerating ? "Generating..." : "Generate New Plan"}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {aiGeneratedSessions.map((session) => (
          <Card 
            key={session.id} 
            className="relative overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-800 h-full group"
          >
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-purple-400/10 to-purple-600/20 rounded-full blur-xl group-hover:blur-lg transition-all duration-500" />
            <div className="absolute top-0 right-0 m-2">
              <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 dark:from-purple-900/70 dark:to-indigo-900/70 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50">
                AI Generated
              </Badge>
            </div>
            <CardHeader className="pb-2">
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
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-medium">Topic:</span> {session.topic}
                </div>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-gray-500" />
                    <span>{session.startTime} - {session.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-500" />
                    <span>{session.location}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-2">{session.description}</p>
                
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewDetails(session)}
                    className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Session details sheet */}
      {selectedSession && (
        <Sheet open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent pr-10">
                {selectedSession.title}
              </SheetTitle>
              <SheetDescription>
                Study session details
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-5 py-6">
              <div className="flex items-center gap-3 text-sm">
                <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full">
                  <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-700 dark:text-gray-300">Date</div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {new Date(selectedSession.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-700 dark:text-gray-300">Time</div>
                  <div className="text-gray-600 dark:text-gray-400">{selectedSession.startTime} - {selectedSession.endTime}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full">
                  <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-700 dark:text-gray-300">Topic</div>
                  <div className="text-gray-600 dark:text-gray-400">{selectedSession.topic}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full">
                  <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-700 dark:text-gray-300">Location</div>
                  <div className="text-gray-600 dark:text-gray-400">{selectedSession.location}</div>
                </div>
              </div>
              
              <div className="pt-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md border border-gray-100 dark:border-gray-800">
                  {selectedSession.description}
                </p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
      
      {/* Information alert dialog */}
      <AlertDialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">How AI Study Plan Works</AlertDialogTitle>
            <AlertDialogDescription>
              Our AI analyzes your profile, skills, learning goals, and availability to create personalized study sessions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-3 items-start">
              <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full mt-1">
                <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300">Optimized Scheduling</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We'll schedule sessions during your available time slots to create a balanced study routine.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 items-start">
              <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full mt-1">
                <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300">Personalized Content</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Study topics are selected based on your major, skills, and learning goals.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 items-start">
              <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full mt-1">
                <BookText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300">Smart Recommendations</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The more information in your profile and goals, the more tailored your study plan will be.
                </p>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onGeneratePlan}
              disabled={isGenerating || !hasAvailability}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              Generate Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
