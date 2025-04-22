
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CapstoneProject } from '@/pages/dashboard/CapstoneProjects';
import { FileText, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectOverviewProps {
  project: CapstoneProject;
}

export default function ProjectOverview({ project }: ProjectOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Project Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
          <p className="text-gray-600">{project.description}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Project Goals</h4>
          <ul className="list-disc list-inside space-y-1">
            {project.goals.map((goal, index) => (
              <li key={index} className="text-gray-600">{goal}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Technologies</h4>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <Badge key={tech} variant="secondary">{tech}</Badge>
            ))}
          </div>
        </div>

        {project.githubUrl && (
          <Button variant="outline" className="w-full">
            <Github className="w-4 h-4 mr-2" />
            View on GitHub
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
