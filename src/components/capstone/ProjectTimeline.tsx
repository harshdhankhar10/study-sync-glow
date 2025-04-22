
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { CapstoneProject } from '@/pages/dashboard/CapstoneProjects';
import { CheckCircle, Circle } from 'lucide-react';

interface ProjectTimelineProps {
  project: CapstoneProject;
}

export default function ProjectTimeline({ project }: ProjectTimelineProps) {
  const sortedMilestones = [...project.timeline.milestones].sort(
    (a, b) => a.date.toDate().getTime() - b.date.toDate().getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Project Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {sortedMilestones.map((milestone, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="h-6">
                  {milestone.completed ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300" />
                  )}
                </div>
                {index < sortedMilestones.length - 1 && (
                  <div className="w-0.5 h-full bg-gray-200" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <h4 className="text-sm font-medium text-gray-900">{milestone.title}</h4>
                <p className="text-sm text-gray-500">
                  {format(milestone.date.toDate(), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
