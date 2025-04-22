
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CapstoneProject } from '@/pages/dashboard/CapstoneProjects';
import ProjectOverview from './ProjectOverview';
import ProjectTimeline from './ProjectTimeline';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, FileText, Github, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectDetailsProps {
  project: CapstoneProject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProjectDetails({ project, open, onOpenChange }: ProjectDetailsProps) {
  const getStatusColor = (status: CapstoneProject['status']) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'review':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">{project.title}</DialogTitle>
            <Badge className={getStatusColor(project.status)}>
              {project.status.replace('-', ' ').charAt(0).toUpperCase() + project.status.slice(1)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            <ProjectOverview project={project} />

            {project.aiFeedback && project.aiFeedback.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    AI Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.aiFeedback.map((feedback, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <MessageSquare className="w-5 h-5 text-blue-500 mt-1" />
                      <p className="text-gray-600">{feedback}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {project.githubUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Repository</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" asChild>
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4 mr-2" />
                      View on GitHub
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectTimeline project={project} />
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
