
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, BookOpen, Users, Target } from 'lucide-react';

interface StudyMetricsProps {
  studyTime?: number;
  completedTasks?: number;
  activeGroups?: number;
  goalsProgress?: number;
}

export default function StudyMetrics({ 
  studyTime = 0, 
  completedTasks = 0, 
  activeGroups = 0, 
  goalsProgress = 0 
}: StudyMetricsProps) {
  const metrics = [
    {
      title: "Study Hours",
      value: `${studyTime}h`,
      description: "Total study time this week",
      icon: BookOpen,
      color: "text-blue-500"
    },
    {
      title: "Tasks Completed",
      value: completedTasks.toString(),
      description: "Completed study tasks",
      icon: Target,
      color: "text-green-500"
    },
    {
      title: "Active Groups",
      value: activeGroups.toString(),
      description: "Study groups you're in",
      icon: Users,
      color: "text-purple-500"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            <metric.icon className={`h-4 w-4 ${metric.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-muted-foreground">
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
