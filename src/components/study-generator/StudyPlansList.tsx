
import { useState } from 'react';
import { StudyPlan } from '@/lib/studyPromptGenerator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, RefreshCw, Calendar, ChevronRight, BookOpen, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface StudyPlansListProps {
  plans: StudyPlan[];
  isLoading: boolean;
  onViewPlan: (plan: StudyPlan) => void;
  onRefresh: () => void;
}

export function StudyPlansList({ plans, isLoading, onViewPlan, onRefresh }: StudyPlansListProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  // Calculate days remaining
  const getDaysRemaining = (deadline: Date) => {
    const today = new Date();
    const diffTime = Math.abs(deadline.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (deadline < today) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Your Study Plans</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          <span>Refresh</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : plans.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-medium mb-2">No study plans yet</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Create your first study plan by filling out the form in the "Create New Plan" tab.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className="overflow-hidden transition-shadow hover:shadow-md cursor-pointer"
              onClick={() => onViewPlan(plan)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{plan.topic}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {plan.overallDescription}
                    </CardDescription>
                  </div>
                  <Badge variant={plan.completed ? "success" : "secondary"}>
                    {plan.completed ? "Completed" : getDaysRemaining(plan.deadline)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Created: {format(plan.createdAt, 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Deadline: {format(plan.deadline, 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{plan.dailyTime} min/day</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{plan.progress}%</span>
                  </div>
                  <Progress value={plan.progress} className="h-2" />
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex justify-between items-center">
                <div className="flex flex-wrap gap-2">
                  {plan.preferredFormat.map((format) => (
                    <Badge key={format} variant="outline" className="bg-blue-50">
                      {format}
                    </Badge>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="gap-1">
                  View Plan
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
