
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { Badge } from "@/components/ui/badge";
import { Award, Book, ChevronRight, Code, FileText } from "lucide-react";
import CreateProjectDialog from '@/components/capstone/CreateProjectDialog';
import ProjectTimeline from '@/components/capstone/ProjectTimeline';
import ProjectOverview from '@/components/capstone/ProjectOverview';

export interface CapstoneProject {
  id?: string;
  title: string;
  description: string;
  goals: string[];
  technologies: string[];
  timeline: {
    startDate: Timestamp;
    endDate: Timestamp;
    milestones: {
      title: string;
      date: Timestamp;
      completed: boolean;
    }[];
  };
  status: 'planning' | 'in-progress' | 'review' | 'completed';
  userId: string;
  createdAt: Timestamp;
  githubUrl?: string;
  aiFeedback?: string[];
}

export default function CapstoneProjects() {
  const [projects, setProjects] = useState<CapstoneProject[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (currentUser) {
      loadProjects();
    }
  }, [currentUser]);

  const loadProjects = async () => {
    if (!currentUser) return;
    
    try {
      const projectsRef = collection(db, 'capstone_projects');
      const q = query(projectsRef, where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      const loadedProjects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CapstoneProject[];
      
      setProjects(loadedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: "Error loading projects",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI-Guided Capstone Projects</h2>
          <p className="text-gray-500">Create and manage your capstone projects with AI guidance</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
          <Award className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Award className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Yet</h3>
            <p className="text-gray-500 text-center mb-4">
              Start your capstone journey with AI guidance. Create your first project to get started.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>Create Project</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold">{project.title}</CardTitle>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status.replace('-', ' ').charAt(0).toUpperCase() + project.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 mb-4 line-clamp-2">{project.description}</p>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <Badge key={tech} variant="outline">{tech}</Badge>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-4">
                    <div className="flex gap-4 text-gray-500 text-sm">
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {project.goals.length} Goals
                      </span>
                      {project.githubUrl && (
                        <span className="flex items-center gap-1">
                          <Code className="w-4 h-4" />
                          GitHub
                        </span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateProjectDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onProjectCreated={loadProjects}
      />
    </div>
  );
}
