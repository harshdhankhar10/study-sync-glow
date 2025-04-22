
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { getUserTasks, createTask, updateTask, deleteTask, updateTaskStatus } from '@/services/taskService';
import { Task, TaskFormData, TaskPriority } from '@/types/tasks';

export default function Tasks() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | undefined>(undefined);
  const [showPriorities, setShowPriorities] = useState<Record<TaskPriority, boolean>>({
    low: true,
    medium: true,
    high: true,
  });

  // Fetch tasks on component mount
  useEffect(() => {
    if (currentUser?.uid) {
      fetchTasks();
    } else {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Filter tasks when search query, tab, or priorities change
  useEffect(() => {
    filterTasks();
  }, [tasks, searchQuery, activeTab, showPriorities]);

  const fetchTasks = async () => {
    try {
      if (!currentUser?.uid) return;
      
      const fetchedTasks = await getUserTasks(currentUser.uid);
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error fetching tasks',
        description: 'Please try again later',
        variant: 'destructive',
      });
    }
  };

  const filterTasks = () => {
    let filtered = [...tasks];

    // Filter by tab (status)
    if (activeTab === 'todo') {
      filtered = filtered.filter(task => task.status === 'todo');
    } else if (activeTab === 'in-progress') {
      filtered = filtered.filter(task => task.status === 'in-progress');
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(task => task.status === 'completed');
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        task =>
          task.title.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query)) ||
          (task.tags && task.tags.some(tag => tag.toLowerCase().includes(query))) ||
          (task.relatedSubject && task.relatedSubject.toLowerCase().includes(query))
      );
    }

    // Filter by priority
    filtered = filtered.filter(task => showPriorities[task.priority]);

    // Sort by priority
    filtered.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    setFilteredTasks(filtered);
  };

  const handleCreateTask = async (formData: TaskFormData) => {
    try {
      if (!currentUser?.uid) return;
      
      setIsSubmitting(true);
      await createTask(currentUser.uid, formData);
      
      toast({
        title: 'Task created',
        description: 'Your task has been created successfully',
      });
      
      await fetchTasks();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error creating task',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTask = async (formData: TaskFormData) => {
    try {
      if (!currentTask) return;
      
      setIsSubmitting(true);
      await updateTask(currentTask.id, formData);
      
      toast({
        title: 'Task updated',
        description: 'Your task has been updated successfully',
      });
      
      await fetchTasks();
      setIsDialogOpen(false);
      setCurrentTask(undefined);
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error updating task',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      
      toast({
        title: 'Task deleted',
        description: 'Your task has been deleted successfully',
      });
      
      await fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error deleting task',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      
      toast({
        title: 'Status updated',
        description: 'Task status updated successfully',
      });
      
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: 'Error updating status',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleEditTask = (task: Task) => {
    setCurrentTask(task);
    setIsDialogOpen(true);
  };

  const handleAddNewTask = () => {
    setCurrentTask(undefined);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setCurrentTask(undefined);
  };

  const handleDialogSubmit = (formData: TaskFormData) => {
    if (currentTask) {
      handleUpdateTask(formData);
    } else {
      handleCreateTask(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Task Management
          </h1>
          <p className="text-muted-foreground">
            Organize your study tasks and track your progress
          </p>
        </div>
        <Button onClick={handleAddNewTask}>
          <Plus className="h-4 w-4 mr-2" /> Add New Task
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Filter className="h-4 w-4 mr-2" /> Filter
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showPriorities.high}
                onCheckedChange={(checked) => 
                  setShowPriorities({...showPriorities, high: checked})}
                className="capitalize"
              >
                High Priority
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showPriorities.medium}
                onCheckedChange={(checked) => 
                  setShowPriorities({...showPriorities, medium: checked})}
                className="capitalize"
              >
                Medium Priority
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showPriorities.low}
                onCheckedChange={(checked) => 
                  setShowPriorities({...showPriorities, low: checked})}
                className="capitalize"
              >
                Low Priority
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="todo">To Do</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="all">
            <TasksDisplay 
              tasks={filteredTasks} 
              onEdit={handleEditTask} 
              onDelete={handleDeleteTask} 
              onStatusChange={handleStatusChange}
              filterLabel="all tasks"
            />
          </TabsContent>
          <TabsContent value="todo">
            <TasksDisplay 
              tasks={filteredTasks} 
              onEdit={handleEditTask} 
              onDelete={handleDeleteTask} 
              onStatusChange={handleStatusChange}
              filterLabel="todo tasks"
            />
          </TabsContent>
          <TabsContent value="in-progress">
            <TasksDisplay 
              tasks={filteredTasks} 
              onEdit={handleEditTask} 
              onDelete={handleDeleteTask} 
              onStatusChange={handleStatusChange}
              filterLabel="in-progress tasks"
            />
          </TabsContent>
          <TabsContent value="completed">
            <TasksDisplay 
              tasks={filteredTasks} 
              onEdit={handleEditTask} 
              onDelete={handleDeleteTask} 
              onStatusChange={handleStatusChange}
              filterLabel="completed tasks"
            />
          </TabsContent>
        </div>
      </Tabs>

      <TaskDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
        initialData={currentTask}
        isSubmitting={isSubmitting}
        type={currentTask ? 'edit' : 'create'}
      />
    </div>
  );
}

interface TasksDisplayProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
  filterLabel: string;
}

function TasksDisplay({ tasks, onEdit, onDelete, onStatusChange, filterLabel }: TasksDisplayProps) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Tasks</CardTitle>
          <CardDescription>
            No {filterLabel} found with the current filters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            Try adjusting your filters or create a new task.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
