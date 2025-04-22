
import { useState, useEffect } from 'react';
import { StudyPlan, StudyTask, updateTaskStatus } from '@/lib/studyPromptGenerator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  Video,
  BookOpen,
  Newspaper,
  PencilRuler,
} from 'lucide-react';
import { format, isToday, isPast, isFuture, parseISO } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface StudyPlanDetailProps {
  plan: StudyPlan;
  onBack: () => void;
  onPlanUpdated: (plan: StudyPlan) => void;
}

export function StudyPlanDetail({ plan, onBack, onPlanUpdated }: StudyPlanDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);
  const [localPlan, setLocalPlan] = useState<StudyPlan>(plan);

  // Find the current day based on date
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const currentDayIndex = plan.days.findIndex(day => day.date === today);
    
    if (currentDayIndex >= 0) {
      setActiveDayIndex(currentDayIndex);
    } else {
      // Find the next upcoming day
      const futureDayIndex = plan.days.findIndex(day => {
        const dayDate = parseISO(day.date);
        return isFuture(dayDate);
      });
      
      if (futureDayIndex >= 0) {
        setActiveDayIndex(futureDayIndex);
      }
    }
  }, [plan]);

  const handleTaskToggle = async (dayIndex: number, taskId: string, completed: boolean) => {
    if (!plan.id) return;
    
    setUpdatingTask(taskId);
    try {
      await updateTaskStatus(plan.id, dayIndex, taskId, completed);
      
      // Update local state
      const updatedDays = [...localPlan.days];
      const taskIndex = updatedDays[dayIndex].tasks.findIndex(task => task.id === taskId);
      
      if (taskIndex !== -1) {
        updatedDays[dayIndex].tasks[taskIndex].completed = completed;
      }
      
      // Calculate new progress
      const totalTasks = updatedDays.reduce((count, day) => count + day.tasks.length, 0);
      const completedTasks = updatedDays.reduce((count, day) => 
        count + day.tasks.filter(task => task.completed).length, 0);
      
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      const updatedPlan = {
        ...localPlan,
        days: updatedDays,
        progress,
        completed: progress === 100
      };
      
      setLocalPlan(updatedPlan);
      onPlanUpdated(updatedPlan);
      
      if (progress === 100 && !localPlan.completed) {
        toast({
          title: "Congratulations!",
          description: "You've completed your study plan!",
        });
      }
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    } finally {
      setUpdatingTask(null);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4 text-red-500" />;
      case 'article':
        return <Newspaper className="h-4 w-4 text-blue-500" />;
      case 'book':
        return <BookOpen className="h-4 w-4 text-purple-500" />;
      case 'exercise':
        return <PencilRuler className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDateStatus = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'today';
    if (isPast(date)) return 'past';
    return 'future';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Plans
        </Button>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">{localPlan.topic}</h2>
          <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Deadline: {format(localPlan.deadline, 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center ml-4">
              <Clock className="h-4 w-4 mr-1" />
              <span>{localPlan.dailyTime} min/day</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span className="font-medium">{localPlan.progress}%</span>
          </div>
          <Progress value={localPlan.progress} className="h-2" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="today">Day by Day</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>About this study plan</CardTitle>
                <CardDescription>
                  {localPlan.overallDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <h4 className="font-medium mb-2">Key Learning Points</h4>
                <ul className="space-y-2">
                  {localPlan.keyLearningPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-medium">
                        {index + 1}
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan Structure</CardTitle>
                <CardDescription>
                  Your {localPlan.days.length}-day learning journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {localPlan.days.map((day, index) => {
                    const dateStatus = getDateStatus(day.date);
                    const completedTasks = day.tasks.filter(t => t.completed).length;
                    const progress = Math.round((completedTasks / day.tasks.length) * 100);
                    
                    return (
                      <div 
                        key={index}
                        className={cn(
                          "p-3 rounded-lg border transition-colors",
                          dateStatus === 'today' ? "border-blue-300 bg-blue-50" : "",
                          dateStatus === 'past' && progress === 100 ? "border-green-300 bg-green-50" : "",
                          dateStatus === 'past' && progress < 100 ? "border-amber-300 bg-amber-50" : "",
                          "hover:border-blue-400 cursor-pointer"
                        )}
                        onClick={() => {
                          setActiveDayIndex(index);
                          setActiveTab('today');
                        }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center">
                            <h4 className="font-medium">Day {day.day}: {day.title}</h4>
                            {dateStatus === 'today' && (
                              <Badge className="ml-2 bg-blue-500">Today</Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(parseISO(day.date), 'MMM d')}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-sm mb-1">
                          <span>
                            {completedTasks} of {day.tasks.length} tasks complete
                          </span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="today" className="mt-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Card className="md:w-1/3 flex-shrink-0">
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Study Days</CardTitle>
                </CardHeader>
                <CardContent className="py-0">
                  <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
                    {localPlan.days.map((day, index) => {
                      const dateStatus = getDateStatus(day.date);
                      const completedTasks = day.tasks.filter(t => t.completed).length;
                      const progress = Math.round((completedTasks / day.tasks.length) * 100);
                      
                      return (
                        <div
                          key={index}
                          className={cn(
                            "p-2 rounded-md flex justify-between items-center cursor-pointer transition-colors",
                            index === activeDayIndex ? "bg-blue-100" : "hover:bg-gray-100",
                            dateStatus === 'today' ? "border-l-2 border-blue-500" : "",
                            dateStatus === 'past' && progress === 100 ? "border-l-2 border-green-500" : "",
                            dateStatus === 'past' && progress < 100 ? "border-l-2 border-amber-500" : ""
                          )}
                          onClick={() => setActiveDayIndex(index)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium">Day {day.day}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(parseISO(day.date), 'MMM d')}
                            </div>
                          </div>
                          <div className="flex items-center">
                            {progress === 100 && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            {dateStatus === 'today' && progress < 100 && (
                              <Badge className="text-xs bg-blue-500">Today</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="flex-1">
                {localPlan.days[activeDayIndex] && (
                  <>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>
                            Day {localPlan.days[activeDayIndex].day}: {localPlan.days[activeDayIndex].title}
                          </CardTitle>
                          <CardDescription>
                            {format(parseISO(localPlan.days[activeDayIndex].date), 'EEEE, MMMM d, yyyy')}
                          </CardDescription>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {localPlan.days[activeDayIndex].estimatedTimeMinutes} min
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Overview</h4>
                          <p className="text-muted-foreground">
                            {localPlan.days[activeDayIndex].description}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-3">Tasks</h4>
                          <div className="space-y-3">
                            {localPlan.days[activeDayIndex].tasks.map((task, i) => (
                              <div key={task.id} className="flex items-start gap-3">
                                <Checkbox
                                  id={task.id}
                                  checked={task.completed}
                                  disabled={updatingTask === task.id}
                                  onCheckedChange={(checked) => {
                                    handleTaskToggle(activeDayIndex, task.id, !!checked);
                                  }}
                                />
                                <div className="grid gap-1.5 leading-none">
                                  <label
                                    htmlFor={task.id}
                                    className={cn(
                                      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer",
                                      task.completed && "line-through text-muted-foreground"
                                    )}
                                  >
                                    {task.description}
                                  </label>
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span>{task.estimatedTimeMinutes} min</span>
                                    
                                    {updatingTask === task.id && (
                                      <Loader2 className="h-3 w-3 animate-spin ml-2" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-3">Resources for Today</h4>
                          <div className="space-y-3">
                            {localPlan.days[activeDayIndex].resources.map((resource, i) => (
                              <div key={i} className="rounded-lg border p-3">
                                <div className="flex items-center gap-2 mb-1.5">
                                  {getResourceIcon(resource.type)}
                                  <h5 className="font-medium text-sm">{resource.title}</h5>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {resource.description}
                                </p>
                                {resource.url && (
                                  <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                  >
                                    Open resource
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </>
                )}
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="resources" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>All Resources</CardTitle>
                <CardDescription>
                  Complete collection of resources for your study plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {localPlan.days.map((day, dayIndex) => (
                    <div key={dayIndex} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          Day {day.day}: {day.title}
                        </h4>
                        <span className="text-sm text-muted-foreground">
                          {format(parseISO(day.date), 'MMM d')}
                        </span>
                      </div>
                      <div className="grid gap-3 pl-4">
                        {day.resources.map((resource, resIndex) => (
                          <div key={resIndex} className="rounded-lg border p-3">
                            <div className="flex items-center gap-2 mb-1.5">
                              {getResourceIcon(resource.type)}
                              <h5 className="font-medium text-sm">{resource.title}</h5>
                              <Badge variant="outline" className="ml-auto">
                                {resource.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {resource.description}
                            </p>
                            {resource.url && (
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                Open resource
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                      {dayIndex < localPlan.days.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
